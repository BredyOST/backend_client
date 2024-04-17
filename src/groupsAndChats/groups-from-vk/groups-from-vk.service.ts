import { HttpException, HttpStatus, Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { GroupsFromVkEntity } from './entities/groups-from-vk.entity'
import { Repository } from 'typeorm'
import { UsersService } from '../../users/users.service'
import * as process from 'process';
import {catchError, firstValueFrom} from "rxjs";
import {AxiosError} from "axios/index";
import {HttpService} from "@nestjs/axios";

@Injectable()
export class GroupsFromVkService {
	constructor(
		private usersService: UsersService,
		@InjectRepository(GroupsFromVkEntity)
		private repository: Repository<GroupsFromVkEntity>,
		private readonly httpService: HttpService,
	) { }

	async findByIdVk(idVk: string) {
		return this.repository.findOneBy({
			idVk,
		})
	}
	async findById(id: number) {
		return this.repository.findOneBy({
			id,
		})
	}
	async findAll() {
		return this.repository.find()
	}

	// ====================================================
	async getGroupsBatch(size,offset) {
		const groups = await this.repository.find({
			take: size,
			skip: offset,
			order: { id: 'ASC' },
		});
		return groups;
	}

	// ====================================================

	async create(id, dto) {
		try {
			const user = await this.usersService.findById(+id)
			if (!user) throw new HttpException('Пользователь не найден', HttpStatus.UNAUTHORIZED)
			if (!user.isMainAdmin) throw new HttpException('Не достаточно прав доступа', HttpStatus.UNAUTHORIZED)

			if (dto.identificator === 1) {
				const isSameGroup = await this.findByIdVk(dto.id_group)
				if (isSameGroup) throw new HttpException('Группа уже добавлена', HttpStatus.UNAUTHORIZED)
				await this.repository.save({
					idVk: dto.id_group,
				})

				return {
					text: 'Группа добавлена',
				}
			}

			if (dto.identificator === 2) {
				const isSameArray = []
				let indicatorAdd = false

				for (const item of dto.id_group) {
					const isSameGroup = await this.findByIdVk(item)

					if (isSameGroup) {
						isSameArray.push(item)
						continue
					} else {
						indicatorAdd = true
						await this.repository.save({
							idVk: item,
						})
					}
				}

				if (!isSameArray && indicatorAdd) {
					return { text: 'группы дабавлены' }
				} else if (isSameArray != undefined && isSameArray && isSameArray.length && indicatorAdd) {
					return { text: `группы добавлены кроме ${isSameArray}` }
				} else if (isSameArray != undefined && isSameArray && isSameArray.length && !indicatorAdd) {
					throw new HttpException('Группы уже добавлены', HttpStatus.UNAUTHORIZED)
				}
			}
		} catch (err) {
			if (err.response === 'Пользователь не найден') {
				throw err
			} else if (err.response === 'Не достаточно прав доступа') {
				throw err
			} else if (err.response === 'Группа уже добавлена') {
				throw err
			} else if (err.response === 'Группы уже добавлены') {
				throw err
			} else {
				throw new HttpException('Ошибка при создании группы', HttpStatus.FORBIDDEN)
			}
		}
	}
	async updateGroup(id, dto: { newIdVk: string; id: number }) {
		try {
			const user = await this.usersService.findById(+id)
			if (!user) throw new HttpException('Пользователь не найден', HttpStatus.UNAUTHORIZED)
			if (!user.isMainAdmin) throw new HttpException('Не достаточно прав доступа', HttpStatus.UNAUTHORIZED)

			const group = await this.findById(dto.id)
			if (!group) throw new HttpException('группа не найдена по id', HttpStatus.UNAUTHORIZED)
			if (group.idVk === dto.newIdVk) throw new HttpException('Передан тот же id', HttpStatus.UNAUTHORIZED)

			group.idVk = dto.newIdVk
			await this.repository.update(dto.id, group)

			return {
				text: 'id группы изменено',
			}
		} catch (err) {
			if (err.response === 'Пользователь не найден') {
				throw err
			} else if (err.response === 'Не достаточно прав доступа') {
				throw err
			} else if (err.response === 'группа не найдена по id') {
				throw err
			} else if (err.response === 'Передан тот же id') {
				throw err
			} else {
				throw new HttpException('Ошибка при обновлении', HttpStatus.FORBIDDEN)
			}
		}
	}
	async deleteGroup(id, dto: { id: number }) {
		try {
			const user = await this.usersService.findById(+id)
			if (!user) throw new HttpException('Пользователь не найден', HttpStatus.UNAUTHORIZED)
			if (!user.isMainAdmin) throw new HttpException('Не достаточно прав доступа', HttpStatus.UNAUTHORIZED)

			const group = await this.findById(dto.id)
			if (!group) throw new HttpException('Группа не найдена по id', HttpStatus.UNAUTHORIZED)
			await this.repository.delete(dto.id)

			return {
				text: 'группа удалена',
			}
		} catch (err) {
			if (err.response === 'Пользователь не найден') {
				throw err
			} else if (err.response === 'Не достаточно прав доступа') {
				throw err
			} else if (err.response === 'Группа не найдена по id') {
				throw err
			} else {
				throw new HttpException('Ошибка при обновлении', HttpStatus.FORBIDDEN)
			}
		}
	}
	async addInfoAboutClosedGroup(groups) {
		await Promise.all(groups.map(async (item) => {
			const group = await this.findByIdVk(item);
			if (group) {
				group.isClosed = true;
				await this.repository.update(group.id, group);
			}
		}));
	}

	async addPostCounter(count: number, date: Date, idVk: string) {

		try {

			const group = await this.findByIdVk(idVk)

			if (!group) return

			let shouldUpdate = false // Флаг, указывающий, нужно ли обновлять запись в базе данных

			// Обновляем количество постов, если переданное значение отличается от текущего или текущего значения нет
			if (!group.postsCounter || (count && group.postsCounter !== count)) {
				group.postsCounter = count
				shouldUpdate = true
			}
			const dateObject = new Date(date);
			// Обновляем дату последнего поста, если переданная дата более свежая или текущей даты нет
			if (!group.postsLastDate || (date && group.postsLastDate.getTime() < dateObject.getTime())) {
				group.postsLastDate = date
				shouldUpdate = true
			}

			// Обновляем запись в базе данных, если были внесены изменения
			if (shouldUpdate) {
				await this.repository.update(group.id, group)
			}
		} catch (err) {
			console.log(err)
		}

	}

	async addPostDateWhenUpdate(count: number, date: Date, idVk: string, groupInfo) {

		// const group = await this.findByIdVk(idVk)
		if (!groupInfo) return

		let shouldUpdate = false // Флаг, указывающий, нужно ли обновлять запись в базе данных

		// Обновляем количество постов, если переданное значение отличается от текущего или текущего значения нет
		if (!groupInfo.postsCounter || (count && groupInfo.postsCounter !== count)) {
			groupInfo.postsCounter = count
			shouldUpdate = true
		}
		const dateObject = new Date(date);
		const groupInfoDate = new Date(groupInfo.postsDateWhenUpdate);
		// Обновляем дату последнего поста, если переданная дата более свежая или текущей даты нет
		if (!groupInfo.postsDateWhenUpdate || (date && groupInfoDate.getTime() < dateObject.getTime())) {
			groupInfo.postsDateWhenUpdate = date
			shouldUpdate = true
		}

		// Обновляем запись в базе данных, если были внесены изменения
		if (shouldUpdate) {
			this.repository.update(groupInfo.id, groupInfo)
		}

	}

	async changePostsDateToDateUpdateWhenBreak(info) {

		if (!info || !info?.postsDateWhenUpdate) return

		const postsLastDate = new Date(info.postsLastDate);
		const postsDateWhenUpdate = new Date(info.postsDateWhenUpdate);

		if(postsDateWhenUpdate > postsLastDate) {

			info.postsLastDate = info.postsDateWhenUpdate
			await this.repository.update(info.id, info)

		} else {
			return
		}
	}

	// для теста
	async createThis(id) {
		await this.repository.save({
			idVk: id,
		})
	}
	async updateThis(id, group) {
		await this.repository.update(id, group)
	}
	async deleteThis(group) {
		try {
			await this.repository.delete(group.id)
		} catch (err) {
			if (err.response === 'Пользователь не найден') {
				throw err
			} else if (err.response === 'Не достаточно прав доступа') {
				throw err
			} else if (err.response === 'Группа не найдена по id') {
				throw err
			} else {
				throw new HttpException('Ошибка при обновлении', HttpStatus.FORBIDDEN)
			}
		}
	}


	async getGroupsNew() {
		let start = 15370500
		let end = 15371000
		let resultArray = []
		let forIndex = 0;
		// формируем запрос на сл посты в вк
		const requestPosts = [];

		for (let i = 0; i <= 500000000000; i++) {
			forIndex = 0
			resultArray = []

			for(let  o = start; o <= end; o++) {
				resultArray.push(o)
			}

		const access = process.env['ACCESS_TOKEN'];
		const versionVk = process.env['VERSION_VK'];

		const groupIds = []

			try {

			const response = await firstValueFrom(
				this.httpService.get<any>(`https://api.vk.com/method/groups.getById?group_ids=${resultArray}&access_token=${access}&fields=name,members_count,is_closed,deactivated,counters&v=${versionVk}`,
				)
					.pipe(
						catchError((error: AxiosError) => {
							if (error.response && 'data' in error.response && error.response.data != undefined) {}
							throw new Error(`${error}`);
						}),
					),
			);

			start += 500;
			end += 500;
			console.log(end)
			const data = response?.data;

			for (let index = 0; index < response?.data?.response?.groups.length; index++) {
				const item = response.data.response.groups[index];
				if (item.is_closed == 0 && item?.members_count >= 1000 && (item?.deactivated != 'deleted' || item?.deactivated != 'banned')) {
					if (item.name.includes(
						'жк' ||
						'недвижимост' ||
						'квартир' ||
						'риелтер' ||
						'район' ||
						'дом' ||
						'дачи' ||
						'строительств' ||
						'ремонт' ||
						'дизайн' ||
						'архитектур' ||
						'ищу' ||
						'без посредников' ||
						'аренд' ||
						'мам'
						// 'работа' ||
						// 'отзыв' ||
						// 'отзови' ||
						// 'город' ||
						// 'мамы' ||
						// 'шабашк' ||
						// 'школ' ||
						// 'куп' ||
						// 'продай' ||
						// 'женски' ||
						// 'объявле' ||
						// 'доска' ||
						// 'студент' ||
						// 'спроси' ||
						// 'совет' ||
						// 'репет' ||
						// 'ищу' ||
						// 'барахол' ||
						// 'женск' ||
						// 'подслушано' ||
						// 'первый' ||
						// 'наш' ||
						// 'проверено' ||
						// 'р-н' ||
						// 'мама' ||
						// 'сегодня' ||
						// 'мкр' ||
						// 'ЕГЭ' ||
						// 'ОГЭ' ||
						// 'сплетни' ||
						// 'район' ||
						// 'вакансии' ||
						// 'покуп' ||
						// 'книг' ||
						// 'krash' ||
						// 'беремен' ||
						// 'доск' ||
						// 'признавашк' ||
						// 'купи' ||
						// 'прода' ||
						// 'стукач' ||
						// 'мамин' ||
						// 'выбирает' ||
						// 'мам' ||
						// 'полезные контакты' ||
						// 'село' ||
						// 'деревн' ||
						// 'подслухано' ||
						// 'типичны' ||
						// 'жк' ||
						// 'поиск' ||
						// 'прод' ||
						// 'ищу' ||
						// 'найдись' ||
						// 'спрашивай' ||
						// 'дете'
					)) {
						const sameGroup = await this.findByIdVk(`-${item.id}`)
						if (!sameGroup) {
							await this.repository.save({
								idVk: `-${item.id}`,
							})
							const sameGroup = await this.findByIdVk(`-${item.id}`)
							sameGroup.name = item.name
							await this.repository.update(sameGroup.id, sameGroup)
						}

					}
				}
			}

				// // if (requestPosts.length >= 2) {
				//
				// 	const codeIfPostsNo =
				// 		requestPosts.join('\n') +
				// 		'\nreturn { ' +
				// 		requestPosts
				// 			.map((_, index) => `group${index}: response${index}`)
				// 			.join(', ') +
				// 		' };';
				//
				// 	console.log(codeIfPostsNo)
				// 	const result = await this.getPostsFromVK(codeIfPostsNo)
				// 	// console.log(result)
				// 	// return
				// // }
		} catch (err) {
			console.log(err)
		}
		}
	}
	// async getPostsFromVK(postsForRequest) {
	// 	const access = process.env['ACCESS_TOKEN'];
	// 	const versionVk = process.env['VERSION_VK'];
	// 	try {
	// 		const { data } = await firstValueFrom(
	// 			this.httpService.get<any>(`https://api.vk.com/method/execute?code=${postsForRequest}&access_token=${access}&v=${versionVk}`)
	// 				.pipe(
	// 					catchError((error: AxiosError) => {
	// 						if (
	// 							error.response &&
	// 							'data' in error.response &&
	// 							error.response.data != undefined
	// 						) {
	//
	// 						}
	// 						throw new Error(
	// 							`getPostsFromVK An error happened! ${data} для ${postsForRequest}`,
	// 						);
	// 					}),
	// 				),
	// 		);
	//
	// 		console.log(data)
	//
	// 		// очищаем ответ, удаляя лишнее
	// 		if (data?.response && typeof data.response === 'object') {
	// 			if ('execute_errors' in data.response) {
	// 				delete data.response.execute_errors;
	// 			}
	// 		}
	//
	// 		const filteredData = { response: {} };
	//
	// 		filteredData.response = Object.fromEntries(
	// 			Object.entries(data.response).filter(([key, value]: [string, any]) => {
	// 				return (
	// 					value !== false &&
	// 					(!value.count || value.count !== 0) &&
	// 					value.items &&
	// 					value.items.length > 0
	// 				);
	// 			}),
	// 		);
	// 		return filteredData;
	// 	} catch (err) {
	// 		console.log(err)
	// 	}
	// }




}
