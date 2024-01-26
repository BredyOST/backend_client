import { Module, Provider } from '@nestjs/common'
import { LogsService } from './logger.service'
import { LogsController } from './logger.controller'

export const RepositoryNameAllAdd = 'RepositoryNameAllAdd'
export const RepositoryAllAdd: Provider = {
  provide: RepositoryNameAllAdd,
  useValue: `PostsAdd`, // Замените на желаемое имя репозитория
}

@Module({
  controllers: [LogsController],
  providers: [LogsService, RepositoryAllAdd],
  exports: [LogsService],
})
export class LogsModule {}
