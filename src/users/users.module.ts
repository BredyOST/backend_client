import { Module } from '@nestjs/common'
import { UsersService } from './users.service'
import { UsersController } from './users.controller'
import { TypeOrmModule } from '@nestjs/typeorm'
import { UserEntity } from './entities/user.entity'
import { HttpModule } from '@nestjs/axios'
import { PassportModule } from '@nestjs/passport'
import { SessionAuthModule } from '../auth/session-auth/session-auth.module'
import { LogsService } from '../otherServices/loggerService/logger.service'
import { RepositoryAllAdd } from '../otherServices/loggerService/logger.module'
import { TelegramTwoService } from '../otherServices/telegram.service/telegramBotTwo.service'

@Module({
  imports: [HttpModule, TypeOrmModule.forFeature([UserEntity]), PassportModule, SessionAuthModule],
  exports: [UsersService],
  controllers: [UsersController],
  providers: [UsersService, RepositoryAllAdd, LogsService, TelegramTwoService],
})
export class UsersModule {}
