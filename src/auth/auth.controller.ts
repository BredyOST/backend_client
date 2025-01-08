import { Controller, Post, UseGuards, Request, Body, Get, Redirect, Param, Res } from '@nestjs/common'
import { AuthService } from './auth.service'
import { UserEntity } from '../users/entities/user.entity'
import { LocalAuthGuard } from './guards/local.guard'
import { RefreshTokenDto } from '../users/dto/refresh-token.dto'
import { SessionAuthService } from './session-auth/session-auth.service'
import * as process from 'process'
import { ConfigService } from '@nestjs/config'

export type createUserType = {
  phoneNumber: string
  password: string
  passwordCheck: string
  refId: null | string
}

export type email = {
  email: string
}
export type accessNumber = {
  email?: string
  phoneNumber: string
  password?: string
  passwordTwo?: string
  code?: string
  indicator: string
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
  async register(@Request() req, @Body() dto: createUserType) {
    const clientIp = req.clientIp
    return this.authService.register(dto, clientIp)
  }

  // ВХОД В УЧЕТНУЮ ЗАПИСЬ
  @UseGuards(LocalAuthGuard)
  @Post('/login')
  async login(@Request() req) {
    const user = req.user as UserEntity
    const clientIp = req.clientIp
    const userAgent = req.headers['user-agent']

    return this.authService.login(user, clientIp, userAgent)
  }

  // КОГДА ПЕРЕШЛИ ПО ССЫЛКЕ АКТИВАЦИИ
  // @Get('activate/:link')
  // @Redirect(process.env['CLIENT_URL'], 200)
  // async activate(@Request() req: any) {
  //   return this.authService.activate(req.params.link)
  // }

  @Get('activate/:link')
  @Redirect('https://xn--e1affem4a4d.com', 301)
  async activate(@Param('link') activationLink: string, @Res() res: Response) {
    await this.authService.activate(activationLink);
    return { url: 'https://xn--e1affem4a4d.com/dashboard/profile' }
  }
  // ЗАПРОС ПОВТОРНОЙ АКТИВАЦИИ
  @Post('/activateRepeat')
  async activateRepeat(@Body() dto: email) {
    return this.authService.activateRepeat(dto)
  }

  // ЗАПРОС НА НОВЫЙ ПАРОЛЬ ЕСЛИ ЗАБЫЛ
  @Post('/forgetPassword')
  async changePassword(@Body() dto: accessNumber) {
    return this.authService.changePassword(dto)
  }

  // ЗАПРОС НА НОВЫЕ ТОКЕНЫ ДОСТУПА, АТОМАТИЧЕСКИ ОТПРАВЛЯЕТСЯ ПО ОКОНЧАНИЮ СРОКА ДЕЙСТВИЯ РЕФРЕШ ТОКЕНА
  @Post('/login/access-token')
  async getNewTokens(@Body() dto: RefreshTokenDto, @Request() req) {
    const result = await this.sessionAuthService.validateSessionToken(req.session)
    if (!result) {
      return {
        text: 'Ваша сессия истекла, выполните повторный вход',
      }
    }
    return this.authService.getNewTokens(dto)
  }
}
