import { Injectable, NestMiddleware } from '@nestjs/common'

// для того чтобы в запросах был ip
@Injectable()
export class IpMiddleware implements NestMiddleware {
  use(req, res, next) {
    const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress
    req.clientIp = ip // Добавляем clientIp к объекту запроса req
    next()
  }
}
