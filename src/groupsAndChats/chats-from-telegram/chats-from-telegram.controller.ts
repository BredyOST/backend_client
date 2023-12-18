import { Body, Controller, Delete, Get, Patch, Post, Request, UseGuards } from '@nestjs/common'
import { ChatsFromTelegramService } from './chats-from-telegram.service'
import { SessionAuthService } from '../../auth/session-auth/session-auth.service'
import { JwtAuthGuard } from '../../auth/guards/jwt.guard'
import { UserId } from '../../decorators/user-id.decorator'

@Controller('chats-from-telegram')
export class ChatsFromTelegramController {
  constructor(private readonly chatsFromTelegramService: ChatsFromTelegramService, private readonly sessionAuthService: SessionAuthService) {}

  @Post('/create')
  @UseGuards(JwtAuthGuard)
  async create(@UserId() id: number, @Body() dto: any, @Request() req) {
    // передаем параметр запроса, который мы добавили при проверке в мидлваре а именно токен
    const result = await this.sessionAuthService.validateSessionToken(req.session)
    // если возвращается false то сессия истекла
    if (!result) {
      return {
        text: 'Ваша сессия истекла, выполните повторный вход',
      }
    }
    // console.log(id)
    return this.chatsFromTelegramService.create(id, dto)
  }

  @Get('/getAll')
  @UseGuards(JwtAuthGuard)
  async getGroups(@UserId() id: number, @Request() req) {
    // передаем параметр запроса, который мы добавили при проверке в мидлваре а именно токен
    const result = await this.sessionAuthService.validateSessionToken(req.session)
    // если возвращается false то сессия истекла
    if (!result) {
      return {
        text: 'Ваша сессия истекла, выполните повторный вход',
      }
    }
    return this.chatsFromTelegramService.findAll()
  }

  @Patch('/update')
  @UseGuards(JwtAuthGuard)
  async updateChat(@UserId() id: number, @Body() dto: { newName: string; id: number }, @Request() req) {
    // передаем параметр запроса, который мы добавили при проверке в мидлваре а именно токен
    const result = await this.sessionAuthService.validateSessionToken(req.session)
    // если возвращается false то сессия истекла
    if (!result) {
      return {
        text: 'Ваша сессия истекла, выполните повторный вход',
      }
    }
    return this.chatsFromTelegramService.updateChat(id, dto)
  }

  @Delete('/delete')
  @UseGuards(JwtAuthGuard)
  async deleteGroup(@UserId() id: number, @Body() dto: { id: number }, @Request() req) {
    // передаем параметр запроса, который мы добавили при проверке в мидлваре а именно токен
    const result = await this.sessionAuthService.validateSessionToken(req.session)
    // если возвращается false то сессия истекла
    if (!result) {
      return {
        text: 'Ваша сессия истекла, выполните повторный вход',
      }
    }
    return this.chatsFromTelegramService.deleteGroup(id, dto)
  }
}
