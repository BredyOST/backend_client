import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { HandymanAndBuilderService } from './handyman-and-builder.service';
import { CreateHandymanAndBuilderDto } from './dto/create-handyman-and-builder.dto';
import { UpdateHandymanAndBuilderDto } from './dto/update-handyman-and-builder.dto';

@Controller('handyman-and-builder')
export class HandymanAndBuilderController {
  constructor(private readonly handymanAndBuilderService: HandymanAndBuilderService) {}

  @Post()
  create(@Body() createHandymanAndBuilderDto: CreateHandymanAndBuilderDto) {
    return this.handymanAndBuilderService.create(createHandymanAndBuilderDto);
  }

  @Get()
  findAll() {
    return this.handymanAndBuilderService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.handymanAndBuilderService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateHandymanAndBuilderDto: UpdateHandymanAndBuilderDto) {
    return this.handymanAndBuilderService.update(+id, updateHandymanAndBuilderDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.handymanAndBuilderService.remove(+id);
  }
}
