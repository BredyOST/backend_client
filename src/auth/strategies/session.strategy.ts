import { Injectable } from '@nestjs/common'
import * as process from 'process'
import { ExtractJwt, Strategy } from 'passport-jwt'
import { PassportStrategy } from '@nestjs/passport'
import { JwtService } from '@nestjs/jwt'

@Injectable()
export class SessionTokenStrategy extends PassportStrategy(Strategy, 'session') {
  constructor(private readonly jwtService: JwtService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env['SECRET_KEY_TWO'],
    })
  }

  async validateSessionToken(token: any) {
    try {
      const secretKey = process.env['SECRET_KEY_TWO']

      const decoded = this.jwtService.verify(token, { secret: secretKey })
      return decoded
    } catch (err) {
      // console.log(err)
      return null
    }
  }
}
