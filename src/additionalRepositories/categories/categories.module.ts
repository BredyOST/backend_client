import { Module } from '@nestjs/common'
import { CategoriesService } from './categories.service'
import { CategoriesController } from './categories.controller'
import { TypeOrmModule } from '@nestjs/typeorm'
import { CategoryEntity } from './entities/category.entity'
import { JwtStrategy } from '../../auth/strategies/jwt.strategy'
import { UsersModule } from '../../users/users.module'
import { SessionAuthModule } from '../../auth/session-auth/session-auth.module'
import { RepositoryAllAdd } from '../../otherServices/loggerService/logger.module'
import { LogsService } from '../../otherServices/loggerService/logger.service'
import { TransactionModule } from '../transaction/transaction.module'
import { TelegramTwoService } from '../../otherServices/telegram.service/telegramBotTwo.service'

@Module({
  imports: [
    TypeOrmModule.forFeature([CategoryEntity]),
    UsersModule,
    SessionAuthModule,
    TransactionModule,
  ],
  exports: [CategoriesService],
  controllers: [CategoriesController],
  providers: [CategoriesService, JwtStrategy, RepositoryAllAdd, LogsService, TelegramTwoService],
})
export class CategoriesModule {}
