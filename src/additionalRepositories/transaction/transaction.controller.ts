import { Controller, Post, Body, UseGuards } from '@nestjs/common'
import { TransactionService } from './transaction.service'
import { JwtAuthGuard } from '../../auth/guards/jwt.guard'
import { UserId } from '../../decorators/user-id.decorator'
import { TransactionEntity } from './entities/transaction.entity'

@Controller('transaction')
export class TransactionController {
  constructor(private readonly transactionService: TransactionService) {}

  @Post('/add')
  @UseGuards(JwtAuthGuard)
  async addNewTransaction(@UserId() id: number, @Body() dto: TransactionEntity) {
    return this.transactionService.addNewTransaction(id, dto)
  }

  @Post('/getAll')
  @UseGuards(JwtAuthGuard)
  async getUserTransactions(@UserId() id: string) {
    return this.transactionService.findAll(id)
  }
}
