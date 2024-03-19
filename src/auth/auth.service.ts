import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common'
import { createUSerWithLink, UsersService } from '../users/users.service'
import { JwtService } from '@nestjs/jwt'
import { UserEntity } from '../users/entities/user.entity'
import * as bcrypt from 'bcrypt'
import * as process from 'process'
import { RefreshTokenDto } from '../users/dto/refresh-token.dto'
import { v4 as uuidv4 } from 'uuid'
import { MailerService } from '@nestjs-modules/mailer'
import { AppService } from '../app.service'
import { AuthorizationsService } from '../additionalRepositories/authorizations/authorizations.service'
import { LogsService } from '../otherServices/loggerService/logger.service'
import { createUserType, email } from './auth.controller'
import { SessionAuthService } from './session-auth/session-auth.service'
import { ConfigService } from '@nestjs/config'
import axios from "axios";

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AppService.name)
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private sessionAuthService: SessionAuthService,
    private LogsService: LogsService,
    private readonly authorizationsService: AuthorizationsService,
    private readonly mailerService: MailerService,
    private configService: ConfigService,
  ) {}

  // регистрация
  async register(dto: createUserType, clientIp: string) {
    try {
      // const allowedDomains = [
      //   'gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'aol.com',
      //   'mail.com', 'protonmail.com', 'icloud.com', 'zoho.com', 'yandex.ru',
      //   'bk.ru', 'inbox.ru', 'list.ru', 'rambler.ru', 'mail.ru', 'tut.by',
      //   'yandex.com', 'fastmail.com', 'gmx.com', 'comcast.net', 'yahoo.co.uk',
      //   'ymail.com', 'live.com', 'rocketmail.com', 'googlemail.com', 'me.com',
      //   'outlook.co.th', 'abv.bg', 'seznam.cz', 'centrum.cz', 'wp.pl', 'onet.pl',
      //   'interia.pl', 'o2.pl', 'yahoo.fr', 'orange.fr', 'free.fr', 'laposte.net',
      // ];
      //
      // try {
      //   const response = await axios.get(`https://apilayer.com/mailboxlayer?check=${dto.email}`);
      //   console.log(response)
      // } catch (err)
      //     return
      // Проверяем, является ли почтовый домен не временным
      // const emailDomain = dto.email.split('@')[1];
      // if (!allowedDomains.includes(emailDomain)) {
      //   throw new HttpException('Использование временных почтовых адресов запрещено', HttpStatus.BAD_REQUEST);
      // }

      // проверяем совпадают ли пароли, основной и проверочный
      if (dto.password !== dto.passwordCheck) throw new HttpException('Не совпадают введенные пароли', HttpStatus.BAD_REQUEST)
      // проверяем email в базе данных, если существует в базе данных то выдаем ошибку
      const checkUserWithTheSameEmail = await this.usersService.findByEmail(dto.email)
      if (checkUserWithTheSameEmail) throw new HttpException('Пользователь c таким email зарегистрирован', HttpStatus.BAD_REQUEST)
      // генерируем ссылку активации учетной записи и шифруем ее
      const activationLink = await uuidv4()
      const saltRounds = 10
      const salt = await bcrypt.genSalt(saltRounds)
      const password = await bcrypt.hash(dto.password, salt)
      // данные для нового пользователя
      const newUser: createUSerWithLink = {
        email: dto.email,
        password: password,
        activationLink: activationLink,
        ip: clientIp,
      }
      // создаем нового пользователя
      const newUserDate = await this.usersService.create(newUser)
      if (!newUserDate || !newUserDate.email) throw new HttpException('Ошибка при создании учетной записи, обновите страницу и попробуйте еще раз', HttpStatus.BAD_REQUEST)
      // отправляем ссылку активации на указанный при регистрации email

      await this.usersService.sendActivationMail(dto.email, `${this.configService.get<string>('API_URL')}/auth/activate/${activationLink}`)

      return {
        text: 'Регистрация завершена. На Ваш Email направлено сообщение для активации аккаунта',
      }
    } catch (err) {
      if (err.response === 'Не совпадают введенные пароли') {
        throw err
      } else if (err.response === 'Пользователь c таким email зарегистрирован') {
        await this.LogsService.error(`Регистрация`, `Пользователь уже существует ${dto.email} no trace`)
        throw err
      } else if (err.response === 'Ошибка при создании учетной записи, обновите страницу и попробуйте еще раз') {
        await this.LogsService.error(`Регистрация`, `Ошибка создания ${dto.email} no trace`)
        throw err
      } else if (err.response === `Ошибка отправки сообщения об активации, проверьте почту`) {
        await this.LogsService.error(`Регистрация`, `sendActivationMail ${dto.email} no trace`)
        throw err
      } else if (err.response === `Использование временных почтовых адресов запрещено`) {
        await this.LogsService.error(`Регистрация`, `Использование временных почтовых адресов запрещено ${dto.email} no trace`)
        throw err
      } else {
        await this.LogsService.error(`Регистрация`, `Ошибка при регистрации ${dto.email} ${err}`)
        throw new HttpException('Ошибка при регистрации', HttpStatus.FORBIDDEN)
      }
    }
  }
  // вход в учетнуб запись
  async login(user: UserEntity, clientIp, userAgent) {
    try {
      // убираем лишнее, что не хотим возвращать пользователю
      const { password, activationLink, activationNumber, id, updateAt, deletedAt, ...other } = user
      // получаем токены доступа
      const tokens = await this.issueTokenPair(user.id)
      if (!tokens || !tokens.accessToken || !tokens.refreshToken) {
        throw new HttpException('Нудачная попытка входа в учетную запись, обновите страницу браузера и попробуйте еще раз', HttpStatus.BAD_REQUEST)
      }
      // получаем токен сессии
      const sessionToken = await this.tokenForSession(user.id)
      if (!sessionToken) throw new HttpException('Нудачная попытка входа в учетную запись по сессии, обновите страницу браузера и попробуйте еще раз', HttpStatus.BAD_REQUEST)
      // записываем новый токен сессии пользователю
      user.sessionToken = sessionToken
      user.lastVisit = new Date()
      //обновляем пользователя
      await this.usersService.saveUpdatedUser(user.id, user)
      // создаем сессиию для добавления в репозиторий авторизации
      const authDto = {
        clientIp: clientIp,
        userId: user.id,
        userAgent: userAgent || 'no date',
        userMail: user.email,
        status: true,
        loginAt: new Date(),
        sessionToken: sessionToken,
      }
      // добавляем новую авторизацию в репозиторий
      await this.authorizationsService.create(authDto)

      return {
        ...other,
        ...tokens,
        sessionToken,
        text: 'Успешная авторизация',
      }
    } catch (err) {
      if (err.response === 'Нудачная попытка входа в учетную запись, обновите страницу браузера') {
        await this.LogsService.error(`вход`, `не получен токен или токены доступа ${user.email} no trace`)
        throw err
      } else if (err.response === 'Нудачная попытка входа в учетную запись по сессии, обновите страницу браузера и попробуйте еще раз') {
        await this.LogsService.error(`вход`, `не получен токен сессии ${user.email} no trace`)
        throw err
      } else if (err.response === `Ошибка в создании сессии, обновите страницу браузера и попробуйте еще раз`) {
        await this.LogsService.error(`вход`, `не получен токен сессии ${user.email} no trace`)
        throw err
      } else if (err.response === `Ошибка в получении токенов доступа, обновите страницу браузера и попробуйте еще раз`) {
        await this.LogsService.error(`вход`, `не получен токен доступа ${user.email} no trace`)
        throw err
      } else {
        await this.LogsService.error(`Вход в учетную запись`, `Ошибка при входе в учетную запись email:${user.email} phone:${user.phoneNumber} ${err}`)
        throw new HttpException('Ошибка при входе в учетную запись', HttpStatus.FORBIDDEN)
      }
    }
  }
  // создать пару токенов доступа
  async issueTokenPair(id: number) {
    let retries = 3 // количество повторных попыток
    const success = false // флаг успешной отправки

    while (retries > 0 && !success) {
      try {
        // создаем рефреш токен
        const refreshToken = await this.jwtService.signAsync({ _id: id }, { expiresIn: process.env.EXPIRES_IN })
        // создаем токен доступа
        const accessToken = await this.jwtService.signAsync({ _id: id }, { expiresIn: process.env.ACCESSS_IN })

        return {
          refreshToken,
          accessToken,
        }
      } catch (err) {
        retries--
        await this.LogsService.error(`Ошибка в получении токенов доступа, обновите страницу браузера и попробуйте еще раз`, `повтор для ${id} ${err}`)
      }
    }

    if (!success) {
      throw new HttpException('Ошибка в получении токенов доступа, обновите страницу браузера и попробуйте еще раз', HttpStatus.FORBIDDEN)
    }
  }
  // создать токен сессии
  async tokenForSession(id: number) {
    let retries = 3 // количество повторных попыток
    const success = false // флаг успешной отправки

    while (retries > 0 && !success) {
      try {
        // создаем токен
        const sessionToken = await this.sessionAuthService.createToken(id)

        return sessionToken
      } catch (err) {
        retries--
        await this.LogsService.error(`Создание токена сессии`, `ошибка ${id} ${err}`)
      }

      if (!success) {
        throw new HttpException('Ошибка в создании сессии, обновите страницу браузера и попробуйте еще раз', HttpStatus.FORBIDDEN)
      }
    }
  }
  // валидация пользователя
  async validateUser(request: any): Promise<any> {
    try {
      // переменная для пользователя
      let user
      // ищем в базе данных пользователя по email или phone
      if (request.email !== 'no date') {
        user = await this.usersService.findByEmail(request.email)
      } else {
        user = await this.usersService.findByPhone(request.phoneNumber)
      }
      // если не активирован email, то ошибка
      if (user && !user.isActivatedEmail) {
        throw new HttpException('Необходимо подтвердить email', HttpStatus.UNAUTHORIZED)
      }
      if (!user) throw new HttpException('Пользователь не найден', HttpStatus.UNAUTHORIZED)
      // сравниваем пароли, то что ввели и тот который у пользователя
      const isMatch = await bcrypt.compare(request.password, user.password)
      if (!isMatch) throw new HttpException('Не верный логин или пароль', HttpStatus.UNAUTHORIZED)

      if (isMatch) {
        const { password, ...result } = user
        return result
      }
    } catch (err) {
      if (err.response === 'Не верный логин или пароль') {
        await this.LogsService.error(`Валидация`, `Не верный логин или пароль ${request?.email && request.email} ${request?.phoneNumber && request.phoneNumber} no trace`)
        throw err
      } else if (err.response === 'Необходимо подтвердить email') {
        await this.LogsService.error(`Валидация`, `Необходимо подтвердить email ${request?.email && request.email} ${request?.phoneNumber && request.phoneNumber} no trace`)
        throw err
      } else if (err.response === 'Пользователь не найден') {
        await this.LogsService.error(`Валидация`, `Пользователь не найден ${request?.email && request.email} ${request?.phoneNumber && request.phoneNumber} no trace`)
        throw err
      } else {
        await this.LogsService.error(`Валидация`, ` ошибка ${request?.email && request.email} ${request?.phoneNumber && request.phoneNumber} ${err}`)
        throw new HttpException('validateUser', HttpStatus.FORBIDDEN)
      }
    }
  }
  // получить новые токены
  async getNewTokens({ refreshToken }: RefreshTokenDto) {
    try {
      // если нет рефрештокена то ошибка
      if (!refreshToken) throw new HttpException('Пожалуйста выполните вход', HttpStatus.UNAUTHORIZED)
      // проверяем валидность токена и достаем из него id пользователя
      const result = await this.jwtService.verifyAsync(refreshToken)
      // если ничего нет то ошибка
      if (!result) throw new HttpException('Не действительный токен доступа', HttpStatus.UNAUTHORIZED)
      // находим пользователя по id
      const user = await this.usersService.findById(result._id)
      // получаем новую пару токенов
      const tokens = await this.issueTokenPair(user.id)
      // токен сессии мы уже проверили в middleware поэтому получаем новый
      const sessionToken = await this.tokenForSession(user.id)
      // теперь надо перезаписать этот токен пользователю
      user.sessionToken = sessionToken
      // сохраняем обновленного пользователя
      await this.usersService.saveUpdatedUser(user.id, user)
      // далее меняем этот токен в последней авторизации этого пользователя, т.к. они потом будут сравниваться для понимания, что это активаная сессия
      const latestSession = await this.authorizationsService.findLastSessionByUserIdAndMonth(user.id)
      // записываем в эту сессию новый токен
      latestSession.sessionToken = sessionToken
      // и обновляем эту сессию
      await this.authorizationsService.updateAuthorization(latestSession.id, latestSession)

      return {
        sessionToken,
        ...tokens,
      }
    } catch (err) {
      if (err.response === 'Пожалуйста выполните вход') {
        await this.LogsService.error(`gettokens`, `Пожалуйста выполните вход no trace`)
        throw err
      } else if (err.response === 'Не действительный токен доступа') {
        await this.LogsService.error(`gettokens`, `Не действительный токен доступа no trace`)
        throw err
      } else {
        await this.LogsService.error(`gettokens`, `Ошибка при генерации токена ${err}`)
        throw new HttpException('Ошибка при генерации токена, перезайдите в учетную запись', HttpStatus.FORBIDDEN)
      }
    }
  }
  // изменения пароля
  async changePassword(dto: email) {
    try {
      const message = await this.usersService.changePassword(dto)

      return message
    } catch (err) {
      if (err.response === 'Аккаунт не найден') {
        await this.LogsService.error(`выслать пароль`, `Аккаунт не найден  no trace`)
        throw err
      } else if (err.response === 'Аккаунт не активирован') {
        await this.LogsService.error(`выслать пароль`, `Аккаунт не активирован`)
        throw err
      } else if (err.response === 'Ошибка при генерации пароля') {
        await this.LogsService.error(`выслать пароль`, `Ошибка при генерации пароля`)
        throw err
      } else if (err.response === '= randomPassword') {
        await this.LogsService.error(`выслать пароль`, `randomPassword error`)
        throw err
      } else if (err.response === 'Ошибка отправки сообщения с новым паролем') {
        await this.LogsService.error(`выслать пароль`, `Ошибка при отправке пароля`)
        throw err
      } else {
        await this.LogsService.error(`отправка пароля`, `Ошибка отправки сообщения ${err}`)
        throw new HttpException('ошибка отправки сообщения на почту', HttpStatus.FORBIDDEN)
      }
    }
  }
  // активация аккаунта
  async activate(activationLink) {
    await this.usersService.activate(activationLink)
  }
  // направить ссылку активации повтороно
  async activateRepeat(dto: email) {
    try {
      await this.usersService.activateRepeat(dto)

      return {
        text: 'Сообщение направлено',
      }
    } catch (err) {
      if (err.response === 'Ваш аккаунт уже активирован') {
        await this.LogsService.error(`отправить повторно ссылку активации`, `Ваш аккаунт уже активирован`)
        throw err
      } else if (err.response === 'Аккаунт не найден') {
        await this.LogsService.error(`отправить повторно ссылку активации`, `Аккаунт не найден`)
        throw err
      } else {
        await this.LogsService.error(`отправить повторно ссылку активации`, `ошибка ${dto.email} ${err}`)
        throw new HttpException('Ошибка при запросе ссылки активации, попробуйте обновить страницу и попровобовать еще раз', HttpStatus.FORBIDDEN)
      }
    }
  }
}
