import { Module } from '@nestjs/common'
import { SessionModule } from 'nestjs-session'
import * as process from 'process'

// Модуль CustomSessionModule, связан с настройкой сессий, а именно с использованием сессионных данных в приложении. Он настраивает секретный ключ для сессий.
@Module({
  imports: [
    SessionModule.forRootAsync({
      useFactory: () => ({
        session: { secret: process.env['SESSION_KEY'] }, // Замените на свой секретный ключ
      }),
    }),
  ],
})
export class CustomSessionModule {}
