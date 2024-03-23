import { Body, Controller, Get, Patch, Post, Request, UseGuards } from '@nestjs/common'
import { UsersService } from './users.service'
import { JwtAuthGuard } from '../auth/guards/jwt.guard'
import { UserId } from '../decorators/user-id.decorator'
import { UpdateUserDto } from './dto/update-user.dto'
import { SessionAuthService } from '../auth/session-auth/session-auth.service'

export type fullNAmeType = { fullName: string }
export type codeForNewEmailType = { email: string; indicator: 'sendAgain' | 'change' }
export type codeType = { code: string }
export type codeForNewPhone = { phoneNumber: string }
export type codeForChangePhone = { phoneNumber: string; phoneToChange: string }
export type phoneType = { phone: string, indicator: string }
@Controller('users')
export class UsersController {
  constructor(
      private readonly usersService: UsersService,
      private readonly sessionAuthService: SessionAuthService
  ) {}

  // получить всех пользователей

  // ПОЛУЧЕНИЕ ИНФОРМАЦИИ О ПОЛЬЗОВАТЕЛЕ
  @Get('profile')
  @UseGuards(JwtAuthGuard)
  async getMe(@UserId() id: number, @Request() req) {
    // передаем параметр запроса, который мы добавили при проверке в мидлваре а именно токен
    const result = await this.sessionAuthService.validateSessionToken(req.session)
    // если возвращается false то сессия истекла
    if (!result) {
      return {
        text: 'Ваша сессия истекла, выполните повторный вход',
      }
    }
    return this.usersService.getProfileInfo(id)
  }

  // ОБНОВЛЛЕНИЕ ИМЕНИ
  @Patch('/update/fullName')
  @UseGuards(JwtAuthGuard)
  // @Headers('session-token') sessionToken: string,
  async updateMe(@UserId() id: number, @Request() req, @Body() dto: fullNAmeType) {
    // передаем параметр запроса, который мы добавили при проверке в мидлваре а именно токен
    const result = await this.sessionAuthService.validateSessionToken(req.session)

    //если возвращается false то сессия истекла
    if (!result) {
      return {
        text: 'Ваша сессия истекла, выполните повторный вход',
      }
    }

    return this.usersService.updateFullName(id, dto)
  }

  // ЗАПРОС КОДА ДЛЯ ОБНОВЛЕНИЯ EMAIL
  @Post('/update/codeEmail')
  @UseGuards(JwtAuthGuard)
  async updateEmailСode(@UserId() id: number, @Request() req, @Body() dto: codeForNewEmailType) {
    // передаем параметр запроса, который мы добавили при проверке в мидлваре а именно токен
    const result = await this.sessionAuthService.validateSessionToken(req.session)
    // если возвращается false то сессия истекла
    if (!result) {
      return {
        text: 'Ваша сессия истекла, выполните повторный вход',
      }
    }
    return this.usersService.updateEmailСode(id, dto)
  }

  // ОБНОВЛЕНИЕ EMAIL
  @Patch('/update/email')
  @UseGuards(JwtAuthGuard)
  async updateEmail(@UserId() id: number, @Request() req, @Body() dto: codeType) {
    // передаем параметр запроса, который мы добавили при проверке в мидлваре а именно токен
    const result = await this.sessionAuthService.validateSessionToken(req.session)
    // если возвращается false то сессия истекла
    if (!result) {
      return {
        text: 'Ваша сессия истекла, выполните повторный вход',
      }
    }
    return this.usersService.updateEmail(id, dto)
  }

  // // ОБНОВЛЕНИЕ ТЕЛЕФОНА
  // @Patch('/update/phone')
  // @UseGuards(JwtAuthGuard)
  // async updatePhone(@UserId() id: number, @Request() req, @Body() dto: codeForNewPhone) {
  //   // передаем параметр запроса, который мы добавили при проверке в мидлваре а именно токен
  //   const result = await this.sessionAuthService.validateSessionToken(req.session)
  //   // если возвращается false то сессия истекла
  //   if (!result) {
  //     return {
  //       text: 'Ваша сессия истекла, выполните повторный вход',
  //     }
  //   }
  //   return this.usersService.updatePhone(id, dto)
  // }

