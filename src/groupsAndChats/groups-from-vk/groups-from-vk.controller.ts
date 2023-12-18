import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Delete,
  UseGuards,
  Request,
} from '@nestjs/common'
import { GroupsFromVkService } from './groups-from-vk.service'

import { JwtAuthGuard } from '../../auth/guards/jwt.guard'
import { UserId } from '../../decorators/user-id.decorator'
import { SessionAuthService } from '../../auth/session-auth/session-auth.service'

@Controller('groups-from-vk')
export class GroupsFromVkController {
  constructor(
    private readonly groupsFromVkService: GroupsFromVkService,
    private readonly sessionAuthService: SessionAuthService,
  ) {}

  @Post('/create')
  @UseGuards(JwtAuthGuard)
  async create(@UserId() id: number, @Body() dto: any, @Request() req) {
    // передаем параметр запроса, который мы добавили при проверке в мидлваре а именно токен
    const result = await this.sessionAuthService.validateSessionToken(
      req.session,
    )
    // если возвращается false то сессия истекла
    if (!result) {
      return {
        text: 'Ваша сессия истекла, выполните повторный вход',
      }
    }
    // console.log(id)
    return this.groupsFromVkService.create(id, dto)
  }

  @Get('/getAll')
  @UseGuards(JwtAuthGuard)
  async getGroups(@UserId() id: number, @Request() req) {
    // передаем параметр запроса, который мы добавили при проверке в мидлваре а именно токен
    const result = await this.sessionAuthService.validateSessionToken(
      req.session,
    )
    // если возвращается false то сессия истекла
    if (!result) {
      return {
        text: 'Ваша сессия истекла, выполните повторный вход',
      }
    }
    return this.groupsFromVkService.findAll()
  }

  @Patch('/update')
  @UseGuards(JwtAuthGuard)
  async updateGroup(
    @UserId() id: number,
    @Body() dto: { newIdVk: string; id: number },
    @Request() req,
  ) {
    // передаем параметр запроса, который мы добавили при проверке в мидлваре а именно токен
    const result = await this.sessionAuthService.validateSessionToken(
      req.session,
    )
    // если возвращается false то сессия истекла
    if (!result) {
      return {
        text: 'Ваша сессия истекла, выполните повторный вход',
      }
    }
    return this.groupsFromVkService.updateGroup(id, dto)
  }

  @Delete('/delete')
  @UseGuards(JwtAuthGuard)
  async deleteGroup(
    @UserId() id: number,
    @Body() dto: { id: number },
    @Request() req,
  ) {
    // передаем параметр запроса, который мы добавили при проверке в мидлваре а именно токен
    const result = await this.sessionAuthService.validateSessionToken(
      req.session,
    )
    // если возвращается false то сессия истекла
    if (!result) {
      return {
        text: 'Ваша сессия истекла, выполните повторный вход',
      }
    }
    return this.groupsFromVkService.deleteGroup(id, dto)
  }
}
