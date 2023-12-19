import { HttpException, HttpStatus } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Brackets, Repository } from 'typeorm'
import { HttpService } from '@nestjs/axios'
import { PostEntity } from './entities/post.entity'
import * as process from 'process'
import {catchError, firstValueFrom} from 'rxjs'
import {AxiosError} from 'axios'

import { UsersService } from '../users/users.service'
import {
  LogsService,
  LogsServiceAddNannies,
  LogsServiceAddTutors,
} from '../otherServices/loggerService/logger.service'
import { Api, TelegramClient } from 'telegram'
import { StringSession } from 'telegram/sessions'
import {CategoriesService} from "../additionalRepositories/categories/categories.service";
import {TutorsService} from "../AllCategoriesForSearch/tutors/tutors.service";
import {NanniesService} from "../AllCategoriesForSearch/nannies/nannies.service";
import {ChatsFromTelegramService} from "../groupsAndChats/chats-from-telegram/chats-from-telegram.service";
import {GroupsFromVkService} from "../groupsAndChats/groups-from-vk/groups-from-vk.service";


const input = require('input')
const Bottleneck = require('bottleneck')

const limiter = new Bottleneck({
  minTime: 334, // минимальное время между запросами (3 запроса в секунду, чтобы избежать ошибки "Too many requests per second")
})
const limiterTwo = new Bottleneck({
  minTime: 634, // минимальное время между запросами (3 запроса в секунду, чтобы избежать ошибки "Too many requests per second")
})

const telegramLimiter = new Bottleneck({
  maxConcurrent: 1, // Максимальное количество одновременных запросов
  minTime: 10000, // Минимальное время между запросами (в миллисекундах)
});

export class PostsService {
  // private readonly logger = new Logger(AppService.name);

  constructor(
      private logsServicePostsAdd: LogsService, // Для PostsAdd
      private logsServiceTutorsAdd: LogsServiceAddTutors,
      private logsServiceNanniesAdd: LogsServiceAddNannies,
      private groupsFromVkService: GroupsFromVkService,
      private chatsFromTelegramService: ChatsFromTelegramService,
      private tutorService: TutorsService,
      private nanniesService: NanniesService,
      private categoriesService: CategoriesService,
      private usersService: UsersService,
      @InjectRepository(PostEntity)
      private repository: Repository<PostEntity>,
      private readonly httpService: HttpService,
  ) {
  }

  // получить все
  async getAll() {
    return await this.repository.find()
  }

  // Удалить посты одной группы
  async deleteOneGroup(id, dto) {
    try {
      const user = await this.usersService.findById(+id)
      if (!user)
        throw new HttpException('Пользователь не найден', HttpStatus.UNAUTHORIZED,)
      if (!user.isMainAdmin)
        throw new HttpException('Не достаточно прав доступа', HttpStatus.UNAUTHORIZED,)

      await this.repository.delete({post_owner_id: dto.owner_id})

    } catch (err) {
      if (err.response === 'Пользователь не найден') {
        throw err
      } else if (err.response === 'Не достаточно прав доступа') {
        throw err
      } else if (err.response === 'Не удалось получить все посты') {
        throw err
      } else if (err.response === 'Не удалось отфилтровать посты по группе') {
        throw err
      } else {
        throw new HttpException('Ошибка при удалении постов', HttpStatus.FORBIDDEN,)
      }
    }
  }

  // удалить все
  async deleteAllPosts(id) {
    // try {
    //
    //     const user = await this.usersService.findById(+id)
    //     if (!user) throw new HttpException('Пользователь не найден', HttpStatus.UNAUTHORIZED);
    //     if (!user.isMainAdmin) throw new HttpException('Не достаточно прав доступа', HttpStatus.UNAUTHORIZED);
    //
    //     await this.repository.clear()
    //
    // } catch (err) {
    //     if (err.response === 'Пользователь не найден') {
    //         throw err;
    //     } else if (err.response === 'Не достаточно прав доступа') {
    //         throw err;
    //     } else {
    //         throw new HttpException('Ошибка при удалении постов', HttpStatus.FORBIDDEN);
    //     }
    // }
  }

  // получить посты одной группы из общего репозитория
  async getAllPostsById(post_owner_id: string) {
    return await this.repository.find({
      where: {
        post_owner_id,
      },
    })
  }

  // получить последний пост одной группы из общего репозитория
  async getLatestPostByIdForThisGroup(post_owner_id: string) {
    const latestPost = await this.repository.findOne({
      where: {
        post_owner_id,
      },
      order: {
        post_date_publish: 'DESC',
      },
    })
    return latestPost
  }

  // async getPagination(post_owner_id: string, dto: { limit: number; page: number },) {
  //   const [result, total] = await this.repository.findAndCount({
  //     skip: (+dto.page - 1) * +dto.limit,
  //     take: +dto.limit,
  //     where: [{post_owner_id: post_owner_id}],
  //     order: {
  //       post_date_publish: 'DESC',
  //     },
  //   })
  //
  //   return {
  //     data: result,
  //     page: +dto.page,
  //     total,
  //     pageCount: Math.ceil(total / +dto.limit),
  //   }
  // }

  // получаем все с пагинацией
  async getPaginationAll(dto: { limit: number; page: number },) {
    const [result, total] = await this.repository.findAndCount({
      skip: (+dto.page - 1) * +dto.limit,
      take: +dto.limit,
      order: {
        post_date_publish: 'DESC',
      },
    })

    return {
      data: result,
      page: +dto.page,
      total,
      pageCount: Math.ceil(total / +dto.limit),
    }
  }

  // найти конкретный пост по id
  async getPostById(post_id) {
    return await this.repository.find({
      where: {
        post_id,
      },
    })
  }

  // когда добавляем посты в репозиторий общий
  async create(item, groups, profiles, identificator) {

    try {

    const ownerId = String(item.owner_id).replace('-', '')
    const groupInfo = groups?.find((element) => element.id == ownerId)
    const profileInfo = profiles?.find(
        (element) => element.id == item.signer_id,
    )

    return this.repository.save({
      identification_post: identificator,
      id_group: groupInfo?.id || item.owner_id || '',
      name_group: groupInfo?.name || '',
      city_group: groupInfo?.city?.title || '',
      country_group: groupInfo?.country?.title || '',
      photo_100_group: groupInfo?.photo_100 || '',
      first_name_user: profileInfo?.first_name || '',
      last_name_user: profileInfo?.last_name || '',
      city_user: profileInfo?.city?.title || '',
      country_user: profileInfo?.country?.title || '',
      photo_100_user: profileInfo?.photo_100 || '',
      post_id: item.id,
      post_owner_id: item.owner_id,
      post_fromId: item.from_id,
      post_date_publish: item.date,
      post_text: item.text,
      post_type: item.post_type,
      signer_id: item.signer_id || '',
    })

    } catch (err) {
      await this.logsServicePostsAdd.error(`№1 ERROR - ${err}`, `Ошибка create в общий`);
    }
  }

  async createTg(item, groups, profiles, identificator) {

    // if( !item?.message) {
    //   await this.logsServicePostsAdd.error(`error`, `нету сообещений ${item?.message} для ${item?.className}`)
    //   return
    // }

    const obj = {
      identification_post: identificator,
      id_group: item?.peerId?.channelId?.value.toString() || groups.fullChat.id.value.toString() || '',//++++++++++++++++++
      name_group: groups?.chats?.[0]?.title || '',
      city_group: groups?.fullChat?.location?.city || '',
      country_group: groups?.fullChat?.location?.country || '',
      photo_100_group: groups?.fullChat?.chatPhoto?.sizes?.[0]?.url || '', //+++++++++++++++++++++
      first_name_user: profiles?.users?.[0]?.firstName || '', // +++++++++++++++++++
      last_name_user: profiles?.users?.[0].last_name || profiles.users[0].username || '', // +++++++++++++++++
      city_user: profiles?.city?.title || '',
      country_user: profiles?.country?.title || '',
      photo_100_user: profiles.users?.[0]?.photo?.sizes[0]?.url || '',
      post_id: item.id, // ++++++++++++++++++++++++
      post_owner_id: item?.peerId?.channelId?.value?.toString() || '', // ++++++++++++++++++
      post_fromId: item?.fromId?.userId?.value?.toString() || '', // ++++++++++++++++++
      post_date_publish: item?.date, // ++++++++++++++++++++++
      post_text: item?.message, // ++++++++++++++++++++++++++
      post_type: 'сообщение',  // Предполагая, что это константа
      signer_id: item?.fromId?.userId?.value?.toString() || '',  // Так как нет данных о signer_id в предоставленном JSON
    }
    // console.log(obj.post_text)

    return this.repository.save(obj)
  }

  // разводящая функция когда появляется новый пост
  async givePostsToAllRepositories(item, groupInfo, profilesInfo, sendMessage) {

    const allCategories = await this.categoriesService.getAllCategories()

    if (!allCategories || !allCategories.length) {
      await this.logsServicePostsAdd.error(`получение категорий`, `не получены категории в развилке`)
    }

    await Promise.all(
        allCategories.map(async (category) => {
          this.addNewPostToOtherRepositories(item, groupInfo, profilesInfo, sendMessage, category, telegramLimiter)
        }),
    )
  }

  // ===================================================================================================================

