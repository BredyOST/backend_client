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

  async changeTransaction(dto) {
    const transaction = await this.repository.findOne({
      where: {
        id_payment: dto,
      }
    });
    if (transaction) {
      transaction.status = 'success';
      await this.repository.save(transaction);
      return transaction;
    } else {
      // Обработка случая, когда транзакция не найдена
      throw new Error('Transaction not found');
    }
  }

  async addNewTransaction(id, dto) {
    if (!dto) throw new HttpException('Неудачная транзакиця оплаты на покупк', HttpStatus.UNAUTHORIZED)
    await this.repository.save(dto)
  }
}
