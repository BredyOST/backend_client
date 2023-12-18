import {Body, Controller, Get, HttpException, HttpStatus, Post, Request, UseGuards} from '@nestjs/common'
import { JwtAuthGuard } from '../../auth/guards/jwt.guard'
import { UserId } from '../../decorators/user-id.decorator'
import { ForGetPostsFromAllService } from './ForGetPostsFromAll.service'
import {SessionAuthService} from "../../auth/session-auth/session-auth.service";
import {GroupsFromVkService} from "../../groupsAndChats/groups-from-vk/groups-from-vk.service";
import {UsersService} from "../../users/users.service";
import {PaginationDto} from "../tutors/dto/pagination.dto";

@Controller('getPostsFromAll')
export class ForGetPostsFromAllController {
  constructor(
      private readonly forGetPostsFromAllService: ForGetPostsFromAllService,
      private readonly sessionAuthService: SessionAuthService,
      private readonly groupsFromVkService: GroupsFromVkService,
      private readonly usersService: UsersService,
  ) {}

  @Post('all')
  @UseGuards(JwtAuthGuard)
  async getPosts(
    @UserId() id: number,
    @Request() req,
    @Body() dto: PaginationDto
  ) {

    // передаем параметр запроса, который мы добавили при проверке в мидлваре а именно токен
    const result = await this.sessionAuthService.validateSessionToken(req.session)
    // // если возвращается false то сессия истекла
    if (!result) {
      return {
        text: 'Ваша сессия истекла, выполните повторный вход',
      }
    }
    // находим пользователя по id
    const user = await this.usersService.findById(id)
    if (!user) throw new HttpException('Не найден пользователь для получения данных', HttpStatus.UNAUTHORIZED)

    return this.forGetPostsFromAllService.findPostsByCategory(dto)
  }
}
