import { Controller, Get, Post, Body, Delete, UseGuards } from '@nestjs/common'
import { PostsService } from './posts.service'
import { JwtAuthGuard } from '../auth/guards/jwt.guard'
import { UserId } from '../decorators/user-id.decorator'
import { PaginationDto } from '../AllCategoriesForSearch/tutors/dto/pagination.dto'
import {Cron} from "@nestjs/schedule";

@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  // БЛОК ДЛЯ ВК
  // ----------------------------------------------------------
  //Если нет группы с постами в общем репозитории - то добавляем
  @Get('/createGroupsVk')
  createGroupsVk() {
    return this.postsService.processGroups(`1`)
  }

  // добавляем новые посты в ощий репозиторий
  // @Cron('0 */6 * * * *')
  @Get('/addNewPosts')
  addNewPostsVk() {
    return this.postsService.processGroups(`2`)
  }
  // ----------------------------------------------------------


  @Get('/createAndCheckTg')
  createAndCheckTg() {
    return this.postsService.processСhatsTg('1')
  }

  // @Cron('0 */3 * * * *')
  @Delete('/deleteAll')
  @UseGuards(JwtAuthGuard)
  deleteAllPosts(@UserId() id: number) {
    return this.postsService.deleteAllPosts(id)
  }

  @Delete('/deleteGroup')
  @UseGuards(JwtAuthGuard)
  deleteOneGroup(@UserId() id: number, @Body() dto: { id: string }) {
    return this.postsService.deleteOneGroup(id, dto)
  }

  @Get('/getAll')
  async getAll() {
    return this.postsService.getAll()
  }

  // @Cron('0 */20 * * * *')
  // @Get('/addPostsToTutors')
  // async addPostsToTutors() {
  //   return this.postsService.addPostsToTutorsRepository('tutors');
  // }

  @Get('/addPostsToRepository')
  async addPostsToRepository(id: number) {
    return this.postsService.createPostsToOthersRepository(14)
  }

  // @Cron('0 */20 * * * *')
  @Get('/addPostsRentalProperty')
  async addPostsRentalProperty() {
    // return this.postsService.addPostsRentalProperty('rentalProrety');
  }

  @Get('/enterToTelegram')
  enterToTelegram() {
    return this.postsService.enterToTelegram()
  }

  @Post('/testAllPosts')
  async getAllSortedPosts(@Body() dto: PaginationDto) {
    return this.postsService.getAllSortedPostsTest(dto)
  }


  @Get('/sss')
  async getGroups() {
    return this.postsService.getPosts(23168354, 10000000000)
  }

  //245704721
  @Get('/cheackOld')
  async checkOld() {
    return await this.postsService.startSeparateGroups()
  }

  // @Get('/name')
  // async name() {
  //   return this.postsService.addName()
  // }

}
