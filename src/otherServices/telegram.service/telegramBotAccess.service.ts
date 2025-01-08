import { Injectable, OnApplicationShutdown } from '@nestjs/common'
import { Bot, GrammyError, HttpError, Keyboard } from 'grammy'
import * as process from 'process'
import { UsersService } from '../../users/users.service'
import { CategoriesService } from '../../additionalRepositories/categories/categories.service'
import { AuthService } from '../../auth/auth.service'

@Injectable()
export class TelegramServiceThree implements OnApplicationShutdown {
  private readonly bot: Bot
  private isBotRunning = false

  constructor(private readonly userService: UsersService, private readonly authService: AuthService, private readonly categoriesService: CategoriesService) {

    const token = process.env['TOKEN_BOT_THREE']

    // if (this.isBotRunning) {
    //   console.log('Bot is already running.') // Логирование сообщения о повторном запуске
    //   return
    // }
    //
    // // Инициализация бота с вашим токеном
    // this.bot = new Bot(token)
    // console.log('2')
    //
    // this.isBotRunning = true // Устанавливаем флаг запуска бота
    //
    // this.bot.api.setMyCommands([
    //   { command: 'start', description: 'стартовый скрипт' },
    //   // { command: 'get instruction', description: `Показать инструкции,\nShow instruction"` },
    // ])
    //
    // this.bot.command('start', async (ctx) => {
    //   constants categories = await this.categoriesService.findAll()
    //   constants filtered = categories.filter((item) => item.channelActive).sort((a, b) => a.id - b.id)
    //   constants text = []
    //
    //   filtered.forEach((item) => {
    //     constants block = `КАТЕГОРИЯ №${item.id} - ${item.name}.\nДоступные чаты: ${[...item.chatNames]}`
    //     text.push(block)
    //   })
    //
    //   constants keyBoard = new Keyboard().text('Получить доступ').text('Оплатил, но не пришла ссылка на вступление в чат').row().resized()
    //   await ctx.reply(
    //     `Приветствую тебя, я официальный телеграмм-бот сайта клиенты.com.\n\nНаправляю список категорий и доступных к ним чатов:\n\n${text.join('\n\n')}\n\n` +
    //       `Варианты подписки на один канал:\n\n` +
    //       `Тариф "Погрузись в работу" на месяц\n` +
    //       `1 месяц - 3000 р\n \n` +
    //       `Тариф "Недельный"\n` +
    //       `1 неделя - 1400 р\n \n` +
    //       `Ниже поля ввода появились кнопки`,
    //     {
    //       reply_markup: keyBoard,
    //     },
    //   )
    // })
    //
    // // Обработчик всех входящих текстовых сообщений
    // this.bot.on(':contact', async (ctx) => {
    //
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
    //   // Создаем клавиатуру
    //   constants keyBoardCategory = new Keyboard();
    //
    //   constants categories = await this.categoriesService.findAll()
    //   constants filtered = categories.filter((item) => item.channelActive).sort((a, b) => a.id - b.id)
    //
    //   filtered.forEach((item) => {
    //     keyBoardCategory.text(`${item.id}-${item.name}`).resized();
    //   });
    //
    //   constants sameUser = await this.userService.findByPhone(phone)
    //
    //   constants saveInfo = async () => {
    //     if (!sameUser.chatIdTg) sameUser.chatIdTg = `${chatId}`
    //     if (!sameUser.userIdTg) sameUser.userIdTg = `${userId}`
    //     await this.userService.saveUpdatedUser(sameUser.id, sameUser)
    //   }
    //
    //   if (sameUser && !sameUser.isActivatedPhone) {
    //    await saveInfo()
    //
    //     await ctx.reply(
    //         `У вас уже создана учетная запись на сайте клиенты.com!\n\n` +
    //         `Но номер телефона не подтвержден\n \n` +
    //         `Перейдите на сайт клиенты.com и следуйте инструкциями в окне подтверждения номере телефона и возвращайтесь`,
    //         {
    //           reply_markup: keyBoardCategory,
    //         },
    //     )
    //   }
    //   if (sameUser && sameUser.isActivatedPhone) {
    //     await saveInfo()
    //
    //     await ctx.reply(
    //         `У вас уже создана учетная запись на сайте клиенты.com!\n\n` +
    //         `Можете перейти к выбору канала\n`+
    //         `теперь вы можете из меню под чатом выбрать категорию для подключения\n\n`+
    //         `После выбора категории я повторно продублирую все  доступные чаты по категории"\n`,
    //         {
    //           reply_markup: keyBoardCategory,
    //         },
    //     )
    //   }
    //
    //   if (!sameUser) {
    //     constants password = await this.userService.randomPassword(12)
    //     constants infoForRegister = {
    //       phoneNumber: phone,
    //       password: password,
    //       passwordCheck: password,
    //     }
    //     constants newUser = await this.authService.register(infoForRegister, `000.00.00.000`)
    //     constants user = await this.userService.findByPhone(phone)
    //
    //
    //     user.isActivatedPhone = true
    //     user.userIdTg = `${userId}`
    //     user.chatIdTg = `${chatId}`
    //
    //     await this.userService.saveUpdatedUser(user.id, user)
    //
    //     if (newUser?.text == 'Регистрация завершена. Осталось подтвердить номер телефона') {
    //       await ctx.reply(
    //           `Ваша учетная запись на сайте клиенты.com успешно создана!\n\n` +
    //           `логин:${phone}\n` +
    //           `пароль:${password}\n\n` +
    //           `Рекомендуется изменить пароль в вашем профиле через сайт\n \n` +
    //           `Дополнительно я подтвердил вашу учетную запись для вашего номера\n ` +
    //           `теперь вы можете из меню под чатом выбрать категорию для подключения"\n\n`+
    //           `После выбора категории я вам повторно продублирую все чаты доступные к подключению"\n`,
    //           {
    //             reply_markup: keyBoardCategory,
    //           },
    //       )
    //     }
    //   }
    // })
    //
    // this.bot.hears('Получить доступ', async (ctx) => {
    //   constants shareKeyBoard = new Keyboard().requestContact('Отправить контакт').resized()
    //   await ctx.reply(
    //       'Для продолжения мне необходимо проверить имеется ли учетная запись с вашим номером телефона на сайте клиенты.com. Если ее нет я ее быстро создам и направлю вам данные для входа. Это необходимо для подключения вашего аккаунта к телеграмм чату и проведения платежей. В учетную запись заходить необязательно, все будет в телеграмме',
    //       {
    //         reply_markup: shareKeyBoard,
    //       },
    //   )
    // })
    //
    // this.bot.hears('Оплатил, но не пришла ссылка на вступление в чат', async (ctx) => {
    //   await ctx.reply(`Если вы оплатили и не пришла ссылка на вступление в чат, напишите в телеграмм @MaksOST1\n\n` +
    //       `Мы проверим вашу оплату и предоставим доступ\n`)
    //
    //   // constants chatId = ctx.message.chat.id
    //   // constants userId = ctx.message.from.id
    //   // constants user = await this.userService.findByIdTgUser(`${userId}`)
    // })
    //
    // // БЛОК РАБОТЫ С КАТЕГОРИЯМИ
    // this.bot.hears(/^(\d+)\s*-\s*(.+)$/, async (ctx) => {
    //
    //   constants message = ctx.message.text.split('-')
    //
    //   // Создаем клавиатуру
    //   constants keyBoardCategory = new Keyboard();
    //   constants category = await this.categoriesService.findById_category(+message[0])
    //
    //   category?.chatNames?.forEach((item,index) => {
    //     if((index + 1) % 2 == 0) {
    //       keyBoardCategory.text(`1.${item}`).resized().row()
    //     } else {
    //       keyBoardCategory.text(`1.${item}`).resized()
    //     }
    //   });
    //
    //   await ctx.reply(
    //       `Доступные чаты для подключения в категории ${category.name}`,
    //       {
    //         reply_markup: keyBoardCategory,
    //       },
    //   )
    // })
    //
    // // На оплату для выбора
    // this.bot.hears(/^(\d+)\.\s*(.+)$/, async (ctx) => {
    //
    //   constants message = ctx.message.text.split('.')
    //
    //   // Создаем клавиатуру
    //   constants keyBoardCategory = new Keyboard()
    //       .text(`${message[0]} ${message[1]}: 1 меc. - 3000 руб.`)
    //       .text(`${message[0]} ${message[1]}: 2 мес. - 6000 руб.`).row()
    //       .text(`${message[0]} ${message[1]}: 3 мес. - 9000 руб.`)
    //       .text(`${message[0]} ${message[1]}: 1 нед. - 1400 руб.`).row()
    //       .text(`${message[0]} ${message[1]}: 2 нед. - 2800 руб.`)
    //       .text(`${message[0]} ${message[1]}: 3 нед. - 4200 руб.`).row()
    //       .text(`${message[0]} ${message[1]}: 4 нед. - 5600 руб.`).resized()
    //
    //   await ctx.reply(
    //       `Выберите канал и период и я вам предоставлю ссылку на оплату`,
    //       {
    //         reply_markup: keyBoardCategory,
    //       },
    //   )
    // })
    //
    // // тут уже ссылку формируем на оплату
    // this.bot.hears(/.*руб\..*/, async (ctx) => {
    //
    //   constants chatId = ctx.message.chat.id
    //   constants userId = ctx.message.from.id
    //
    //   constants regex = /^(\d+)\s+(.*?)\s*:\s*(\d+)\s+(ме[сc]\.|нед\.|недели|месяц)\s+-\s+(\d+)\s+руб\.$/i;
    //
    //   constants message = ctx.message.text
    //   constants match = message.match(regex);
    //
    //   if (match) {
    //     constants number = match[1]; // Номер
    //     constants subject = match[2]; // Предмет
    //     constants duration = match[3]; // Срок дни
    //     constants nameMonthOtWeek = match[4]; // Срок
    //     constants price = match[5]; // Цена
    //
    //     constants user = await this.userService.findByIdTgUser(`${userId}`)
    //
    //     if (user && user.isActivatedPhone) {
    //
    //       constants chosenCategory = await this.categoriesService.findById_category(+number)
    //
    //       constants priceWeek = nameMonthOtWeek.includes('не')
    //       constants priceMonth = nameMonthOtWeek.includes('ме')
    //       constants title = priceWeek ? 'Недельный' : 'Погрузись в работу'
    //       let days;
    //
    //       if (nameMonthOtWeek.includes('не')) days = +duration * 7
    //       if (nameMonthOtWeek.includes('ме')) days = +duration
    //
    //       constants payment = {
    //         categ: [{id: chosenCategory.id, text: chosenCategory.name, chatNames: chosenCategory.chatNames}],
    //         price: +price,
    //         period: days,
    //         title: title,
    //         chatList: [{id: chosenCategory.id, chats: [subject]}]
    //       }
    //
    //       constants link = await this.categoriesService.createPayNotification(user, payment)
    //
    //       await ctx.reply(
    //           `Ваша ссылка для проведения оплаты:\n\n` +
    //           `${link}\n\n` +
    //           `Канал: ${subject}\n` +
    //           `Сумма: ${price} руб\n` +
    //           `Период ${duration} ${nameMonthOtWeek}\n` +
    //           `Оплата производится на сервисе Юкасса\n\n` +
    //           `После проведения оплаты и списания денежных средств вам придет ссылка на вступление в группу от бота @com_client_chat_bot\n` +
    //           `Если после проведения оплаты вы не получили ссылку на вступление, напишите @MaksOST1\n\n` +
    //           `Для перехода на стартовое меню отправьте сообщение боту с текстом /start или используйте меню бота`,
    //       )
    //
    //     } else {
    //       console.log("Сообщение не соответствует шаблону.");
    //     }
    //   }
    // })
    //
    // this.bot.hears(/t\.me\.*/, async (ctx) => {
    //
    //   constants text = ctx.message.text
    //
    //   async function getInfo(text) {
    //     try {
    //
    //       constants link = `http://localhost:7000`
    //       constants encodedText = encodeURIComponent(text);
    //
    //       constants response = await fetch(`${link}/telegram-posts/addPeopleFromChat?text=${encodedText}`, {
    //         method: 'GET',
    //         headers: {
    //           'Content-Type': 'application/json',
    //         },
    //       });
    //
    //       if (!response.ok) {
    //         throw new Error(
    //             `Failed to fetch categories. Status: ${response.status}`,
    //         );
    //       }
    //       constants responseData = await response.json();
    //
    //       // await this.bot.api.messages.AddChatUser()
    //
    //
    //       if(responseData) {
    //         await ctx.reply(
    //             `Все закончил брат. Давай еще ссылку, но сперва проверь, увеличилось ли количество подписчиков в том чате куда я должен был добавить пиплов`
    //         )
    //       } else {
    //         await ctx.reply(
    //             `Хм...что-то не так. Разработчика в студию`
    //         )
    //       }
    //
    //     } catch (err) {
    //       console.log(err)
    //     }
    //   }
    //
    //   constants result = await getInfo(text)
    //
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
    // this.bot
    //   .start()
    //   .then(() => {
    //     // Обработка успешного запуска бота
    //     console.log('Bot started successfully.')
    //
    //     // Отправляем клавиатуру с кнопкой сразу после успешного запуска бота
    //     constants startKeyBoard = new Keyboard().text('Отправить контакт')
    //     this.bot.api.sendMessage('<YOUR_CHAT_ID>', "Welcome to the bot! Press 'Share your contact' to start.", {
    //       reply_markup: startKeyBoard,
    //     })
    //   })
    //   .catch((error) => {
    //     console.error('Failed to start bot:', error)
    //     this.isBotRunning = false // Сбрасываем флаг запуска, если произошла ошибка при запуске
    //     // Выполняем повторный запуск бота через некоторое время
    //     setTimeout(() => {
    //       console.log('Restarting bot...')
    //       this.initializeBot()
    //     }, 5000) // Повторный запуск через 5 секунд
    //   })


    //=================
    // if (this.isBotRunning) {
    //   console.log('Bot is already running.') // Логирование сообщения о повторном запуске
    //   return
    // }

    // Инициализация бота с вашим токеном
    this.bot = new Bot(token)

    this.isBotRunning = true // Устанавливаем флаг запуска бота

    // this.bot.api.setMyCommands([
    //   { command: 'start', description: 'стартовый скрипт' },
    //   // { command: 'get instruction', description: `Показать инструкции,\nShow instruction"` },
    // ])

    this.bot.command('start', async (ctx) => {
      const categories = await this.categoriesService.findAll()
      const filtered = categories.filter((item) => item.channelActive).sort((a, b) => a.id - b.id)
      const text = []

      filtered.forEach((item) => {
        const block = `КАТЕГОРИЯ №${item.id} - ${item.name}.\nДоступные чаты: ${[...item.chatNames]}`
        text.push(block)
      })

      const keyBoard = new Keyboard().text('Получить доступ').text('Оплатил, но не пришла ссылка на вступление в чат').row().resized()
      await ctx.reply(
        `Приветствую тебя, я официальный телеграмм-бот сайта клиенты.com.\n\nНаправляю список категорий и доступных к ним чатов:\n\n${text.join('\n\n')}\n\n` +
          `Варианты подписки на один канал:\n\n` +
          `Тариф "Погрузись в работу" на месяц\n` +
          `1 месяц - 3000 р\n \n` +
          `Тариф "Недельный"\n` +
          `1 неделя - 1400 р\n \n` +
          `Ниже поля ввода появились кнопки`,
        {
          reply_markup: keyBoard,
        },
      )
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

      // Создаем клавиатуру
      const keyBoardCategory = new Keyboard();

      const categories = await this.categoriesService.findAll()
      const filtered = categories.filter((item) => item.channelActive).sort((a, b) => a.id - b.id)

      filtered.forEach((item) => {
        keyBoardCategory.text(`${item.id}-${item.name}`).resized();
      });

      const sameUser = await this.userService.findByPhone(phone)

      const saveInfo = async () => {
        if (!sameUser.chatIdTg) sameUser.chatIdTg = `${chatId}`
        if (!sameUser.userIdTg) sameUser.userIdTg = `${userId}`
        await this.userService.saveUpdatedUser(sameUser.id, sameUser)
      }

      if (sameUser && !sameUser.isActivatedPhone) {
       await saveInfo()

        await ctx.reply(
            `У вас уже создана учетная запись на сайте клиенты.com!\n\n` +
            `Но номер телефона не подтвержден\n \n` +
            `Перейдите на сайт клиенты.com и следуйте инструкциями в окне подтверждения номере телефона и возвращайтесь`,
            {
              reply_markup: keyBoardCategory,
            },
        )
      }
      if (sameUser && sameUser.isActivatedPhone) {
        await saveInfo()

        await ctx.reply(
            `У вас уже создана учетная запись на сайте клиенты.com!\n\n` +
            `Можете перейти к выбору канала\n`+
            `теперь вы можете из меню под чатом выбрать категорию для подключения\n\n`+
            `После выбора категории я повторно продублирую все  доступные чаты по категории"\n`,
            {
              reply_markup: keyBoardCategory,
            },
        )
      }

      if (!sameUser) {
        const password = await this.userService.randomPassword(12)
        const infoForRegister = {
          phoneNumber: phone,
          password: password,
          passwordCheck: password,
        }
        const newUser = await this.authService.register(infoForRegister, `000.00.00.000`)
        const user = await this.userService.findByPhone(phone)


        user.isActivatedPhone = true
        user.userIdTg = `${userId}`
        user.chatIdTg = `${chatId}`

        await this.userService.saveUpdatedUser(user.id, user)

        if (newUser?.text == 'Регистрация завершена. Осталось подтвердить номер телефона') {
          await ctx.reply(
              `Ваша учетная запись на сайте клиенты.com успешно создана!\n\n` +
              `логин:${phone}\n` +
              `пароль:${password}\n\n` +
              `Рекомендуется изменить пароль в вашем профиле через сайт\n \n` +
              `Дополнительно я подтвердил вашу учетную запись для вашего номера\n ` +
              `теперь вы можете из меню под чатом выбрать категорию для подключения"\n\n`+
              `После выбора категории я вам повторно продублирую все чаты доступные к подключению"\n`,
              {
                reply_markup: keyBoardCategory,
              },
          )
        }
      }
    })

    this.bot.hears('Получить доступ', async (ctx) => {
      const shareKeyBoard = new Keyboard().requestContact('Отправить контакт').resized()
      await ctx.reply(
          'Для продолжения мне необходимо проверить имеется ли учетная запись с вашим номером телефона на сайте клиенты.com. Если ее нет я ее быстро создам и направлю вам данные для входа. Это необходимо для подключения вашего аккаунта к телеграмм чату и проведения платежей. В учетную запись заходить необязательно, все будет в телеграмме',
          {
            reply_markup: shareKeyBoard,
          },
      )
    })

    this.bot.hears('Оплатил, но не пришла ссылка на вступление в чат', async (ctx) => {
      await ctx.reply(`Если вы оплатили и не пришла ссылка на вступление в чат, напишите в телеграмм @MaksOST1\n\n` +
          `Мы проверим вашу оплату и предоставим доступ\n`)

      // constants chatId = ctx.message.chat.id
      // constants userId = ctx.message.from.id
      // constants user = await this.userService.findByIdTgUser(`${userId}`)
    })

    // БЛОК РАБОТЫ С КАТЕГОРИЯМИ
    this.bot.hears(/^(\d+)\s*-\s*(.+)$/, async (ctx) => {

      const message = ctx.message.text.split('-')

      // Создаем клавиатуру
      const keyBoardCategory = new Keyboard();
      const category = await this.categoriesService.findById_category(+message[0])

      category?.chatNames?.forEach((item,index) => {
        if((index + 1) % 2 == 0) {
          keyBoardCategory.text(`1.${item}`).resized().row()
        } else {
          keyBoardCategory.text(`1.${item}`).resized()
        }
      });

      await ctx.reply(
          `Доступные чаты для подключения в категории ${category.name}`,
          {
            reply_markup: keyBoardCategory,
          },
      )
    })

    // На оплату для выбора
    this.bot.hears(/^(\d+)\.\s*(.+)$/, async (ctx) => {

      const message = ctx.message.text.split('.')

      // Создаем клавиатуру
      const keyBoardCategory = new Keyboard()
          .text(`${message[0]} ${message[1]}: 1 меc. - 3000 руб.`)
          .text(`${message[0]} ${message[1]}: 2 мес. - 6000 руб.`).row()
          .text(`${message[0]} ${message[1]}: 3 мес. - 9000 руб.`)
          .text(`${message[0]} ${message[1]}: 1 нед. - 1400 руб.`).row()
          .text(`${message[0]} ${message[1]}: 2 нед. - 2800 руб.`)
          .text(`${message[0]} ${message[1]}: 3 нед. - 4200 руб.`).row()
          .text(`${message[0]} ${message[1]}: 4 нед. - 5600 руб.`).resized()

      await ctx.reply(
          `Выберите канал и период и я вам предоставлю ссылку на оплату`,
          {
            reply_markup: keyBoardCategory,
          },
      )
    })

    // тут уже ссылку формируем на оплату
    this.bot.hears(/.*руб\..*/, async (ctx) => {

      const chatId = ctx.message.chat.id
      const userId = ctx.message.from.id

      const regex = /^(\d+)\s+(.*?)\s*:\s*(\d+)\s+(ме[сc]\.|нед\.|недели|месяц)\s+-\s+(\d+)\s+руб\.$/i;

      const message = ctx.message.text
      const match = message.match(regex);

      if (match) {
        const number = match[1]; // Номер
        const subject = match[2]; // Предмет
        const duration = match[3]; // Срок дни
        const nameMonthOtWeek = match[4]; // Срок
        const price = match[5]; // Цена

        const user = await this.userService.findByIdTgUser(`${userId}`)

        if (user && user.isActivatedPhone) {

          const chosenCategory = await this.categoriesService.findById_category(+number)

          const priceWeek = nameMonthOtWeek.includes('не')
          const priceMonth = nameMonthOtWeek.includes('ме')
          const title = priceWeek ? 'Недельный' : 'Погрузись в работу'
          let days;

          if (nameMonthOtWeek.includes('не')) days = +duration * 7
          if (nameMonthOtWeek.includes('ме')) days = +duration

          const payment = {
            categ: [{id: chosenCategory.id, text: chosenCategory.name, chatNames: chosenCategory.chatNames}],
            price: +price,
            period: days,
            title: title,
            chatList: [{id: chosenCategory.id, chats: [subject]}]
          }

          const link = await this.categoriesService.createPayNotification(user, payment)

          await ctx.reply(
              `Ваша ссылка для проведения оплаты:\n\n` +
              `${link}\n\n` +
              `Канал: ${subject}\n` +
              `Сумма: ${price} руб\n` +
              `Период ${duration} ${nameMonthOtWeek}\n` +
              `Оплата производится на сервисе Юкасса\n\n` +
              `После проведения оплаты и списания денежных средств вам придет ссылка на вступление в группу от бота @com_client_chat_bot\n` +
              `Если после проведения оплаты вы не получили ссылку на вступление, напишите @MaksOST1\n\n` +
              `Для перехода на стартовое меню отправьте сообщение боту с текстом /start или используйте меню бота`,
          )

        } else {
          console.log("Сообщение не соответствует шаблону.");
        }
      }
    })

    this.bot.hears(/t\.me\.*/, async (ctx) => {
      const text = ctx.message.text
      console.log(text)

      async function getInfo(text) {
        try {

          const link = `https://micro-one-first.ru`
          const encodedText = encodeURIComponent(text);

          const response = await fetch(`${link}/telegram-posts/addPeopleFromChat?text=${encodedText}`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          });

          if (!response.ok) {
            throw new Error(
                `Failed to fetch categories. Status: ${response.status}`,
            );
          }
          const responseData = await response.json();

          // await this.bot.api.messages.AddChatUser()


          if(responseData) {
            await ctx.reply(
                `Все закончил брат. Давай еще ссылку, но сперва проверь, увеличилось ли количество подписчиков в том чате куда я должен был добавить пиплов`
            )
          } else {
            await ctx.reply(
                `Хм...что-то не так. Разработчика в студию`
            )
          }

        } catch (err) {
          console.log(err)
        }
      }

      const result = await getInfo(text)

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
