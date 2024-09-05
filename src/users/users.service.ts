import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { UserEntity } from './entities/user.entity'
import * as bcrypt from 'bcrypt'
import { v4 as uuidv4 } from 'uuid'
import * as process from 'process'
import { catchError, firstValueFrom } from 'rxjs'
import { AxiosError } from 'axios/index'
import { AppService } from '../app.service'
import { MailerService } from '@nestjs-modules/mailer'
import { HttpService } from '@nestjs/axios'
import {accessNumber, email} from '../auth/auth.controller'
import {
  codeForChangePhone,
  codeForNewEmailType,
  codeForNewPhone,
  codeType,
  fullNAmeType,
  phoneType
} from './users.controller'
import { LogsService } from '../otherServices/loggerService/logger.service'
import { TelegramTwoService } from '../otherServices/telegram.service/telegramBotTwo.service'

export type createUSerWithLink = {
  phoneNumber: string
  password: string
  ip: string
}

@Injectable()
export class UsersService {
  private readonly logger = new Logger(AppService.name)
  constructor(
    @InjectRepository(UserEntity)
    private repository: Repository<UserEntity>,
    private readonly mailerService: MailerService,
    private LogsService: LogsService,
    private readonly httpService: HttpService,
    private telegramTwoService: TelegramTwoService,
  ) {}

  // блоки получения пользователей по параметрам
  // по email
  async findByEmail(email: string) {
    return this.repository.findOneBy({
      email,
    })
  }
  // по телефону
  async findByPhone(phoneNumber: string) {
    return this.repository.findOneBy({
      phoneNumber,
    })
  }
  async findByIdTg(chatIdTg: string) {
    return this.repository.findOneBy({
      chatIdTg,
    })
  }
  async findByIdTgUser(userIdTg: string) {
    return this.repository.findOneBy({
      userIdTg,
    })
  }
  async findByChangePhone(forChangePhoneNumber: string) {
    return this.repository.findOneBy({
      forChangePhoneNumber,
    })
  }
  async findById(id: number) {
    return this.repository.findOneBy({
      id,
    })
  }
  async findByIp(ip: string) {
    return await this.repository
        .createQueryBuilder('user')
        .where('user.ip = :ip', { ip })
        .getMany();
  }

  async findManyByIp(ip: string) {
    return await this.repository.find({ where: { ip } });
  }

