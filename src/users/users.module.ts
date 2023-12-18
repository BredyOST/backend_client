import { Module } from '@nestjs/common'
import { UsersService } from './users.service'
import { UsersController } from './users.controller'
import { TypeOrmModule } from '@nestjs/typeorm'
import { UserEntity } from './entities/user.entity'
import { HttpModule } from '@nestjs/axios'
import { MailerModule } from '@nestjs-modules/mailer'
import { PassportModule } from '@nestjs/passport'
import { SessionAuthModule } from '../auth/session-auth/session-auth.module'
import { RepositoryOtherAdd } from '../otherServices/loggerService/logger.module'
import { LogsServiceOtherErrors } from '../otherServices/loggerService/logger.service'
import * as process from 'process'

@Module({
  imports: [
    HttpModule,
    TypeOrmModule.forFeature([UserEntity]),
    PassportModule,
    SessionAuthModule,
  ],
  exports: [UsersService],
  controllers: [UsersController],
  providers: [UsersService, RepositoryOtherAdd, LogsServiceOtherErrors],
})
export class UsersModule {}
