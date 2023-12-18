import { PartialType } from '@nestjs/swagger'
import { CreateNannyDto } from './create-nanny.dto'

export class UpdateNannyDto extends PartialType(CreateNannyDto) {}
