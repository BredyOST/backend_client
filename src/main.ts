import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import * as express from 'express'
import { join } from 'path'
import * as process from 'process'
import * as session from 'express-session';
async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  app.enableCors({
    origin: ['https://xn--e1affem4a4d.com', `${process.env['API_IP']}`],
  })

  app.use(
    '/uploads',
    express.static(join(__dirname, '..', 'uploads')),
    session({
      resave: false,
      saveUninitialized: false,
      secret: process.env['SECRET_KEY_TWO'],
    }),
  )
  await app.listen(7777)
}
bootstrap()
