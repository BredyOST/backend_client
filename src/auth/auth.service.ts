import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common'
import { createUSerWithLink, UsersService } from '../users/users.service'
import { JwtService } from '@nestjs/jwt'
import { UserEntity } from '../users/entities/user.entity'
import * as bcrypt from 'bcrypt'
import * as process from 'process'
import { RefreshTokenDto } from '../users/dto/refresh-token.dto'
import { MailerService } from '@nestjs-modules/mailer'
import { AppService } from '../app.service'
import { AuthorizationsService } from '../additionalRepositories/authorizations/authorizations.service'
import { LogsService } from '../otherServices/loggerService/logger.service'
import { accessNumber, createUserType, email } from './auth.controller'
import { SessionAuthService } from './session-auth/session-auth.service'
import { ConfigService } from '@nestjs/config'

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

      // проверяем совпадают ли пароли, основной и проверочный
      if (dto.password !== dto.passwordCheck) throw new HttpException('Не совпадают введенные пароли', HttpStatus.BAD_REQUEST)

      // проверяем телефон в базе данных
      const checkUserWithTheSamePhone = await this.usersService.findByPhone(dto?.phoneNumber)
      if (checkUserWithTheSamePhone) throw new HttpException('Пользователь c таким номером телефона зарегистрирован', HttpStatus.BAD_REQUEST)

      // генерируем ссылку активации учетной записи и шифруем ее (не актуально)
      // const activationLink = await uuidv4()
      const saltRounds = 10
      const salt = await bcrypt.genSalt(saltRounds)
      const password = await bcrypt.hash(dto.password, salt)
      // данные для нового пользователя
      const newUser: createUSerWithLink = {
        phoneNumber: dto.phoneNumber,
        password: password,
        ip: clientIp,
      }

      // создаем нового пользователя
      const newUserDate = await this.usersService.create(newUser)

      if (!newUserDate || !newUserDate.phoneNumber) throw new HttpException('Ошибка при создании учетной записи, обновите страницу и попробуйте еще раз', HttpStatus.BAD_REQUEST)

      return {
        text: 'Регистрация завершена. Осталось подтвердить номер телефона',
      }

    } catch (err) {
      if (err.response === 'Не совпадают введенные пароли') {
        throw err
      } else if (err.response === 'Пользователь c таким номером телефона зарегистрирован') {
        throw err
      } else if (err.response === 'Ошибка при создании учетной записи, обновите страницу и попробуйте еще раз') {
        throw err
      } else {
        await this.LogsService.error(`Регистрация`, `Ошибка при регистрации ${dto.phoneNumber} ${err}`)
        throw new HttpException('Ошибка при регистрации', HttpStatus.FORBIDDEN)
      }
    }
  }

  // вход в учетнуб запись
  async login(user: UserEntity, clientIp, userAgent) {
    try {

      // убираем лишнее, что не нужно возвращать пользователю
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
      // создаем сессию для добавления в репозиторий авторизации
      const authDto = {
        clientIp: clientIp,
        userId: user.id,
        userAgent: userAgent || 'no date',
        userMail: user.phoneNumber,
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
        await this.LogsService.error(`вход`, `не получен токен или токены доступа ${user.id} no trace`)
        throw err
      } else if (err.response === 'Нудачная попытка входа в учетную запись по сессии, обновите страницу браузера и попробуйте еще раз') {
        await this.LogsService.error(`вход`, `не получен токен сессии ${user.id} no trace`)
        throw err
      } else if (err.response === `Ошибка в создании сессии, обновите страницу браузера и попробуйте еще раз`) {
        await this.LogsService.error(`вход`, `не получен токен сессии ${user.id} no trace`)
        throw err
      } else if (err.response === `Ошибка в получении токенов доступа, обновите страницу браузера и попробуйте еще раз`) {
        await this.LogsService.error(`вход`, `не получен токен доступа ${user.id} no trace`)
        throw err
      } else {
        await this.LogsService.error(`Вход в учетную запись`, `Ошибка при входе в учетную запись email:${user.id} phone:${user.phoneNumber} ${err}`)
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
      let ifNoAccess;
      // ищем в базе данных пользователя по email или phone
      if (request?.email !== 'no date') {
        user = await this.usersService.findByEmail(request.email)
        if (user && !user?.isActivatedEmail) throw new HttpException('Для входа через email, требуется его подтвердить', HttpStatus.UNAUTHORIZED)
      }
      if (request?.phoneNumber !== 'no date') {
        user = await this.usersService.findByPhone(request?.phoneNumber)
        if (user && !user?.isActivatedPhone) throw new HttpException('Не подтвержден номер телефона', HttpStatus.UNAUTHORIZED)
      }

      // если не активирован email, то ошибка
      // if (user && !user.isActivatedEmail) {
      //   throw new HttpException('Необходимо подтвердить email', HttpStatus.UNAUTHORIZED)
      // }

      if (!user) throw new HttpException('Пользователь не найден', HttpStatus.UNAUTHORIZED)
      // сравниваем пароли, то что ввели и тот который у пользователя в бд
      const isMatch = await bcrypt.compare(request.password, user.password)
      if (!isMatch) throw new HttpException('Не верный логин или пароль', HttpStatus.UNAUTHORIZED)

      if (isMatch) {
        const { password, ...result } = user
        return result
      }

    } catch (err) {

      if (err.response === 'Не верный логин или пароль') {
        throw err
      } else if (err.response === 'Не подтвержден номер телефона') {
        throw err
      } else if (err.response === 'Для входа через email, требуется его подтвердить') {
        throw err
      } else if (err.response === 'Пользователь не найден') {
        throw err
      } else {
        await this.LogsService.error(`Валидация`, ` ошибка ${request?.id && request.id} ${request?.email && request?.phoneNumber} ${err}`)
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
      // перезаписываем токен пользователю
      user.sessionToken = sessionToken
      // сохраняем обновленного пользователя
      await this.usersService.saveUpdatedUser(user.id, user)
      // далее меняем этот токен в последней авторизации этого пользователя, т.к. они потом будут сравниваться для понимания, что это активная сессия
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
  async changePassword(dto: accessNumber) {

    try {
      const message = await this.usersService.changePassword(dto)

      return message

    } catch (err) {

      if (err.response === 'Не заполнены или некорректно заполнены поля') {
        throw err
      } else if (err.response === 'Введенные пароли не совпадают') {
        throw err
      } else if (err.response === 'Не заполнен номер телефона') {
        throw err
      } else if (err.response === 'Аккаунт не найден') {
        throw err
      } else if (err.response === 'Аккаунт не активирован, необходимо подтвердить номер телефона') {
        throw err
      } else if (err.response === 'Указан не верный код') {
        throw err
      } else if (err.response === 'На аккаунте не привязан телеграмм') {
        throw err
      } else {
        await this.LogsService.error(`отправка пароля`, `Ошибка отправки сообщения ${err}`)
        throw new HttpException('ошибка изменения пароля', HttpStatus.FORBIDDEN)
      }
    }
  }
  // активация аккаунта
  async activate(activationLink) {
    await this.usersService.activate(activationLink)
  }
  // направить ссылку активации повторно
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
