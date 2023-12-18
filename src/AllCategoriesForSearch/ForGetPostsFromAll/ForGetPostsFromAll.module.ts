import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { TutorEntity } from '../tutors/entities/tutor.entity'
import { NannyEntity } from '../nannies/entities/nanny.entity'
import { ForGetPostsFromAllController } from './ForGetPostsFromAl.controller'
import { ForGetPostsFromAllService } from './ForGetPostsFromAll.service'
import { SessionAuthModule } from '../../auth/session-auth/session-auth.module'
import { TutorsModule } from '../tutors/tutors.module'
import { NanniesModule } from '../nannies/nannies.module'
import { UsersModule } from '../../users/users.module'
import { GroupsFromVkModule } from '../../groupsAndChats/groups-from-vk/groups-from-vk.module'

@Module({
  imports: [
    TypeOrmModule.forFeature([TutorEntity, NannyEntity]),
    SessionAuthModule,
    GroupsFromVkModule,
    TutorsModule,
    NanniesModule,
    UsersModule,
    SessionAuthModule,
  ],
  providers: [ForGetPostsFromAllService],
  controllers: [ForGetPostsFromAllController],
  exports: [ForGetPostsFromAllService],
})
export class ForGetPostsFromAllModule {}
