import {
	Controller,
	Get,
	Post,
	Body,
	Patch,
	Delete,
	UseGuards,
	Request, Query,
} from '@nestjs/common'
import { GroupsFromVkService } from './groups-from-vk.service'

import { JwtAuthGuard } from '../../auth/guards/jwt.guard'
import { UserId } from '../../decorators/user-id.decorator'
import { SessionAuthService } from '../../auth/session-auth/session-auth.service'

@Controller('groups-from-vk')
export class GroupsFromVkController {
	constructor(
		private readonly groupsFromVkService: GroupsFromVkService,
		private readonly sessionAuthService: SessionAuthService,
	) { }

	@Post('/create')
	@UseGuards(JwtAuthGuard)
	async create(@UserId() id: number, @Body() dto: any, @Request() req) {
    const result = await this.sessionAuthService.validateSessionToken(req.session)
		if (!result) {
      return {
				text: 'Ваша сессия истекла, выполните повторный вход',
			}
		}
		return this.groupsFromVkService.create(id, dto)
	}

	@Get('/getAll')
	@UseGuards(JwtAuthGuard)
	async getGroups(@UserId() id: number, @Request() req) {
		const result = await this.sessionAuthService.validateSessionToken(
			req.session,
		)
		if (!result) {
			return {
				text: 'Ваша сессия истекла, выполните повторный вход',
			}
		}
		return this.groupsFromVkService.findAll()
	}

	@Patch('/update')
	@UseGuards(JwtAuthGuard)
	async updateGroup(@UserId() id: number, @Body() dto: { newIdVk: string; id: number }, @Request() req,) {
		const result = await this.sessionAuthService.validateSessionToken(
			req.session,
		)
		if (!result) {
			return {
				text: 'Ваша сессия истекла, выполните повторный вход',
			}
		}
		return this.groupsFromVkService.updateGroup(id, dto)
	}

	@Delete('/delete')
	@UseGuards(JwtAuthGuard)
	async deleteGroup(@UserId() id: number, @Body() dto: { id: number }, @Request() req,) {
		const result = await this.sessionAuthService.validateSessionToken(
			req.session,
		)
		if (!result) {
			return {
				text: 'Ваша сессия истекла, выполните повторный вход',
			}
		}
		return this.groupsFromVkService.deleteGroup(id, dto)
	}

	// для сторонних микросервисов
	@Get('/findAll')
	async findAll() {
		return this.groupsFromVkService.findAll()
	}

	@Get('/getPartOfGroup')
		async getGroupsBatch(@Query('size') size: string, @Query('offset') offset: string) {
		return this.groupsFromVkService.getGroupsBatch(size, offset)
	}

	// помечаем в базе данных информацию по закрытым группам
	@Post('/addInfoAboutClosedGroup')
	async addInfoAboutClosedGroup(@Body() body: { groups }) {
		return this.groupsFromVkService.addInfoAboutClosedGroup(body.groups);
	}

	@Post('/addPostCounter')
	async addPostCounter(@Body() body: { info }) {
		return this.groupsFromVkService.addPostCounter(body.info.count, body.info.date, body.info.idVk)
	}

	@Post('/findByIdVk')
	async findById(@Body() body: { id }) {
		return this.groupsFromVkService.findByIdVk(body.id)
	}

	@Post('/updateThis')
	async updateThis(@Body() body: { info }) {
		return this.groupsFromVkService.updateThis(body.info.id, body.info.group)
	}

	@Post('/changePostsDateToDateUpdateWhenBreak')
	async changePostsDateToDateUpdateWhenBreak(@Body() body: { info }) {
		return this.groupsFromVkService.changePostsDateToDateUpdateWhenBreak(body.info)
	}

	@Post('/addPostDateWhenUpdate')
	async addPostDateWhenUpdate(@Body() body: { info }) {
		return this.groupsFromVkService.addPostDateWhenUpdate(body.info.count, body.info.date, body.info.idVk, body.info.groupInfo)
	}
}
