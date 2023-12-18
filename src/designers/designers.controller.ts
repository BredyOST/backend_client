import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { DesignersService } from './designers.service';
import { CreateDesignerDto } from './dto/create-designer.dto';
import { UpdateDesignerDto } from './dto/update-designer.dto';

@Controller('designers')
export class DesignersController {
  constructor(private readonly designersService: DesignersService) {}

  @Post()
  create(@Body() createDesignerDto: CreateDesignerDto) {
    return this.designersService.create(createDesignerDto);
  }

  @Get()
  findAll() {
    return this.designersService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.designersService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateDesignerDto: UpdateDesignerDto) {
    return this.designersService.update(+id, updateDesignerDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.designersService.remove(+id);
  }
}
