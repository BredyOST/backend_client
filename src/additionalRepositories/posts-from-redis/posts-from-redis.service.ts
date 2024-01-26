import {HttpException, HttpStatus, Injectable} from '@nestjs/common';
import { RedisService } from '../../redis/redis.service'
import {UsersService} from "../../users/users.service";

@Injectable()
export class PostsFromRedisService {


  constructor(
      private redisService: RedisService,
      private usersService: UsersService,
  ) {}

  async getAllKeysRedis(id, dto) {
    try {
      const user = await this.usersService.findById(+id)
      if (!user) throw new HttpException('Пользователь не найден', HttpStatus.UNAUTHORIZED)

      const pattern = await this.redisService.getAllKeys(`id:${dto.id}-*`);

      return pattern;

    } catch (err) {
      if (err.response === 'Пользователь не найден') {
        throw err
      }
    }
  }

  async getPostsFromRedis(id, dto) {
    try {

      const user = await this.usersService.findById(+id)
      if (!user) throw new HttpException('Пользователь не найден', HttpStatus.UNAUTHORIZED)

      const posts = await this.redisService.get(dto.str)
      return posts;

    } catch (err) {
      if (err.response === 'Пользователь не найден') {
        throw err
      }
    }
  }

}
