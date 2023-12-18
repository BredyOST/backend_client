import { Controller, Post, Body, UseGuards } from '@nestjs/common'
import { NotificationsService } from './notifications.service'
import { JwtAuthGuard } from '../../auth/guards/jwt.guard'
import { UserId } from '../../decorators/user-id.decorator'

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post('/create')
  @UseGuards(JwtAuthGuard)
  async addUserToList(@UserId() id: number, @Body() dto: any) {
    return this.notificationsService.create(id, dto)
  }
}
