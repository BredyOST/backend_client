import { PartialType } from '@nestjs/swagger';
import { CreateHouseholdStaffDto } from './create-household-staff.dto';

export class UpdateHouseholdStaffDto extends PartialType(CreateHouseholdStaffDto) {}
