import { Module } from '@nestjs/common'
import { ChatsFromTelegramService } from './chats-from-telegram.service'
import { ChatsFromTelegramController } from './chats-from-telegram.controller'
import { TypeOrmModule } from '@nestjs/typeorm'
import { ChatsFromTelegramEntity } from './entities/chats-from-telegram.entity'
import { UsersModule } from '../../users/users.module'
import { SessionAuthModule } from '../../auth/session-auth/session-auth.module'
import { RepositoryOtherAdd } from '../../otherServices/loggerService/logger.module'
import { LogsServiceOtherErrors } from '../../otherServices/loggerService/logger.service'

@Module({
  imports: [
    TypeOrmModule.forFeature([ChatsFromTelegramEntity]),
    UsersModule,
    SessionAuthModule,
  ],
  controllers: [ChatsFromTelegramController],
  providers: [
    ChatsFromTelegramService,
    RepositoryOtherAdd,
    LogsServiceOtherErrors,
  ],
  exports: [ChatsFromTelegramService],
})
export class ChatsFromTelegramModule {}
