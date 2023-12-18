import { Module } from '@nestjs/common';
import { HandymanAndBuilderService } from './handyman-and-builder.service';
import { HandymanAndBuilderController } from './handyman-and-builder.controller';

@Module({
  controllers: [HandymanAndBuilderController],
  providers: [HandymanAndBuilderService]
})
export class HandymanAndBuilderModule {}
