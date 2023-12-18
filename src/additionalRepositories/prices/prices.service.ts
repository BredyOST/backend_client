import { HttpException, HttpStatus, Injectable } from '@nestjs/common'
import { PriceEntity } from './entities/price.entity'
import { Repository } from 'typeorm'
import { InjectRepository } from '@nestjs/typeorm'
import { LogsServiceOtherErrors } from '../../otherServices/loggerService/logger.service'
import { UsersService } from '../../users/users.service'

@Injectable()
export class PricesService {
  constructor(
    @InjectRepository(PriceEntity)
    private repository: Repository<PriceEntity>,
    private readonly usersService: UsersService,
    private logsServiceForOtherErrors: LogsServiceOtherErrors, // сервис для создания общих уведомления и ошибок
  ) {}

  // получить все
  async getAllPrices() {
    return await this.repository.find()
  }
  // поиск по идентификатору
  async findOneByIdentificatorId(identificatorId) {
    return await this.repository.findOneBy({
      identificatorId,
    })
  }
  // обновить прайс
  async saveUpdateOne(identificatorId, newPrice) {
    await this.repository.update(identificatorId, newPrice)
  }
  // создание прайса
  async create(id, dto) {
    try {
      const user = await this.usersService.findById(+id)
      if (!user) throw new HttpException('Пользователь не найден', HttpStatus.UNAUTHORIZED)
      if (!user.isMainAdmin) throw new HttpException('У вас нет доступа', HttpStatus.UNAUTHORIZED)

      return await this.repository.save({
        identificatorId: dto.identidicatorId,
        title: dto.title,
        price: dto.price,
        period: dto.period,
        description: dto.description,
        sale: dto.sale,
        percentForSale: dto.percentForSale,
      })
    } catch (err) {
      // console.log(err)
      if (err.response === 'Пользователь не найден') {
        await this.logsServiceForOtherErrors.error(`добавление прайса`, `Пользователь не найден ${dto.email}`, `no trace`)
        throw err
      } else if (err.response === 'Не достаточно прав доступа') {
        await this.logsServiceForOtherErrors.error(`добавление прайса`, `нет доступа ${dto.email}`, `no trace`)
        throw err
      } else {
        await this.logsServiceForOtherErrors.error(`добавление прайса`, `ошибка ${dto.email}`, `${err}`)
        throw new HttpException('Ошибка при создании прайса', HttpStatus.UNAUTHORIZED)
      }
    }
  }
  // получение прайсов для админов с возможность редактирования
  async getAllForAdmins(id) {
    try {
      const user = await this.usersService.findById(+id)
      if (!user) throw new HttpException('Пользователь не найден', HttpStatus.UNAUTHORIZED)
      if (!user.isMainAdmin) throw new HttpException('У вас нет доступа', HttpStatus.UNAUTHORIZED)

      return await this.getAllPrices()
    } catch (err) {
      if (err.response === 'Пользователь не найден') {
        await this.logsServiceForOtherErrors.error(`получение прайсов для всех`, `Пользователь не найден ${id}`, `no trace`)
        throw err
      } else if (err.response === 'Не достаточно прав доступа') {
        await this.logsServiceForOtherErrors.error(`получение прайсов для всех`, `нет доступа ${id}`, `no trace`)
        throw err
      } else {
        await this.logsServiceForOtherErrors.error(`получение прайсов для всех`, `ошибка ${id}`, `${err}`)
        throw new HttpException('Ошибка при получении', HttpStatus.UNAUTHORIZED)
      }
    }
  }
  // получение прайсов для всех
  async getAll() {
    try {
      return await this.getAllPrices()
    } catch (err) {
      await this.logsServiceForOtherErrors.error(`получение прайсов для всех`, `ошибка`, `${err}`)
      throw new HttpException('Ошибка при получении прайсов для незарегестрированного', HttpStatus.UNAUTHORIZED)
    }
  }
  // обновление одного
  async updateOne(id, dto) {
    try {
      const user = await this.usersService.findById(+id)
      if (!user) throw new HttpException('Пользователь не найден', HttpStatus.UNAUTHORIZED)
      if (!user.isMainAdmin) throw new HttpException('У вас нет доступа', HttpStatus.UNAUTHORIZED)
      let changedPrice = false
      const priceBlock = await this.findOneByIdentificatorId(dto.identificatorId)
      if (!priceBlock) throw new HttpException('Категория не найдена', HttpStatus.UNAUTHORIZED)

      if (dto.title && dto.title != priceBlock.title) {
        priceBlock.title = dto.title
        if (!changedPrice) changedPrice = true
      }
      if (dto.price && dto.price != priceBlock.price) {
        priceBlock.price = dto.price
        if (!changedPrice) changedPrice = true
      }
      if (dto.period && dto.period != priceBlock.period) {
        priceBlock.period = dto.period
        if (!changedPrice) changedPrice = true
      }
      if (dto.description && dto.description != priceBlock.description) {
        priceBlock.description = dto.description
        if (!changedPrice) changedPrice = true
      }
      if (dto.sale && dto.sale != priceBlock.sale) {
        priceBlock.sale = dto.sale
        if (!changedPrice) changedPrice = true
      }
      if (dto.percentForSale && dto.percentForSale != priceBlock.percentForSale) {
        priceBlock.percentForSale = dto.percentForSale
        if (!changedPrice) changedPrice = true
      }

      if (changedPrice) throw new HttpException('Вы не внесли изменения', HttpStatus.UNAUTHORIZED)

      return await this.saveUpdateOne(dto.identificatorId, priceBlock)
    } catch (err) {
      if (err.response === 'Пользователь не найден') {
        await this.logsServiceForOtherErrors.error(`обновление прайса`, `Пользователь не найден ${id}`, `no trace`)
        throw err
      } else if (err.response === 'Не достаточно прав доступа') {
        await this.logsServiceForOtherErrors.error(`обновление прайса`, `нет доступа ${id}`, `no trace`)
        throw err
      } else if (err.response === 'Категория не найдена') {
        await this.logsServiceForOtherErrors.error(`обновление прайса`, `категория не найдена ${id}`, `no trace`)
        throw err
      } else if (err.response === 'Вы не внесли изменения') {
        await this.logsServiceForOtherErrors.error(`обновление прайса`, `Вы не внесли изменения ${id}`, `no trace`)
        throw err
      } else {
        await this.logsServiceForOtherErrors.error(`обновление прайса`, `ошибка ${id}`, `${err}`)
        throw new HttpException('Ошибка при обновлении прайса, попробуйте позже', HttpStatus.UNAUTHORIZED)
      }
    }
  }
  // удаление одного
  async deleteOne(id, dto) {
    try {
      const user = await this.usersService.findById(+id)
      if (!user) throw new HttpException('Пользователь не найден', HttpStatus.UNAUTHORIZED)
      if (!user.isMainAdmin) throw new HttpException('У вас нет доступа', HttpStatus.UNAUTHORIZED)

      const priceBlock = await this.findOneByIdentificatorId(dto.identificatorId)
      if (!priceBlock) throw new HttpException('прайс не найден', HttpStatus.UNAUTHORIZED)
      await this.repository.delete(dto.identificatorId)
    } catch (err) {
      if (err.response === 'Пользователь не найден') {
        await this.logsServiceForOtherErrors.error(`удаление прайса`, `Пользователь не найден ${dto.email}`, `no trace`)
        throw err
      } else if (err.response === 'Не достаточно прав доступа') {
        await this.logsServiceForOtherErrors.error(`удаление прайса`, `нет доступа ${dto.email}`, `no trace`)
        throw err
      } else if (err.response === 'Не достаточно прав доступа') {
        await this.logsServiceForOtherErrors.error(`удаление прайса`, `прайс не найден ${dto.email}`, `no trace`)
        throw err
      } else {
        await this.logsServiceForOtherErrors.error(`удаление прайса`, `ошибка ${dto.email}`, `${err}`)
        throw new HttpException('Ошибка при удалении прайса', HttpStatus.UNAUTHORIZED)
      }
    }
  }
}
