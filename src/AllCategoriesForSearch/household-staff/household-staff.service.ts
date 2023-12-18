import { Injectable } from '@nestjs/common';
import { CreateHouseholdStaffDto } from './dto/create-household-staff.dto';
import { UpdateHouseholdStaffDto } from './dto/update-household-staff.dto';

@Injectable()
export class HouseholdStaffService {
  create(createHouseholdStaffDto: CreateHouseholdStaffDto) {
    return 'This action adds a new householdStaff';
  }

  findAll() {
    return `This action returns all householdStaff`;
  }

  findOne(id: number) {
    return `This action returns a #${id} householdStaff`;
  }

  update(id: number, updateHouseholdStaffDto: UpdateHouseholdStaffDto) {
    return `This action updates a #${id} householdStaff`;
  }

  remove(id: number) {
    return `This action removes a #${id} householdStaff`;
  }
}