  // по ссылке активации
  async findByActivateLink(activationLink: string) {
    return this.repository.findOneBy({
      activationLink,
    })
  }
  // создание пользователя
  async create(dto: createUSerWithLink) {
    return this.repository.save(dto)
  }
  // получение информации о профиле пользователя
  async getProfileInfo(id: number) {
    try {
      // находим пользователя по id
      const user = await this.repository.findOneBy({ id })
      if (!user) throw new HttpException('Пользователь не найден', HttpStatus.UNAUTHORIZED)
      // определяем что нам нужно вернуть
      const { activationLink, activationNumber, id: idVk, password, ip, updateAt, deletedAt, sessionToken, ...other } = user

      return { ...other, identificator: 'получено' }
    } catch (err) {
      if (err.response === 'Пользователь не найден') {
        await this.LogsService.error(`получение пользователя`, `Не найден пользователь ${id} no trace`)
        throw err
      } else {
        await this.LogsService.error(`получение пользователя`, `Ошибка при получении данных пользователя ${id} ${err}`)
        throw new HttpException('Ошибка при получении данных пользователя', HttpStatus.FORBIDDEN)
      }
    }
  }
  // сохраняем обновленного пользователя
  async saveUpdatedUser(id, user) {
    try {
      await this.repository.update(id, user)
    } catch (err) {
      await this.LogsService.error(`Обновление пользователя #`, `Ошибка ${id} ${err}`)
      throw new HttpException('Ошибка при обновлении пользователя', HttpStatus.FORBIDDEN)
    }
  }
  // код для подтверждения нового email
  async updateEmailСode(id: number, dto: codeForNewEmailType) {
    try {
      const user = await this.findById(+id)
      // проверям не прислал ли нам пользователь зарегистрированный email
      if (user.email === dto.email) throw new HttpException('Вы уже ипользуете этот email', HttpStatus.UNAUTHORIZED)
      if (dto.indicator === 'change') {
        if (user.forChangeEmail === dto.email) throw new HttpException('Email уже добавлен во временное хранилище, проверьте ваш Email', HttpStatus.UNAUTHORIZED)
      }
      // проверяем нет ли кого с таким email
      if (user && dto.email) {
        const isSameUser = await this.findByEmail(dto.email)
        if (isSameUser && isSameUser.id !== user.id) {
          throw new HttpException('Такой Email уже зарегистрирован', HttpStatus.UNAUTHORIZED)
        } else {
          // если все ок, то обновляем данные у пользователя, в базе данных и скидываем активацию почты
          user.forChangeEmail = dto.email
          await this.saveUpdatedUser(id, user)
        }
      }
      if (user.timeSendMessageVerify) {
        const timeSinceLastRequest = new Date().getTime() - user.timeSendMessageVerify.getTime()
        const twoMinutesInMillis = 2 * 60 * 1000
        if (timeSinceLastRequest < twoMinutesInMillis) {
          throw new HttpException('Запросы можно делать не более 1 раза в 2 минуты', HttpStatus.UNAUTHORIZED)
        }
      } else {
        user.timeSendMessageVerify = new Date()
      }

      user.timeSendMessageVerify = new Date()
      await this.saveUpdatedUser(user.id, user)
      await this.sendActivationCodeForNewEmail(user, dto)

      return {
        text: 'Код подтверждения направен на указанную почту',
      }
    } catch (err) {
      if (err.response === 'Вы уже ипользуете этот email') {
        // await this.LogsService.error(`обновление почты`, `Вы уже ипользуете этот email ${dto.email} no trace`)
        throw err
      } else if (err.response === 'Такой Email уже зарегистрирован') {
        // await this.LogsService.error(`обновление почты`, `уже существует ${dto.email} no trace`)
        throw err
      } else if (err.response === `Ошибка отправки сообщения об активации, проверьте почту`) {
        // await this.LogsService.error(`обновление почты`, `ошибка отправки кода ${dto.email} no trace`)
        throw err
      } else if (err.response === 'Email уже добавлен во временное хранилище, проверьте ваш Email') {
        throw err
      } else if (err.response === 'Запросы можно делать не более 1 раза в 2 минуты') {
        throw err
      } else {
        await this.LogsService.error(`обновление почты`, `ошибка ${dto.email} ${err}`)
        throw new HttpException('Ошибка при обновлении email - получение кода', HttpStatus.FORBIDDEN)
      }
    }
  }
  // обновляем email
  async updateEmail(id: number, dto: codeType) {
    try {
      const user = await this.findByActivateLink(dto.code)
      if (!user) throw new HttpException('Пользователь не найден, проверьте еще раз код или запросите новый', HttpStatus.UNAUTHORIZED)

      if (user.forChangeEmail) {
        const newEmail = user.forChangeEmail
        user.email = newEmail
        user.forChangeEmail = ''
        user.activationLink = ''
        user.isActivatedEmail = true
        await this.saveUpdatedUser(id, user)
      }

      return {
        text: `Email успешно изменен на ${user.email}. Обновите страницу`,
      }
    } catch (err) {
      if (err.response === 'Пользователь не найден, проверьте еще раз код или запросите новый') {
        await this.LogsService.error(`обновление почты`, `ользователь не найден ${id} no trace`)
        throw err
      } else if (err.response === 'Ошибка при обновлении пользователя') {
        await this.LogsService.error(`обновление почты`, `ошибка при обнволении пользователя ${id} no trace`)
        throw err
      } else {
        await this.LogsService.error(`обновление почты`, `ошибка ${id}} ${err}`)
        throw new HttpException('Ошибка при обновлении email', HttpStatus.FORBIDDEN)
      }
    }
  }
  // обновляем имя
  async updateFullName(id: number, dto: fullNAmeType) {
    try {
      const user = await this.findById(+id)
      if (!user) throw new HttpException('Пользователь не найден', HttpStatus.UNAUTHORIZED)

      if (user.fullName === dto.fullName) {
        throw new HttpException('Вы уже ипользуете это имя', HttpStatus.UNAUTHORIZED)
      }
      // если есть пользователь и данные то обновляем
      if (user && dto.fullName) user.fullName = dto.fullName
      // обновляем пользователя
      await this.saveUpdatedUser(id, user)

      return {
        text: 'Имя пользователя изменено',
      }
    } catch (err) {
      if (err.response === 'Вы уже ипользуете это имя') {
        // await this.LogsService.error(`обновление имени`, `Вы уже ипользуете этот email ${dto.fullName} no trace`)
        throw err
      } else if (err.response === `Ошибка при обновлении пользователя`) {
        // await this.LogsService.error(`обновление имени`, `ошибка у ${id} no trace`)
        throw err
      } else if (err.response === `Пользователь не найден`) {
        // await this.LogsService.error(`обновление имени`, `ошибка у ${id} no trace`)
        throw err
      } else {
        // await this.LogsService.error(`обновление имени`, `ошибка у ${id} ${err}`)
        throw new HttpException('Ошибка при обновлении данных имени', HttpStatus.FORBIDDEN)
      }
    }
  }
  // изменение телефона
  async updatePhone(id: number, dto: codeForNewPhone) {

    try {
      // получем пользователя
      const user = await this.findById(+id)
      if (!user) throw new HttpException('Пользователь не найден', HttpStatus.UNAUTHORIZED)
      // проверям не прислал ли нам пользователь  номер которой уже использует
      if (user.phoneNumber.replace('+', '') === dto.phoneNumber.replace('+', '')) {
        throw new HttpException('Вы уже иcпользуете этот телефон', HttpStatus.UNAUTHORIZED)
      }
      if (user.forChangePhoneNumber === dto.phoneNumber) throw new HttpException('Телефон уже добавлен во временное хранилище, нажмите "Подтвердить телефон', HttpStatus.UNAUTHORIZED)

      // если есть пользователь и есть номер то проверяем, обновляем и сохраняем во временную переменную
      if (user && dto.phoneNumber) {
        // проверяем нет ли уже такого номера в базе
        const isSameUser = await this.findByPhone(dto.phoneNumber)
        if (isSameUser && isSameUser.id != user.id) {
          // если есть то ошибка
          throw new HttpException('Такой телефон уже зарегестрирован', HttpStatus.UNAUTHORIZED)
        } else {
          // все ок, записываем новые данные и сохраняем обновленного пользователя
          user.forChangePhoneNumber = dto.phoneNumber
        }
      }
      await this.saveUpdatedUser(id, user)

      return {
        text: 'телефон добавлен во временное хранилище, нажмите кнопку "подтвердить телефон" --> "Запрос вызова"',
      }
    } catch (err) {
      if (err.response === 'Вы уже ипользуете этот телефон') {
        // await this.LogsService.error(`обновление номера`, `Вы уже ипользуете этот телефон ${id} no trace`)
        throw err
      } else if (err.response === `Пользователь не найден`) {
        // await this.LogsService.error(`обновление имени`, `ошибка у ${id} no trace`)
        throw err
      } else if (err.response === 'Такой телефон уже зарегестрирован') {
        // await this.LogsService.error(`обновление номера`, `Такой телефон уже зарегестрирован ${id} no trace`)
        throw err
      } else if (err.response === 'Телефон уже добавлен во временное хранилище, нажмите "Подтвердить телефон') {
        throw err
      } else {
        await this.LogsService.error(`обновление номера`, `ошибка ${id} ${err}`)
        throw new HttpException('Ошибка при обновлении телефона', HttpStatus.FORBIDDEN)
      }
    }
  }
  // запрос кода в тг
  async codeForChangePhone(id: number, dto: codeForChangePhone) {

    try {
      // получем пользователя
      const user = await this.findById(+id)
      if (!user) throw new HttpException('Пользователь не найден', HttpStatus.UNAUTHORIZED)

      if (user.forChangePhoneNumber.replace('+', '') != dto.phoneToChange.replace('+', '')) {
        throw new HttpException('Указан не верный номер телефона', HttpStatus.UNAUTHORIZED)
      }

      if(user.forChangePhoneNumber.replace('+', '') == dto.phoneToChange.replace('+', '')) {
        const code = await this.randomPassword(20)
        user.activationTgNumberToProfile = code
        await this.saveUpdatedUser(user.id, user)
        await this.telegramTwoService.sendNewCodeForNewPhone(user.userIdTg,`Ваш код: ${code}` )
      }

      return {
        text: 'Код успешно направлен в телеграмм',
      }

    } catch (err) {

      if (err.response === 'Вы уже ипользуете этот телефон') {
        // await this.LogsService.error(`обновление номера`, `Вы уже ипользуете этот телефон ${id} no trace`)
        throw err
      } else if (err.response === `Пользователь не найден`) {
        // await this.LogsService.error(`обновление имени`, `ошибка у ${id} no trace`)
        throw err
      } else if (err.response === 'Указан не верный номер телефона') {
        // await this.LogsService.error(`обновление номера`, `Такой телефон уже зарегестрирован ${id} no trace`)
        throw err
      } else if (err.response === 'Телефон уже добавлен во временное хранилище, нажмите "Подтвердить телефон') {
        throw err
      } else {
        await this.LogsService.error(`обновление номера`, `ошибка ${id} ${err}`)
        throw new HttpException('Ошибка при обновлении телефона', HttpStatus.FORBIDDEN)
      }
    }
  }
  // обновление пароля
  async updatePassword(id: number, dto: any) {

    try {
      if (dto.passwordNew !== dto.passwordNewTwo) throw new HttpException('Введенные новые пароли не совпадают', HttpStatus.UNAUTHORIZED)

      const user = await this.findById(+id)

      const isMatch = await bcrypt.compare(dto.currentPassword, user.password)
      if (!isMatch) throw new HttpException('Не верный текущий пароль', HttpStatus.UNAUTHORIZED)
      const oldPassword = await bcrypt.compare(dto.passwordNew, user.password)
      if (oldPassword) throw new HttpException('Вы уже используете этот пароль', HttpStatus.UNAUTHORIZED)

      if (user && dto.passwordNew) {
        const saltRounds = 10
        const salt = await bcrypt.genSalt(saltRounds)
        user.password = await bcrypt.hash(dto.passwordNew, salt)
      }

      await this.saveUpdatedUser(id, user)

      return {
        text: 'Пароль успешно обновлен',
      }
    } catch (err) {
      if (err.response === 'Введенные новые пароли не совпадают') {
        await this.LogsService.error(`обновление пароля`, `Ошибка при обновлении пароля ${id} no trace`)
        throw err
      } else if (err.response === 'Не верный текущий пароль') {
        await this.LogsService.error(`обновление пароля`, `Не верный текущий пароль ${id} no trace`)
        throw err
      } else if ('Вы уже используете этот пароль') {
        await this.LogsService.error(`обновление пароля`, `Вы уже используете этот пароль ${id} no trace`)
        throw err
      } else {
        await this.LogsService.error(`обновление пароля`, `Ошибка при обновлении пароля ${id} ${err}`)
        throw new HttpException('Ошибка при обновлении пароля', HttpStatus.FORBIDDEN)
      }
    }
  }
  // отправить ссылку активации
  async sendActivationMail(to: string, link: string) {
    let retries = 3 // количество повторных попыток
    let success = false // флаг успешной отправки

    while (retries > 0 && !success) {
      try {
        await this.mailerService.sendMail({
          from: process.env['FROM_SEND_MAIL'],
          to: to,
          subject: `Активация аккаунта на сайте клиенты.com`,
          text: '',
          html: `
          <div style="
                  display: flex;
                  flex-direction: column;
                  background-color: #f0f0f0;
                  padding: 5px;
                  border-radius: 10px;
                  width: 100%;
                  column-gap: 10px;
                  text-align: center;">
             <h1 style="
                      background-color: #806d6a;
                      font-size: 20px;
                      font-weight: 400;
                      padding: 10px;
                      color: white;
                      align-items: center;
                      justify-content: center;
                      text-align: center;
                      border-radius: 10px;">
             
                 Клиенты.com
             </h1>
             <div style="padding: 0px;">
                    <h2 style="
                    font-size: 16px; 
                    font-weight: 400;">
                        Для завершения процедуры регистрации на сайте и верификации email-адреса перейдите по данной ссылке:
                    </h2>
                    <div style="
                        background-color: #b46c60;
                        padding: 10px;
                        font-weight: 400;
                        font-size: 16px;
                        border-radius: 5px;
                        cursor: pointer;
                        text-decoration: none;
                        color: white;">
                      <a href="${link}" style="
                      text-decoration: none; 
                      color: white;
                     
                      ">
                        Кликните здесь, чтобы активировать аккаунт
                      </a>
                    </div>
                    <h2 style="font-size: 16px; font-weight: 400;">
                     Если вы не производили регистрацию на сайте Клиенты.com, то проигнорируйте это сообщение
                 </h2>
                </div>
            </div>
            `,
        })
        success = true
      } catch (err) {
        console.log(err)
        retries--
        await this.LogsService.error(`repeatSendMessage`, `${to} ${err}`)
      }
    }

    if (!success) {
      await this.LogsService.error(`ссылка активации`, `Ошибка при отправке пароля после повтора ${to} no trace`)
      throw new HttpException('Ошибка отправки сообщения об активации, проверьте почту', HttpStatus.FORBIDDEN)
    }
  }
  // сообщение об успешной активации
  async sendMessageAboutActivated(to: string) {
    let retries = 3 // количество повторных попыток
    let success = false // флаг успешной отправки

    while (retries > 0 && !success) {
      try {
        await this.mailerService.sendMail({
          from: process.env['FROM_SEND_MAIL'],
          to: to,
          subject: `Успешная активация аккаунта на сайте клиенты.com`,
          text: '',
          html: `
<div style="
    display: flex;
    flex-direction: column;
    gap: 18px;
    background-color: #f0f0f0;
    padding: 20px;
    border-radius: 10px;
    width: 100%;
    text-align: center;">
    <h1 style="
        background-color: #ab5e4d;
        font-size: 18px;
        font-weight: 800;
        padding: 10px;
        color: white;
        border-radius: 10px;">
        Клиенты.com
    </h1>
    <div style="padding: 10px;">
        <h2 style="font-size: 18px;">
            Ваш аккаунт на сайте Клиенты.com успешно активирован
        </h2>
    </div>
</div>
`,
        })
        success = true
      } catch (err) {
        retries--
        await this.LogsService.error(`сообщение об активации`, `${to} ${err}`)
      }
    }

    if (!success) {
      await this.LogsService.error(`Ошибка отправки сообщения об успешной активации`, `Ошибка при отправке пароля после повтора ${to} no trace`)
      throw new HttpException('Ошибка отправки сообщения об успешной активации', HttpStatus.FORBIDDEN)
    }
  }
  // отправить код активации при смене почты
  async sendActivationCodeForNewEmail(user, dto) {
    let retries = 3 // количество повторных попыток
    let success = false // флаг успешной отправки

    while (retries > 0 && !success) {
      try {
        user.activationLink = await uuidv4()
        await this.saveUpdatedUser(user.id, user)

        await this.mailerService.sendMail({
          from: process.env['FROM_SEND_MAIL'],
          to: dto.email,
          subject: `Код подтверждения email на сайте ${process.env['API_URL']}`,
          text: '',
          html: `
<div style="
    display: flex;
    flex-direction: column;
    gap: 25px;
    background-color: #f0f0f0;
    padding: 30px;
    border-radius: 10px;
    width: 100%;
    text-align: center;">
    <h1 style="
        background-color: #ab5e4d;
        font-size: 35px;
        font-weight: 800;
        padding: 10px;
        color: white;
        border-radius: 10px;">
        Клиенты.com
    </h1>
    <div style="padding: 10px;">
        <h2 style="font-size: 28px;">
            Ваш код подтверждения
        </h2>
        <div style="
            background-color: #2626d0;
            padding: 10px;
            font-size: 24px;
            border-radius: 5px;
            color: white;">
        </div>
            ${user.activationLink}
        <h2 style="font-size: 24px;">
            Если вы не запрашивали код, то проигнорируйте это сообщение
        </h2>
    </div>
</div>
`,
        })
        success = true
      } catch (err) {
        retries--
        await this.LogsService.error(`Смена почты`, `с ${user.email} на ${dto.email} ${err}`)
      }
    }

    if (!success) {
      await this.LogsService.error(`Смена почты`, `Ошибка при отправке no trace`)
      throw new HttpException('Ошибка отправки сообщения об активации, проверьте почту', HttpStatus.FORBIDDEN)
    }
  }
  // отправить сообщение от пользователя
  async sendMessage(dto: any) {
    let retries = 3 // количество повторных попыток
    let success = false // флаг успешной отправки

    while (retries > 0 && !success) {
      try {
        await this.mailerService.sendMail({
          from: process.env['FROM_SEND_MAIL'],
          to: process.env['FROM_SEND_MAIL'],
          subject: `Вопрос от пользователя ${dto.name} ${dto.email}`,
          text: `${dto.message}`,
          html: ``,
        })
        success = true

        return {
          text: 'Сообщение успешно направлено, ожидайте ответа',
        }
      } catch (err) {
        retries--
        await this.LogsService.error(`сообщение об активации`, ` ${err}`)
      }
    }

    if (!success) {
      await this.LogsService.error(`Ошибка отправки сообщения`, `Ошибка при отправке пароля после повтора no trace`)
      throw new HttpException('Ошибка отправки сообщения', HttpStatus.FORBIDDEN)
    }
  }
  // отправить новый пароль - запрос
  async sendChangePassword(to: string, password: string) {
    let retries = 3 // количество повторных попыток
    let success = false // флаг успешной отправки

    while (retries > 0 && !success) {
      try {
        await this.mailerService.sendMail({
          from: process.env['FROM_SEND_MAIL'],
          to: to,
          subject: `Восстановление пароля`,
          text: '',
          html:
            '<div style="flex-direction: column; row-gap: 25px; background-color: #eee7e7; padding-bottom: 30px; border-radius: 10px">' +
            '<H1 style="background-color: #ab5e4d; font-size: 35px;font-weight: 800; padding-right: 10px; padding-left: 10px; padding-bottom: 5px; padding-top: 5px; text-align: center; color:black">Клиенты.ru</H1>' +
            '<div>Ваш пароль:</div>' +
            password +
            '</div>',
        })
        success = true
      } catch (err) {
        retries--
        await this.LogsService.error(`новый пароль`, `Ошибка при отправке пароля  ${to} ${err}`)
      }

      if (!success) {
        await this.LogsService.error(`новый пароль`, `Ошибка при отправке пароля после повтора ${to} no trace`)
        throw new HttpException('Ошибка отправки сообщения с новым паролем', HttpStatus.FORBIDDEN)
      }
    }
  }
  // генерация нового пароля
  async randomPassword(length) {
    try {
      let result = ''
      const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
      const charactersLength = characters.length
      for (let i = 0; i <= length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength))
      }
      return result
    } catch (err) {
      await this.LogsService.error(`randomPassword`, `Ошибка ${err}`)
      throw new HttpException('Ошибка при генерации пароля', HttpStatus.FORBIDDEN)
    }
  }
  // верификация номера телефона или изменение пароля - запрос вызова
  //  indicator: `1` - подтверждение, 2- восстановление
  async verifyPhoneNumber(id: number, dto: phoneType) {

    try {

      const id_company = process.env['ID_COMPANY']
      const key = process.env['KEY']

      const user = await this.findByPhone(dto?.phone)

      if (!user) throw new HttpException('Пользователь не найден', HttpStatus.UNAUTHORIZED)

      if (dto.indicator == `1`) {
        if (user.isActivatedPhone) throw new HttpException('Ваш номер телефона уже активирован', HttpStatus.UNAUTHORIZED)
      }
      if (dto.indicator == `2`) {
        if (!user.isActivatedPhone) throw new HttpException('Ваш номер не подтвержден', HttpStatus.UNAUTHORIZED)
      }

      if (user.timeCallVerify) {
        const timeSinceLastRequest = new Date().getTime() - user.timeCallVerify.getTime()
        const twoMinutesInMillis = 2 * 60 * 1000
        if (timeSinceLastRequest < twoMinutesInMillis) {
          throw new HttpException('Запросы можно делать не более 1 раза в 2 минуты', HttpStatus.UNAUTHORIZED)
        }
      } else {
        user.timeCallVerify = new Date()
      }

      user.timeCallVerify = new Date()
      await this.saveUpdatedUser(user.id, user)

      const { data: response } = await firstValueFrom(
        this.httpService.get<any>(`https://zvonok.com/manager/cabapi_external/api/v1/phones/flashcall/?public_key=${key}&phone=${dto.phone}&campaign_id=${id_company}`).pipe(
          catchError((error: AxiosError) => {
            if (error.response && 'data' in error.response && error.response.data != undefined) {
              this.logger.error(error.response.data)
            }
            throw 'An error happened!'
          }),
        ),
      )

      if (response && response.data && response?.data?.pincode) {
        if (dto.indicator == `1`) {
          user.activationNumber = response?.data?.pincode
        }
        if (dto.indicator == `2`) {
          user.activationCodeForChangePassword = response?.data?.pincode
        }
        await this.saveUpdatedUser(user?.id, user)
      }

      return {
        text: 'Запрос выполнен, ожидайте звонка',
      }

    } catch (err) {
      if (err.response === 'Пользователь не найден') {
        throw err
      } else if (err.response === 'Ваш номер телефона уже активирован') {
        throw err
      } else if (err.response === 'Ваш номер не подтвержден') {
        throw err
      } else if (err.response === 'Пользователь с таким номером телефона не найден. Нажмите кнопку "Изменить номер" перед запросом') {
        throw err
      } else if (err.response === 'Запросы можно делать не более 1 раза в 2 минуты') {
        throw err
      } else {
        throw new HttpException('запрос завершился неуспешно, если ен поступит звонок, повторите запрос', HttpStatus.UNAUTHORIZED)
      }
    }
  }

  //когда зашел в форму забыл пароль и восстанавливаешь его через номер телефона
  async reqCallForgetPassword(id: number, dto: phoneType) {

    try {

      const id_company = process.env['ID_COMPANY']
      const key = process.env['KEY']

      const user = await this.findByPhone(dto?.phone)

      if (!user) throw new HttpException('Пользователь не найден', HttpStatus.UNAUTHORIZED)
      if (user.isActivatedPhone) throw new HttpException('Ваш номер телефона уже активирован', HttpStatus.UNAUTHORIZED)

      if (user.timeCallVerify) {
        const timeSinceLastRequest = new Date().getTime() - user.timeCallVerify.getTime()
        const twoMinutesInMillis = 2 * 60 * 1000
        if (timeSinceLastRequest < twoMinutesInMillis) {
          throw new HttpException('Запросы можно делать не более 1 раза в 2 минуты', HttpStatus.UNAUTHORIZED)
        }
      } else {
        user.timeCallVerify = new Date()
      }

      user.timeCallVerify = new Date()
      await this.saveUpdatedUser(user.id, user)

      const { data: response } = await firstValueFrom(
          this.httpService.get<any>(`https://zvonok.com/manager/cabapi_external/api/v1/phones/flashcall/?public_key=${key}&phone=${dto.phone}&campaign_id=${id_company}`).pipe(
              catchError((error: AxiosError) => {
                if (error.response && 'data' in error.response && error.response.data != undefined) {
                  this.logger.error(error.response.data)
                }
                throw 'An error happened!'
              }),
          ),
      )

      if (response && response.data && response?.data?.pincode) {
        user.activationNumber = response?.data?.pincode
        await this.saveUpdatedUser(user?.id, user)
      }

      return {
        text: 'Запрос выполнен, ожидайте звонка',
      }

    } catch (err) {

      if (err.response === 'Пользователь не найден') {
        throw err
      } else if (err.response === 'Ваш номер телефона уже активирован') {
        throw err
      } else if (err.response === 'Пользователь с таким номером телефона не найден. Нажмите кнопку "Изменить номер" перед запросом') {
        throw err
      } else if (err.response === 'Запросы можно делать не более 1 раза в 2 минуты') {
        throw err
      } else {
        throw new HttpException('запрос завершился неуспешно, если ен поступит звонок, повторите запрос', HttpStatus.UNAUTHORIZED)
      }
    }
  }

  // проверка введенного кода пользователем для верификации номера телефона
  async verifyPhoneCode(id: number, dto: { phoneNumber: string, numberActivation: string}) {

    try {

      const user = await this.findByPhone(dto?.phoneNumber)
      if (!user) throw new HttpException('Пользователь не найден', HttpStatus.UNAUTHORIZED)
      if (user.isActivatedPhone) throw new HttpException('Ваш номер телефона уже активирован', HttpStatus.UNAUTHORIZED)

      const checkCode = user.activationNumber == dto.numberActivation
      if (!checkCode) throw new HttpException('Не верный код, проверьте еще раз последние 4 цифры номера', HttpStatus.UNAUTHORIZED)
      if (checkCode) {
        user.isActivatedPhone = true
        user.activationNumber = ''
      }

      await this.saveUpdatedUser(user.id, user)

      return {
        text: 'Телефон успешно подтвержден, можете войти в учетную запись',
      }
    } catch (err) {
      if (err.response === 'Пользователь не найден') {
        throw err
      } else if (err.response === 'Ваш номер телефона уже активирован') {
        throw err
      } else if (err.response === 'Не верный код, проверьте еще раз последние 4 цифры номера') {
        throw err
      } else {
        await this.LogsService.error(`верификация номера-код`, `ошибка ${err}`)
        throw new HttpException('ошибка при отправке кода, попробуйте повторить запрос', HttpStatus.UNAUTHORIZED)
      }
    }
  }
  // запрос на восстановление пароля через вызов и тг
  async changePassword(dto: accessNumber) {

    // indicator == `2 - звонок, 1 - телеграмм

    try {
      if (dto?.phoneNumber?.length <= 5 || dto?.password?.length <= 0 || dto?.passwordTwo?.length <= 0 || dto?.code?.length <= 0) {
        throw new HttpException('Не заполнены или некорректно заполнены поля', HttpStatus.UNAUTHORIZED)
      }

      if (dto?.password != dto?.passwordTwo) throw new HttpException('Введенные пароли не совпадают', HttpStatus.UNAUTHORIZED)

      let user

      if (dto?.phoneNumber?.length >= 5) {
        user = await this.findByPhone(dto.phoneNumber)
      }

      if (!user) throw new HttpException('Аккаунт не найден', HttpStatus.UNAUTHORIZED)
      // если не активирован то ошибка
      if (!user.isActivatedPhone) throw new HttpException('Аккаунт не активирован, необходимо подтвердить номер телефона', HttpStatus.UNAUTHORIZED)

      if (dto.indicator == '1') {
        if(!user.chatIdTg) throw new HttpException('На аккаунте не привязан телеграмм', HttpStatus.UNAUTHORIZED)
      }

      let checkPassword;

      const saltRounds = 10
      const salt = await bcrypt.genSalt(saltRounds)

      if (dto.indicator == '2') {
        checkPassword = user.activationCodeForChangePassword == dto.code
      }
      if (dto.indicator == '1') {
        checkPassword = user.activationCodeForChangePasswordTg == dto.code
      }

      if(!checkPassword) throw new HttpException('Указан не верный код', HttpStatus.UNAUTHORIZED)

      const password = await bcrypt.hash(dto.password, salt)
      user.password = password

      await this.saveUpdatedUser(user.id, user)

      // через звонок
      if (dto.indicator == '2') {
        user.activationCodeForChangePassword = ''
      }

      if (dto.indicator == '1') {
        user.activationCodeForChangePasswordTg = ''
      }

      return {
        text: 'Пароль успешно изменен',
      }

    } catch (err) {
      console.log(err)
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
        await this.LogsService.error(`Ошибка при изменении пароля ${dto.phoneNumber}`, `ошибка ${err}`)
        throw new HttpException('Ошибка при изменении пароля', HttpStatus.FORBIDDEN)
      }
    }
  }
  // активация аккаунта
  async activate(activationLink: string) {
    try {
      const user = await this.findByActivateLink(activationLink)

      if (!user) {
        throw new HttpException('Некорректная ссылка активации, запросите повторно в окне авторизации', HttpStatus.BAD_REQUEST)
      }

      user.isActivatedEmail = true
      await this.saveUpdatedUser(user.id, user)
      await this.sendMessageAboutActivated(user.email)

      return {
        text: 'Успешная активация',
      }
    } catch (err) {
      if (err.response === 'Некорректная ссылка активации, запросите повторно в окне авторизации') {
        await this.LogsService.error(`аквтивация ак`, `некорректная ссылка активации no trace`)
        throw err
      } else {
        await this.LogsService.error(`активация ак`, `ошибка ${err}`)
        throw new HttpException('Ошибка при активации аккаунта', HttpStatus.BAD_REQUEST)
      }
    }
  }
  // повторно направить письмо с ссылкой активации
  async activateRepeat(dto: email) {
    try {
      const user = await this.findByEmail(dto.email)
      if (!user) throw new HttpException('Аккаунт не найден', HttpStatus.UNAUTHORIZED)
      if (user.isActivatedEmail === true) throw new HttpException('Ваш аккаунт уже активирован', HttpStatus.UNAUTHORIZED)
      // если isActivatedEmail = false то генерируем новую ссылку активации
      const activationLink = await uuidv4()
      user.activationLink = activationLink
      // обновляем пользователя
      await this.saveUpdatedUser(user.id, user)
      // отправляем на почту ссылку
      await this.sendActivationMail(user.email, `${process.env['API_URL']}/auth/activate/${activationLink}`)

      return {
        text: 'Сообщение направлено',
      }
    } catch (err) {
      if (err.response === 'Аккаунт не найден') {
        await this.LogsService.error(`отправить повторно ссылку активации`, `Аккаунт не найден no trace`)
        throw err
      } else if (err.response === 'Ваш аккаунт уже активирован') {
        await this.LogsService.error(`отправить повторно ссылку активации`, `Ваш аккаунт уже активирован no trace`)
        throw err
      } else {
        await this.LogsService.error(`отправить повторно ссылку активации`, `ошибка ${err}`)
        throw new HttpException('Ошибка при регистрации', HttpStatus.FORBIDDEN)
      }
    }
  }
  // создание кода при регистрации
  async verifyTg(dto, userIdTg, chatId) {

    try {
      const user = dto
      const code = await this.randomPassword(20)

      user.activationTgNumber = `${code}`
      user.chatIdTg = chatId
      user.userIdTg = userIdTg
      await this.saveUpdatedUser(user.id, user)

      return {
        text: code,
      }

    } catch (err) {

      if (err.response === 'Аккаунт не найден') {
        await this.LogsService.error(`отправить повторно ссылку активации`, `Аккаунт не найден no trace`)
        throw err
      } else if (err.response === 'Телефон уже используется') {
        await this.LogsService.error(`телефон уже используется`, `повторно введен телефон`)
      } else {
        await this.LogsService.error(`подтверждение номера в телеграмме`, `ошибка ${err}`)
        throw new HttpException('Ошибка при отправке запроса', HttpStatus.FORBIDDEN)
      }
    }
  }
  // создание кода в профиле
  async verifyTgInProfile(dto) {

    try {

      const code = dto.number
      let phone;
      let phoneToChange;

      if (dto.phoneNumber.startsWith('+')) {
        phone = dto.phoneNumber
      } else {
        phone = `+${dto.phoneNumber}`
      }

      if (dto.phoneToChange.startsWith('+')) {
        phoneToChange = dto.phoneToChange
      } else {
        phoneToChange = `+${dto.phoneToChange}`
      }

      const sameUser = await this.findByPhone(phoneToChange)

      if (sameUser && sameUser.isActivatedPhone) throw new HttpException('Номер телефона уже зарегистрирован в системе и подтвержден', HttpStatus.UNAUTHORIZED)

      const user = await this.findByPhone(phone)

      if (!user) throw new HttpException('Аккаунт не найден', HttpStatus.UNAUTHORIZED)
      if(user.forChangePhoneNumber != phoneToChange) throw new HttpException('Указан не верный номер телефона', HttpStatus.UNAUTHORIZED)

      if (user.activationTgNumberToProfile !== code) throw new HttpException('Не верный код активации', HttpStatus.UNAUTHORIZED)

      user.phoneNumber = phoneToChange
      user.forChangePhoneNumber = ''
      user.activationTgNumberToProfile = ''
      if(!user.isActivatedPhone) user.isActivatedPhone = true

      await this.saveUpdatedUser(user.id, user)

      return {
        text: 'Телефон успешно изменен, обновите страницу',
      }

    } catch (err) {

      if (err.response === 'Аккаунт не найден') {
        // await this.LogsService.error(`отправить повторно ссылку активации`, `Аккаунт не найден no trace`)
        throw err
      } else if (err.response === 'Указан не верный номер телефона') {
        // await this.LogsService.error(`телефон уже используется`, `повторно введен телефон`)
        throw err
      } else if (err.response === 'Не верный код активации') {
        // await this.LogsService.error(`телефон уже используется`, `повторно введен телефон`)
        throw err
      } else if (err.response === 'Номер телефона уже зарегистрирован в системе и подтвержден') {
        // await this.LogsService.error(`телефон уже используется`, `повторно введен телефон`)
        throw err
      } else {
        await this.LogsService.error(`подтверждение номера в телеграмме`, `ошибка ${err}`)
        throw new HttpException('Ошибка при отправке запроса', HttpStatus.FORBIDDEN)
      }
    }
  }
  async numberTgActivate(dto) {

    try {
      let numberPhone;
      const code = dto.numberActivation

      if (dto.phoneNumber.startsWith('+')) {
        numberPhone = dto.phoneNumber
      } else {
        numberPhone = `+${dto.phoneNumber}`
      }

      const user = await this.findByPhone(numberPhone)

      if (!user) throw new HttpException('Аккаунт не найден', HttpStatus.UNAUTHORIZED)

      if (user.activationTgNumber !== code) throw new HttpException('Не верный код активации', HttpStatus.UNAUTHORIZED)

      user.isActivatedPhone = true

      await this.saveUpdatedUser(user.id, user)

      return {
        text: 'Телефон успешно подтвержден, можете войти в учетную запись',
      }
    } catch (err) {
      if (err.response === 'Аккаунт не найден') {
        throw err
      } else if (err.response === 'Указан другой номер телефона, проверьте поле ввода номера') {
        throw err
      } else if (err.response === 'Не верный код активации') {
        throw err
      } else if (err.response === 'Аккаунт пользователя активирован') {
        throw err
      } else {
        await this.LogsService.error(`Подтверждение номера в телеграмме кодом`, `ошибка ${err}`)
        throw new HttpException('Ошибка при отправке запроса', HttpStatus.FORBIDDEN)
      }
    }
  }
  // изменение пароля через тг - запрос кода подтверждения
  async numberTgForgetPassword(dto) {

    try {

      let numberPhone;

      if (dto.phoneNumber.startsWith('+')) {
        numberPhone = dto.phoneNumber
      } else {
        numberPhone = `+${dto.phoneNumber}`
      }

      const user = await this.findByPhone(numberPhone)

      if (!user) throw new HttpException('Аккаунт не найден', HttpStatus.UNAUTHORIZED)
      if (!user?.chatIdTg) throw new HttpException('На вашем аккаунте не привязан телеграм', HttpStatus.UNAUTHORIZED)
      if (!user.isActivatedPhone) throw new HttpException('Аккаунт не активирован, необходимо подтвердить номер телефона', HttpStatus.UNAUTHORIZED)

      const code = await this.randomPassword(15)

      user.activationCodeForChangePasswordTg = code;
      await this.saveUpdatedUser(user.id, user)
      await this.telegramTwoService.sendNewPassword(user?.chatIdTg, `Ваш код подтверждения для изменения пароля: ${code}.\n \nНе передавайте его никому. Внесите его в соответствующую форму запроса насайте.`)

      return {
        text: 'Ожидайте сообщения от бота с кодом подтверждения в ваш телеграмм',
      }

    } catch (err) {
      if (err.response === 'Аккаунт не найден') {
        throw err
      } else if (err.response === 'На вашем аккаунте не привязан телеграм') {
        throw err
      } else if (err.response === 'Аккаунт не активирован, необходимо подтвердить номер телефона') {
        throw err
      } else {
        await this.LogsService.error(`Запрос кода на смену пароля в тг`, `ошибка ${err}`)
        throw new HttpException('Ошибка при отправке запроса', HttpStatus.FORBIDDEN)
      }
    }
  }

  // async numberTgActivate(id, dto) {
  //   try {
  //
  //     const user = await this.findById(id)
  //
  //     if (!user) throw new HttpException('Аккаунт не найден', HttpStatus.UNAUTHORIZED)
  //     if (user.activationTgNumber !== dto.number) throw new HttpException('Не верный код активации', HttpStatus.UNAUTHORIZED)
  //     if (user.phoneNumber == dto.number) throw new HttpException('Номер подтвержден', HttpStatus.UNAUTHORIZED)
  //
  //     user.phoneNumber = user.forChangePhoneNumber
  //     user.forChangePhoneNumber = ''
  //     user.isActivatedPhone = true
  //     user.activationTgNumber = ''
  //
  //     await this.saveUpdatedUser(id, user)
  //
  //     return {
  //       text: 'Телефон успешно подтвержден',
  //     }
  //   } catch (err) {
  //     if (err.response === 'Аккаунт не найден') {
  //       await this.LogsService.error(`подтверждение номера тг`, `Аккаунт не найден no trace`)
  //       throw err
  //     } else if (err.response === 'Не верный код активации') {
  //       await this.LogsService.error(`подтверждение номера тг`, `не верный код`)
  //       throw err
  //     } else if (err.response === 'Номер подтвержден') {
  //       throw err
  //     } else {
  //       await this.LogsService.error(`подтверждение номера в телеграмме кодом`, `ошибка ${err}`)
  //       throw new HttpException('Ошибка при отправке запроса', HttpStatus.FORBIDDEN)
  //     }
  //   }
  // }
}
