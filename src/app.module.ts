import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { UsersModule } from './users/users.module'
import { TypeOrmModule } from '@nestjs/typeorm'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { AuthModule } from './auth/auth.module'
import { UserEntity } from './users/entities/user.entity'
import { HttpModule } from '@nestjs/axios'
import { TutorsModule } from './AllCategoriesForSearch/tutors/tutors.module'
import { TutorEntity } from './AllCategoriesForSearch/tutors/entities/tutor.entity'
import { MailerModule } from '@nestjs-modules/mailer'
import { CategoriesModule } from './additionalRepositories/categories/categories.module'
import { CategoryEntity } from './additionalRepositories/categories/entities/category.entity'
import { ScheduleModule } from '@nestjs/schedule'
// import * as process from 'process'
import { NotificationsModule } from './additionalRepositories/notifications/notifications.module'
import { NotificationEntity } from './additionalRepositories/notifications/entities/notification.entity'
import { PostsModule } from './posts/posts.module'
import { PostEntity } from './posts/entities/post.entity'
import { TransactionEntity } from './additionalRepositories/transaction/entities/transaction.entity'
import { TransactionModule } from './additionalRepositories/transaction/transaction.module'
import { FilesModule } from './files/files.module'
import { FileEntity } from './files/entities/file.entity'
import { LogsModule } from './otherServices/loggerService/logger.module'
import { IpMiddleware } from './middleware/middlewar'
import { IpController } from './ipController/ipController'
import { AuthorizationsModule } from './additionalRepositories/authorizations/authorizations.module'
import { CustomSessionModule } from './middleware/session.middleware'
import { AuthorizationEntity } from './additionalRepositories/authorizations/entities/authorization.entity'
import { SessionTokenMiddleware } from './middleware/sessionTikenCheck.middleware'
import { NanniesModule } from './AllCategoriesForSearch/nannies/nannies.module'
import { NannyEntity } from './AllCategoriesForSearch/nannies/entities/nanny.entity'
import { PricesModule } from './additionalRepositories/prices/prices.module'
import { PriceEntity } from './additionalRepositories/prices/entities/price.entity'
import { ForGetPostsFromAllModule } from './AllCategoriesForSearch/ForGetPostsFromAll/ForGetPostsFromAll.module'
import { GroupsFromVkEntity } from './groupsAndChats/groups-from-vk/entities/groups-from-vk.entity'
import { ChatsFromTelegramEntity } from './groupsAndChats/chats-from-telegram/entities/chats-from-telegram.entity'
import { GroupsFromVkModule } from './groupsAndChats/groups-from-vk/groups-from-vk.module'
import { ChatsFromTelegramModule } from './groupsAndChats/chats-from-telegram/chats-from-telegram.module'
import { HouseholdStaffModule } from './AllCategoriesForSearch/household-staff/household-staff.module'
import { HandymanAndBuilderModule } from './AllCategoriesForSearch/handyman-and-builder/handyman-and-builder.module'
import { DesignersModule } from './designers/designers.module'
import { RedisModule } from './redis/redis.module'
import { RedisService } from './redis/redis.service'
import * as dotenv from 'dotenv'
dotenv.config()

@Module({
  imports: [
    HttpModule,
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        return {
          type: 'postgres',
          host: configService.get('DB_HOST'),
          port: configService.get('DB_PORT'),
          username: configService.get('DB_USER'),
          password: configService.get('DB_PASSWORD'),
          database: configService.get('DB_NAME'),
          synchronize: true,
          entities: [
            UserEntity,
            TutorEntity,
            CategoryEntity,
            NotificationEntity,
            GroupsFromVkEntity,
            PostEntity,
            TransactionEntity,
            FileEntity,
            AuthorizationEntity,
            NannyEntity,
            PriceEntity,
            ChatsFromTelegramEntity,
          ],
        }
      },
    }),
    MailerModule.forRoot({
      transport: {
        host: process.env['SMTP_HOST'],
        port: 465,
        secure: true,
        auth: {
          user: process.env['SMTP_USER'],
          pass: process.env['SMTP_PASSWORD'],
        },
        tls: {
          rejectUnauthorized: false,
        },
      },
    }),
    UsersModule,
    FilesModule,
    AuthModule,
    TutorsModule,
    CategoriesModule,
    NotificationsModule,
    GroupsFromVkModule,
    PostsModule,
    TransactionModule,
    LogsModule,
    AuthorizationsModule,
    CustomSessionModule,
    NanniesModule,
    PricesModule,
    PricesModule,
    ChatsFromTelegramModule,
    ForGetPostsFromAllModule,
    HouseholdStaffModule,
    HandymanAndBuilderModule,
    DesignersModule,
    RedisModule,
  ],
  controllers: [AppController, IpController],
  providers: [AppService, IpMiddleware, SessionTokenMiddleware, RedisService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(IpMiddleware, SessionTokenMiddleware).forRoutes('*') // Примените Middleware ко всем маршрутам
  }
}
