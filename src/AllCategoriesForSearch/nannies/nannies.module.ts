import { Module } from '@nestjs/common'
import { NanniesController } from './nannies.controller'
import { HttpModule } from '@nestjs/axios'
import { TypeOrmModule } from '@nestjs/typeorm'
import { ScheduleModule } from '@nestjs/schedule'
import { ConfigModule } from '@nestjs/config'
import { NannyEntity } from './entities/nanny.entity'
import { NanniesService } from './nannies.service'
import {LogsServiceAddNannies} from "../../otherServices/loggerService/logger.service";
import {RepositoryNanniesAdd} from "../../otherServices/loggerService/logger.module";
import {RedisService} from "../../redis/redis.service";
import {SessionAuthModule} from "../../auth/session-auth/session-auth.module";

@Module({
  imports: [HttpModule,
      TypeOrmModule.forFeature([NannyEntity]),
      ScheduleModule.forRoot(),
      ConfigModule.forRoot(),
      SessionAuthModule,
  ],
  controllers: [NanniesController],
  providers: [
      NanniesService,
      LogsServiceAddNannies,
      RepositoryNanniesAdd,
      RedisService,
  ],
  exports: [NanniesService],
})
export class NanniesModule {}
