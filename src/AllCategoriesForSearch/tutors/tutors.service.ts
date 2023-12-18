import { Injectable, Logger } from '@nestjs/common'
import { Brackets, Repository } from 'typeorm'
import { InjectRepository } from '@nestjs/typeorm'
import { HttpService } from '@nestjs/axios'
import {TutorEntity} from "./entities/tutor.entity";
import {AppService} from "../../app.service";
import {PaginationDto} from "./dto/pagination.dto";
import {CategoryStrategy} from "../ForGetPostsFromAll/ForGetPostsFromAll.service";
import {GroupsFromVkService} from "../../groupsAndChats/groups-from-vk/groups-from-vk.service";
import {catchError, firstValueFrom} from "rxjs";
import {AxiosError} from "axios/index";
import {LogsServiceAddTutors} from "../../otherServices/loggerService/logger.service";
import {RedisService} from "../../redis/redis.service";
import { reviveFromBase64Representation, replaceJsonWithBase64 } from '@neshca/json-replacer-reviver';

@Injectable()
export class TutorsService implements CategoryStrategy{
  private readonly logger = new Logger(AppService.name)

  constructor(
    private groupsFromVkService: GroupsFromVkService,
    @InjectRepository(TutorEntity)
    private repository: Repository<TutorEntity>,
    private readonly httpService: HttpService,
    private logsServiceTutorsAdd: LogsServiceAddTutors,
    private redisService: RedisService,
  ) {}

  // получаем последния пост из репозитория с сортировкой
  async getLatestPostById(post_owner_id: string) {
    const latestPost = await this.repository.findOne({
      where: {
        post_owner_id,
      },
      order: {
        post_date_publish: 'DESC', // Сортировка по дате в убывающем порядке (самые свежие в начале)
      },
    })
    return latestPost
  }
  // найти конкретный пост
  async getPostById(post_id) {
    return await this.repository.findOne({
      where: {
        post_id,
      },
    })
  }
  // найти посты для одной группы
  async getAllPostsByIdForOneGroup(post_owner_id: string) {
    return await this.repository.find({
      where: {
        post_owner_id,
      },
      order: {
        post_date_publish: 'DESC', // Сортировка по дате в убывающем порядке (самые свежие в начале)
      },
    })
  }
  // получить весь репозиторий
  async getAll() {
    const posts = await this.redisService.get('256be92d1ae670fa9e25d3f48bb803ac87859cbdab111acdaa001f9b92d68da5')
    if (posts && posts !== null) {
      return JSON.parse(posts).sort((a, b) => b.post_date_publish - a.post_date_publish);
    }
  }
  // получить посты при первичной сборке проекта
  async getPostForStatic() {
    const queryBuilder = this.repository.createQueryBuilder('posts');
    const sortedPosts = await queryBuilder
        .orderBy('posts.post_date_publish', 'DESC')
        .getMany();
    return sortedPosts;
  }