  // БЛОК ФУНКЦИй ДЛЯ ДОБАВЛЕНИЯ ПОСТОВ С НОВЫХ ГРУПП
  // стратовая функция
  async processGroups(indicator) {

    try {

      this.logsServicePostsAdd.log(`${new Date().toTimeString()} ${indicator == 1 ? '************************************************ СОЗДАНИЕ' : '********************************************* ОБНОВЛЕНИЕ'}`);

      // получаем все группы с репозитория в формате масива объектов
      const groups = await this.groupsFromVkService.findAll()

      this.logsServicePostsAdd.log(`№1 получено ${groups.length} групп в ${new Date().toTimeString()}`);

      // если индикатор = 2, значит надо обновить групппы, а если их нет то и обновлять нечего
      if ( indicator == 2 && (!groups || !groups?.length)) {
        await this.logsServicePostsAdd.error('№1 ERROR', `групп в базе данных не найдено или не получены ШАГ №1 ERROR `)
        return
      }

      // размер пакета групп для запроса в вк. ограничение от вк в 450
      let mainBatchSize = 450

      // Разделение groupBatch на подгруппы по 450 групп
      for (let i = 0; i < groups.length; i += mainBatchSize) {
        this.logsServicePostsAdd.log(`№1 обработка пакета группы ${i} - ${i + mainBatchSize}, всего групп ${groups.length} групп, делим на ${mainBatchSize} групп`)
        this.processMainBatch(groups.slice(i, i + mainBatchSize), indicator, i, mainBatchSize)
      }

      this.logsServicePostsAdd.log(`№1 Разбивка групп по ${mainBatchSize} завершена в : ${new Date().toTimeString()} +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++`);

    }  catch(err) {
      await this.logsServicePostsAdd.error(`№1 ERROR - ${err.message}`, `Ошибка на ШАГЕ №1: ${err.stack}`);
    }
  }

