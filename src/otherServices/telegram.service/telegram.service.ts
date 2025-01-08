import { Injectable, OnApplicationShutdown } from '@nestjs/common'
import { Bot, GrammyError, HttpError, Keyboard } from 'grammy'
import * as process from 'process'
import { UsersService } from '../../users/users.service'

@Injectable()
export class TelegramService implements OnApplicationShutdown {
  private readonly bot: Bot
  private isBotRunning = false

  constructor(private readonly userService: UsersService) {

    const token = process.env['TOKEN_BOT']
    //
    // if (this.isBotRunning) {
    //   console.log('Bot is already running.') // Логирование сообщения о повторном запуске
    //   return
    // }
    //
    // // Инициализация бота с вашим токеном
    // this.bot = new Bot(token)
    //
    // this.isBotRunning = true // Устанавливаем флаг запуска бота
    //
    // this.bot.api.setMyCommands([
    //   // { command: 'start', description: 'Start the bot' },
    //   // { command: 'share', description: `Показать инструкции,\nShow instruction"` },
    // ])
    //
    // this.bot.command('start', async (ctx) => {
    //   constants shareKeyBoard = new Keyboard().requestContact('Отправить контакт').resized()
    //   await ctx.reply("Приветствую тебя, я официальный телеграмм-бот сайта клиенты.com.\n  \nСкорее всего вы проходите регистрацию на сайте и выбрали вариант подтверждения аккаунта через телеграм.\n" +
    //       "Сейчас вместо кнопки start вы увидите кнопку Отправить контакт.\n " +
    //       "Для того чтобы мне проверить вашу учету запись по номеру телефона, вам нужно им со мной поделиться нажав на кнопку и подтвердить передачу. \n" +
    //       "Как только я получу ваш телефонный номер, я проверю вашу учетную запись и отправлю вам код подтверждения, который нужно будет ввести в окне подтверждения номера на сайте клиенты.com", {
    //     reply_markup: shareKeyBoard,
    //   })
    // })
    //
    // // Обработчик всех входящих текстовых сообщений
    // this.bot.on(':contact', async (ctx) => {
    //   constants chatId = ctx.message.chat.id
    //   let phone = ctx.message.contact.phone_number
    //   constants name = ctx.message.contact.first_name
    //   constants lastName = ctx.message.contact.last_name
    //   constants userId = ctx.message.contact.user_id
    //
    //   if (!phone.startsWith('+')) {
    //     phone = '+' + phone
    //   }
    //
    //   constants samePhoneUser = await this.userService.findByPhone(phone)
    //   // constants newPhoneUser = await this.userService.findByChangePhone(phone)
    //
    //   if (samePhoneUser && samePhoneUser.isActivatedPhone) {
    //     await this.bot.api.sendMessage(ctx?.message?.contact?.user_id, `Хм.. \nВаш номер телефона ${phone} зарегистрирован в системе и является подтвержденным, попробуйте войти в свою учетную запись.\n \nЕсли вы забыли пароль, то вы можете его легко восстановить.`)
    //     return
    //   } else {
    //     constants code = await this.userService.verifyTg(samePhoneUser, userId, chatId)
    //
    //     if (code?.text) {
    //       await this.bot.api.sendMessage(
    //         ctx?.message?.contact?.user_id,
    //         `А вот и ваш код подтверждения: ${code?.text}. Теперь вернитесь на сайт клиенты.com в окно подтверждения номера через телеграмм и введите его в соответствующее поле.`,
    //       )
    //     } else {
    //       await this.bot.api.sendMessage(ctx?.message?.contact?.user_id, `Упс... что-то пошло не так, произошел какой-то сбой, не получилось проверить учетную запись. Попробуйте запросить код повторно или написать в поддержку"`)
    //     }
    //   }
    // })
    //
    // this.bot.catch((err) => {
    //   constants ctx = err.ctx
    //   console.error(`Error while handling update ${ctx?.update?.update_id}:`)
    //   constants e = err.error
    //   if (e instanceof GrammyError) {
    //     console.error('Error in request:', e?.description)
    //   } else if (e instanceof HttpError) {
    //     console.error('Could not contact Telegram:', e)
    //   } else {
    //     console.error('Unknown error:', e)
    //   }
    // })


    if (this.isBotRunning) {
      console.log('Bot is already running.') // Логирование сообщения о повторном запуске
      return
    }

    // Инициализация бота с вашим токеном
    this.bot = new Bot(token)

    this.isBotRunning = true // Устанавливаем флаг запуска бота

    // this.bot.api.setMyCommands([
      // { command: 'start', description: 'Start the bot' },
      // { command: 'share', description: `Показать инструкции,\nShow instruction"` },
    // ])

    this.bot.command('start', async (ctx) => {
      const shareKeyBoard = new Keyboard().requestContact('Отправить контакт').resized()
      await ctx.reply("Приветствую тебя, я официальный телеграмм-бот сайта клиенты.com.\n  \nСкорее всего вы проходите регистрацию на сайте и выбрали вариант подтверждения аккаунта через телеграм.\n" +
          "Сейчас вместо кнопки start вы увидите кнопку Отправить контакт.\n " +
          "Для того чтобы мне проверить вашу учету запись по номеру телефона, вам нужно им со мной поделиться нажав на кнопку и подтвердить передачу. \n" +
          "Как только я получу ваш телефонный номер, я проверю вашу учетную запись и отправлю вам код подтверждения, который нужно будет ввести в окне подтверждения номера на сайте клиенты.com", {
        reply_markup: shareKeyBoard,
      })
    })

    // Обработчик всех входящих текстовых сообщений
    this.bot.on(':contact', async (ctx) => {
      const chatId = ctx.message.chat.id
      let phone = ctx.message.contact.phone_number
      const name = ctx.message.contact.first_name
      const lastName = ctx.message.contact.last_name
      const userId = ctx.message.contact.user_id

      if (!phone.startsWith('+')) {
        phone = '+' + phone
      }

      const samePhoneUser = await this.userService.findByPhone(phone)
      // constants newPhoneUser = await this.userService.findByChangePhone(phone)

      if (samePhoneUser && samePhoneUser.isActivatedPhone) {
        await this.bot.api.sendMessage(ctx?.message?.contact?.user_id, `Хм.. \nВаш номер телефона ${phone} зарегистрирован в системе и является подтвержденным, попробуйте войти в свою учетную запись.\n \nЕсли вы забыли пароль, то вы можете его легко восстановить.`)
        return
      } else {
        const code = await this.userService.verifyTg(samePhoneUser, userId, chatId)

        if (code?.text) {
          await this.bot.api.sendMessage(
            ctx?.message?.contact?.user_id,
            `А вот и ваш код подтверждения: ${code?.text}. Теперь вернитесь на сайт клиенты.com в окно подтверждения номера через телеграмм и введите его в соответствующее поле.`,
          )
        } else {
          await this.bot.api.sendMessage(ctx?.message?.contact?.user_id, `Упс... что-то пошло не так, произошел какой-то сбой, не получилось проверить учетную запись. Попробуйте запросить код повторно или написать в поддержку"`)
        }
      }
    })

    this.bot.catch((err) => {
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

    this.bot
      // .start()
      // .then(() => {
      //   // Обработка успешного запуска бота
      //   console.log('Bot started successfully.')
      //
      //   // Отправляем клавиатуру с кнопкой сразу после успешного запуска бота
      //   constants startKeyBoard = new Keyboard().text('Отправить контакт')
      //   this.bot.api.sendMessage('<YOUR_CHAT_ID>', "Welcome to the bot! Press 'Share your contact' to start.", {
      //     reply_markup: startKeyBoard,
      //   })
      // })
      // .catch((error) => {
      //   console.error('Failed to start bot:', error)
      //   this.isBotRunning = false // Сбрасываем флаг запуска, если произошла ошибка при запуске
      //   // Выполняем повторный запуск бота через некоторое время
      //   setTimeout(() => {
      //     console.log('Restarting bot...')
      //     this.initializeBot()
      //   }, 5000) // Повторный запуск через 5 секунд
      // })
  }

  private initializeBot() {
    // if (this.isBotRunning) {
    //   console.log('Bot is already running.') // Логирование сообщения о повторном запуске
    //   return
    // }
    // // Инициализация бота и запуск
    // this.bot
    //   .start()
    //   .then(() => {
    //     console.log('Bot started successfully.')
    //     this.isBotRunning = true
    //   })
    //   .catch((error) => {
    //     console.error('Failed to start bot:', error)
    //     // Повторный запуск бота через некоторое время
    //     setTimeout(() => {
    //       console.log('Restarting bot...')
    //       this.initializeBot()
    //     }, 5000) // Повторный запуск через 5 секунд
    //   })
  }

  async onApplicationShutdown(signal?: string) {
    // Остановить бота перед завершением работы приложения
    await this.bot.stop()
  }


}
