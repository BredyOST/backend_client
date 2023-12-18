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

  async addNewTransaction(id, dto: TransactionEntity) {
    const newTransaction = {
      title: dto.title,
      type: dto.type,
      user_id: id,
      category: dto.category,
    }

    if (!newTransaction) throw new HttpException('Неудачная транзакиця оплаты на покупк', HttpStatus.UNAUTHORIZED)

    await this.repository.save(newTransaction)
  }
}
