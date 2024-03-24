import { Injectable, OnApplicationShutdown, Scope } from '@nestjs/common'
import { Bot, GrammyError, HttpError, Keyboard } from 'grammy'
import * as process from 'process'
import { UsersService } from '../../users/users.service'

@Injectable({ scope: Scope.DEFAULT })
export class TelegramTwoService implements OnApplicationShutdown {
  private readonly bot: Bot
  private isBotRunning = false
  constructor(
      // private readonly userService: UsersService,
      // private readonly categoriesService: CategoriesService,
  ) {
    const token = process.env['TOKEN_BOT_TWO']
    this.bot = new Bot(token)

    // this.bot.api.setMyCommands([
    //   { command: 'share', description: `Показать инструкции,\nShow instruction"` },
    // ])

    // this.bot.command('share', async (ctx) => {
    //
    //   // const shareKeyBoard = new Keyboard().requestContact('Add contact').resized()
    //   await ctx.reply(
    //     `Напишите в чат "получить информацию".\n \nWrite here "get information".`,
    //     // {
    //     //   reply_markup: shareKeyBoard,
    //     // },
    //   )
    // })

    // this.bot.hears('получить информацию', async (ctx) => {
    //   const userId = ctx.message.from.id
    //   const currentDate = new Date();
    //
    //
    //   const user = await this.userService.findByIdTg(`${userId}`)
    //
    //
    //   if (!user || !user?.phoneNumber) {
    //     await this.bot.api.sendMessage(ctx?.message?.contact?.user_id, `У вас не добавлен номер телефона в профиле, пользователь не найден. Добавьте номер и попробуйте заново`)
    //   }
    //
    //   if (user && user?.phoneNumber) {
    //
    //     if (user.notificationsFreePeriod.length !== 0 && !user.endFreePeriodNotification && currentDate.getTime() < new Date(user.notificationsFreePeriod[0].purchaseEndDate).getTime()) {
    //       const category = await this.categoriesService.findByName(user.notificationsFreePeriod[0].category);
    //
    //       await this.bot.api.sendMessage(
    //         userId,
    //         `У вас подключен пробный период в категории: \n"${user.notificationsFreePeriod[0].category}". \nНачало периода: ${new Date(
    //           user.notificationsFreePeriod[0].purchaseBuyDate,
    //         )}. \nЗавершение периода: ${new Date(user.notificationsFreePeriod[0].purchaseEndDate)}, \n \nдоступные чаты: ${[
    //           ...category.chatNames,
    //         ]}. \n \nНапишите в ответ название чата в формате: \n \n Для репетиторов, пробный, физика
    //         `,
    //       )
    //     }
    //   }
    //
    //   // if (user?.notificationsHasBought?.length > 0) {
    //   //
    //   //   let arrayText = [];
    //   //
    //   //   for (const item of user?.notificationsHasBought) {
    //   //
    //   //     if (new Date(item.purchaseEndDate).getTime() > new Date(currentDate).getTime()) {
    //   //       const category = await this.categoriesService.findByName(item.category);
    //   //       arrayText.push(`У вас подключена платная подписка в категории: \n"${item.category}". \nНачало периода: ${new Date(item.purchaseBuyDate)}. \nЗавершение периода: ${new Date(
    //   //         item.purchaseEndDate,
    //   //       )}, \n \nдоступные чаты: ${[...category.chatNames]}. \n \nНапишите в ответ название чата в формате: \n \n Для репетиторов, платный, физика
    //   //       `)
    //   //     }
    //   //   }
    //   //   await this.bot.api.sendMessage(userId, `${[...arrayText]}`)
    //   // }
    // })

    // Обработчик всех входящих текстовых сообщений

    // this.bot.on('message:text', async (ctx) => {
    //
    //   const phone = ctx.message
    //   const userId = ctx.message.from.id
    //   const text = ctx.message.text
    //   const arrayText = text.split(',')
    //   const currentDate = new Date();
    //
    //   const user = await this.userService.findByIdTg(`${userId}`)
    //
    //   if (!user || !user?.phoneNumber) {
    //     await this.bot.api.sendMessage(ctx?.message?.contact?.user_id, `У вас не добавлен номер телефона в профиле, пользователь не найден. Добавьте номер и попробуйте заново`)
    //   }
    //
    //
    //   if (arrayText[1].toLowerCase().includes('пробный')) {
    //     const check = user.notificationsFreePeriod.find((item) => item.category.toLowerCase() == arrayText[0].toLowerCase())
    //
    //     if (!check) {
    //       await this.bot.api.sendMessage(
    //           userId,
    //           `У вас не подключены уведомления для категории "${arrayText[0]}"`,
    //       )
    //     }
    //
    //     if (user.notificationsFreePeriod) {
    //
    //     }
    //   }
    //   if (arrayText[1].toLowerCase().includes('платный')) {
    //
    //     if (user.notificationsFreePeriod) {
    //
    //     }
    //   }
    // })

    // this.bot.hears('получить', async (ctx) => {
    //   const chatId = process.env['CHAT_MATH']
    //   const name = 'MyInviteLink'; // Название пригласительной ссылки (необязательно)
    //   const currentDate = new Date();
    //   const futureDate = Math.floor((currentDate.getTime() + (24 * 60 * 60 * 1000)) / 1000); // Преобразуем в Unix timestamp, разделив на 1000 и округлив
    //   const createsJoinRequest = false; // Указывает, нужно ли администраторам чата одобрять запросы на вступление по этой ссылке (необязательно)
    //
    //   const link = await this.bot.api.createChatInviteLink(chatId,{
    //     name,
    //     expire_date: futureDate,
    //     member_limit: 1,
    //     creates_join_request: createsJoinRequest,
    //   })
    //
    //   // Ваша логика для отправки сообщения подтверждения пользователю
    //   await this.bot.api.sendMessage( `${ctx.message.from.id}`, `${link.invite_link}`);
    // })


    this.bot.catch((err) => {
      console.log(`err ${err}`)
      const ctx = err.ctx
      console.error(`Error while handling update ${ctx?.update?.update_id}:`)
      const e = err.error
      if (e instanceof GrammyError) {
        console.error('Error in request:', e?.description)
      } else if (e instanceof HttpError) {
        console.error('Could not contact Telegram:', e)
      } else {
        console.error('Unknown error:', e)
      }
    })

    // Запуск бота
    // Запуск бота
    this.bot.start().catch((error) => {
      console.error('Failed to start bot:', error)
      this.isBotRunning = false // Сбрасываем флаг запуска, если произошла ошибка при запуске
      // Выполняем повторный запуск бота через некоторое время
      setTimeout(() => {
        console.log('Restarting bot...')
        this.initializeBot()
      }, 5000) // Повторный запуск через 5 секунд
    })
  }

