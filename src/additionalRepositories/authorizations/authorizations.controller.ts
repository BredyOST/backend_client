import { Controller, Get, Post, Request, UseGuards } from '@nestjs/common'
import { AuthorizationsService } from './authorizations.service'
import { JwtAuthGuard } from '../../auth/guards/jwt.guard'
import { SessionAuthService } from '../../auth/session-auth/session-auth.service'
import { UserId } from '../../decorators/user-id.decorator'

@Controller('authorizations')
export class AuthorizationsController {
  constructor(private readonly authorizationsService: AuthorizationsService, private readonly sessionAuthService: SessionAuthService) {}

  @Post('/create')
  async create(dto) {
    return await this.authorizationsService.create(dto)
  }

  @Get('getMyAuthorizations')
  @UseGuards(JwtAuthGuard)
  async getMyAuthorizations(@UserId() id: number, @Request() req) {
    // передаем параметр запроса, который мы добавили при проверке в мидлваре а именно токен
    const result = await this.sessionAuthService.validateSessionToken(req.session)
    // если возвращается false то сессия истекла
    if (!result) {
      return {
        text: 'Ваша сессия истекла, выполните повторный вход',
      }
    }
    return await this.authorizationsService.getMyAuthorizations(id)
  }
}
