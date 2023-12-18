import { Controller, Get, Res, Req } from '@nestjs/common'
import { Response, Request } from 'express'

@Controller('ip')
export class IpController {
  @Get()
  getIp(@Req() req: Request, @Res() res: Response) {
    const xForwardedFor = req.headers['x-forwarded-for']

    // Получаем IP-адрес пользователя
    const ip = xForwardedFor || req.connection.remoteAddress

    return res.json({ ip: ip || 'Unknown' })
  }
}
