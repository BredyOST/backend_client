import { Module } from '@nestjs/common'
import { PostsFromRedisService } from './posts-from-redis.service'
import { PostsFromRedisController } from './posts-from-redis.controller'
import { JwtStrategy } from '../../auth/strategies/jwt.strategy'
import { UsersModule } from '../../users/users.module'
import { SessionAuthModule } from '../../auth/session-auth/session-auth.module'
import {RedisModule} from "../../redis/redis.module";

@Module({
  imports: [
      UsersModule,
    SessionAuthModule,
      RedisModule,
  ],
  controllers: [PostsFromRedisController],
  providers: [PostsFromRedisService, JwtStrategy],
  exports:[PostsFromRedisService]
})
export class PostsFromRedisModule {}
