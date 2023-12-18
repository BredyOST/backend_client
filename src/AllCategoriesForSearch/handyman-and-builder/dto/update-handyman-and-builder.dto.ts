import { PartialType } from '@nestjs/swagger';
import { CreateHandymanAndBuilderDto } from './create-handyman-and-builder.dto';

export class UpdateHandymanAndBuilderDto extends PartialType(CreateHandymanAndBuilderDto) {}
