import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { JwtModule } from '@nestjs/jwt';
import { SessionTokenStrategy } from '../strategies/session.strategy'
import {SessionAuthService} from "./session-auth.service";

@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get('SECRET_KEY_TWO'), // for session
        signOptions: { expiresIn: configService.get('SESSION_IN') },
        name: 'session',
      }),
    }),
  ],
  providers: [SessionAuthService, SessionTokenStrategy],
  exports: [SessionAuthService, SessionAuthModule],
})
export class SessionAuthModule {}