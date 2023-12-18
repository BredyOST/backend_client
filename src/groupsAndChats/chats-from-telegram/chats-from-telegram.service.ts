import { HttpException, HttpStatus, Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { ChatsFromTelegramEntity } from './entities/chats-from-telegram.entity'
import { Repository } from 'typeorm'
import {UsersService} from "../../users/users.service";

@Injectable()
export class ChatsFromTelegramService {
  constructor(
    private usersService: UsersService,
    @InjectRepository(ChatsFromTelegramEntity)
    private repository: Repository<ChatsFromTelegramEntity>,
  ) {}

  async findByNameChat(chatName: string) {
    return this.repository.findOneBy({
      chatName,
    })
  }
  async findById(id: number) {
    return this.repository.findOneBy({
      id,
    })
  }
  async findAll() {
    return this.repository.find()
  }
  async create(id, dto) {
    try {
      const user = await this.usersService.findById(+id)
      if (!user) throw new HttpException('Пользователь не найден', HttpStatus.UNAUTHORIZED)
      if (!user.isMainAdmin) throw new HttpException('Не достаточно прав доступа', HttpStatus.UNAUTHORIZED)

      if (dto.identificator === 1) {
        const isSameGroup = await this.findByNameChat(dto.chatName)
        if (isSameGroup) throw new HttpException('Чат уже добавлен', HttpStatus.UNAUTHORIZED)
        await this.repository.save({
          chatName: dto.chatName,
        })

        return {
          text: 'чат добавлен',
        }
      }

      if (dto.identificator === 2) {
        const isSameArray = []
        let indicatorAdd = false

        for (const item of dto.chatName) {
          const isSameGroup = await this.findByNameChat(item)

          if (isSameGroup) {
            isSameArray.push(item)
            continue
          } else {
            indicatorAdd = true
            await this.repository.save({
              chatName: dto.chatName,
            })
          }
        }

        if (!isSameArray && indicatorAdd) {
          return { text: 'Чаты дабавлены' }
        } else if (isSameArray != undefined && isSameArray && isSameArray.length && indicatorAdd) {
          return { text: `Чаты добавлены кроме ${isSameArray}` }
        } else if (isSameArray != undefined && isSameArray && isSameArray.length && !indicatorAdd) {
          throw new HttpException('Чаты уже добавлены', HttpStatus.UNAUTHORIZED)
        }
      }
    } catch (err) {
      if (err.response === 'Пользователь не найден') {
        throw err
      } else if (err.response === 'Не достаточно прав доступа') {
        throw err
      } else if (err.response === 'Чат уже добавлены') {
        throw err
      } else if (err.response === 'Чаты уже добавлены') {
        throw err
      } else {
        throw new HttpException('Ошибка при добавлении чата', HttpStatus.FORBIDDEN)
      }
    }
  }
  async updateChat(id, dto: { newName: string; id: number }) {
    try {
      const user = await this.usersService.findById(+id)
      if (!user) throw new HttpException('Пользователь не найден', HttpStatus.UNAUTHORIZED)
      if (!user.isMainAdmin) throw new HttpException('Не достаточно прав доступа', HttpStatus.UNAUTHORIZED)

      const chat = await this.findById(dto.id)
      if (!chat) throw new HttpException('Чат не найден по id', HttpStatus.UNAUTHORIZED)
      if (chat.chatName === dto.newName) throw new HttpException('Передано то же имя', HttpStatus.UNAUTHORIZED)

      chat.chatName = dto.newName

      await this.repository.update(dto.id, chat)

      return {
        text: 'имя чата изменено',
      }
    } catch (err) {
      if (err.response === 'Пользователь не найден') {
        throw err
      } else if (err.response === 'Не достаточно прав доступа') {
        throw err
      } else if (err.response === 'Чат не найден по id') {
        throw err
      } else if (err.response === 'Передано то же имя') {
        throw err
      } else {
        throw new HttpException('Ошибка при обновлении', HttpStatus.FORBIDDEN)
      }
    }
  }
  async deleteGroup(id, dto: { id: number }) {
    try {
      const user = await this.usersService.findById(+id)
      if (!user) throw new HttpException('Пользователь не найден', HttpStatus.UNAUTHORIZED)
      if (!user.isMainAdmin) throw new HttpException('Не достаточно прав доступа', HttpStatus.UNAUTHORIZED)

      const chat = await this.findById(dto.id)
      if (!chat) throw new HttpException('Чат не найден по id', HttpStatus.UNAUTHORIZED)
      await this.repository.delete(dto.id)

      return {
        text: 'Чат удален',
      }
    } catch (err) {
      if (err.response === 'Пользователь не найден') {
        throw err
      } else if (err.response === 'Не достаточно прав доступа') {
        throw err
      } else if (err.response === 'Чат не найден по id') {
        throw err
      } else {
        throw new HttpException('Ошибка при обновлении', HttpStatus.FORBIDDEN)
      }
    }
  }
}
