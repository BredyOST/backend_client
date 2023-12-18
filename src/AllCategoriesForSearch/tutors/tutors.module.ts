import { Module } from '@nestjs/common'
import { TutorsController } from './tutors.controller'
import { HttpModule } from '@nestjs/axios'
import { TypeOrmModule } from '@nestjs/typeorm'
import { TutorEntity } from './entities/tutor.entity'
import { ConfigModule } from '@nestjs/config'
import { ScheduleModule } from '@nestjs/schedule'
import { TutorsService } from './tutors.service'
import { GroupsFromVkModule } from '../../groupsAndChats/groups-from-vk/groups-from-vk.module'
import { RepositoryTutorsAdd } from '../../otherServices/loggerService/logger.module'
import {LogsServiceAddTutors} from "../../otherServices/loggerService/logger.service";
import {RedisService} from "../../redis/redis.service";
import {SessionAuthModule} from "../../auth/session-auth/session-auth.module";

@Module({
  imports: [
    HttpModule,
    TypeOrmModule.forFeature([TutorEntity]),
    ScheduleModule.forRoot(),
    ConfigModule.forRoot(),
    GroupsFromVkModule,
    SessionAuthModule,
  ],
  controllers: [TutorsController],
  providers: [
      TutorsService,
      LogsServiceAddTutors,
      RepositoryTutorsAdd,
      RedisService,
  ],
  exports: [TutorsService],
})
export class TutorsModule {}
