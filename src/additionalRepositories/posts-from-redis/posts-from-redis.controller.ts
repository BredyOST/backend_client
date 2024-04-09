import { Body, Controller, Get, Post, Request, UseGuards } from '@nestjs/common'
import { PostsFromRedisService } from './posts-from-redis.service';
import { JwtAuthGuard } from '../../auth/guards/jwt.guard'
import { UserId } from '../../decorators/user-id.decorator'
import { SessionAuthService } from '../../auth/session-auth/session-auth.service'

@Controller('posts-from-redis')
export class PostsFromRedisController {
  constructor(
      private readonly postsFromRedisService: PostsFromRedisService,
      private readonly sessionAuthService: SessionAuthService

  ) {}

  @Post('/getPostsRedis')
  @UseGuards(JwtAuthGuard)
  async getPostsFromRedis(@UserId() id: number, @Request() req, @Body() dto) {
    // передаем параметр запроса, который мы добавили при проверке в мидлваре а именно токен
    const result = await this.sessionAuthService.validateSessionToken(req.session)
    // если возвращается false то сессия истекла
    if (!result) {
      return {
        text: 'Ваша сессия истекла, выполните повторный вход',
      }
    }
    return this.postsFromRedisService.getPostsFromRedis(id, dto)
  }

  @Post('/redisKeys')
  @UseGuards(JwtAuthGuard)
  async redisKey(@UserId() id: number, @Request() req, @Body() dto) {
    // передаем параметр запроса, который мы добавили при проверке в мидлваре а именно токен
    const result = await this.sessionAuthService.validateSessionToken(req.session)
    // если возвращается false то сессия истекла
    if (!result) {
      return {
        text: 'Ваша сессия истекла, выполните повторный вход',
      }
    }
    return this.postsFromRedisService.getAllKeysRedis(id, dto)
  }
}
