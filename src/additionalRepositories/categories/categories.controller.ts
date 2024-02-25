import { Controller, Get, Post, Body, Patch, Delete, UseGuards, Request } from '@nestjs/common'
import { CategoriesService } from './categories.service'
import { ApiTags } from '@nestjs/swagger'
import { JwtAuthGuard } from '../../auth/guards/jwt.guard'
import { UserId } from '../../decorators/user-id.decorator'
import { CategoryEntity } from './entities/category.entity'
import { SessionAuthService } from '../../auth/session-auth/session-auth.service'


export type category = {
	id: number
	id_category: string
	name: string
	description: string
	positiveWords: string[]
	negativeWords: string[]
	salary:string
}

export type PaymentNotificationDto = {
	type: string;
	event: string;
	object: {
		id: string;
		status: string;
		paid: boolean;
		amount: {
			value: string;
			currency: string;
		};
		authorization_details: {
			rrn: string;
			auth_code: string;
			three_d_secure: {
				applied: boolean;
			};
		};
		created_at: string;
		description: string;
		expires_at: string;
		metadata: any;
		payment_method: {
			type: string;
			id: string;
			saved: boolean;
			card: {
				first6: string;
				last4: string;
				expiry_month: string;
				expiry_year: string;
				card_type: string;
				issuer_country: string;
				issuer_name: string;
			};
			title: string;
		};
		refundable: boolean;
		test: boolean;
	};
}



@Controller('categories')
@ApiTags('categories')
export class CategoriesController {
	constructor(
		private readonly categoriesService: CategoriesService,
		private readonly sessionAuthService: SessionAuthService,

	) { }

	// СОЗДАНИЕ КАТЕГОРИИ
	@Post('/create')
	@UseGuards(JwtAuthGuard)
	async createCategory(@UserId() id: number, @Body() dto: CategoryEntity) {
		return this.categoriesService.createCategory(id, dto)
	}

	// ОБНОВЛЕНИЕ КАТЕГОРИИ
	@Patch('/update')
	@UseGuards(JwtAuthGuard)
	async updateCategory(@UserId() id: number, @Body() dto: category) {
		return this.categoriesService.updateCategory(id, dto)
	}

	// УДАЛЕНИЕ КАТЕГОРИИ
	@Delete('/delete')
	@UseGuards(JwtAuthGuard)
	async deleteCategory(@UserId() id: number, @Body() dto: { id: number }) {
		return this.categoriesService.deleteCategory(id, dto)
	}

	// ПОЛУЧИТЬ ВСЕ КАТЕГОРИИ
	// @Get('/getAllAuth')
	// @UseGuards(JwtAuthGuard)
	// async getAllCategories(@UserId() id: number) {
	//   return this.categoriesService.getAllCategories(id);
	// }

	// ПОЛУЧИТЬ ОДНУ КАТЕГОРИЮ
	@Get('/getOne')
	@UseGuards(JwtAuthGuard)
	async getOneCategory(@UserId() id: number, dto: { id: number }) {
		return this.categoriesService.getOneCategory(id, dto)
	}

	// работа с пользователем
	@Post('/freePeriod')
	@UseGuards(JwtAuthGuard)
  async activateFreePeriod(@UserId() id: number, @Request() req, @Body() dto: number) {
		// передаем параметр запроса, который мы добавили при проверке в мидлваре а именно токен
    const result = await this.sessionAuthService.validateSessionToken(req.session)
		// если возвращается false то сессия истекла
		if (!result) {
			return {
        text: 'Ваша сессия истекла, выполните повторный вход',
      }
		}
		return this.categoriesService.activateFreePeriod(id, dto)
	}

	@Post('/payment')
	@UseGuards(JwtAuthGuard)
	async payment(@UserId() id: number, @Request() req, @Body() dto: any) {
		// передаем параметр запроса, который мы добавили при проверке в мидлваре а именно токен
		const result = await this.sessionAuthService.validateSessionToken(req.session)
		// если возвращается false то сессия истекла
		if (!result) {
			return {
				text: 'Ваша сессия истекла, выполните повторный вход',
			}
		}
		const link =  await this.categoriesService.createPay(id, dto)
		return { url: `${link}` };
	}

	// получить категорию по id
	@Get('/findById')
	async findById(id: number) {
		return this.categoriesService.findById_category(id)
	}

	// для сторонних микросервисов
	// получить все категории
	@Get('/getAll')
	async getAllCategories() {
		return this.categoriesService.getAllCategories()
	}

	@Post('/findByIdOther')
	async findByIdOther(@Body() body: { id: number }) {
		const { id } = body;
		return this.categoriesService.findById_category(id);
	}
	@Get('/getPayment')
	async getPayment() {
		return this.categoriesService.getPayment('2d6beb3d-000f-5000-9000-1a4686d97366');
	}

	// @Get('/capturePayment')
	// async capturePayment() {
	// 	return this.categoriesService.capturePayment('2d6beb3d-000f-5000-9000-1a4686d97366');
	// }

	@Post('/payment/status')
	async handlePaymentStatus(@Body() paymentStatusDto:PaymentNotificationDto) {
		console.log('change')
		const response = await this.categoriesService.capturePayment(paymentStatusDto);
		return response.data; // Возвращаем данные из ответа API ЮKassa
	}

}
