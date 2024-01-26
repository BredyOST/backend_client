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
import { email } from '../auth/auth.controller'
import { codeForNewEmailType, codeForNewPhone, codeType, fullNAmeType, phoneType } from './users.controller'
import { LogsService } from '../otherServices/loggerService/logger.service'

export type createUSerWithLink = {
  email: string
  password: string
  activationLink: string
}

@Injectable()
export class UsersService {
  private readonly logger = new Logger(AppService.name)
  constructor(
    @InjectRepository(UserEntity)
    private repository: Repository<UserEntity>,
    private readonly mailerService: MailerService,
    private LogsService: LogsService, // сервис для создания общих уведомления и ошибок
    private readonly httpService: HttpService,
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
  async findByChangePhone(forChangePhoneNumber: string) {
    return this.repository.findOneBy({
      forChangePhoneNumber,
    })
  }
  // по id
  async findById(id: number) {
    return this.repository.findOneBy({
      id,
    })
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
  // сохраняем обвновленного пользователя
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
      // проверям не прислал ли нам пользователь свой же email
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
        await this.LogsService.error(`обновление почты`, `Вы уже ипользуете этот email ${dto.email} no trace`)
        throw err
      } else if (err.response === 'Такой Email уже зарегистрирован') {
        await this.LogsService.error(`обновление почты`, `уже существует ${dto.email} no trace`)
        throw err
      } else if (err.response === `Ошибка отправки сообщения об активации, проверьте почту`) {
        await this.LogsService.error(`обновление почты`, `ошибка отправки кода ${dto.email} no trace`)
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
        await this.saveUpdatedUser(id, user)
      }

      return {
        text: `Email успешно изменен на ${user.email}`,
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
        await this.LogsService.error(`обновление имени`, `Вы уже ипользуете этот email ${dto.fullName} no trace`)
        throw err
      } else if (err.response === `Ошибка при обновлении пользователя`) {
        await this.LogsService.error(`обновление имени`, `ошибка у ${id} no trace`)
        throw err
      } else {
        await this.LogsService.error(`обновление имени`, `ошибка у ${id} ${err}`)
        throw new HttpException('Ошибка при обновлении данных имени', HttpStatus.FORBIDDEN)
      }
    }
  }
  // изменение телефона
  async updatePhone(id: number, dto: codeForNewPhone) {
    try {
      // получем пользователя
      const user = await this.findById(+id)
      // проверям не прислал ли нам пользователь  номер которой уже использует
      if (user.phoneNumber === dto.phoneNumber.replace('+', '')) {
        throw new HttpException('Вы уже ипользуете этот телефон', HttpStatus.UNAUTHORIZED)
      }
      if (user.forChangePhoneNumber === dto.phoneNumber)
        throw new HttpException('Телефон уже добавлен во временное хранилище, нажмите "Подтвердить телефон', HttpStatus.UNAUTHORIZED)

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
        await this.LogsService.error(`обновление номера`, `Вы уже ипользуете этот телефон ${id} no trace`)
        throw err
      } else if (err.response === 'Такой телефон уже зарегестрирован') {
        await this.LogsService.error(`обновление номера`, `Такой телефон уже зарегестрирован ${id} no trace`)
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
          subject: `Активация аккаунта на сайте ${process.env['API_URL']}`,
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
                  /*margin: auto;*/
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
                        Для завершения процедуры регистрации на сайте и верификации email-адреса перейдите по данной ссылке:
                    </h2>
                    <div style="
                        background-color: #2626d0;
                        padding: 10px;
                        font-size: 24px;
                        border-radius: 5px;
                        cursor: pointer;
                        text-decoration: none;
                        color: white;">
                        <a href="${link}" style="text-decoration: none; color: white;">${link}</a>
                    </div>
                    <h2 style="font-size: 24px;">
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
          subject: `Успешная активация аккаунта на сайте ${process.env['API_URL']}`,
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

  // отправить нвоый пароль - запрос
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
  // верификация номера телефона - запрос вызова
  async verifyPhoneNumber(id: number, dto: phoneType) {
    const id_company = process.env['ID_COMPANY']
    const key = process.env['KEY']

    try {
      const user = await this.findById(+id)
      if (!user) throw new HttpException('Пользователь не найден', HttpStatus.UNAUTHORIZED)
      if (!user.forChangePhoneNumber || user.forChangePhoneNumber != dto.phone)
        throw new HttpException('Пользователь с таким номером телефона не найден. Нажмите кнопку "Изменить номер" перед запросом', HttpStatus.UNAUTHORIZED)

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

      if (response && response.data && response.data.pincode) {
        user.activationNumber = response.data.pincode
        await this.saveUpdatedUser(user.id, user)
      }

      return {
        text: 'Запрос выполнен, ожидайте звонка',
      }
    } catch (err) {
      if (err.response === 'Пользователь не найден') {
        await this.LogsService.error(`верификация номера - звонок`, `Пользователь не найден no trace`)
        throw err
      } else if (err.response === 'Пользователь с таким номером телефона не найден. Нажмите кнопку "Изменить номер" перед запросом') {
        await this.LogsService.error(`верификация номера - звонок`, `Пользователь с таким номером телефона не найден no trace`)
        throw err
      } else if (err.response === 'Запросы можно делать не более 1 раза в 2 минуты') {
        await this.LogsService.error(`верификация номера - звонок`, `частый запрос no trace`)
        throw err
      } else {
        await this.LogsService.error(`верификация номера - звонок`, `Ошибка ${err}`)
        throw new HttpException('запрос завершился неуспешно, если ен поступит звонок, повторите запрос', HttpStatus.UNAUTHORIZED)
      }
    }
  }
  // проверка введенног окода пользователем для верификации номера телефона
  async verifyPhoneCode(id: number, dto: any) {
    try {
      const user = await this.findById(+id)
      if (!user) throw new HttpException('Пользователь не найден', HttpStatus.UNAUTHORIZED)

      const checkCode = user.activationNumber == dto.actovatedCode
      if (!checkCode) throw new HttpException('Код не совадает, проверьте еще раз последние 4 цифры номера', HttpStatus.UNAUTHORIZED)
      if (checkCode) {
        user.phoneNumber = user.forChangePhoneNumber
        user.forChangePhoneNumber = ''
        user.isActivatedPhone = true
      }
      await this.saveUpdatedUser(id, user)

      return {
        text: 'Телефон успешно подтвержден',
      }
    } catch (err) {
      if (err.response === 'Пользователь не найден') {
        await this.LogsService.error(`верификация номера-код`, `Пользователь не найден no trace`)
        throw err
      } else if (err.response === 'Код не совадает, проверьте еще раз последние 4 цифры номера') {
        await this.LogsService.error(`верификация номера-код`, `Код не совадает, проверьте еще раз последние 4 цифры номера no trace`)
        throw err
      } else {
        await this.LogsService.error(`верификация номера-код`, `ошибка ${err}`)
        throw new HttpException('ошибка при отправке кода, попробуйте повторить запрос', HttpStatus.UNAUTHORIZED)
      }
    }
  }
  // запрос на восстановление пароля
  async changePassword(dto: email) {
    try {
      // находим пользователя по email
      const user = await this.findByEmail(dto.email)
      if (!user) throw new HttpException('Аккаунт не найден', HttpStatus.UNAUTHORIZED)
      // если не активирован то ошибка
      if (user.isActivatedEmail === false) throw new HttpException('Аккаунт не активирован', HttpStatus.UNAUTHORIZED)
      // создаем новый пароль и шифруем
      const newPassword = await this.randomPassword(12)
      const saltRounds = 10
      const salt = await bcrypt.genSalt(saltRounds)
      const password = await bcrypt.hash(newPassword, salt)
      // обновляем пароль у найденного пользователя
      user.password = password
      // обновляем пользователя а базе данных
      await this.saveUpdatedUser(user.id, user)
      // высылаем на почту новый пароль
      await this.sendChangePassword(user.email, newPassword)

      return {
        text: 'Сообщение c новым паролем направлено на email',
      }
    } catch (err) {
      if (err.response === 'Аккаунт не найден') {
        await this.LogsService.error(`выслать пароль`, `Аккаунт не найден  ${dto.email} no trace`)
        throw err
      } else if (err.response === 'Аккаунт не активирован') {
        await this.LogsService.error(`выслать пароль`, `Аккаунт не активирован  ${dto.email} no trace`)
        throw err
      } else if (err.response === 'Ошибка при обновлении пользователя') {
        await this.LogsService.error(`выслать пароль`, `ошибка приобновлении пользователя ${dto.email} no trace`)
        throw err
      } else if (err.response === '= randomPassword') {
        await this.LogsService.error(`выслать пароль`, `randomPassword error  ${dto.email} no trace`)
        throw err
      } else if (err.response === 'Ошибка при отправке пароля') {
        await this.LogsService.error(`выслать пароль`, `Ошибка при отправке пароля  ${dto.email} no trace`)
        throw err
      } else {
        await this.LogsService.error(`выслать пароль`, `Ошибка при генерации пароля ${dto.email} no trace`)
        throw new HttpException('Ошибка при генерации пароля', HttpStatus.FORBIDDEN)
      }
    }
  }
  // активация аккаунта
  async activate(activationLink) {
    try {
      // находим пользователя с такой ссылкой
      const user = await this.findByActivateLink(activationLink)

      if (!user) {
        throw new HttpException('Некорректная ссылка активации, запросите повторно в окне авторизации', HttpStatus.BAD_REQUEST)
      }
      // если есть то ставим флаг об активации и обновляем его
      user.isActivatedEmail = true
      await this.saveUpdatedUser(user.id, user)
      await this.sendMessageAboutActivated(user.email)

      return {
        text: 'Успешная активация'
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

}
