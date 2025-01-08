import { HttpException, HttpStatus, Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { TransactionEntity } from './entities/transaction.entity'
import { Repository } from 'typeorm'

@Injectable()
export class TransactionService {
  constructor(
    @InjectRepository(TransactionEntity)
    private repository: Repository<TransactionEntity>,
  ) {}

  async findAll(id: string) {
    return await this.repository.find({
      where: {
        user_id: id,
      },
      order: {
        createdAt: 'DESC',
      },
    })
  }

  async changeTransaction(response) {
    const transaction = await this.repository.findOne({
      where: {
        id_payment: response.data.id,
      },
    })
    if (transaction.status == 'success') {
      return false
    } else if (transaction) {
      transaction.status = 'success'
      transaction.paymentAt = response.captured_at
      await this.repository.save(transaction)
      return transaction
    } else {
      throw new HttpException('Неудачное обновление транзакции', HttpStatus.UNAUTHORIZED)
    }
  }

  async addNewTransaction(id, dto) {
    if (!dto) throw new HttpException('Неудачная транзакция оплаты на покупки', HttpStatus.UNAUTHORIZED)
    await this.repository.save(dto)
  }
}
