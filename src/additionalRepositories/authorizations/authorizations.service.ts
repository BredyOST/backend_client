import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { AuthorizationEntity } from './entities/authorization.entity'
import { Repository } from 'typeorm'

@Injectable()
export class AuthorizationsService {
  constructor(
    @InjectRepository(AuthorizationEntity)
    private repository: Repository<AuthorizationEntity>,
  ) {}

  async create(dto) {
    try {
      const obj = {
        clientIp: dto.clientIp,
        userId: dto.userId,
        userMail: dto.userMail,
        userAgent: dto.userAgent,
        status: dto.status,
        sessionToken: dto.sessionToken,
        loginAt: dto.loginAt,
      }
      await this.repository.save(obj)
    } catch (err) {
      // await this.logsServiceForOtherErrors.error(`создание сессии`,`ошибка при добавлении сессии для ${dto.userMail}`, `${err}`)
    }
  }
  async findLastSessionByUserId(userId) {
    return this.repository.findOneBy({
      userId,
    })
  }
  async findLastSessionByUserIdAndMonth(userId: number): Promise<AuthorizationEntity | null> {
    const query = this.repository.createQueryBuilder('authorization').where('authorization.userId = :userId', { userId }).orderBy('authorization.createdAt', 'DESC').getOne()
    return query
  }
  async updateAuthorization(id, authoried) {
    await this.repository.update(id, authoried)
  }
  async getMyAuthorizations(userId: number) {
    return await this.repository.find({
      where: {
        userId,
      },
      order: {
        createdAt: 'DESC',
      },
    })
  }
}
