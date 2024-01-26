import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import * as express from 'express'
import { join } from 'path'

async function bootstrap() {
  // const app = await NestFactory.create(AppModule, { cors: false });
  const app = await NestFactory.create(AppModule)
  app.enableCors({
    origin: [`${process.env['CLIENT_URL']}`],
  })

  // app.enableCors({ credentials: true, origin: true });
  // app.setGlobalPrefix('api');
  app.use('/uploads', express.static(join(__dirname, '..', 'uploads')))

  const config = new DocumentBuilder().setTitle('Клиент.ру').setVersion('1.0').addBearerAuth().build()

  const document = SwaggerModule.createDocument(app, config)

  SwaggerModule.setup('swagger', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  })

  await app.listen(7777)
}
bootstrap()
