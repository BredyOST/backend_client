import { Controller, Post, Body, UseGuards, Request, Get, Patch, Delete } from '@nestjs/common'
import { PricesService } from './prices.service'
import { JwtAuthGuard } from '../../auth/guards/jwt.guard'
import { UserId } from '../../decorators/user-id.decorator'
import { SessionAuthService } from '../../auth/session-auth/session-auth.service'

@Controller('prices')
export class PricesController {
  constructor(private readonly pricesService: PricesService, private readonly sessionAuthService: SessionAuthService) {}

  @Post('/create')
  @UseGuards(JwtAuthGuard)
  async create(@UserId() id: number, @Request() req, @Body() dto) {
    // передаем параметр запроса, который мы добавили при проверке в мидлваре а именно токен
    const result = await this.sessionAuthService.validateSessionToken(req.session)
    // если возвращается false то сессия истекла
    if (!result) {
      return {
        text: 'Ваша сессия истекла, выполните повторный вход',
      }
    }
    return this.pricesService.create(id, dto)
  }

  @Get('/getAllOpen')
  @UseGuards(JwtAuthGuard)
  async getAllForAdmins(@UserId() id: number, @Request() req) {
    // передаем параметр запроса, который мы добавили при проверке в мидлваре а именно токен
    const result = await this.sessionAuthService.validateSessionToken(req.session)
    // если возвращается false то сессия истекла
    if (!result) {
      return {
        text: 'Ваша сессия истекла, выполните повторный вход',
      }
    }
    return this.pricesService.getAllForAdmins(id)
  }

  @Get('/getAll')
  async getAll() {
    console.log('222')
    return this.pricesService.getAll()
  }

  @Patch('/update')
  @UseGuards(JwtAuthGuard)
  async updateOne(@UserId() id: number, @Request() req, @Body() dto) {
    // передаем параметр запроса, который мы добавили при проверке в мидлваре а именно токен
    const result = await this.sessionAuthService.validateSessionToken(req.session)
    // если возвращается false то сессия истекла
    if (!result) {
      return {
        text: 'Ваша сессия истекла, выполните повторный вход',
      }
    }
    return this.pricesService.updateOne(id, dto)
  }

  @Delete('/delete')
  @UseGuards(JwtAuthGuard)
  async deleteOne(@UserId() id: number, @Request() req, @Body() dto) {
    // передаем параметр запроса, который мы добавили при проверке в мидлваре а именно токен
    const result = await this.sessionAuthService.validateSessionToken(req.session)
    // если возвращается false то сессия истекла
    if (!result) {
      return {
        text: 'Ваша сессия истекла, выполните повторный вход',
      }
    }
    return this.pricesService.deleteOne(id, dto)
  }
}
