import { HttpException, HttpStatus, Injectable } from '@nestjs/common'
import { CreateCategoryDto } from './dto/create-category.dto'
import { Repository } from 'typeorm'
import { CategoryEntity } from './entities/category.entity'
import { InjectRepository } from '@nestjs/typeorm'
import { UsersService } from '../../users/users.service'

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(CategoryEntity)
    private repository: Repository<CategoryEntity>,
    private usersService: UsersService,
  ) {}

  async findByIdCategory(id_category: string) {
    return this.repository.findOneBy({
      id_category,
    })
  }
  async findById_category(id: number) {
    return this.repository.findOneBy({
      id,
    })
  }
  async findByName(name: string) {
    return this.repository.findOneBy({
      name,
    })
  }
  async findAll() {
    return await this.repository.find()
  }
  async getAllCategories() {
    try {
      // const user = await this.usersService.findById(+id);
      // if (!user) throw new HttpException('Пользователь не найден', HttpStatus.UNAUTHORIZED);
      // if (!user.isMainAdmin) throw new HttpException('У вас нет доступа', HttpStatus.UNAUTHORIZED);

      return await this.findAll()
    } catch (err) {
      if (err.response === 'Пользователь не найден') {
        throw err
      } else if (err.response === 'У вас нет доступа') {
        throw err
      } else {
        throw new HttpException('Ошибка получении всех категорий', HttpStatus.FORBIDDEN)
      }
    }
  }
  async createCategory(id: number, dto: CreateCategoryDto) {
    try {
      const user = await this.usersService.findById(+id)
      if (!user) throw new HttpException('Пользователь не найден', HttpStatus.UNAUTHORIZED)
      if (!user.isMainAdmin) throw new HttpException('У вас нет доступа', HttpStatus.UNAUTHORIZED)

      const isSameCategoryId = await this.findByIdCategory(dto.id_category)

      if (isSameCategoryId) throw new HttpException('Такой id существует', HttpStatus.BAD_REQUEST)

      const isSameCategoryName = await this.findByName(dto.name)
      if (isSameCategoryName) throw new HttpException('Такая категория уже существует', HttpStatus.BAD_REQUEST)

      await this.repository.save({
        id_category: dto.id_category,
        name: dto.name,
        description: dto.description,
        positiveWords: dto.positiveWords,
        negativeWords: dto.negativeWords,
      })

      return {
        text: ' категория успено добавлена',
      }
    } catch (err) {
      if (err.response === 'Пользователь не найден') {
        throw err
      } else if (err.response === 'У вас нет доступа') {
        throw err
      } else if (err.response === 'Такой id существует') {
        throw err
      } else if (err.response === 'Такая категория уже существует') {
        throw err
      } else {
        throw new HttpException('Ошибка при доабвлении категории', HttpStatus.FORBIDDEN)
      }
    }
  }
  async updateCategory(id: number, dto: { id: number; id_category: string; name: string; description: string }) {
    try {
      let indicatorID = false
      let indicatorName = false
      let indicatorDescription = false

      const user = await this.usersService.findById(+id)
      if (!user) throw new HttpException('Пользователь не найден', HttpStatus.UNAUTHORIZED)
      if (!user.isMainAdmin) throw new HttpException('У вас нет доступа', HttpStatus.UNAUTHORIZED)

      const categoryId = await this.findByIdCategory(`${dto.id}`)
      if (!categoryId) throw new HttpException('id категории не найден', HttpStatus.BAD_REQUEST)

      if (dto.name.length && categoryId.name != dto.name) {
        const isSameCategoryName = await this.findByName(dto.name)
        if (!isSameCategoryName) {
          indicatorName = true
          categoryId.name = dto.name
        }
      }

      if (dto.id_category && dto.id_category != categoryId.id_category) {
        const isSameIdCategory = await this.findById_category(+dto.id)
        if (!isSameIdCategory) {
          indicatorID = true
          categoryId.id_category = dto.id_category
        }
      }

      if (dto.description && dto.description != categoryId.description) {
        indicatorDescription = true
        categoryId.description = dto.description
      }

      if (indicatorID || indicatorName || indicatorDescription) await this.repository.update(dto.id, categoryId)

      if (!indicatorID && !indicatorName && !indicatorDescription) {
        throw new HttpException('категория не изменена', HttpStatus.BAD_REQUEST)
      } else {
        return {
          text: `${indicatorID ? 'id обновлен,' : 'id не обновлен,'} ${indicatorName ? 'имя обновлено,' : 'имя не обновлено,'} ${
            indicatorDescription ? 'описание обновлено' : 'описание не обновлено'
          }`,
        }
      }
    } catch (err) {
      if (err.response === 'Пользователь не найден') {
        throw err
      } else if (err.response === 'id категории не найден') {
        throw err
      } else if (err.response === 'У вас нет доступа') {
        throw err
      } else if (err.response === 'категория не изменена') {
        throw err
      } else {
        throw new HttpException('Ошибка при изменении категории', HttpStatus.FORBIDDEN)
      }
    }
  }
  async deleteCategory(id: number, dto: { id: number }) {
    try {
      const user = await this.usersService.findById(+id)
      if (!user) throw new HttpException('Пользователь не найден', HttpStatus.UNAUTHORIZED)
      if (!user.isMainAdmin) throw new HttpException('У вас нет доступа', HttpStatus.UNAUTHORIZED)

      const categoryId = await this.findByIdCategory(`${dto.id}`)
      if (!categoryId) throw new HttpException('id категории не найден', HttpStatus.BAD_REQUEST)

      await this.repository.delete(dto.id)

      return {
        text: 'категория успешно удалена',
      }
    } catch (err) {
      if (err.response === 'Пользователь не найден') {
        throw err
      } else if (err.response === 'id категории не найден') {
        throw err
      } else if (err.response === 'У вас нет доступа') {
        throw err
      } else {
        throw new HttpException('Ошибка при изменении категории', HttpStatus.FORBIDDEN)
      }
    }
  }
  async getOneCategory(id: number, dto: { id: number }) {
    try {
      const user = await this.usersService.findById(+id)
      if (!user) throw new HttpException('Пользователь не найден', HttpStatus.UNAUTHORIZED)

      const categoryId = await this.findByIdCategory(`${dto.id}`)
      if (!categoryId) throw new HttpException('id категории не найден', HttpStatus.BAD_REQUEST)

      return categoryId
    } catch (err) {
      if (err.response === 'Пользователь не найден') {
        throw err
      } else if (err.response === 'id категории не найден') {
      } else {
        throw new HttpException('Ошибка при получении категории', HttpStatus.FORBIDDEN)
      }
    }
  }
  async getWordsPositiveAndNegative(id: number, dto:{id:number, indicator: 1 | 2}) {

    try {

      const user = await this.usersService.findById(+id)
      if (!user) throw new HttpException('Пользователь не найден', HttpStatus.UNAUTHORIZED)

      const category = await this.findByIdCategory(`${dto.id}`)
      if (!category) throw new HttpException('id категории не найден', HttpStatus.BAD_REQUEST)

      if (dto.indicator == 1) {
        return category.positiveWords;
      }
      if (dto.indicator == 2) {
        return category.negativeWords;
      }


    } catch (err) {
      throw new HttpException(`Ошибка при получении позитивных слов в категории ${id}`, HttpStatus.FORBIDDEN)
    }

  }

  async activateFreePeriod(id: number, dto) {

    try {
      const user = await this.usersService.findById(+id)
      if (!user) throw new HttpException('Пользователь не найден', HttpStatus.UNAUTHORIZED)
      if (!dto.length) throw new HttpException('Необходимо выбрать категории', HttpStatus.UNAUTHORIZED)
      if (user.activatedFreePeriod) throw new HttpException('Вы уже используете бесплатный период', HttpStatus.UNAUTHORIZED)
      if (user.endFreePeriod) throw new HttpException('Вы уже использовали бесплатный период', HttpStatus.UNAUTHORIZED)

      const categories = []
      const purchaseDate = new Date() // Дата покупки
      const endDate = new Date(purchaseDate) // Создаем новый объект Date, чтобы не изменять оригинальный
      endDate.setDate(purchaseDate.getDate() + 2) // Устанавливаем дату окончания на 2 дня после даты покупки

      for (const item of dto) {
        const nameCategory = await this.findById_category(item.id)
        const obj = {
          id: item.id, // id купленной категории
          name: nameCategory.name,
          purchaseBuyDate: purchaseDate, // Дата покупки
          purchaseEndDate: endDate, // Дата окончания подписки
          purchasePeriod: 2, // Период подписки в днях
        }
        categories.push(obj)
      }

      user.activatedFreePeriod = true // делам активным бесплатный период
      user.categoriesFreePeriod = categories // записываекм пользователю категории для бесплатного периода

      await this.usersService.saveUpdatedUser(user.id, user)

      return {
        text: 'Бесплатный период активирован',
      }

    } catch (err) {
      if (err.response === 'Пользователь не найден') {
        throw err
      } else if (err.response === `Вы уже используете бесплатный период`) {
        throw err
      } else if (err.response === `Необходимо выбрать категории`) {
        throw err
      } else if (err.response === `Вы уже использовали бесплатный период`) {
        throw err
      } else {
        throw new HttpException('Ошибка при получении бесплатного периода', HttpStatus.FORBIDDEN)
      }
    }
  }
}
