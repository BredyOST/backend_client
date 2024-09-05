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

	async updateThis(id, group) {
		await this.repository.update(id, group)
	}
}
