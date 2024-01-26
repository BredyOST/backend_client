import { Module } from '@nestjs/common'
import { PricesService } from './prices.service'
import { PricesController } from './prices.controller'
import { MailerModule } from '@nestjs-modules/mailer'
import { SessionAuthModule } from '../../auth/session-auth/session-auth.module'
import { TypeOrmModule } from '@nestjs/typeorm'
import { PriceEntity } from './entities/price.entity'
import { UsersModule } from '../../users/users.module'
import { RepositoryAllAdd } from '../../otherServices/loggerService/logger.module'
import { LogsService } from '../../otherServices/loggerService/logger.service'

@Module({
  imports: [
    TypeOrmModule.forFeature([PriceEntity]),
    MailerModule.forRoot({
      transport: {
        host: 'smtp.yandex.ru',
        port: 465,
        secure: true,
        auth: {
          user: 'i@mdmitrievich.ru',
          pass: 'Rjp39!_"@kjd',
        },
      },
    }),
    SessionAuthModule,
    UsersModule,
  ],
  controllers: [PricesController],
  providers: [PricesService, RepositoryAllAdd, LogsService],
})
export class PricesModule {}
