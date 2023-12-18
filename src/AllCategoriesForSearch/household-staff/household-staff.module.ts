import { Module } from '@nestjs/common';
import { HouseholdStaffService } from './household-staff.service';
import { HouseholdStaffController } from './household-staff.controller';

@Module({
  controllers: [HouseholdStaffController],
  providers: [HouseholdStaffService]
})
export class HouseholdStaffModule {}
