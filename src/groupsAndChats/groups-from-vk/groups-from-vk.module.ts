import { Module } from '@nestjs/common'
import { GroupsFromVkService } from './groups-from-vk.service'
import { GroupsFromVkController } from './groups-from-vk.controller'
import { TypeOrmModule } from '@nestjs/typeorm'
import { GroupsFromVkEntity } from './entities/groups-from-vk.entity'
import { HttpModule } from '@nestjs/axios'
import { UsersModule } from "../../users/users.module";
import { SessionAuthModule } from '../../auth/session-auth/session-auth.module'
import { RepositoryOtherAdd } from '../../otherServices/loggerService/logger.module'
import { LogsServiceOtherErrors } from '../../otherServices/loggerService/logger.service'

@Module({
  imports: [
    HttpModule,
    TypeOrmModule.forFeature([GroupsFromVkEntity]),
    UsersModule,
    SessionAuthModule,
  ],
  exports: [GroupsFromVkService],
  controllers: [GroupsFromVkController],
  providers: [GroupsFromVkService, RepositoryOtherAdd, LogsServiceOtherErrors],
})
export class GroupsFromVkModule {}
