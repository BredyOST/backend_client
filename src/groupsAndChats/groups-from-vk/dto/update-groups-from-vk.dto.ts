import { PartialType } from '@nestjs/swagger'
import { CreateGroupsFromVkDto } from './create-groups-from-vk.dto'

export class UpdateGroupsFromVkDto extends PartialType(CreateGroupsFromVkDto) {}
