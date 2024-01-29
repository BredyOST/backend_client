import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import * as express from 'express'
import { join } from 'path'
import * as process from 'process'
import * as session from 'express-session';
async function bootstrap() {
  // const app = await NestFactory.create(AppModule, { cors: false });
  const app = await NestFactory.create(AppModule)
  app.enableCors({
    // origin: [`${process.env['CLIENT_URL']}`],
    origin: `*`,
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

  const config = new DocumentBuilder().setTitle('Клиент.ру').setVersion('1.0').addBearerAuth().build()

  await app.listen(7777)
}
bootstrap()
