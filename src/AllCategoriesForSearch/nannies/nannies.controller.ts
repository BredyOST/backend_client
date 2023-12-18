import {Controller, Get, Post, Body, UseGuards, Request} from '@nestjs/common'
import { PaginationDto } from '../tutors/dto/pagination.dto'
import { NanniesService } from './nannies.service'
import {JwtAuthGuard} from "../../auth/guards/jwt.guard";
import {UserId} from "../../decorators/user-id.decorator";
import {SessionAuthService} from "../../auth/session-auth/session-auth.service";

@Controller('nannies')
export class NanniesController {
  constructor(
      private readonly nanniesService: NanniesService,
      private readonly sessionAuthService: SessionAuthService
  ) {}

  @Post('/posts')
  async getAllSortedPosts(@Body() dto: PaginationDto) {
    return this.nanniesService.getAllSortedPosts(dto)
  }

  @Get('/getPostForStatic')
  async getPostForStatic() {
    return this.nanniesService.getPostForStatic()
  }

  @Get('/all')
  @UseGuards(JwtAuthGuard)
  async getAll(@UserId() id: number, @Request() req) {
    // передаем параметр запроса, который мы добавили при проверке в мидлваре а именно токен
    const result = await this.sessionAuthService.validateSessionToken(req.session)
    // если возвращается false то сессия истекла
    // console.log(req.session)
    if (!result) {
      return {
        text: 'Ваша сессия истекла, выполните повторный вход',
      }
    }
    return this.nanniesService.getAll()
  }
}
