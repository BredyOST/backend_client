import { Controller, Post, UseGuards, Request, Body, Get, Redirect} from '@nestjs/common'
import { AuthService } from './auth.service'
import { UserEntity } from '../users/entities/user.entity'
import { LocalAuthGuard } from './guards/local.guard'
import { RefreshTokenDto } from '../users/dto/refresh-token.dto'
import { SessionAuthService } from './session-auth/session-auth.service'
import * as dotenv from 'dotenv'
import {ConfigService} from "@nestjs/config";
dotenv.config()


export type createUserType = {
  email: string
  password: string
  passwordCheck: string
}

export type email = {
  email: string
}

@Controller('auth')
export class AuthController {
  constructor(
      private readonly authService: AuthService,
      private readonly sessionAuthService: SessionAuthService,
      private configService: ConfigService
  ) {}

  // РЕГИСТРАЦИЯ
  @Post('register')
  async register(@Body() dto: createUserType) {
    return this.authService.register(dto)
  }

  // ВХОД В УЧЕТКУ
  @UseGuards(LocalAuthGuard)
  @Post('/login')
  async login(@Request() req) {
    const user = req.user as UserEntity
    const clientIp = req.clientIp
    const userAgent = req.headers['user-agent']

    return this.authService.login(user, clientIp, userAgent)
  }

  // КОГДА ПЕРЕШЛИ ПО ССЫЛКЕ АКТИВАЦИИ
  @Get('activate/:link')
  @Redirect('http://5.35.12.33:7777', 200)
  async activate(@Request() req: any) {
    return this.authService.activate(req.params.link)
  }

  // ЗАПРОС ПОВТОРНОЙ АКТИВАЦИИ
  @Post('/activateRepeat')
  async activateRepeat(@Body() dto: email) {
    return this.authService.activateRepeat(dto)
  }

  // ЗАПРОС НА НОВЫЙ ПАРОЛЬ ЕСЛИ ЗАБЫЛ
  @Post('/forgetPassword')
  async changePassword(@Body() dto: email) {
    return this.authService.changePassword(dto)
  }

  // ЗАПРОС НА НОВЫЕ ТОКЕНЫ ДОСТУПА, АТОМАТИЧЕСКИ ОТПРАВЛЯЕТСЯ ПО ОКОНЧАНИЮ СРОКА ДЕЙСТВИЯ РЕФРЕШ ТОКЕНА
  @Post('/login/access-token')
  async getNewTokens(@Body() dto: RefreshTokenDto, @Request() req) {
    // передаем параметр запроса, который мы добавили при проверке в мидлваре а именно токен
    const result = await this.sessionAuthService.validateSessionToken(req.session)
    // если возвращается false то сессия истекла
    if (!result) {
      return {
        text: 'Ваша сессия истекла, выполните повторный вход',
      }
    }
    return this.authService.getNewTokens(dto)
  }
}
