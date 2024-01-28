import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import * as express from 'express'
import { join } from 'path'
import * as process from 'process'
import session from 'express-session'
async function bootstrap() {
  // const app = await NestFactory.create(AppModule, { cors: false });
  const app = await NestFactory.create(AppModule)
  app.enableCors({
    origin: [`${process.env['CLIENT_URL']}`],
  })

  app.use(
    '/uploads',
    express.static(join(__dirname, '..', 'uploads')),
    session({
      resave: false,
      saveUninitialized: false,
      secret: 'your-secret-key',
    }),
  )

  const config = new DocumentBuilder().setTitle('Клиент.ру').setVersion('1.0').addBearerAuth().build()

  const document = SwaggerModule.createDocument(app, config)

  // SwaggerModule.setup('swagger', app, document, {
  //   swaggerOptions: {
  //     persistAuthorization: true,
  //   },
  // })

  await app.listen(7777)
}
bootstrap()