  // вспомогательная к 1й функции
  async processMainBatch(groups, indicator, i, mainBatchSize) {

    this.logsServicePostsAdd.log(`№2 processMainBatch, запуск второй функции  для групп ${i} - ${i + mainBatchSize}, количество групп ${groups.length} ******************************************************************************************` )

    try {

      // делим на более мелкие пакеты по 10 и 25 групп в каждом, ограничение по мб от вк
      let batchSize;
      if (indicator == 1) batchSize = 10 // для создания группы - т.е. когда ее нет, только добавили
      if (indicator == 2) batchSize = 25 // если требуется только обновить

      // подготовливаем все id в строку 130459324,213267337,67332874, ... для запросв в вк и проверку на закрытость
      const groupIds = groups
          .map((group) => group.idVk.replace('-', ''))
          .join(',')

      const code = `
            var groupInfo = API.groups.getById({group_ids: "${groupIds}", fields: "is_closed"});
            return { groupInfo: groupInfo };`

      this.logsServicePostsAdd.log(`№2 код для запроса для групп ${i} - ${i + mainBatchSize}: ${code}`);

      // получаем инфу о группах в массиве и в каждом объете есть свойство is_closed по которому определяем закрыта группа или нет
      const groupsInfo = await this.checkIsClosedGroup(code)

      if (!groupsInfo) {
        this.logsServicePostsAdd.log(`№2 для групп ${i} - ${i + mainBatchSize} - не получено инфа о закрытости для ${groupsInfo}`);
      }

      // выделяем все закрытые группы, оставляем их id и помечаем их в БД
      const closedGroupIds = groupsInfo.response.groupInfo.groups
          .filter((group) => group.is_closed)
          .map((group) => `-${group.id}`)
      // помечаем в БД
      this.groupsFromVkService.addInfoAboutClosedGroup(closedGroupIds)

      // Выделяем открытые группы для дальнейшей обработки (тут массива данных по группам из БД)
      const openGroups = groups.filter(
          (group) => !closedGroupIds.includes(group.idVk),
      )

      this.logsServicePostsAdd.log(`№2 Начало обработки групп: ${new Date().toTimeString()}, !закрытых ${closedGroupIds ? closedGroupIds?.length : 0} из ${groups.length} для групп ${i} - ${i + mainBatchSize}`);
      this.logsServicePostsAdd.log(`№2 Начало обработки групп: ${new Date().toTimeString()}, открытых ${openGroups ? openGroups?.length : 0} из ${groups.length} для групп ${i} - ${i + mainBatchSize}`);

      if (!openGroups || !openGroups.length) {
        await this.logsServicePostsAdd.error(`№2 ERROR второй функции для групп ${i} - ${i + mainBatchSize} - не найдено открытых групп, закрытые ${closedGroupIds} из ${groups.length}`, `groups не получены !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!! ШАГ №1 ERROR `)
        return
      }

      // массив для групп, в котором будут группы после фильтрации. Если indicator = 1, то будут группы, постов которых нет в базе и наоборот
      let groupsForNextFunction = []
      // группы, постов которых нет в бд.Проверяем есть ли посты в БД
      if (indicator == 1) {
        groupsForNextFunction = await Promise.all(
            openGroups.map(async (group) => {
              return (await this.hasPosts(group)) ? null : group
            }),
        ).then((results) => results.filter((result) => result != null))
      }
      // группы посты которых есть в бд
      if (indicator == 2) {
        groupsForNextFunction = await Promise.all(
            openGroups.map(async (group) => {
              return (await this.hasPosts(group)) ? group : null
            }),
        ).then((results) => results.filter((result) => result != null))
      }

      if (!groupsForNextFunction || !groupsForNextFunction.length) {
        await this.logsServicePostsAdd.error(`№2 ERROR второй функции для групп ${i} - ${i + mainBatchSize} - после фильтрации на первом шаге нет групп ${groupsForNextFunction.length}, открытые ${openGroups.length} !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!`, `ШАГ №1 ERROR `)
        return
      }

      this.logsServicePostsAdd.log(`№2 --------------------------------К дальнейшей обработке  ${groupsForNextFunction.length} из ${groups.length}, делим ${batchSize} для групп ${i} - ${i + mainBatchSize}.`);

      for (let u = 0; u < groupsForNextFunction.length; u += batchSize) {
        this.logsServicePostsAdd.log(`№2 Обработка пакета мелкого №${u / batchSize + 1} из ${Math.ceil(groupsForNextFunction.length / batchSize)} для групп ${i} - ${i + mainBatchSize}`);
        const groupBatch = groupsForNextFunction.slice(u, u + batchSize)
        this.createAndCheckVk(indicator, groupBatch, i, u, mainBatchSize, batchSize)
      }

      this.logsServicePostsAdd.log(`№2 завершение второй фукнкции  в : ${new Date().toTimeString()}  для групп ${i} - ${i + mainBatchSize}+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++`);

    } catch (err) {
      await this.logsServicePostsAdd.error(`№2 Функция processMainBatch по получению постов с вк - ошибка  ***************************************************** ШАГ №1 ERROR, для групп ${i} - ${i + mainBatchSize}`, `${err}`,)
    }
  }
  // подготавливаем к запросам
  async createAndCheckVk(indicator, owner, i, u, mainBatchSize, batchSize) {

    // owner - тут группы с бд с овсей инфой что в бд
    this.logsServicePostsAdd.log(`№3 createAndCheckVk запуск третьей функции в ${new Date().toTimeString()} для групп ${i} ${i + mainBatchSize}, количество групп ${owner.length}, пачка ${u} - ${u + batchSize} +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++`)

    try {
      const IfNoPostsInRepository = `80` // если нет постов в нашем репозитории, то будем запрашивать по 100 постов
      const IfPostsAreInRepository = `10` // если есть посты в нашем репозитории, то запрашиваем по 10
      const numberOffset = process.env['OFFSET_POST'] // начальное смещение для получения постов = 0

      if (!owner || !owner?.length) {
        await this.logsServicePostsAdd.error(`№3 ERROR третьей функции для групп ${i} ${i + mainBatchSize} пачка  - ${u + batchSize} - не получены группы из второй функции`, ` с первого щага получил пустой owner - нет групп; !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!! ШАГ №2 ERROR`,)
        return
      }

      // массивы для хранения данных когда нет постов групп
      const prepereRequestIfNoPostsInRepository = [] // запрос по группам для постов
      const partOfGroupsIfPostsNo = [] // массив объетов групп которых еще нет - будем запрашивать максимум  - 100 постов
      // массивы для хранения данных когда есть посты групп - нужно только обновить
      const prepereRequestIfPostsAreInRepository = []  // запрос по группам для постов
      const partOfGroupsIfPostsAre = [] // которые есть - запрашивать будем по 10 постов
      // количество запрашиваемых постов
      let numberPost = `0`;

      if (indicator == 1) numberPost = IfNoPostsInRepository; // 100
      if (indicator == 2) numberPost = IfPostsAreInRepository; // 10

      if (numberPost == `0`) {
        await this.logsServicePostsAdd.error(`№3 ERROR третьей функции для групп ${i} ${i + mainBatchSize} пачка  - ${u + batchSize} - numberPost == 0, не поменялось значение`, `  !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!! ШАГ №2 ERROR`,)
        return
      }

      // перебираем все объекты в массиве и формируем переменную для отправки запроса на получение постов, а также разбиваем на группы
      await Promise.all(
          owner.map(async (group, index) => {
            const query = `var response${index} = API.wall.get({owner_id: ${group.idVk}, count: ${numberPost}, offset: ${numberOffset}, fields: "city,country,first_name_nom,photo_100", extended: 1});`

            if (indicator == 1) {
              prepereRequestIfNoPostsInRepository.push(query)
              partOfGroupsIfPostsNo.push(
                  owner.find((item) => item.idVk === group.idVk),
              )
            }
            if (indicator == 2) {
              prepereRequestIfPostsAreInRepository.push(query)
              partOfGroupsIfPostsAre.push(
                  owner.find((item) => item.idVk === group.idVk),
              )
            }
          }),
      )

      // добавляем доп инфу к запросу и отправляем дальше
      if (indicator == 1) {
        if (!prepereRequestIfNoPostsInRepository || !prepereRequestIfNoPostsInRepository.length) {
          await this.logsServicePostsAdd.error(`№3 ERROR - не сформирован prepereRequestIfNoPostsInRepository для групп ${i} ${i + mainBatchSize} пачка  - ${u + batchSize}, групп принято ${owner}`, `  !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!ШАГ №2 ERROR`,)
          return
        }

        const codeIfPostsNo = prepereRequestIfNoPostsInRepository.join('\n') + '\nreturn { ' + prepereRequestIfNoPostsInRepository.map((_, index) => `group${index}: response${index}`).join(', ') + ' };'
        this.logsServicePostsAdd.log(`№3 создание кода  для для групп ${i} ${i + mainBatchSize} пачка  - ${u + batchSize}  с кодом зароса ${codeIfPostsNo}`)
        if (codeIfPostsNo && codeIfPostsNo.length)
          this.addPostsToCommonOrUpdate(codeIfPostsNo, IfNoPostsInRepository, numberOffset, partOfGroupsIfPostsNo, indicator, i, u, mainBatchSize, batchSize)
      }

      if (indicator == 2) {
        if (!prepereRequestIfPostsAreInRepository || !prepereRequestIfPostsAreInRepository.length) {
          await this.logsServicePostsAdd.error(`№3 ERROR - не сформирован prepereRequestIfPostsAreInRepository для групп ${i} ${i + mainBatchSize} пачка  - ${u + batchSize}, групп принято ${owner}`, `  ***************************************************** ШАГ №2 ERROR`,)
          return
        }

        const codeIfPostsYes = prepereRequestIfPostsAreInRepository.join('\n') + '\nreturn { ' + prepereRequestIfPostsAreInRepository.map((_, index) => `group${index}: response${index}`).join(', ') + ' };'
        this.logsServicePostsAdd.log(`№3 создание кода для update для групп ${i} пачка ${u}  с кодом зароса ${codeIfPostsYes}`)
        if (codeIfPostsYes && codeIfPostsYes.length)
          this.addPostsToCommonOrUpdate(codeIfPostsYes, IfPostsAreInRepository, numberOffset, partOfGroupsIfPostsAre, indicator,i, u, mainBatchSize, batchSize)
      }
    } catch (err) {
      await this.logsServicePostsAdd.error(`№3 Функция проверки и получению постов с вк - ошибка для групп ${i} ${i + mainBatchSize} пачка  - ${u + batchSize} ***************************************************** ШАГ №2 ERROR,`, `${err}`,)
    }
  }
  // тут уже цикл с передачей в функциб добавления
  async addPostsToCommonOrUpdate(postsForRequst, numberPost, numberOffset, owner, indicator,i, u, mainBatchSize, batchSize) {
    //owner - группы по 25 шт
    //postsForRequst - запрос для вк

    try {
      this.logsServicePostsAdd.log(`№4 addPostsToCommonOrUpdate в ${new Date().toTimeString()} для групп ${i} ${i + mainBatchSize} пачка  - ${u + batchSize}, количество групп ${owner?.length} +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++`)

      let startOffset = +numberOffset // изнчально  офсет 0

      // получаем первые посты. тут будет объект в котором будет находится инфа о группе {group0: { count: 8267, items: [Array], profiles: [Array], groups: [Array] }, group1:{...}}
      const posts = await limiter.schedule(() => this.getPostsFromVK(postsForRequst))

      if (!posts || Object.keys(posts?.response)?.length == 0) {
        this.logsServicePostsAdd.log(`№4 не получены ключи для групп ${i} ${i + mainBatchSize} пачка  - ${u + batchSize} - останов !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!`,)
        return
      }

      // массив для id групп которые не прошли по датам
      let filterGroups = await this.filterGroups(posts, indicator, i, u, mainBatchSize, batchSize)

      // все группы для старта, проверки и от сюда будем удалять те которые не прошли по датам
      let allGroups = owner

      // запускаем бесконечный цикл пока allGroup не будет пустым
      for (let i = 1; i < Infinity; i++) {
        this.logsServicePostsAdd.log(`№4 ВХОД В БЕСКОНЕЧНЫЙ ЦИКЛ -------------------------------------------------------------------- для групп ${i} ${i + mainBatchSize} пачка  - ${u + batchSize} итерация № ${i} `,)
        this.logsServicePostsAdd.log(`№4 для групп ${i} ${i + mainBatchSize} пачка  - ${u + batchSize} итерация № ${i} не прошли по датам ${filterGroups?.length} шт, а именно id: ${filterGroups}`)

        // если есть id групп которые не прошли по датам то фильтруем
        if (filterGroups && filterGroups?.length) {
          //получаем все группы с предыдущего раза
          const forFilter = allGroups
          // получаем то что остается

          const groupsForNest = allGroups.filter((groupItem) => {
            const result = !filterGroups.includes(Number(groupItem.idVk))
            return result
          })

          // обновили весь массив то с чем работаем
          allGroups = groupsForNest
        }

        if (!allGroups || !allGroups?.length) {
          this.logsServicePostsAdd.log(`№4 для групп ${i} ${i + mainBatchSize} пачка  - ${u + batchSize} итерация № ${i} внутри цикла allGroups = ${allGroups.length} ******************************************************************************** итерация № ${i} ${new Date()}`,)
          break
        }

        startOffset += +numberPost // увеличиваем офсет
        // формируем запрос на сл посты в вк
        const requestPosts = []

        for (let index = 0; index < allGroups?.length; index++) {
          const query = `var response${index} = API.wall.get({owner_id: ${allGroups[index].idVk}, count: ${numberPost}, offset: ${startOffset}, fields: "city,country,first_name_nom,photo_100", extended: 1});`
          requestPosts.push(query)
        }
        const codeMany = requestPosts.join('\n') + '\nreturn { ' + requestPosts.map((_, index) => `group${index}: response${index}`).join(', ') + ' };'
        const posts = await limiter.schedule(() => this.getPostsFromVK(codeMany))

        if (!posts || Object.keys(posts.response)?.length == 0) {
          this.logsServicePostsAdd.log(`№4 НУТРИ В ЦИКЛЕ ПРИ ПОВТОРНОМ ЗАПРОСЕ для групп ${i} ${i + mainBatchSize} пачка  - ${u + batchSize} - posts =  ${posts?.length} !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!`,)
          break
        }
        filterGroups = await this.filterGroups(posts, indicator, i, u, mainBatchSize, batchSize )
      }

      this.logsServicePostsAdd.log(`№4 Завершен беспонечный цикл для групп ${i} ${i + mainBatchSize} пачка  - ${u + batchSize} - ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++`,)

    } catch (err) {
      this.logsServicePostsAdd.error(`№4 error`, `ошибка где входы в цикл: для групп ${i} ${i + mainBatchSize} пачка  - ${u + batchSize} ${err} для групп`);
    }

  }
  // распределяем куда дальше - создаем или обновляем
  async filterGroups(posts, indicator, i, u, mainBatchSize, batchSize) {

    try {

      let remainingGroups = []

      if (indicator == 1) {
        this.logsServicePostsAdd.log(`№5 функция фильтрации создание для групп ${i} -${i + mainBatchSize} пачка ${u} - ${u + batchSize}  ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++`)
        remainingGroups = await this.forFuncfilterGroupsIfCreateGroups(posts, i, u, mainBatchSize, batchSize)
      } else if (indicator == 2) {
        this.logsServicePostsAdd.log(`№5 функция фильтрации обновление для групп ${i} -${i + mainBatchSize} пачка ${u} - ${u + batchSize}  ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++`)
        remainingGroups = await this.forFuncfilterGroupsIfUpadete(posts, i, u, mainBatchSize, batchSize)
      } else {
        this.logsServicePostsAdd.error(`№5 error для групп ${i} -${i + mainBatchSize} пачка ${u} - ${u + batchSize} `, `Unexpected indicator value: ${indicator} !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!`);
      }

      return remainingGroups

    }catch (err) {
      this.logsServicePostsAdd.error(`№5 error для групп ${i} -${i + mainBatchSize} пачка ${u} - ${u + batchSize} `, `ошибка в разветвлении: ${err} !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!`);
    }
  }
  // для создания
  async forFuncfilterGroupsIfCreateGroups(posts, ii, u, mainBatchSize, batchSize) {

    this.logsServicePostsAdd.log(`№6 функция получения и добавления постов для групп ${ii} -${ii + mainBatchSize} пачка ${u} - ${u + batchSize}  ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++`)

    try {

      const currentMonth = new Date().getMonth() // текущий месяц
      const searchFromCurrentMonth = currentMonth - 1 // месяц до которого будем проссматривать все посты с каждой группы
      const sendMessage = false

      const remainingGroups = [] // Массив для хранения групп, циклы которых были прерваны break, не прошли по датам

      // в key мы получаем все названия групп, group0,1,2,3...
      for (const key in posts.response) {
        // проверка, есть ли у объекта posts.response собственное свойство с ключом key.
        if (Object.prototype.hasOwnProperty.call(posts.response, key)) {
          const group = posts.response[key] // получаем инфу о конкретной группе из общего объекта
          if (!group) return
          // this.logsServicePostsAdd.log(`'''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''№6 проверяем посты группы ${group.items[0].owner_id} групп ${i} -${i + mainBatchSize} пачка ${u} - ${u + batchSize}`)

          for (let i = 0; i < group.items?.length; i++) {
            const item = group.items[i]

            if (new Date(item.date * 1000).getMonth() < searchFromCurrentMonth) {
              // если месяц меньше искомого, то проверяем не закреп ли это
              if (item.is_pinned) {
                this.logsServicePostsAdd.log(`${group.items[0].owner_id} групп ${ii} -${ii + mainBatchSize} пачка ${u} - ${u + batchSize} дата ${new Date(item.date * 1000).getMonth()} ------------------------------------ ISPING ==== на итерации ${i}`)
                continue
              }
              // если не с закрепа то то кидаем в массив и прекращаем итерацию
              if (!item.is_pinned) {
                remainingGroups.push(item.owner_id)
                this.logsServicePostsAdd.log(`${group.items[0].owner_id} групп ${ii} -${ii + mainBatchSize} пачка ${u} - ${u + batchSize}  ${new Date(item.date * 1000,).getMonth()} -------------------------------- BREAK--------------  на итерации ${i}`)
                break
              }
            }
            // Если же дата больше искомой то добавляем в репозиторий
            if (new Date(item.date * 1000).getMonth() >= searchFromCurrentMonth) {
              await this.create(item, group.groups, group.profiles, 'vk'); // ТУТ УБРАТЬ AWAIT ДЛЯ ИСКЛЮЧЕНИЯ ЗЕДЕРЖЕК
              this.groupsFromVkService.addPostCounter(
                  group.count,
                  new Date(item.date * 1000),
                  item.owner_id,
              )
              this.givePostsToAllRepositories(item, group?.groups, group?.profiles, sendMessage)
            }
          }
        }
      }

      return remainingGroups

    }catch (err) {
      this.logsServicePostsAdd.error(`№6 error групп ${ii} -${ii + mainBatchSize} пачка ${u} - ${u + batchSize}`, `ошибка при фильтрации постов для создания: ${err}!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!`);
    }
  }
  // для обновления
  async forFuncfilterGroupsIfUpadete(posts, ii, u, mainBatchSize, batchSize) {

    this.logsServicePostsAdd.log(`№6 функция обновления постов для групп ${ii} -${ii + mainBatchSize} пачка ${u} - ${u + batchSize}  ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++`)

    try {

      const sendMessage = true
      const remainingGroups = [] // Массив для хранения групп, которые были прерваны, не прошли по датам

      for (const key in posts.response) {

        if (Object.prototype.hasOwnProperty.call(posts.response, key)) {
          const group = posts.response[key]
          if (!group) return

          for (let i = 0; i < group.items?.length; i++) {
            const item = group.items[i]

            let latestPostsDates;
            const groupInfo = await this.groupsFromVkService.findByIdVk(item.owner_id)

            if (groupInfo?.postsLastDate) {
              latestPostsDates = new Date(groupInfo?.postsLastDate).getTime();
            } else {
              const postDateLast = await this.getLatestPostByIdForThisGroup(item.owner_id)
              latestPostsDates = new Date(Number(postDateLast.post_date_publish)*1000).getTime()
              groupInfo.postsLastDate = new Date(Number(postDateLast) * 1000)
              await this.groupsFromVkService.updateThis(groupInfo.id, groupInfo)
            }

            if (new Date(item.date * 1000).getTime() < latestPostsDates) {
              // если это с закрпа то
              if (item.is_pinned) {
                this.logsServicePostsAdd.log(`${group.items[0].owner_id} групп ${ii} -${ii + mainBatchSize} пачка ${u} - ${u + batchSize} дата ${new Date(item.date * 1000).getMonth()} ------------------------------------ ISPING ==== на итерации ${i}`)
                continue
              }
              // если не с закрепа то
              if (!item.is_pinned) {
                remainingGroups.push(item.owner_id)
                this.logsServicePostsAdd.log(`${group.items[0].owner_id} групп ${ii} -${ii + mainBatchSize} пачка ${u} - ${u + batchSize}  ${new Date(item.date * 1000,).getMonth()} -------------------------------- BREAK--------------  на итерации ${i}`)
                this.groupsFromVkService.changePostsDateToDateUpdateWhenBreak(groupInfo)
                break
              }
            }
            if (new Date(item.date * 1000).getTime() > new Date(latestPostsDates).getTime()) {
              await this.create(item, group.groups, group.profiles, 'vk'); // ТУТ УБРАТЬ AWAIT ДЛЯ ИСКЛЮЧЕНИЯ ЗЕДЕРЖЕК
              this.logsServicePostsAdd.log(`${group.items[0].owner_id} групп ${ii} -${ii + mainBatchSize} пачка ${u} - ${u + batchSize} ${new Date(item.date * 1000,).getMonth()} CREATE------------------------------------------  на итерации ${i}`,)
              this.groupsFromVkService.addPostDateWhenUpdate(
                  group.count,
                  new Date(item.date * 1000),
                  item.owner_id,
                  groupInfo
              )
              this.givePostsToAllRepositories(item, group?.groups, group?.profiles, sendMessage)
            }
          }
        }
      }

      return remainingGroups

    } catch (err) {
      this.logsServicePostsAdd.error(`№6 error`, `ошибка при фильтрации постов для  update: ${err}!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!`);
    }
  }
  // получаем посты с вк
  async getPostsFromVK(postsForRequst) {
    const access = process.env['ACCESS_TOKEN']
    const versionVk = process.env['VERSION_VK']

    try {
      const { data } = await firstValueFrom(
          this.httpService
              .get<any>(`https://api.vk.com/method/execute?code=${encodeURIComponent(postsForRequst,)}&access_token=${access}&v=${versionVk}`,)
              .pipe(
                  catchError((error: AxiosError) => {
                    if (error.response && 'data' in error.response && error.response.data != undefined) {
                      this.logsServicePostsAdd.error(`№6 error`, `ошибка получения постов в группе ${error.response} запрос ${postsForRequst}`);

                      // this.logger.error(error.response.data);
                    }
                    throw 'err'
                  }),
              ),
      )

      // очищаем ответ, удаляя лишнее
      if (data?.response && typeof data.response === 'object') {
        if ('execute_errors' in data.response) {
          delete data.response.execute_errors;
        }
      }
      // if('execute_errors' in data.response) {
      //   const { execute_errors, ...cleanData } = data.response
      // }


      const filteredData = { response: {} }

      filteredData.response = Object.fromEntries(
          Object.entries(data.response).filter(([key, value]: [string, any]) => {
            return value !== false && (!value.count || value.count !== 0) && value.items && value.items.length > 0;
          })
      );
      return filteredData

    } catch (err) {
      this.logsServicePostsAdd.error(`№6 error`, `ошибка получения постов в группе ${err} запрос ${postsForRequst}`);
      throw new HttpException(
          'Ошибка при получении групп вк',
          HttpStatus.FORBIDDEN,
      )
    }
  }
  // запрос групп по id чтобы проверить закрыта она или нет
  async checkIsClosedGroup(code) {
    const access = process.env['ACCESS_TOKEN']
    const versionVk = process.env['VERSION_VK']

    try {
      const { data } = await firstValueFrom(
          this.httpService
              .get<any>(`https://api.vk.com/method/execute?code=${encodeURIComponent(code)}&access_token=${access}&v=${versionVk}`,)
              .pipe(
                  catchError((error: AxiosError) => {
                    if (error.response && 'data' in error.response && error.response.data != undefined) {
                      // this.loggerError(error.response.data)
                      // this.logger.error(error.response.data);
                    }
                    console.log(error)
                    throw 'An error happened!'
                  }),
              ),
      )

      if (!data) {
        this.logsServicePostsAdd.log(`запрос не успешный для ${code}`);
      }

      return data

    } catch (err) {
      // console.log((err))
      await this.logsServicePostsAdd.log(
          `ошибка получения постов в группе проверяем ids ${new Date().toTimeString()}`,
      )
      throw new HttpException(
          'Ошибка при получении групп вк',
          HttpStatus.FORBIDDEN,
      )
    }
  }
  // есть ли посты в общем репозитории по искомой группе перед формированием запросов
  async hasPosts(group) {
    // console.log(group)
    const latestPostsDates = await this.getLatestPostByIdForThisGroup(
        group.idVk,
    )
    return latestPostsDates != null
  }
  // ===================================================================================================================

