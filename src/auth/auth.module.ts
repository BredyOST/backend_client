import { Module } from '@nestjs/common'
import { AuthService } from './auth.service'
import { AuthController } from './auth.controller'
import { UsersModule } from '../users/users.module'
import { PassportModule } from '@nestjs/passport'
import { LocalStrategy } from './strategies/local.strategy'
import { JwtModule } from '@nestjs/jwt'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { JwtStrategy } from './strategies/jwt.strategy'
import { HttpModule } from '@nestjs/axios'
import { CustomSessionModule } from '../middleware/session.middleware'
import { AuthorizationsModule } from '../additionalRepositories/authorizations/authorizations.module'
import { SessionTokenStrategy } from './strategies/session.strategy'
import { SessionAuthModule } from './session-auth/session-auth.module'
import { RepositoryAllAdd } from '../otherServices/loggerService/logger.module'
import { LogsService } from '../otherServices/loggerService/logger.service'

@Module({
  imports: [
    HttpModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        return {
          secret: configService.get('SECRET_KEY'), // for tokens
          signOptions: { expiresIn: configService.get('ACCESSS_IN') },
          name: 'ACCESS',
        }
      },
    }),
    UsersModule,
    PassportModule,
    CustomSessionModule,
    AuthorizationsModule,
    SessionAuthModule,
  ],
  providers: [
    AuthService,
    LocalStrategy,
    JwtStrategy,
    SessionTokenStrategy,
    RepositoryAllAdd,
    LogsService,
  ],
  controllers: [AuthController],
  exports: [SessionTokenStrategy, AuthService],
})
export class AuthModule {}
