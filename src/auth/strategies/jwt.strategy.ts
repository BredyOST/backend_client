import { ExtractJwt, Strategy } from 'passport-jwt'
import { PassportStrategy } from '@nestjs/passport'
import { HttpException, HttpStatus, Injectable } from '@nestjs/common'
import { UsersService } from '../../users/users.service'
import * as process from 'process'

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(private readonly userService: UsersService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env['SECRET_KEY'],
    })
  }

  async validate(payload) {
    try {

      const user = await this.userService.findById(+payload._id)

      if (!user) {
        throw new HttpException('Ошибка при входе в учетную запись', HttpStatus.UNAUTHORIZED)
      }

      return {
        id: user.id,
      }
    } catch (err) {
      if ((err.response = 'Ошибка при входе в учетную запись')) {
        throw err
      } else {
        throw new HttpException('Ошибка валидации', HttpStatus.FORBIDDEN)
      }
    }
  }
}
