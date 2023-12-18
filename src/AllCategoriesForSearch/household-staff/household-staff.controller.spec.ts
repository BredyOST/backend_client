import { Test, TestingModule } from '@nestjs/testing';
import { HouseholdStaffController } from './household-staff.controller';
import { HouseholdStaffService } from './household-staff.service';

describe('HouseholdStaffController', () => {
  let controller: HouseholdStaffController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HouseholdStaffController],
      providers: [HouseholdStaffService],
    }).compile();

    controller = module.get<HouseholdStaffController>(HouseholdStaffController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