  async create(identificator, item) {
    return this.repository.save({
      identification_post: identificator,
      id_group: item.id_group,
      name_group: item.name_group || '',
      city_group: item.city_group || '',
      country_group: item.country_group || '',
      photo_100_group: item.photo_100_group || '',
      first_name_user: item.first_name_user || '',
      last_name_user: item.last_name_user || '',
      city_user: item.city_user || '',
      country_user: item.country_user || '',
      photo_100_user: item.photo_100_user || '',
      post_id: item.post_id,
      post_owner_id: item.post_owner_id,
      post_fromId: item.post_fromId,
      post_date_publish: item.post_date_publish,
      post_text: item.post_text,
      post_type: item.post_type,
      signer_id: item.signer_id || '',
    })
  }
  // создание для ВК
  async createFromVkDataBase(item, groups, profiles, identificator, sendMessage, tokenBot, telegramLimiter) {

    try {

    const ownerId = String(item.owner_id).replace('-', '')
    const groupInfo = groups?.find((element) => element.id == ownerId)
    const profileInfo = profiles?.find((element) => element.id == item.signer_id)

    if (sendMessage) this.sendPostToTelegram(item, tokenBot, telegramLimiter)

    return this.repository.save({
      identification_post: 'vk',
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
      console.log(err)
    }
  }

  async createIfEmpty(post) {

    const item = post;

    return this.repository.save({
      identification_post: 'vk',
      id_group: item.id_group,
      name_group: item.name_group || '',
      city_group: item.city_group || '',
      country_group: item.country_group || '',
      photo_100_group: item.photo_100_group || '',
      first_name_user: item.first_name_user || '',
      last_name_user: item.last_name_user || '',
      city_user: item.city_user || '',
      country_user: item.country_user || '',
      photo_100_user: item.photo_100_user || '',
      post_id: item.post_id,
      post_owner_id: item.post_owner_id,
      post_fromId: item.post_fromId,
      post_date_publish: item.post_date_publish,
      post_text: item.post_text,
      post_type: item.post_type,
      signer_id: item.signer_id || '',
    })
  }


  async sendPostToTelegram(item, tokenBot, telegramLimiter) {
    try {
    let chatId = `-1002097526611`;

    const messageLines = [
      `Дата публикации:`,
      `${new Date(item.date * 1000)}.`,
      `Текст поста:`,
      `${item.text}.`,
      (item.signer_id && !String(item.signer_id).includes('-') || item.from_id && !String(item.from_id).includes('-')) ? `Пользователя: https://vk.com/id${item.signer_id || item.from_id}.` : null,
      `Пост: https://vk.com/wall${item.owner_id}_${item.id}.`
    ];

    let imageUrl;  // Предполагая, что URL изображения хранится в свойстве photo_url объекта item
    if (item.text.includes('матем' || 'матан')) imageUrl = 'https://imgur.com/PrXMtZd'
    if (item.text.includes('биологи')) imageUrl = 'https://imgur.com/fRjItyY'
    if (item.text.includes('информат')) imageUrl = 'https://imgur.com/L3I8Sij'
    if (item.text.includes('испанс')) imageUrl = 'https://imgur.com/VmXerZE'
    if (item.text.includes('истори')) imageUrl = 'https://imgur.com/jDWSiC6'
    if (item.text.includes('китайс')) imageUrl = 'https://imgur.com/WZLfkp5'
    if (item.text.includes('литер')) imageUrl = 'https://imgur.com/m85lYjb'
    if (item.text.includes('немецк')) imageUrl = 'https://imgur.com/YEvmS2X'
    if (item.text.includes('обществ')) imageUrl = 'https://imgur.com/KcfzOf1'
    if (item.text.includes('русск')) imageUrl = 'https://imgur.com/JvTluSl'
    if (item.text.includes('физик')) imageUrl = 'https://imgur.com/w90mAsI'
    if (item.text.includes('англий')) imageUrl = 'https://imgur.com/6vXwpt2'

    let messageText;

    if (messageLines) {
      messageText = messageLines.filter(line => line !== null).join('\n');
    }

    if (messageLines) {
      await telegramLimiter.schedule(() => this.sendToChat(chatId, messageText, imageUrl,  tokenBot))
    }

    } catch (err) {
      this.logsServiceTutorsAdd.error(`Функция проверки и получению постов с вк - ошибка`, `${err}`,)
    }
  }

  async sendToChat(chatId: string, messageText: string, photoUrl: string, token: string) {
    try {

      let url;
      let dataToSend;

      if (photoUrl) {
        url = `https://api.telegram.org/bot${token}/sendPhoto`;
        dataToSend = {
          chat_id: chatId,
          caption: messageText,
          photo: photoUrl
        };
      } else {
        url = `https://api.telegram.org/bot${token}/sendMessage`;
        dataToSend = {
          chat_id: chatId,
          text: messageText
        };
      }

      const {data} = await firstValueFrom(
          this.httpService.post<any>(
              url,
              dataToSend
          ).pipe(
              catchError((error: AxiosError) => {
                if (error.response && 'data' in error.response && error.response.data != undefined) {
                  // this.loggerError(error.response.data)
                  // this.logger.error(error.response.data);
                  console.log(error)
                  this.logsServiceTutorsAdd.error(`Функция проверки и получению постов с вк - ошибка`, `${error}`,)
                }
                this.logsServiceTutorsAdd.error(`Функция проверки и получению постов с вк - ошибка`, `${error}`,)
                throw 'An error happened!'
              }),
          ),
      );
    } catch (err) {
      // console.log(err)
    }
  }




  // отдать клиенту на фронтенд сортированный список
  async getAllSortedPosts(dto: PaginationDto) {

    if (dto.category != 13) {
      return
    }

    const keyCities = dto.cityWords?.word || []
    const keyWords = dto.keyWords?.word || []

    const queryBuilder = this.repository.createQueryBuilder('posts')

    if (keyCities.length > 0) {
      queryBuilder
          .andWhere(
              new Brackets((qb) => {
                keyCities.forEach((city, index) => {
                  if (index === 0) {
                    qb.where(`LOWER(posts.city_group) LIKE :city_group_${index}`, {
                      [`city_group_${index}`]: `%${city.toLowerCase()}%`,
                    })
                  } else {
                    qb.orWhere(`LOWER(posts.city_group) LIKE :city_group_${index}`, {
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
                    qb.where(`LOWER(posts.city_user) LIKE :city_user_${index}`, {
                      [`city_user_${index}`]: `%${city.toLowerCase()}%`,
                    })
                  } else {
                    qb.orWhere(`LOWER(posts.city_user) LIKE :city_user_${index}`, {
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
                qb.where('LOWER(posts.post_text) LIKE :keyword_' + index, {
                  ['keyword_' + index]: `%${keyword.toLowerCase()}%`,
                })
              } else {
                qb.orWhere('LOWER(posts.post_text) LIKE :keyword_' + index, {
                  ['keyword_' + index]: `%${keyword.toLowerCase()}%`,
                })
              }
            })
          }),
      )
    }

    const [result, total] = await queryBuilder
        .orderBy('posts.post_date_publish', 'DESC')
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
}
