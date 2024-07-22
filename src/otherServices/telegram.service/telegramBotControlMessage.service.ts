import {Injectable, OnApplicationShutdown} from "@nestjs/common";
import {Bot, Composer, GrammyError, HttpError, Keyboard} from "grammy";
import * as process from 'process'

@Injectable()
    export class TelegramBotControlMessage implements OnApplicationShutdown {

    private readonly bot: Bot
    private isBotRunning = false

    constructor(){
        // const token = process.env["TOKEN_BOT_FIVE"]
        //
        // if (this.isBotRunning) {
        //     console.log('Bot is already running.') // Логирование сообщения о повторном запуске
        //     return
        // }
        //
        // // Инициализация бота с вашим токеном
        // this.bot = new Bot(token)
        //
        // this.isBotRunning = true // Устанавливаем флаг запуска бота
        //
        // // Подписка на обновления канала
        // this.bot.on("message:left_chat_member", async (ctx) => {
        //     const message = ctx.update.message;
        //     const chatId = message.chat.id;
        //     const messageId = message.message_id;
        //
        //     try {
        //         await ctx.api.deleteMessage(chatId, messageId);
        //     } catch (error) {
        //         console.error(`Failed to delete message ${messageId} from chat ${chatId}:`, error);
        //     }
        //
        //     // Здесь можно добавить логику для обработки сообщений из канала
        // });
        //
        // this.bot.on("message:new_chat_members", async (ctx) => {
        //     const message = ctx.update.message;
        //     const chatId = message.chat.id;
        //     const messageId = message.message_id;
        //
        //     try {
        //         await ctx.api.deleteMessage(chatId, messageId);
        //     } catch (error) {
        //         console.error(`Failed to delete message ${messageId} from chat ${chatId}:`, error);
        //     }
        //     // Здесь можно добавить логику для обработки сообщений из канала
        // });
        //
        //
        //
        // this.bot.catch((err) => {
        //     const ctx = err.ctx
        //     console.error(`Error while handling update ${ctx?.update?.update_id}:`)
        //     const e = err.error
        //     if (e instanceof GrammyError) {
        //         console.error('Error in request:', e?.description)
        //     } else if (e instanceof HttpError) {
        //         console.error('Could not contact Telegram:', e)
        //     } else {
        //         console.error('Unknown error:', e)
        //     }
        // })
        // this.bot
        //     .start()
        //     .then(() => {
        //         // Обработка успешного запуска бота
        //         console.log('Bot started successfully.11111111111111111111111')
        //
        //         // Отправляем клавиатуру с кнопкой сразу после успешного запуска бота
        //         const startKeyBoard = new Keyboard().text('Отправить контакт')
        //         this.bot.api.sendMessage('<YOUR_CHAT_ID>', "Welcome to the bot! Press 'Share your contact' to start.", {
        //             reply_markup: startKeyBoard,
        //         })
        //     })
        //     .catch((error) => {
        //         console.error('Failed to start bot:', error)
        //         this.isBotRunning = false // Сбрасываем флаг запуска, если произошла ошибка при запуске
        //         // Выполняем повторный запуск бота через некоторое время
        //         setTimeout(() => {
        //             console.log('Restarting bot...')
        //             this.initializeBot()
        //         }, 5000) // Повторный запуск через 5 секунд
        //     })

    }

    private initializeBot() {
        if (this.isBotRunning) {
            console.log('Bot is already running.') // Логирование сообщения о повторном запуске
            return
        }
        // Инициализация бота и запуск
        // this.bot
        //     .start()
        //     .then(() => {
        //         console.log('Bot started successfully.')
        //         this.isBotRunning = true
        //     })
        //     .catch((error) => {
        //         console.error('Failed to start bot:', error)
        //         // Повторный запуск бота через некоторое время
        //         setTimeout(() => {
        //             console.log('Restarting bot...')
        //             this.initializeBot()
        //         }, 5000) // Повторный запуск через 5 секунд
        //     })
    }

    async onApplicationShutdown(signal?: string) {
        // Остановить бота перед завершением работы приложения
        await this.bot.stop()
    }

}