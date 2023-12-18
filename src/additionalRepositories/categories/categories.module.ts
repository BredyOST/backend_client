import { Module } from '@nestjs/common'
import { CategoriesService } from './categories.service'
import { CategoriesController } from './categories.controller'
import { TypeOrmModule } from '@nestjs/typeorm'
import { CategoryEntity } from './entities/category.entity'
import { JwtStrategy } from '../../auth/strategies/jwt.strategy'
import { UsersModule } from '../../users/users.module'
import { RepositoryOtherAdd } from '../../otherServices/loggerService/logger.module'
import { LogsServiceOtherErrors } from '../../otherServices/loggerService/logger.service'
import { SessionAuthModule } from '../../auth/session-auth/session-auth.module'

@Module({
  imports: [TypeOrmModule.forFeature([CategoryEntity]), UsersModule, SessionAuthModule],
  exports: [CategoriesService],
  controllers: [CategoriesController],
  providers: [CategoriesService, JwtStrategy, RepositoryOtherAdd, LogsServiceOtherErrors],
})
export class CategoriesModule {}
