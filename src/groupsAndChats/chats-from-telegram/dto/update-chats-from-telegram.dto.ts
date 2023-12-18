import { PartialType } from '@nestjs/swagger'
import { CreateChatsFromTelegramDto } from './create-chats-from-telegram.dto'

export class UpdateChatsFromTelegramDto extends PartialType(CreateChatsFromTelegramDto) {}
