import { Module } from '@nestjs/common'
import { TelegramTwoService } from './telegramBotTwo.service'

@Module({
  providers: [TelegramTwoService],
  exports: [TelegramTwoService],
})
export class TelegramTwoModule {}