  private initializeBot() {
    if (this.isBotRunning) {
      console.log('Bot is already running.') // Логирование сообщения о повторном запуске
      return
    }
    // Инициализация бота и запуск
    this.bot
        .start()
        .then(() => {
          console.log('Bot started successfully.')
          this.isBotRunning = true
        })
        .catch((error) => {
        console.error('Failed to start bot:', error)
          // Повторный запуск бота через некоторое время
          setTimeout(() => {
            console.log('Restarting bot...')
            this.initializeBot()
          }, 5000) // Повторный запуск через 5 секунд
        })
  }

  async onApplicationShutdown(signal?: string) {
    // Остановить бота перед завершением работы приложения
    await this.bot.stop();
  }

  async sendlink(chatTgId, link, chatName) {

    try {
      await this.bot.api.sendMessage( `${chatTgId}`, `чат "${chatName}" Ссылка для вступления: \n\n ${link.invite_link}`);

    } catch (error) {
      console.error("Error sending confirmation message:", error);
    }
  }

  async createLink(user, chatId, chatName) {

    // const chatId = process.env['CHAT_MATH']
    const name = 'MyInviteLink'; // Название пригласительной ссылки (необязательно)
    const currentDate = new Date();
    const futureDate = Math.floor((currentDate.getTime() + (7 * 60 * 60 * 1000)) / 1000); // Преобразуем в Unix timestamp, разделив на 1000 и округлив
    const createsJoinRequest = false; // Указывает, нужно ли администраторам чата одобрять запросы на вступление по этой ссылке (необязательно)

    const link = await this.bot.api.createChatInviteLink(chatId,{
      name,
      expire_date: futureDate,
      member_limit: 1,
      creates_join_request: createsJoinRequest,
    })

    return link;
  }

  async sendNewPassword(userId, text) {
    await this.bot.api.sendMessage( `${userId}`, `${text}`);
  }

  async sendNewCodeForNewPhone(userId, text) {
    await this.bot.api.sendMessage( `${userId}`, `${text}`);
  }

}
