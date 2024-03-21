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

    if (this.isBotRunning) {
      console.log('Bot is already running.') // Логирование сообщения о повторном запуске
      return
    }

    // Инициализация бота с вашим токеном
    this.bot = new Bot(token)

    this.isBotRunning = true // Устанавливаем флаг запуска бота

    this.bot.api.setMyCommands([
      // { command: 'start', description: 'Start the bot' },
      // { command: 'share', description: `Показать инструкции,\nShow instruction"` },
    ])

    this.bot.command('start', async (ctx) => {
      const shareKeyBoard = new Keyboard().requestContact('Отправить контакт').resized()
      await ctx.reply("Нажмите на кнопку 'Отправить контакт', после чего вы получите код подтверждения, который необходимо ввести на сайте в окне подтверждения номера.", {
        reply_markup: shareKeyBoard,
      })
    })

    // Обработчик всех входящих текстовых сообщений
    // this.bot.on('::email', async (ctx) => {
    //   const text = ctx.message.text
    //   const userId = ctx.message.from.id
    //   const chatId = ctx.message.chat.id
    //
    //   const user = await this.userService.findByEmail(text)

      // Проверка, содержит ли сообщение email
      // if (isValidEmail(text)) {
      //   // Проверить, есть ли у пользователя номер телефона в его учетной записи
      //   const hasPhoneNumber = await this.userService.userHasPhoneNumber(userId);
      //   if (!hasPhoneNumber) {
      //     // Если у пользователя нет номера телефона, предложить поделиться контактом
      //     await this.bot.api.sendMessage(userId, 'Чтобы продолжить, пожалуйста, поделитесь своим контактом.');
      //   } else {
      //     // Если у пользователя есть номер телефона, обработать email соответствующим образом
      //     await this.processEmail(userId, text);
      //   }
      // } else {
      //   // Обработать другие типы сообщений или проигнорировать
      // }

      // await this.handleTextMessage(ctx);
    // })

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
      // const newPhoneUser = await this.userService.findByChangePhone(phone)

      if (samePhoneUser && samePhoneUser.isActivatedPhone) {
        await this.bot.api.sendMessage(ctx?.message?.contact?.user_id, `Номер телефона ${phone} уже используется и является подтвержденным`)
        return
      } else {
        const code = await this.userService.verifyTg(samePhoneUser, userId, chatId)

        if (code?.text) {
          await this.bot.api.sendMessage(
            ctx?.message?.contact?.user_id,
            `Ваш код подтверждения: ${code?.text}, введите его на сайте. \n \n Your confirmation code: ${code?.text}, please enter it on the website."`,
          )
        } else {
          await this.bot.api.sendMessage(ctx?.message?.contact?.user_id, `Произошел сбой, код не получен. Попробуйте запросить код повторно или написать в поддержку"`)
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
      .start()
      .then(() => {
        // Обработка успешного запуска бота
        console.log('Bot started successfully.')

        // Отправляем клавиатуру с кнопкой сразу после успешного запуска бота
        const startKeyBoard = new Keyboard().text('Отправить контакт')
        this.bot.api.sendMessage('<YOUR_CHAT_ID>', "Welcome to the bot! Press 'Share your contact' to start.", {
          reply_markup: startKeyBoard,
        })
      })
      .catch((error) => {
        console.error('Failed to start bot:', error)
        this.isBotRunning = false // Сбрасываем флаг запуска, если произошла ошибка при запуске
        // Выполняем повторный запуск бота через некоторое время
        setTimeout(() => {
          console.log('Restarting bot...')
          this.initializeBot()
        }, 5000) // Повторный запуск через 5 секунд
      })

    // Запуск бота
    // this.bot.start().catch((error) => {
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
    await this.bot.stop()
  }
}