  // ЗАПРОС КОДА В ТГ ДЛЯ ВЕРИФИКАЦИИ НОМЕРА ПРИ СМЕНЕ В ПРОФИЛЕ
  // @Patch('/update/phoneCodeTg')
  // @UseGuards(JwtAuthGuard)
  // async codeForChangePhone(@UserId() id: number, @Request() req, @Body() dto: codeForChangePhone) {
  //   // передаем параметр запроса, который мы добавили при проверке в мидлваре а именно токен
  //   const result = await this.sessionAuthService.validateSessionToken(req.session)
  //   // если возвращается false то сессия истекла
  //   if (!result) {
  //     return {
  //       text: 'Ваша сессия истекла, выполните повторный вход',
  //     }
  //   }
  //   return this.usersService.codeForChangePhone(id, dto)
  // }

  // ОБНОВЛЕНИЕ ПАРОЛЯ
  @Patch('/update/password')
  @UseGuards(JwtAuthGuard)
  async updatePassword(@UserId() id: number, @Request() req, @Body() dto: UpdateUserDto) {
    // передаем параметр запроса, который мы добавили при проверке в мидлваре а именно токен
    const result = await this.sessionAuthService.validateSessionToken(req.session)
    // если возвращается false то сессия истекла
    if (!result) {
      return {
        text: 'Ваша сессия истекла, выполните повторный вход',
      }
    }
    return this.usersService.updatePassword(id, dto)
  }


  // ЗАПРОС ВЫЗОВА ДЛЯ ВЕРИФИКАЦИИ НОМЕРА ИЛИ ЗАБЫЛ ПАРОЛЬ
  @Post('/call')
  async verifyPhoneNumber(@UserId() id: number, @Request() req, @Body() dto: phoneType) {
    return this.usersService.verifyPhoneNumber(id, dto)
  }

  // КОГДА ПОЛЬЗОВАТЕЛЬ ОТПРАВЛЯЕТ КОД ДЛЯ ВЕРИФИКАЦИИ НОМЕРА ТЕЛЕФОНА
  @Post('/call/code')
  async verifyPhoneCode(@UserId() id: number, @Request() req, @Body() dto: { phoneNumber: string, numberActivation: string}) {
    return this.usersService.verifyPhoneCode(id, dto)
  }

  @Post('/sendMessage')
  async sendMessage(@UserId() id: number, @Request() req, @Body() dto: any) {
    return this.usersService.sendMessage(dto)
  }

  // @Post('/sendTg')
  // @UseGuards(JwtAuthGuard)
  // async verifyTg(@UserId() id: number, @Request() req, @Body() dto: any) {
  //   // передаем параметр запроса, который мы добавили при проверке в мидлваре а именно токен
  //   const result = await this.sessionAuthService.validateSessionToken(req.session)
  //   // если возвращается false то сессия истекла
  //   if (!result)
  //     return {
  //       text: 'Ваша сессия истекла, выполните повторный вход',
  //     }
  //   }
  //   // return this.usersService.verifyTg(id, dto)
  // }

  // Отправка кода для верификации номера в ТГ
  @Post('/numberTgActivate')
  async numberTgActivate(@UserId() id: number, @Request() req, @Body() dto: any) {
    return this.usersService.numberTgActivate(dto)
  }
  // Отправка кода для смены пароля через тг
  @Post('/numberTgForgetPassword')
  async numberTgForgetPassword(@UserId() id: number, @Request() req, @Body() dto: any) {
    return this.usersService.numberTgForgetPassword(dto)
  }

  // Активация
  // @Post('/activateTgProfile')
  // @UseGuards(JwtAuthGuard)
  // async verifyTgInProfile(@UserId() id: number, @Request() req, @Body() dto: any) {
  //   // передаем параметр запроса, который мы добавили при проверке в мидлваре а именно токен
  //   const result = await this.sessionAuthService.validateSessionToken(req.session)
  //   // если возвращается false то сессия истекла
  //   if (!result) {
  //     return {
  //       text: 'Ваша сессия истекла, выполните повторный вход',
  //     }
  //   }
  //   return this.usersService.verifyTgInProfile(dto)
  // }

  // СТАРОЕ ЕСЛИ ЧЕЛ ЗАРЕГАЛСЯ БЕЗ НОМЕРА ДО 21.03.2024
  @Post('/giveInfo')
  async giveInfo(@UserId() id: number, @Request() req, @Body() dto: any) {
    // передаем параметр запроса, который мы добавили при проверке в мидлваре а именно токен
    const result = await this.sessionAuthService.validateSessionToken(req.session)
    // если возвращается false то сессия истекла
    if (!result) {
      return {
        text: 'Ваша сессия истекла, выполните повторный вход',
      }
    }
    return this.usersService.giveInfo(dto)
  }


}
