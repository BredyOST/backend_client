import { Module } from '@nestjs/common'
import { AuthorizationsService } from './authorizations.service'
import { AuthorizationsController } from './authorizations.controller'
import { TypeOrmModule } from '@nestjs/typeorm'
import { AuthorizationEntity } from './entities/authorization.entity'
import { MailerModule } from '@nestjs-modules/mailer'
import { SessionAuthModule } from '../../auth/session-auth/session-auth.module'

@Module({
  imports: [
    TypeOrmModule.forFeature([AuthorizationEntity]),
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
  ],
  controllers: [AuthorizationsController],
  providers: [AuthorizationsService],
  exports: [AuthorizationsService],
})
export class AuthorizationsModule {}
