import { Injectable } from '@nestjs/common'
import { destroyCookie } from 'nookies'
import { JwtService } from '@nestjs/jwt'
import * as process from 'process'
// для того чтобы очищать куки и возвратить false если токен сессии из req.session будет не валидный или будет отсутствовать
// т.е. сессия поменяется, кто-то другой зашел в учетку
@Injectable()
export class SessionAuthService {

  constructor(
      private readonly jwtService: JwtService
  ) {}

  async validateSessionToken(reqSession) {

    const resTokenSession = reqSession
    if (!resTokenSession || !resTokenSession._id) {
      destroyCookie(null, '_z', { path: '/' })
      destroyCookie(null, '_d', { path: '/' })
      destroyCookie(null, '_a', { path: '/' })
      return false
    }
    return true
  }

  async createToken(id: number) {
    const expiresIn = process.env.SESSION_IN;
    return this.jwtService.signAsync({ _id: id }, { expiresIn: expiresIn })
  }
}
