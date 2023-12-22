import { Module } from '@nestjs/common'
import { PostsService } from './posts.service'
import { PostsController } from './posts.controller'
import { HttpModule } from '@nestjs/axios'
import { TypeOrmModule } from '@nestjs/typeorm'
import { ScheduleModule } from '@nestjs/schedule'
import { ConfigModule } from '@nestjs/config'
import { PostEntity } from './entities/post.entity'
import { TutorsModule } from '../AllCategoriesForSearch/tutors/tutors.module'
import { UsersModule } from '../users/users.module'
import {
  LogsService,
  LogsServiceAddNannies,
  LogsServiceAddTutors,
} from '../otherServices/loggerService/logger.service'
import {
  RepositoryNanniesAdd,
  RepositoryPostsAdd,
  RepositoryTutorsAdd,
} from '../otherServices/loggerService/logger.module'
import { NanniesModule } from '../AllCategoriesForSearch/nannies/nannies.module'
import { CategoriesModule } from '../additionalRepositories/categories/categories.module'
import { GroupsFromVkModule } from '../groupsAndChats/groups-from-vk/groups-from-vk.module'
import { ChatsFromTelegramModule } from '../groupsAndChats/chats-from-telegram/chats-from-telegram.module'
import {RedisService} from "../redis/redis.service";

@Module({
  imports: [
    HttpModule,
    TypeOrmModule.forFeature([PostEntity]),
    ScheduleModule.forRoot(),
    ConfigModule.forRoot(),
    GroupsFromVkModule,
    TutorsModule,
    UsersModule,
    NanniesModule,
    ChatsFromTelegramModule,
    CategoriesModule,
  ],
  controllers: [PostsController],
  providers: [
    PostsService,
    LogsService,
    LogsServiceAddTutors,
    LogsServiceAddNannies,
    RepositoryPostsAdd,
    RepositoryTutorsAdd,
    RepositoryNanniesAdd,
    RedisService,
  ],
  exports: [PostsService],
})
export class PostsModule {}
