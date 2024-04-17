import { HttpException, HttpStatus, Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { ChatsFromTelegramEntity } from './entities/chats-from-telegram.entity'
import { Repository } from 'typeorm'
import {UsersService} from "../../users/users.service";
import {HttpService} from "@nestjs/axios";
import * as process from 'process';

@Injectable()
export class ChatsFromTelegramService {
  constructor(
    private usersService: UsersService,
    @InjectRepository(ChatsFromTelegramEntity)
    private repository: Repository<ChatsFromTelegramEntity>,
    private readonly httpService: HttpService,
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
  async updateThis(id, group) {
    await this.repository.update(id, group)
  }
  async findAll() {
    return this.repository.find()
  }
  async getGroupsBatch(size,offset) {
    const groups = await this.repository.find({
      take: size,
      skip: offset,
      order: { id: 'ASC' },
    });
    return groups;
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
  async addPostDateWhenUpdate(date: Date, id: string, groupInfo) {

    // const group = await this.findByIdVk(idVk)
    if (!groupInfo) return

    let shouldUpdate = false // Флаг, указывающий, нужно ли обновлять запись в базе данных

    const dateObject = new Date(date);
    const groupInfoDate = new Date(groupInfo.postsDateWhenUpdate);
    // Обновляем дату последнего поста, если переданная дата более свежая или текущей даты нет
    if (!groupInfo.postsDateWhenUpdate || (date && groupInfoDate.getTime() < dateObject.getTime())) {
      groupInfo.postsDateWhenUpdate = date
      shouldUpdate = true
    }

    // Обновляем запись в базе данных, если были внесены изменения
    if (shouldUpdate) {
      this.repository.update(groupInfo.id, groupInfo)
    }

  }
  async changePostsDateToDateUpdateWhenBreak(info) {

    if (!info || !info?.postsDateWhenUpdate) return

    const postsLastDate = new Date(info.postsLastDate);
    const postsDateWhenUpdate = new Date(info.postsDateWhenUpdate);

    if(postsDateWhenUpdate > postsLastDate) {

      info.postsLastDate = info.postsDateWhenUpdate
      await this.repository.update(info.id, info)

    } else {
      return
    }
  }
  async addPostCounter(date: Date, chatName: string) {

    try {

      const group = await this.findByNameChat(chatName)

      if (!group) return

      let shouldUpdate = false // Флаг, указывающий, нужно ли обновлять запись в базе данных

      const dateObject = new Date(date);
      // Обновляем дату последнего поста, если переданная дата более свежая или текущей даты нет
      if (!group.postsLastDate || (date && group.postsLastDate.getTime() < dateObject.getTime())) {
        group.postsLastDate = date
        shouldUpdate = true
      }

      // Обновляем запись в базе данных, если были внесены изменения
      if (shouldUpdate) {
        await this.repository.update(group.id, group)
      }
    } catch (err) {
      console.log(err)
    }

  }




}
