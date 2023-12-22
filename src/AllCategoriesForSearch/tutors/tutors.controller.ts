'use client'
import {Controller, Get, Post, Body, UseGuards, Request} from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { PaginationDto } from './dto/pagination.dto'
import { TutorsService } from './tutors.service'
import {JwtAuthGuard} from "../../auth/guards/jwt.guard";
import {UserId} from "../../decorators/user-id.decorator";
import {SessionAuthService} from "../../auth/session-auth/session-auth.service";

@Controller('tutors')
@ApiTags('tutors')
export class TutorsController {
  constructor(
      private readonly tutorsService: TutorsService,
      private readonly sessionAuthService: SessionAuthService,
  ) {}

  @Post('/posts')
  async getAllSortedPosts(@Body() dto: PaginationDto) {
    return this.tutorsService.getAllSortedPosts(dto)
  }
  // для статики - 50 постов
  @Get('/getPostForStatic')
  async getPostForStatic() {
    return this.tutorsService.getPostForStatic()
  }

  @Get('forRedis')
  async savePostsToRedis() {
    return this.tutorsService.savePostsToRedis()
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
    return this.tutorsService.getAll()
  }

  @Get('/create')
  async createPosts() {
    // return this.tutorsService.createPosts()
  }
}