  // КАТЕГОРИИ ОСТАЛЬНЫЕ
  // ЕСЛИ НЕТ ПОСТОВ В РЕПОЗИТОРИИ
  async createPostsToOthersRepository(id:number){
    try {

      const categories = [
        { id: 1, name: 'Для репетиторов', service: this.tutorService },
        { id: 2, name: 'Поиск домашнего персонала', service: this.nanniesService },
        // { id: 3, name: 'Покупка, аренда недвижимости' },
        // { id: 4, name: 'Для мастеров на все руки' },
        // { id: 5, name: 'Перевозки' },
        // { id: 6, name: 'IT/WEB' },
        // { id: 7, name: 'Фото и видеомонтаж' },
        // { id: 8, name: 'SEO' },
        // { id: 9, name: 'Ищут удаленную работу' },
        // { id: 10, name: 'Для дизайнеров ' },
      ];

      const category = await this.categoriesService.findById_category(id)
      const categoryInfo = categories.find((cat) => cat.id === category.id); // находим конеретно по которой нужно искать

      const positiveWords = category.positiveWords;
      const negativeWords = category.negativeWords;


        for (let i = 1; i < Infinity; i++) {

          const startPage = {
            limit: 50,
            page: i,
          };

          const posts = await this.getPaginationAll(startPage)
          if (!posts || !posts?.data || !posts?.data.length) break;

          await Promise.all(
              posts.data.map(async (post) => {

                if (categoryInfo && categoryInfo.service) {
                  const isSamePost = await categoryInfo.service.getPostById(post.post_id);
                  if (isSamePost) return;

                  const filter = await this.filterOnePostForOthersRepositories(post, positiveWords, negativeWords, 2);
                  if (filter) await categoryInfo.service.createIfEmpty(posts)
                }
              }),
          )
        }
    } catch (err) {
      await this.logsServiceNanniesAdd.error(`Функция проверки и получению постов с вк - ошибка`, `${err}`,)
    }
  }
  // проверяем
  async addNewPostToOtherRepositories(item, groupInfo, profilesInfo, sendMessage, category, telegramLimiter) {

    try {

    // токен бота
    const tokenBot = process.env['TOKEN_BOT']

    const categories = [
      { id: 1, name: 'Для репетиторов', service: this.tutorService },
      { id: 2, name: 'Поиск домашнего персонала', service: this.nanniesService },
      // { id: 3, name: 'Покупка, аренда недвижимости' },
      // { id: 4, name: 'Для мастеров на все руки' },
      // { id: 5, name: 'Перевозки' },
      // { id: 6, name: 'IT/WEB' },
      // { id: 7, name: 'Фото и видеомонтаж' },
      // { id: 8, name: 'SEO' },
      // { id: 9, name: 'Ищут удаленную работу' },
      // { id: 10, name: 'Для дизайнеров ' },
    ];

    const categoryInfo = categories.find((cat) => cat.id === category.id);
    // if(!categoryInfo) this.logsServicePostsAdd.error(`не найдена категория`, `${category}`,)

    if (categoryInfo) {
      if (categoryInfo.service) {
        const isSamePost = await categoryInfo.service.getPostById(item.id);
        if (isSamePost) return;
      }

    let positiveWords = await category.positiveWords;
    const negativeWords = await category.negativeWords;

    const filter = await this.filterOnePostForOthersRepositories(item, positiveWords, negativeWords, 1);
      if (filter) {
      await categoryInfo.service?.createFromVkDataBase(item, groupInfo, profilesInfo, 'vk', sendMessage, tokenBot, telegramLimiter);
      }
    }

    } catch (err) {
      await this.logsServiceNanniesAdd.error(`addNewPostToOtherRepositories - ошибка`, `${err}`,)
    }
  }
  async filterOnePostForOthersRepositories(post, positiveKeywords, negativeKeywords, indicator) {

    try {

      let postText;

      if (indicator == 1 ) postText = post.text.toLowerCase()
      if (indicator == 2 ) postText = post.post_text.toLowerCase()

        const containsPositiveKeyword = positiveKeywords.some((keyword) =>
            postText.includes(keyword),
        )
        const containsNegativeKeyword = negativeKeywords.some((keyword) =>
            postText.includes(keyword),
        )
        return containsPositiveKeyword && !containsNegativeKeyword

    } catch (err) {
      console.log(`filterOnePostForOthersRepositories ${err}`)
    }
  }



