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
      console.log('Bot is already running.'); // Логирование сообщения о повторном запуске
      return;
    }

    // Инициализация бота с вашим токеном
    this.bot = new Bot(token)

    this.isBotRunning = true // Устанавливаем флаг запуска бота

    this.bot.api.setMyCommands([
      // { command: 'start', description: 'Start the bot' },
      { command: 'share', description: `Показать инструкции,\nShow instruction"` },
    ])

    this.bot.command('share', async (ctx) => {
      const shareKeyBoard = new Keyboard().requestContact('Add contact').resized()
      await ctx.reply(
        "Нажмите на кнопку 'Add contact', после чего вы получите код подтверждения, который необходимо ввести на сайте.\n \nClick on the 'Add contact' button, after which you will receive a confirmation code that you need to enter on the website.\"",
        {
          reply_markup: shareKeyBoard,
        },
      )
    })

    // Обработчик всех входящих текстовых сообщений
    this.bot.on('::email', async (ctx) => {
      // await this.handleTextMessage(ctx);
    })

    // Обработчик всех входящих текстовых сообщений
    this.bot.on(':contact', async (ctx) => {
      console.log(ctx)
      const phone = ctx.message.contact.phone_number
      const name = ctx.message.contact.first_name
      const lastName = ctx.message.contact.last_name
      const userId = ctx.message.contact.user_id
      console.log(phone)
      console.log(userId)
      const samePhoneUser = await this.userService.findByPhone(phone)
      const newPhoneUser = await this.userService.findByChangePhone(phone)

      if (samePhoneUser && samePhoneUser.isActivatedPhone) {
        await this.bot.api.sendMessage(ctx?.message?.contact?.user_id, `Номер телефона ${phone} уже используется и является подтвержденным`)
        return
      }

      if (samePhoneUser && !samePhoneUser.isActivatedPhone) {
        await this.bot.api.sendMessage(
          ctx?.message?.contact?.user_id,
          `Номер телефона ${phone} уже используется, но не подтвержден. Вероятно его кто-то ввел ошибочно. Для того чтобы разобраться в данной ситуации, напишите в форму обратной связи на сайте, либо в тг https://t.me/MaksOST1`,
        )
        return
      }

      if (newPhoneUser && !samePhoneUser && phone.replace('+', '') == newPhoneUser.forChangePhoneNumber.replace('+', '')) {
        const code = await this.userService.verifyTg(newPhoneUser, userId)
        if (code?.text) {
          await this.bot.api.sendMessage(
            ctx?.message?.contact?.user_id,
            `Ваш код подтверждения: ${code?.text}, введите его на сайте. \n \n Your confirmation code: ${code?.text}, please enter it on the website."`,
          )
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
    await this.bot.stop()
  }
}
