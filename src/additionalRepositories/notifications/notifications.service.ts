import { HttpException, HttpStatus, Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { NotificationEntity } from './entities/notification.entity'
import {Column, CreateDateColumn, Repository, UpdateDateColumn} from 'typeorm'
import { UsersService } from '../../users/users.service'
import process from 'process'

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(NotificationEntity)
    private repository: Repository<NotificationEntity>,
    private usersService: UsersService,
  ) {}

  // async findUsersByTutors() {
  //   return await this.repository.find({
  //     where: [
  //       {
  //         tutors: true,
  //       },
  //     ],
  //   })
  // }

  async findUserByEmail(email: string) {
    return await this.repository.findOneBy({
      email,
    })
  }

  async findUserByPhone(phoneNumber: string) {
    return await this.repository.findOneBy({
      phoneNumber,
    })
  }

  async create(id, dto: NotificationEntity) {

    try {
      const user = await this.usersService.findById(+id)
      if (!user) throw new HttpException('Пользователь не найден', HttpStatus.BAD_REQUEST)
      if (!user.isActivatedPhone) throw new HttpException('Не подтвержден номер телефона', HttpStatus.BAD_REQUEST)
      if (!user.isActivatedEmail) throw new HttpException('Не подтвержден email', HttpStatus.BAD_REQUEST)


      if(user.notificationsFreePeriod.find((item:any) => item.id == dto.id)) {
        throw new HttpException(`У вас уже активан бесплатный период по категории ${dto.categoryName}`, HttpStatus.BAD_REQUEST)
      }
      if(user.endFreePeriodNotification){
        throw new HttpException(`Вы уже использовали возможность бесплтного периода`, HttpStatus.BAD_REQUEST)
      }

      const notification = {
        email: user.email,
        phoneNumber: user.phoneNumber,
        category: dto.category,
        categoryName: dto.categoryName,
        purchaseBuyDate: new Date(),
        purchaseEndDate: dto.purchaseEndDate,
        purchasePeriod: dto.purchasePeriod,
        freePeriod: dto.freePeriod,
      }
      await this.repository.save(notification);

      const notifications = []
      const obj = {
        id: dto.category, // id купленной категории
        name: dto.categoryName,
        purchaseBuyDate: new Date(),
        purchaseEndDate: dto.purchaseEndDate,
        freePeriod: dto.freePeriod,
      }
      notifications.push(obj)

      user.activatedFreePeriodNotification = true

      if (user.notificationsFreePeriod.length) {
        user.notificationsFreePeriod = [
          ...user.notificationsFreePeriod,
          ...notifications,
        ]
      } else {
        user.notificationsFreePeriod = notifications;
      }


      await this.usersService.saveUpdatedUser(user.id, user)

      return {
        text: `вы успешно подключили уведомления в категории ${dto.categoryName}`,
      }

    } catch (err) {
      if (err.response === 'Пользователь не найден') {
        throw err
      } else if (err.response === 'Не подтвержден номер телефона') {
        throw err
      } else if (err.response === 'Не подтвержден email') {
        throw err
      } else if (err.response === 'Не подтвержден email') {
        throw err
      } else if (err.response === `У вас уже активан бесплатный период по категории ${dto.categoryName}`) {
        throw err
      } else {
        throw new HttpException('Ошибка при добавлении, напишите в поддержку', HttpStatus.BAD_REQUEST)
      }
    }
  }

}