  // ===================================================================================================================
  // ТЕЛЕГРАММ
  async processСhatsTg(indicator) {

    try {

      // // this.logsServicePostsAdd.log(`старт  для ${chats}`)
      // // получем сессионый ключ
      const savedSessionString = process.env['TELEGRAM_SESSION_STRING']
      // // apiId приложения
      const apiId = +process.env['API_ID']
      // // apiHash приложения
      const apiHash = process.env['API_HASH']
      // // получем сессионый ключ в переменную
      const session = new StringSession(savedSessionString || '') // You should put your string session here
      const client = new TelegramClient(session, apiId, apiHash, {})

      await client.connect()

      const currentDate = new Date();
      const firstDayOfCurrentMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const firstDayOfLastMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);

      const minDate = Math.floor(firstDayOfLastMonth.getTime() / 1000);
      const maxDate = Math.floor(firstDayOfCurrentMonth.getTime() / 1000) - 1; // Последний день предыдущего месяца

      let nextRate = 0;
      let userName = 'Kristina3245'
      for (let i = 0; i < 3; i++) {

        const result  = await limiterTwo.schedule(() =>client.invoke(
            new Api.messages.SearchGlobal({
              q: "посоветуйте репетитора",
              filter: new Api.InputMessagesFilterEmpty(),
              minDate: Math.floor(Date.now() / 1000),
              maxDate: Math.floor(Date.now() / 1000),
              offsetRate: 0,
              offsetPeer: userName,
              offsetId: 100,
              limit: 2,
            })))

        if (!result) {
          console.log( 'no res')
          continue
        }

        // получаем непосредственно сообщения
        const messagesArray = result['messages']
        if (!messagesArray) {
          console.log('no message')
          continue
        }
          // nextRate = message.nextRate
        // console.log(result.nextRate)
        // nextRate = result.nextRate

        const chats = result['chats']
          if (!chats) {
            console.log(  'no chats')
            continue
          }
          const users = result['users']
          if (!users) {
            console.log(  'no users')
            continue
          }
        messagesArray.forEach(message => {
        // Находим соответствующий чат и пользователя
        const chat = chats.find(chat => chat?.id?.value === message?.peerId?.channelId?.value);
        const user = users.find(user => user?.id?.value === message?.fromId?.userId?.value);
          // userName = user.username;
          console.log(chats)
        // console.log(startPage)
        // Если чат или пользователь не найдены, пропускаем это сообщение
        //
        // console.log(message?.id)
        // console.log(new Date(message.date * 1000))
        //
        // const obj = {
        //   identification_post: 'tg',  // оставляем как есть
        //   id_group: chat?.id?.value.toString(),
        //   name_group: chat?.title,
        //   city_group: '',  // информация о городе и стране группы не предоставлена
        //   country_group: '',
        //   photo_100_group: chat?.photo?.photoId?.value?.toString() || '',
        //   first_name_user: user?.firstName,
        //   last_name_user: user?.lastName || '',
        //   city_user: '',  // информация о городе и стране пользователя не предоставлена
        //   country_user: '',
        //   photo_100_user: user?.photo ? user?.photo?.photoId?.value?.toString() : '',
        //   post_id: message?.id?.toString(),
        //   post_owner_id: chat?.id?.value?.toString(),
        //   post_fromId: user?.id?.value?.toString(),
        //   post_date_publish: message?.date,
        //   post_text: message?.message,
        //   post_type: 'Message',
        //   signer_id: user?.id?.value?.toString(),
        //   username_tg: user?.username,
        //   chatUsername:chat?.username,
        // };

        // const userLink = user.username ? `https://t.me/${user.username}` : 'Профиль пользователя недоступен';
        // const messageLink = chat.username ? `https://t.me/${chat.username}/${message.id.value}` : 'Ссылка на сообщение недоступна';

        });
      }








      this.logsServicePostsAdd.log(`ТГ ${new Date().toTimeString()} ${indicator == 1 ? 'ОБНОВЛЕНИЕ' : 'СОЗДАНИЕ'}`)
      this.logsServicePostsAdd.log(`получаем группы: ${new Date().toTimeString()}`);

      // получаем все чаты с репозитория в формате
      const chats = await this.chatsFromTelegramService.findAll()
      this.logsServicePostsAdd.log(`Завершение получения чатов: ${new Date().toTimeString()}, всего их ${chats.length}`);

      if (!chats || !chats?.length) {
        await this.logsServicePostsAdd.error(`ERROR - не получены чаты из БД`, `чаты не получены ******************************************************************* ШАГ №1 ERROR `)
        return
      }

      // пакет для основных
      let mainBatchSize = 25
      let allPromises = []

      for (let i = 0; i < chats.length; i += mainBatchSize) {
        this.logsServicePostsAdd.log(`приступаю к обработке главного пакета чатов № ${i} из ${mainBatchSize} групп`)
        allPromises.push(this.processMainBatchTg(chats.slice(i, i + mainBatchSize), indicator));
      }

      this.logsServicePostsAdd.log(`Завершение обработки групп: ${new Date().toTimeString()}`);

    }  catch(err) {
      console.log(err)
      await this.logsServicePostsAdd.error(`ERROR - ${err.message}`, `Ошибка на ШАГЕ №1: ${err.stack}`);
    }
  }
  // вспомогательная к 1й функции ТГ
  async processMainBatchTg(chats, indicator) {
    try {

      // делим на более мелкие пакеты по 10 и 25 групп в каждом, ограничение по мб от вк
      let batchSize;
      if (indicator == 1) batchSize = 3 // для создания  - т.е. когда ее нет, только добавили
      if (indicator == 2) batchSize = 5 // если требуется только обновить

      // массив для групп, в котором будут группы после фильтрации. Если indicator = 1, то будут группы, постов которых нет в базе и наоборот
      let chatsForNextFunction = []
      // чаты постов которых нет в бд

      if (indicator == 1) {
        chatsForNextFunction = await Promise.all(
            chats.map(async (chat) => {
              return (await this.hasMessageTg(chat)) ? null : chat
            }),
        ).then((results) => results.filter((result) => result != null))
      }
      // чаты посты которых есть в бд
      if (indicator == 2) {
        chatsForNextFunction = await Promise.all(
            chats.map(async (chat) => {
              return (await this.hasMessageTg(chat)) ? chat : null
            }),
        ).then((results) => results.filter((result) => result != null))
      }

      if (!chatsForNextFunction || !chatsForNextFunction.length) {
        await this.logsServicePostsAdd.error(`ERROR - после фильтрации на первом шаге нет чатов ${chatsForNextFunction.length}, открытые`, `ШАГ №1 ERROR `)
        return
      }

      for (let u = 0; u < chatsForNextFunction.length; u += batchSize) {
        this.logsServicePostsAdd.log(`Обработка пакета ${u / batchSize + 1} из ${Math.ceil(chatsForNextFunction.length / batchSize)}`);
        const chatBatch = chatsForNextFunction.slice(u, u + batchSize)
        this.addChatsToCommonOrUpdate(chatBatch, indicator,)
      }

      this.logsServicePostsAdd.log(`Найдено ${chatsForNextFunction.length} групп после фильтрации.`);

    } catch (err) {
      await this.logsServicePostsAdd.error(`Функция cnfhnjdfz получению постов с вк - ошибка  ***************************************************** ШАГ №1 ERROR,`, `${err}`,)
    }
  }

  // ТГ
  async addChatsToCommonOrUpdate(chatBatch, indicator) {

    try {
      this.logsServicePostsAdd.log(`indicator addPostsToCommonOrUpdate ${indicator}`,)

      let numberMessage;
      if (indicator == 1) numberMessage = 20; // 100
      if (indicator == 2) numberMessage = 10; // 10
      let numberOffset = 0;
      // все группы для старта, проверки и от сюда будем удалять те которые не прошли по датам
      let allGroups = chatBatch;
      let filterGroups = []

      // запускаем цикл пока allGroup не будет пустым
      for (let i = 0; i <= Infinity; i++) {
        console.log(`запрос ыыы ${i}`)
        this.logsServicePostsAdd.log(`ВХОД В ЦИКЛ -------------------------------------------------------------------- ${i} `,)
        this.logsServicePostsAdd.log(`не прошли ${filterGroups}`)

        filterGroups = await this.filterChats(allGroups, indicator, numberMessage, numberOffset)

        // если есть id групп которые не прошли по датам то фильтруем
        if (filterGroups && filterGroups.length) {
          //получаем все группы с предыдущего раза
          const forFilter = allGroups
          // получаем то что остается

          const groupsForNest = allGroups.filter((chat) => {
            const result = !filterGroups.includes(Number(chat.id))
            return result
          })

          // обновили весь массив то с чем работаем
          allGroups = groupsForNest
        }

        this.logsServicePostsAdd.log(` после ${allGroups}`)

        if (!allGroups || !allGroups?.length) {
          this.logsServicePostsAdd.log(` осталось ${allGroups}`)
          this.logsServicePostsAdd.log(`уже внутри цикла allFroups = 0 ********************************************************************************`,)
          break
        }
        numberOffset += +numberMessage // увеличиваем офсет
        // формируем запрос на сл посты в вк

      }

    } catch (err) {
      this.logsServicePostsAdd.error(`error`, `ошибка где входы в цикл: ${err}`);
    }

  }
  // тг
  async filterChats (allGroups, indicator, numberMessage, numberOffset) {

    try {

      let remainingGroups = []

      if (indicator == 1) {
        this.logsServicePostsAdd.log(` идем по кругу № 1`)
        remainingGroups = await this.forFuncfilterChatsIfCreate(allGroups, numberMessage, numberOffset, indicator)
      } else if (indicator == 2) {
        this.logsServicePostsAdd.log(` идем по кругу № 2`)
        // remainingGroups = await this.forFuncfilterChatsIfUpdate(allGroups, numberMessage,numberOffset, indicator)
      } else {
        this.logsServicePostsAdd.error(`error`, `Unexpected indicator value: ${indicator}`);
      }

      return remainingGroups

    }catch (err) {
      this.logsServicePostsAdd.error(`error`, `ошибка в разветвлении: ${err}`);
    }
  }
  async forFuncfilterChatsIfCreate(chats, numberMessage, numberOffset, indicator) {


    try {
      // this.logsServicePostsAdd.log(`старт  для ${chats}`)
      // получем сессионый ключ
      const savedSessionString = process.env['TELEGRAM_SESSION_STRING']
      // apiId приложения
      const apiId = +process.env['API_ID']
      // apiHash приложения
      const apiHash = process.env['API_HASH']
      // получем сессионый ключ в переменную
      const session = new StringSession(savedSessionString || '') // You should put your string session here
      const client = new TelegramClient(session, apiId, apiHash, {})

      try {
        await client.connect()
      } catch (error) {
        console.error('Error connecting to Telegram:', error)
      }

      const currentMonth = new Date().getMonth() // текущий месяц
      const searchFromCurrentMonth = currentMonth - 1 // месяц до которого будем проссматривать все посты с каждой группы
      const sendMessage = false

      const remainingGroups = [] // Массив для хранения групп, которые были прерваны, не прошли по датам
      // получение сообщений с чата

      let old = 0;

      for (let chat of chats) {

        // this.logsServicePostsAdd.log(`старт цикла для ${chat}`)

        const result = await limiterTwo.schedule(() => client.invoke(
            new Api.messages.GetHistory({
              peer: `${chat.chatName}`,
              limit: 25,
              offsetId: +numberOffset,
            }),
        ))
        // console.log(result)

        // получаем непосредственно сообщения
        const messagesArray = result['messages']

        // сли сообщений нет то пропускаем и ставим метку true
        if (!messagesArray) {
          await this.logsServicePostsAdd.error(`ERROR - пропуск чата, т.к. не получены сообщения ${chat.chatName} номер группы в списке`, ``)
          break
        }

        // console.log(messagesArray) // тут я вижу что длина 20

        const group = await limiterTwo.schedule(() => client.invoke(new Api.channels.GetFullChannel({channel: `${chat.chatName}`})))

        for (const item of messagesArray) {
          if(item?.className == 'MessageService') continue
          if (!item?.message || (item?.message?.length <= 6)) continue

          console.log(new Date(item.date * 1000).getMonth())
          // console.log(item?.message)


          this.logsServicePostsAdd.log(`${new Date(item.date * 1000).getMonth()} для ${chat.chatName}`)

          if (new Date(item.date * 1000).getMonth() < searchFromCurrentMonth) {
            old +=1;
            if(old < 10) continue;
            if(old > 10) {
              remainingGroups.push(chat.chatName)
              console.log('break')
              break
            }

            this.logsServicePostsAdd.log(`не прошел для ${item.fromId}`)

          }
          if (new Date(item.date * 1000).getMonth() >= searchFromCurrentMonth) {

            // const profiles = await limiterTwo.schedule(() => client.invoke(new Api.users.GetFullUser({id: item.fromId?.userId,}),))
            // await this.createTg(item, group, profiles,indicator)
          }
        }

      }
      this.logsServicePostsAdd.log(`цикл завершен для ${chats}`)

      return remainingGroups

    }catch (err) {
      this.logsServicePostsAdd.error(`error`, `ошибка при фильтрации постов для создания: ${err}`);
    }
  }





  async hasMessageTg(chat) {
    const latestMessageDates = await this.getLatestPostByIdForThisGroup(
        `${chat.id}`,
    )
    return latestMessageDates != null
  }


  async sendPhoto(chatId, photoUrl, caption) {
    const tokenBot = process.env['TOKEN_BOT'];
    const apiUrl = `https://api.telegram.org/bot${tokenBot}/sendPhoto`;

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        chat_id: chatId,
        photo: photoUrl,
        caption: caption
      })
    });

    const data = await response.json();
  }
  async enterToTelegram() {
    console.log('s')
    try {
      const savedSessionString = process.env['TELEGRAM_SESSION_STRING']
      if (savedSessionString) return

      const apiId = 22974621
      const apiHash = 'b3af68b7b98ee02f1dbc42fcfdecf935'
      const stringSession = new StringSession('')

      const client = new TelegramClient(stringSession, apiId, apiHash, {
        connectionRetries: 5,
      })

      try {
        await client.start({
          phoneNumber: '+79292642644', // replace with your phone number
          password: async () => 'your-2fa-password', // replace with your 2FA password
          phoneCode: async () => await input.text('Code ?'), // keep this line if Telegram sends you a code
          onError: (err) => console.log(err),
        })

        const sessionString = client.session.save()
        console.log('Session string:', sessionString) // save this string securely for future use
      } catch (err) {
        console.log(err)
      } finally {
        await client.disconnect()
      }
    } catch (err) {
      console.log(err)
    }
  }
  async createAndCheckg(indicator) {
    try {
      // получем сессионый ключ
      const savedSessionString = process.env['TELEGRAM_SESSION_STRING']
      // apiId приложения
      const apiId = +process.env['API_ID']
      // apiHash приложения
      const apiHash = process.env['API_HASH']
      // получем сессионый ключ в переменную
      const session = new StringSession(savedSessionString || '') // You should put your string session here
      const client = new TelegramClient(session, apiId, apiHash, { connectionRetries: 5 })

      const initialState = { phoneNumber: '+79292642644', password: 'your-2fa-password', phoneCode: 'Code ?' } // Initialize component initial state

      // количество сообщений которое будет получено
      let numberPost = process.env['NUMBER_POST']
      // офсет при переборе сообщений
      const numberOffset = process.env['OFFSET_POST']
      // текущий месяц для поиска
      const currentMonth = new Date().getMonth()
      // месяц до которого ищем
      const searchFromCurrentMonth = currentMonth - 1

      try {
        await client.connect()
      } catch (error) {
        console.error('Error connecting to Telegram:', error)
      }

      // получаем все чаты телеграмма по которым будет производиться поиск
      const owner = await this.chatsFromTelegramService.findAll()

      // если их нет то прокидываем ошибку и завершаем выполнение функции
      if (!owner?.length) {
        // await this.logsServicePostsAdd.error(`ERROR - не получены группы из БД на шаге ${steps}`, ` const owner = await this.groupsFromVkService.findAll(indicator);`)
        return
      }

      // приступаем к перебору всех чатов
      for (let start = 0; start < owner.length; start++) {
        console.log(`start ${start}`)
        // если не получены посты то ставим true чтобы много запросов не было
        let counterPass = false
        // получение последнего самого свежего сообщения по имени чата с репозитория постов
        let getMessageInRepository
        // если сообщения есть то меняем количество записей на 10 для ускорения процесса получения постов
        if (getMessageInRepository) {
          numberPost = `10`
        }
        // начальный каунтре для перебора, потом как будут получены сообщения скорректируется
        let startCount = 70
        // начальный офсет = 0
        let startOffset = Number(numberOffset)
        // для учета итераций
        let iterationStep = 0
        let groups

        outer: for (let i = 0; i < startCount; i++) {
          console.log(`startOffset ${startOffset}`)
          // во время перебора если вдруг не получены сообщения, то сверху будет true и цикл не продожится (не будет получать постоянно 0 значения), цик прервется и начнется перебор другого чата
          if (counterPass) break

          iterationStep = i

          // получение сообщений с чата
          const result = await client.invoke(
              new Api.messages.GetHistory({
                peer: `${owner[start].chatName}`, // замените "username" на имя пользователя канала в Telegram
                limit: +numberPost, // количество сообщений, которые вы хотите получить
                offsetId: startOffset, // идентификатор сообщения для начала; установите в 0, чтобы начать с самого последнего сообщения
              }),
          )

          // получаем непосредственно сообщения
          const messagesArray = result['messages']
          // сли сообщений нет то пропускаем и ставим метку true
          if (!messagesArray) {
            counterPass = true
            // await this.logsServicePostsAdd.error(`ERROR - пропуск постов, т.к. не получены, группа ${owner[start].idVk} номер группы в списке №${start}`, `const posts = await this.getPostsFromVK( arrayLinks, owner, start, numberPost, startOffset, access, versionVk )`)
            continue
          }


          // if (!groups || !groups.length) {
          groups = await client.invoke(new Api.channels.GetFullChannel({channel: `${owner[start].chatName}`,}),)
          // }

          // if (!getMessageInRepository || !getMessageInRepository.length) {
          getMessageInRepository = await this.getLatestPostByIdForThisGroup(
              `${groups.chats[0]?.id || messagesArray[0].peerId.channelId}`,
          )
          // }

          // увеличиваем офсет для перебора сообщений
          startOffset += Number(numberPost)

          if (messagesArray.length > 0 && iterationStep === 0) {
            startCount = Math.ceil(result['count'] / Number(numberPost))
          }

          if (getMessageInRepository != undefined && getMessageInRepository) {
            for (const item of messagesArray) {
              if (iterationStep == 0) {
                if (new Date(item.date * 1000).getTime() < new Date(+getMessageInRepository.post_date_publish * 1000,).getTime()) {
                  continue
                } else if (new Date(item.date * 1000).getTime() > new Date(+getMessageInRepository.post_date_publish * 1000,).getTime()) {
                  const profiles = await client.invoke(new Api.users.GetFullUser({id: item.fromId.userId}))
                  await this.createTg(item, groups, profiles, indicator)
                }
              }
              if (iterationStep != 0) {
                if (new Date(item.date * 1000).getTime() < new Date(+getMessageInRepository.post_date_publish * 1000,).getTime()) {
                  break outer
                } else if (
                    new Date(item.date * 1000).getTime() > new Date(+getMessageInRepository.post_date_publish * 1000,).getTime()) {
                  const profiles = await client.invoke(new Api.users.GetFullUser({id: item.fromId.userId,}),)
                  await this.createTg(item, groups, profiles, indicator)
                }
              }
            }
          } else {
            for (const item of messagesArray) {
              console.log('00')
              if (iterationStep == 0) {
                if (new Date(item.date * 1000).getMonth() < searchFromCurrentMonth) {
                  continue
                } else if (new Date(item.date * 1000).getMonth() >= searchFromCurrentMonth) {
                  console.log('02')
                  const profiles = await client.invoke(new Api.users.GetFullUser({id: item.fromId?.userId,}),)
                  await this.createTg(item, groups,profiles,indicator)
                }
              }
              if (iterationStep != 0) {
                console.log('02')
                if (new Date(item.date * 1000).getMonth() < searchFromCurrentMonth) {
                  break outer
                } else if (
                    new Date(item.date * 1000).getMonth() >=
                    searchFromCurrentMonth
                ) {
                  const profiles = await client.invoke(
                      new Api.users.GetFullUser({
                        id: item.fromId.userId,
                      }),
                  )

                  await this.createTg(item, groups,profiles,indicator)
                }
              }
            }
          }
        }
      }
    } catch (err) {}
  }



  // ===============================================================

  // ТАК ДЛЯ ТЕСТИРОВАНИЯ
  async getPosts(start, end) {
    const access = process.env['ACCESS_TOKEN'] // токен доступа
    const versionVk = process.env['VERSION_VK'] // версия вк

    const count = 450

    let startGroups = start
    let endGroups = start + 450

    for (let i = start; i < 1000000000000000; i + count) {
      const result = []

      for (let i = startGroups; i <= endGroups; i++) {
        result.push(i)
      }

      try {
        const { data: groups } = await firstValueFrom(
            this.httpService
                .get<any>(
                    `https://api.vk.com/method/groups.getById?group_ids=${[
                      ...result,
                    ]}&fields=members_count,is_closed&access_token=${access}&v=${versionVk}`,
                )
                .pipe(
                    catchError((error: AxiosError) => {
                      if (
                          error.response &&
                          'data' in error.response &&
                          error.response.data != undefined
                      ) {
                        // this.loggerError(error.response.data)
                        // this.logger.error(error.response.data);
                      }
                      console.log(error)
                      throw 'An error happened!'
                    }),
                ),
        )

        for (const item of groups?.response?.groups) {
          console.log(item)
          console.log( item.name
              .toLowerCase()
              .includes(
                  'подслушано',
                  'барахолка',
                  'мамы',
                  'мамочки',
                  'объявления',
                  'доска объявлений',
              ))
          if (
              item.name
                  .toLowerCase()
                  .includes(
                      'подслушано',
                      'барахолка',
                      'мамы',
                      'мамочки',
                      'объявления',
                      'доска объявлений',
                  )
          ) {
            const idVk =   item.name
            const isSameGroup = await this.groupsFromVkService.findByIdVk(idVk)
            if (
                !isSameGroup &&
                item.members_count > 1500 &&
                item.is_closed != 1
            ) {
              // await this.groupsFromVkService.createThis(`-${item.id}`)
            }
          }
        }

        startGroups += 450
        endGroups += 450
      } catch (err) {
        console.log(err)
        throw new HttpException(
            'Ошибка при получении групп вк',
            HttpStatus.FORBIDDEN,
        )
      }
    }
  }
  async getAllSortedPostsTest(dto: any) {
    const keyCities = dto.cityWords?.word || []
    const keyWords = dto.keyWords?.word || []

    const queryBuilder = this.repository.createQueryBuilder('all')

    if (keyCities.length > 0) {
      queryBuilder
          .andWhere(
              new Brackets((qb) => {
                keyCities.forEach((city, index) => {
                  if (index === 0) {
                    qb.where(`LOWER(all.city_group) LIKE :city_group_${index}`, {
                      [`city_group_${index}`]: `%${city.toLowerCase()}%`,
                    })
                  } else {
                    qb.orWhere(`LOWER(all.city_group) LIKE :city_group_${index}`, {
                      [`city_group_${index}`]: `%${city.toLowerCase()}%`,
                    })
                  }
                })
              }),
          )
          .orWhere(
              new Brackets((qb) => {
                keyCities.forEach((city, index) => {
                  if (index === 0) {
                    qb.where(`LOWER(all.city_user) LIKE :city_user_${index}`, {
                      [`city_user_${index}`]: `%${city.toLowerCase()}%`,
                    })
                  } else {
                    qb.orWhere(`LOWER(all.city_user) LIKE :city_user_${index}`, {
                      [`city_user_${index}`]: `%${city.toLowerCase()}%`,
                    })
                  }
                })
              }),
          )
    }

    if (keyWords.length > 0) {
      queryBuilder.andWhere(
          new Brackets((qb) => {
            keyWords.forEach((keyword, index) => {
              if (index === 0) {
                qb.where('LOWER(all.post_text) LIKE :keyword_' + index, {
                  ['keyword_' + index]: `%${keyword.toLowerCase()}%`,
                })
              } else {
                qb.orWhere('LOWER(all.post_text) LIKE :keyword_' + index, {
                  ['keyword_' + index]: `%${keyword.toLowerCase()}%`,
                })
              }
            })
          }),
      )
    }

    const [result, total] = await queryBuilder
        .orderBy('all.post_date_publish', 'DESC')
        .skip((+dto.page - 1) * +dto.limit)
        .take(+dto.limit)
        .getManyAndCount()

    return {
      data: result,
      page: +dto.page,
      total,
      pageCount: Math.ceil(total / +dto.limit),
    }
  }
  async getAllTest(post_owner_id: string) {
    return await this.repository.find({
      where: {
        post_owner_id,
      },
      order: {
        post_date_publish: 'DESC', // Сортировка по дате в убывающем порядке (самые свежие в начале)
      },
    })
  }





  // async addName(start, end) {
  //
  //     try {
  //
  //       const groups = await this.groupsFromVkService.findAll()
  //       const groupIds = groups
  //           .map((group) => group.idVk.replace('-', ''))
  //           .join(',')
  //
  //       let batchSize = 450;
  //
  //       // тут начинаем делить и сразу передаем на обработку в функцию
  //       for (let i = 0; i < groups.length; i += batchSize) {
  //         const groupBatch = groupIds.slice(i, i + batchSize)
  //         this.nextAddName(groupBatch)
  //       }
  //
  //
  //     } catch (err) {
  //       console.log(err)
  //       throw new HttpException(
  //           'Ошибка при получении групп вк',
  //           HttpStatus.FORBIDDEN,
  //       )
  //     }
  //   }
  //
  //
  // async nextAddName(owner) {
  //   const access = process.env['ACCESS_TOKEN'] // токен доступа
  //   const versionVk = process.env['VERSION_VK'] // версия вк
  //
  //
  //   const { data: groups } = await firstValueFrom(
  //       this.httpService
  //           .get<any>(
  //               `https://api.vk.com/method/groups.getById?group_ids=${[
  //                 ...owner,
  //               ]}&fields=members_count,is_closed&access_token=${access}&v=${versionVk}`,
  //           )
  //           .pipe(
  //               catchError((error: AxiosError) => {
  //                 if (
  //                     error.response &&
  //                     'data' in error.response &&
  //                     error.response.data != undefined
  //                 ) {
  //                   // this.loggerError(error.response.data)
  //                   // this.logger.error(error.response.data);
  //                 }
  //                 console.log(error)
  //                 throw 'An error happened!'
  //               }),
  //           ),
  //   )
  //
  //
  //
  //   for (const item of groups?.response?.groups) {
  //     if (
  //         item.name
  //             .toLowerCase()
  //             .includes(
  //                 'подслушано',
  //                 'барахолка',
  //                 'мамы',
  //                 'мамочки',
  //                 'объявления',
  //                 'доска объявлений',
  //             )
  //     ) {
  //       const idVk = item.id
  //       const isSameGroup = await this.groupsFromVkService.findByIdVk(idVk)
  //       idVk.name = item.name
  //       if (
  //           !isSameGroup &&
  //           item.members_count > 1500 &&
  //           item.is_closed != 1
  //       ) {
  //         await this.groupsFromVkService.createThis(`-${item.id}`)
  //       }
  //     }
  //   }
  // }


  // analis Groups Steps

  async startSeparateGroups() {

    try {

      this.logsServicePostsAdd.log(`получаем группы: ${new Date().toTimeString()}`);

      // получаем все группы с репозитория
      const groups = await this.groupsFromVkService.findAll()
      this.logsServicePostsAdd.log(`Завершение получения групп: ${new Date().toTimeString()}, всего их ${groups.length}`);

      if (!groups || !groups?.length) {
        await this.logsServicePostsAdd.error(`ERROR - не получены группы из БД`, `groups не получены ******************************************************************* ШАГ №1 ERROR `)
        return
      }

      // пакет для основных
      let mainBatchSize = 300
      let allPromises = []
      // Разделение groupBatch на подгруппы по 450 групп

      for (let i = 0; i < groups.length; i += mainBatchSize) {
        this.logsServicePostsAdd.log(`приступаю к обработке главного пакета № ${i} из ${groups.length} групп`)
        allPromises.push(this.separateVkFirst(groups.slice(i, i + mainBatchSize)));
      }

      this.logsServicePostsAdd.log(`Завершение обработки групп: ${new Date().toTimeString()}`);

    }  catch(err) {
      await this.logsServicePostsAdd.error(`ERROR - ${err.message}`, `Ошибка на ШАГЕ №1: ${err.stack}`);
      return;
    }

  }

  async separateVkFirst(groups) {
    try {

      // делим на более мелкие пакеты по 10 и 25 групп в каждом, ограничение по мб от вк
      let batchSize = 25;

      // проверяем закрыты группы ели нет, подготавливаем все id в строку через запятые, формируем code для запроса и направляем
      this.logsServicePostsAdd.log(`проверяем на закрытость группы: ${new Date().toTimeString()}`);
      const groupIds = groups
          .map((group) => group.idVk.replace('-', ''))
          .join(',')
      this.logsServicePostsAdd.log(`закончил проверку на закрытость группы: ${new Date().toTimeString()}`);

      const code = `
            var groupInfo = API.groups.getById({group_ids: "${groupIds}", fields: "is_closed"});
            return { groupInfo: groupInfo };`

      this.logsServicePostsAdd.log(`код для запроса: ${code}`);
      // получаем инфу о группах
      const groupsInfo = await limiter.schedule(() => this.checkIsClosedGroup(code))

      console.log(groupsInfo)
      // тут будут закрытые
      const closedGroupIds = groupsInfo.response.groupInfo.groups
          .filter((group) => group.is_closed)
          .map((group) => `-${group.id}`)

      // помечаем их в бд
      this.groupsFromVkService.addInfoAboutClosedGroup(closedGroupIds)
      // Получаем открытые группы для дальнейшей обработки
      const openGroups = groups.filter(
          (group) => !closedGroupIds.includes(group.idVk),
      )

      this.logsServicePostsAdd.log(`Начало обработки групп: ${new Date().toTimeString()}, закрытых ${closedGroupIds ? closedGroupIds?.length : 0} открытых ${openGroups ? openGroups?.lengt : 0}`);

      if (!openGroups || !openGroups.length) {
        await this.logsServicePostsAdd.error(`ERROR - не найдено открытых групп, закрытые ${closedGroupIds} из ${groups}`, `groups не получены ********************************************************************* ШАГ №1 ERROR `)
        return
      }

      // массив для групп, в котором будут группы после фильтрации. Если indicator = 1, то будут группы, постов которых нет в базе и наоборот
      let groupsForNextFunction = []
      // группы постов которых нет в бд

      groupsForNextFunction = await Promise.all(
          openGroups.map(async (group) => {
            return (await this.hasPosts(group)) ? null : group
          }),
      ).then((results) => results.filter((result) => result != null))

      if (!groupsForNextFunction || !groupsForNextFunction.length) {
        await this.logsServicePostsAdd.error(`ERROR - после фильтрации на первом шаге нет групп ${groupsForNextFunction.length}, открытые ${openGroups.length}`, `ШАГ №1 ERROR `)
        return
      }

      for (let u = 0; u < groupsForNextFunction.length; u += batchSize) {
        this.logsServicePostsAdd.log(`Обработка пакета ${u / batchSize + 1} из ${Math.ceil(groupsForNextFunction.length / batchSize)}`);
        const groupBatch = groupsForNextFunction.slice(u, u + batchSize)
        this.separateVk(groupBatch)
      }

      this.logsServicePostsAdd.log(`Найдено ${groupsForNextFunction.length} групп после фильтрации.`);

    } catch (err) {
      await this.logsServicePostsAdd.error(`Функция cnfhnjdfz получению постов с вк - ошибка  ***************************************************** ШАГ №1 ERROR,`, `${err}`,)
    }
  }

  async separateVk(owner) {

    this.logsServicePostsAdd.log(`createAndCheckVk старт в ${new Date().toTimeString()}`)

    try {

      const IfPostsAreInRepository = `10` // если есть посты в нашем репозитории
      const numberOffset = process.env['OFFSET_POST'] // начальное смещение для получения постов, сначала 0

      if (!owner || !owner?.length) {
        await this.logsServicePostsAdd.error(`ERROR - не получены группы из БД`, ` с первого щага получил пустой owner - нет групп; *********************************************************** ШАГ №2 ERROR`,)
        return
      }
      // блок когда надо только обновить
      const prepereRequestIfPostsAreInRepository = [] // которые есть - запрашивать будем по 10 постов
      const partOfGroupsIfPostsAre = []
      // количество запрашиваемых постов
      let numberPost = `6`;


      this.logsServicePostsAdd.log(`выполняем перебор групп в ${new Date().toTimeString()}`)
      // перебираем все объекты в массиве и формируем переменную для отправки запроса на получение групп, а также разбиваем на группы
      await Promise.all(
          owner.map(async (group, index) => {
            const query = `var response${index} = API.wall.get({owner_id: ${group.idVk}, count: ${numberPost}, offset: ${numberOffset}, fields: "city,country,first_name_nom,photo_100", extended: 1});`
            // если есть дата и запущена функция обновления то
            prepereRequestIfPostsAreInRepository.push(query)
            partOfGroupsIfPostsAre.push(
                owner.find((item) => item.idVk === group.idVk),
            )
          }),
      )
      this.logsServicePostsAdd.log(`завершил перебор в ${new Date().toTimeString()}`)

      if (!prepereRequestIfPostsAreInRepository || !prepereRequestIfPostsAreInRepository.length) {
        await this.logsServicePostsAdd.error(`ERROR - не сформирован prepereRequestIfPostsAreInRepository, групп принято ${owner}`, `  ***************************************************** ШАГ №2 ERROR`,)
        return
      }

      const codeIfPostsYes = prepereRequestIfPostsAreInRepository.join('\n') + '\nreturn { ' + prepereRequestIfPostsAreInRepository.map((_, index) => `group${index}: response${index}`).join(', ') + ' };'
      this.logsServicePostsAdd.log(`update - ${codeIfPostsYes}`)
      if (codeIfPostsYes && codeIfPostsYes.length)
        this.separeteUpdate(codeIfPostsYes, IfPostsAreInRepository, numberOffset, partOfGroupsIfPostsAre)

    } catch (err) {
      await this.logsServicePostsAdd.error(`Функция проверки и получению постов с вк - ошибка  ***************************************************** ШАГ №2 ERROR,`, `${err}`,)
    }
  }
  // тут уже цикл с передачей в функциб добавления
  async separeteUpdate(postsForRequst, numberPost, numberOffset, owner) {

    try {

      this.logsServicePostsAdd.log(`indicator addPostsToCommonOrUpdate`,)

      let startOffset = +numberOffset // изнчально  офсет 0

      // получаем первые посты, 10 или 100 и проверяем вернулись ли что-то
      const posts = await limiter.schedule(() => this.getPostsFromVK(postsForRequst))

      // получаем группы с постами, профилями, и инфой о группе
      if (Object.keys(posts?.response).length === 0 || !posts) {
        this.logsServicePostsAdd.log(`на первом этапе не получены посты - останов *******************************************************************************`,)
        return
      }
      const finish = await this.separateFinishGroups(posts)
      this.logsServicePostsAdd.log(`прошли`,)

    } catch (err) {
      this.logsServicePostsAdd.error(`error`, `ошибка где входы в цикл: ${err}`);
    }

  }

  async separateFinishGroups(posts) {
    try {

      const currentMonth = new Date().getMonth() // текущий месяц
      const searchFromCurrentMonth = currentMonth -1 // месяц до которого будем проссматривать все посты с каждой группы
      const sendMessage = false

      const remainingGroups = [] // Массив для хранения групп, которые были прерваны, не прошли по датам

      for (const key in posts.response) {
        if (Object.prototype.hasOwnProperty.call(posts.response, key)) {
          const group = posts.response[key]
          if (!group) return
          for (let i = 0; i < group.items?.length; i++) {
            const item = group.items[i]
            if (new Date(item.date * 1000).getMonth() < searchFromCurrentMonth) {
              // если это с закрпа то
              if (item.is_pinned) {
                this.logsServicePostsAdd.log(`${i} ${item.owner_id} ${new Date(item.date * 1000,).getMonth()} ------------------------------------ ISPING ==== 1`)
                continue
              }
              // если не с закрепа то
              if (!item.is_pinned) {
                this.logsServicePostsAdd.log(`${i} ${item.owner_id} ${new Date(item.date * 1000,).getMonth()} ОБНОВА`)
                const group = await this.groupsFromVkService.findByIdVk(item.owner_id)
                this.logsServicePostsAdd.log(`${group}`)
                this.groupsFromVkService.deleteThis(group)
                this.logsServicePostsAdd.log(`${i} ${item.owner_id} ${new Date(item.date * 1000,).getMonth()} -------------------------------- BREAK-------------- 1`)
                break
              }
            }
            if (new Date(item.date * 1000).getMonth() >= searchFromCurrentMonth) {
              continue
            }
          }
        }
      }

      return remainingGroups

    }catch (err) {
      this.logsServicePostsAdd.error(`error`, `ошибка при фильтрации постов для создания: ${err}`);
    }
  }


}