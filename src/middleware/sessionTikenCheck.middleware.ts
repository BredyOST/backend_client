import { Injectable, NestMiddleware } from '@nestjs/common'
import { NextFunction, Request, Response } from 'express'
import { SessionTokenStrategy } from '../auth/strategies/session.strategy'
import { AuthorizationsService } from '../additionalRepositories/authorizations/authorizations.service'

@Injectable()
export class SessionTokenMiddleware implements NestMiddleware {
  constructor(
      private readonly sessionTokenStrategy: SessionTokenStrategy,
      private readonly authorizationsService: AuthorizationsService
  ) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const sessionToken = req.headers['session-token']

    if (sessionToken) {
      const validatedToken = await this.sessionTokenStrategy.validateSessionToken(sessionToken)

      if (validatedToken) {
        // Получаем последнюю сессию пользователя из репозитория authorizationsService
        const userId = validatedToken._id
        const latestSession = await this.authorizationsService.findLastSessionByUserIdAndMonth(userId)

        if (latestSession && latestSession.sessionToken === sessionToken) {
          // Если сессионный токен валиден и соответствует последней сессии, сохраните информацию о сессии в req
          req.session = validatedToken
          next()
        } else {
          next()
          // res.status(401).json({ message: 'Недействительный сессионный токен1' });
        }
      } else {
        next()
        // res.status(401).json({ message: 'Недействительный сессионный токен2' });
      }
    } else {
      next()
      // res.status(401).json({ message: 'Сессионный токен отсутствует3' });
    }
  }
}
