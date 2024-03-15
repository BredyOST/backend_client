import { Body, Controller, Get, Patch, Post, Request, UseGuards } from '@nestjs/common'
import { UsersService } from './users.service'
import { JwtAuthGuard } from '../auth/guards/jwt.guard'
import { UserId } from '../decorators/user-id.decorator'
import { UpdateUserDto } from './dto/update-user.dto'
import { SessionAuthService } from '../auth/session-auth/session-auth.service'

export type fullNAmeType = { fullName: string }
export type codeForNewEmailType = { email: string, indicator:'sendAgain' | 'change' }
export type codeType = { code: string }
export type codeForNewPhone = { phoneNumber: string }
export type phoneType = { phone: string }
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
    // console.log(req.session)
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

  // ОБНОВЛЕНИЕ ТЕЛЕФОНА
  @Patch('/update/phone')
  @UseGuards(JwtAuthGuard)
  async updatePhone(@UserId() id: number, @Request() req, @Body() dto: codeForNewPhone) {
    // передаем параметр запроса, который мы добавили при проверке в мидлваре а именно токен
    const result = await this.sessionAuthService.validateSessionToken(req.session)
    // если возвращается false то сессия истекла
    if (!result) {
      return {
        text: 'Ваша сессия истекла, выполните повторный вход',
      }
    }
    return this.usersService.updatePhone(id, dto)
  }

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

  // ЗАПРОС ВЫЗОВА ДЛЯ ВЕРИФИКАЦИИ НОМЕРА
  @Post('/call')
  @UseGuards(JwtAuthGuard)
  async verifyPhoneNumber(@UserId() id: number, @Request() req, @Body() dto: phoneType) {
    // передаем параметр запроса, который мы добавили при проверке в мидлваре а именно токен
    const result = await this.sessionAuthService.validateSessionToken(req.session)
    // если возвращается false то сессия истекла
    if (!result) {
      return {
        text: 'Ваша сессия истекла, выполните повторный вход',
      }
    }
    return this.usersService.verifyPhoneNumber(id, dto)
  }

  // КОГДА ПОЛЬЗОВАТЕЛЬ ОТПРАВЛЯЕТ КОД ДЛЯ ВЕРИФИКАЦИИ НОМЕРА ТЕЛЕФОНА
  @Post('/call/code')
  @UseGuards(JwtAuthGuard)
  async verifyPhoneCode(@UserId() id: number, @Request() req, @Body() dto: number) {
    // передаем параметр запроса, который мы добавили при проверке в мидлваре а именно токен
    const result = await this.sessionAuthService.validateSessionToken(req.session)
    // если возвращается false то сессия истекла
    if (!result) {
      return {
        text: 'Ваша сессия истекла, выполните повторный вход',
      }
    }
    return this.usersService.verifyPhoneCode(id, dto)
  }

  @Post('/sendMessage')
  async sendMessage(@UserId() id: number, @Request() req, @Body() dto: any) {
    return this.usersService.sendMessage(dto)
  }

  @Post('/sendTg')
  @UseGuards(JwtAuthGuard)
  async verifyTg(@UserId() id: number, @Request() req, @Body() dto: any) {1
    console.log(dto)
    // передаем параметр запроса, который мы добавили при проверке в мидлваре а именно токен
    const result = await this.sessionAuthService.validateSessionToken(req.session)
    // если возвращается false то сессия истекла
    if (!result) {
      return {
        text: 'Ваша сессия истекла, выполните повторный вход',
      }
    }
    return this.usersService.verifyTg(id, dto)
  }

  @Post('/numberTgActivate')
  @UseGuards(JwtAuthGuard)
  async numberTgActivate(@UserId() id: number, @Request() req, @Body() dto: any) {
    // передаем параметр запроса, который мы добавили при проверке в мидлваре а именно токен
    const result = await this.sessionAuthService.validateSessionToken(req.session)
    // если возвращается false то сессия истекла
    if (!result) {
      return {
        text: 'Ваша сессия истекла, выполните повторный вход',
      }
    }
    return this.usersService.numberTgActivate(id, dto)
  }

}
