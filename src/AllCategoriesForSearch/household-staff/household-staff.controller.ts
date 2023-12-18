import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { HouseholdStaffService } from './household-staff.service';
import { CreateHouseholdStaffDto } from './dto/create-household-staff.dto';
import { UpdateHouseholdStaffDto } from './dto/update-household-staff.dto';

@Controller('household-staff')
export class HouseholdStaffController {
  constructor(private readonly householdStaffService: HouseholdStaffService) {}

  @Post()
  create(@Body() createHouseholdStaffDto: CreateHouseholdStaffDto) {
    return this.householdStaffService.create(createHouseholdStaffDto);
  }

  @Get()
  findAll() {
    return this.householdStaffService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.householdStaffService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateHouseholdStaffDto: UpdateHouseholdStaffDto) {
    return this.householdStaffService.update(+id, updateHouseholdStaffDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.householdStaffService.remove(+id);
  }
}
