import { Module, Provider } from '@nestjs/common'
import { LogsService } from './logger.service'
import { LogsController } from './logger.controller'

export const RepositoryNameTokenPostsAdd = 'RepositoryNameTokenPostsAdd'
export const RepositoryNameTokenTutorsAdd = 'RepositoryNameTokenTutorsAdd'
export const RepositoryNameTokenNanniesAdd = 'RepositoryNameTokenNanniesAdd'
export const RepositoryNameTokenOtherAdd = 'RepositoryNameTokenOtherAdd'
export const RepositoryPostsAdd: Provider = {
  provide: RepositoryNameTokenPostsAdd,
  useValue: `PostsAdd`, // Замените на желаемое имя репозитория
}
export const RepositoryTutorsAdd: Provider = {
  provide: RepositoryNameTokenTutorsAdd,
  useValue: `TutorsAdd`, // Замените на желаемое имя репозитория
}
export const RepositoryNanniesAdd: Provider = {
  provide: RepositoryNameTokenNanniesAdd,
  useValue: `NanniesAdd`, // Замените на желаемое имя репозитория
}
export const RepositoryOtherAdd: Provider = {
  provide: RepositoryNameTokenOtherAdd,
  useValue: `OtherAdd`, // Замените на желаемое имя репозитория
}

@Module({
  controllers: [LogsController],
  providers: [LogsService, RepositoryPostsAdd, RepositoryTutorsAdd, RepositoryNanniesAdd, RepositoryOtherAdd],
  exports: [LogsService],
})
export class LogsModule {}
