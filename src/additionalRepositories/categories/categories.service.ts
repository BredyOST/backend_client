import { HttpException, HttpStatus, Injectable } from '@nestjs/common'
import { CreateCategoryDto } from './dto/create-category.dto'
import { Repository } from 'typeorm'
import { CategoryEntity } from './entities/category.entity'
import { InjectRepository } from '@nestjs/typeorm'
import { UsersService } from '../../users/users.service'
import { category } from './categories.controller'
import * as uuid from 'uuid'
import axios from 'axios'
import { TransactionService } from '../transaction/transaction.service'
import * as process from 'process'

// admin.initializeApp();

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(CategoryEntity)
    private repository: Repository<CategoryEntity>,
    private transactionService: TransactionService,
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
      return await this.findAll()
    } catch (err) {
      throw new HttpException('Ошибка получении всех категорий', HttpStatus.FORBIDDEN)
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
        salary: +dto.salary,
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

  async updateCategory(id: number, dto: category) {
    try {
      let indicatorID = false
      let indicatorName = false
      let indicatorDescription = false
      let positiveWords = false
      let negativeWords = false
      let salary = false

      const user = await this.usersService.findById(+id)
      if (!user) throw new HttpException('Пользователь не найден', HttpStatus.UNAUTHORIZED)
      if (!user.isMainAdmin) throw new HttpException('У вас нет доступа', HttpStatus.UNAUTHORIZED)

      const categoryId = await this.findByIdCategory(`${dto.id}`)
      if (!categoryId) throw new HttpException('id категории не найден', HttpStatus.BAD_REQUEST)

      if (dto?.name?.length && categoryId.name != dto.name) {
        const isSameCategoryName = await this.findByName(dto.name)
        if (!isSameCategoryName) {
          indicatorName = true
          categoryId.name = dto.name
        }
      }

      if (dto?.id_category && dto.id_category != categoryId.id_category) {
        const isSameIdCategory = await this.findById_category(+dto.id)
        if (!isSameIdCategory) {
          indicatorID = true
          categoryId.id_category = dto.id_category
        }
      }

      if (dto?.description && dto.description != categoryId.description) {
        indicatorDescription = true
        categoryId.description = dto.description
      }

      if (dto?.positiveWords?.length) {
        categoryId.positiveWords = dto.positiveWords
        positiveWords = true
      }
      if (dto?.negativeWords?.length) {
        categoryId.negativeWords = dto.negativeWords
        negativeWords = true
      }
      if (dto?.salary) {
        categoryId.salary = +dto.salary
        salary = true
      }

      if (indicatorID || indicatorName || indicatorDescription || negativeWords || positiveWords || salary) await this.repository.update(dto.id, categoryId)

      if (!indicatorID && !indicatorName && !indicatorDescription && !negativeWords && !positiveWords && !salary) {
        throw new HttpException('категория не изменена', HttpStatus.BAD_REQUEST)
      } else {
        return {
          text: `${indicatorID ? 'id обновлен,' : 'id не обновлен,'} 
          ${indicatorName ? 'имя обновлено,' : 'имя не обновлено,'} 
          ${indicatorDescription ? 'описание обновлено' : 'описание не обновлено'}
          ${positiveWords ? 'позитив обновлено' : 'позитив не обновлен'}
          ${negativeWords ? 'негатив обновлено' : 'негатив не обновлен'}`,
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

  async getWordsPositiveAndNegative(id: number, dto: { id: number; indicator: 1 | 2 }) {
    try {
      const user = await this.usersService.findById(+id)
      if (!user) throw new HttpException('Пользователь не найден', HttpStatus.UNAUTHORIZED)

      const category = await this.findByIdCategory(`${dto.id}`)
      if (!category) throw new HttpException('id категории не найден', HttpStatus.BAD_REQUEST)

      if (dto.indicator == 1) {
        return category.positiveWords
      }
      if (dto.indicator == 2) {
        return category.negativeWords
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
      if (dto.length >= 2) throw new HttpException('Для бесплатного периода доступна одна категория', HttpStatus.UNAUTHORIZED)
      const days = 1

      const categories = []
      const purchaseDate = new Date() // Дата покупки
      const endDate = new Date(purchaseDate) // Создаем новый объект Date, чтобы не изменять оригинальный
      endDate.setDate(purchaseDate.getDate() + days) // Устанавливаем дату окончания на 1 дня после даты покупки

      for (const item of dto) {
        const nameCategory = await this.findById_category(item.id)
        const obj = {
          id: item.id, // id купленной категории
          name: nameCategory.name,
          purchaseBuyDate: purchaseDate, // Дата покупки
          purchaseEndDate: endDate, // Дата окончания подписки
          purchasePeriod: days, // Период подписки в днях
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
      } else if (err.response === `Для бесплатного периода доступна одна категория`) {
        throw err
      } else {
        throw new HttpException('Ошибка при получении бесплатного периода', HttpStatus.FORBIDDEN)
      }
    }
  }
  async activatePayment(dto) {
    console.log(2)
    try {
      const user = await this.usersService.findById(+dto.user_id) // находим юзера
      if (!user) throw new HttpException('Пользователь не найден', HttpStatus.UNAUTHORIZED)
      const currentDate = new Date()

      if (user?.categoriesHasBought?.length == 0) {
        user.categoriesHasBought = dto.category
        // console.log(1)
      } else {
        for (const item of dto.category) {
          // console.log(2)
          let existingCategory = user.categoriesHasBought.find((category) => category.id === item.id);
          // если есть категория у пользователя
          if (existingCategory) {
            // console.log(3)
            const dateCategoryEnd = new Date(existingCategory.purchaseEndDate)
            // console.log(dateCategoryEnd)
            const actualDate = currentDate.getTime() <= dateCategoryEnd.getTime()

            if (actualDate) {
              // console.log(4)
              // Обновляем существующую категорию, добавляя новый период и увеличив срок окончания подписки
              existingCategory.purchasePeriod += item.purchasePeriod;
              existingCategory.purchaseEndDate = new Date(existingCategory.purchaseEndDate);
              // console.log(existingCategory.purchaseEndDate)

              if (dto.title === 'Посуточный') {
                existingCategory.purchaseEndDate.setDate(existingCategory.purchaseEndDate.getDate() + item.purchasePeriod);
              } else if (dto.title === 'Погрузись в работу') {
                existingCategory.purchaseEndDate.setMonth(existingCategory.purchaseEndDate.getMonth() + item.purchasePeriod);
              }
              // console.log(existingCategory)
              const noExistingCategory = user.categoriesHasBought.filter((category) => category.id !== item.id);
              user.categoriesHasBought = [...noExistingCategory, existingCategory]
            }
            if (!actualDate) {
              // console.log(5)
              const noExistingCategory = user.categoriesHasBought.filter((category )=> category.id !== item.id);
              user.categoriesHasBought = [...noExistingCategory, item]
            }
          } else if (!existingCategory) {
            // console.log(6)
            user.categoriesHasBought = [...user.categoriesHasBought, item]
          }
        }
      }

      user.activatedFreePeriod = false
      user.categoriesFreePeriod = []
      user.endFreePeriod = true

      await this.usersService.saveUpdatedUser(user.id, user)

      return {
        text: 'Подписка оформлена',
      }
    } catch (err) {
      if (err.response === 'Пользователь не найден') {
        throw err
      } else {
        throw new HttpException('Ошибка при получении бесплатного периода', HttpStatus.FORBIDDEN)
      }
    }
  }

  async createPay(id, dto) {
    try {
      const user = await this.usersService.findById(+id)
      if (!user) throw new HttpException('Пользователь не найден', HttpStatus.UNAUTHORIZED)
      if (dto.categ.length <= 0) throw new HttpException('Необходимо выбрать категории', HttpStatus.UNAUTHORIZED)

      const shopId = process.env['SHOP_ID']
      const secretKey = process.env['SECRET_KEY_SHOP']
      const idempotenceKey = uuid.v4()

      const days = +dto.period
      const categories = []
      const purchaseDate = new Date()
      const endDate = new Date(purchaseDate)
      let price

      if (dto.title === 'Посуточный') {
        endDate.setDate(purchaseDate.getDate() + days)
      } else if (dto.title === 'Погрузись в работу') {
        endDate.setMonth(endDate.getMonth() + days)
      }

      for (const item of dto.categ) {
        const nameCategory = await this.findById_category(item.id)
        if (dto.title === 'Посуточный') {
          price = Math.round(((+nameCategory.salary * 2.5) / 30) * +days)
        } else if (dto.title === 'Погрузись в работу') {
          price = +nameCategory.salary * +days
        }

        const obj = {
          id: item.id,
          category: nameCategory.name,
          purchaseBuyDate: purchaseDate,
          purchaseEndDate: endDate,
          purchasePeriod: days,
          price: price,
          title: dto.title,
        }
        categories.push(obj)
      }

      const url = 'https://api.yookassa.ru/v3/payments'
      const authorization = `Basic ${Buffer.from(`${shopId}:${secretKey}`).toString('base64')}`

      const data = {
        amount: {
          value: `${price}`,
          // value: `2`,
          currency: 'RUB',
        },
        payment_method_data: {
          type: 'bank_card',
        },
        confirmation: {
          type: 'redirect',
          return_url: process.env['CLIENT_URL'],
        },
        capture: false,
        description: 'Оплата подписки на сайте клиенты.com',
      }

      const headers = {
        Authorization: authorization,
        'Idempotence-Key': idempotenceKey,
        'Content-Type': 'application/json',
      }

      try {
        const response = await axios.post(url, data, { headers })

        const confirmationUrl = response.data?.confirmation?.confirmation_url

        if (response.data?.confirmation?.confirmation_url) {
          const newTransaction = {
            title: dto.title,
            type: response.data.status,
            user_id: id,
            amount: dto.price,
            category: categories,
            id_payment: response.data.id,
            payment_method: response.data.payment_method.type,
            status: response.data.status,
            createdAt: new Date(), // текущая дата и время
          }
          this.transactionService.addNewTransaction(id, newTransaction)
        }
        return confirmationUrl
      } catch (error) {
        throw new HttpException('Failed to create payment', HttpStatus.FORBIDDEN)
      }
    } catch (err) {}
  }

  async getPayment(paymentStatusDto: string) {
    const url = `https://api.yookassa.ru/v3/payments/${paymentStatusDto}`
    const shopId = process.env['SHOP_ID']
    const secretKey = process.env['SECRET_KEY_SHOP']
    const authorization = `Basic ${Buffer.from(`${shopId}:${secretKey}`).toString('base64')}`
    const headers = {
      Authorization: authorization,
    }

    try {
      const response = await axios.get(url, { headers })
      return response;
    } catch (error) {
      // console.log(error)
      // throw new Error('Failed to get payment information');
    }
  }

  async cancelPayemnt(payment_id) {
    const url = `https://api.yookassa.ru/v3/payments/${payment_id}/cancel`
    const shopId = process.env['SHOP_ID']
    const secretKey = process.env['SECRET_KEY_SHOP']
    const authorization = `Basic ${Buffer.from(`${shopId}:${secretKey}`).toString('base64')}`
    const headers = {
      Authorization: authorization,
    }

    try {
      const response = await axios.post(url, { headers })
      console.log(response)
      // return response;
    } catch (error) {
      console.log(error)
      // throw new Error('Failed to get payment information');
    }
  }

  async capturePayment(paymentStatusDto) {

    const receipt = await this.getPayment(paymentStatusDto.object.id)
    console.log(receipt)
    console.log(receipt.status)
    // if (receipt.status !== 'waiting_for_capture')


    const url = `https://api.yookassa.ru/v3/payments/${paymentStatusDto.object.id}/capture`
    const shopId = process.env['SHOP_ID']
    const secretKey = process.env['SECRET_KEY_SHOP']
    const authorization = `Basic ${Buffer.from(`${shopId}:${secretKey}`).toString('base64')}`
    const idempotenceKey = uuid.v4()
    const headers = {
      Authorization: authorization,
      'Idempotence-Key': idempotenceKey,
      'Content-Type': 'application/json',
    }

    const data = {
      amount: {
        value: `${paymentStatusDto.object.amount.value}`,
        currency: `${paymentStatusDto.object.amount.currency}`,
      },
    }

    try {
      const response = await axios.post(url, data, { headers });
      console.log(response)
      if(response?.data && response?.status == 200 && response.data.status == 'succeeded') {
        const trans = await this.transactionService.changeTransaction(response)
        if (trans) {
          this.activatePayment(trans)
        }
      }
      return { statusCode: HttpStatus.OK, data: response.data };
    } catch (error) {
      throw new Error('Failed to get payment information');
    }
  }
}
