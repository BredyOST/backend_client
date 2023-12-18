import { Test, TestingModule } from '@nestjs/testing';
import { HouseholdStaffService } from './household-staff.service';

describe('HouseholdStaffService', () => {
  let service: HouseholdStaffService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [HouseholdStaffService],
    }).compile();

    service = module.get<HouseholdStaffService>(HouseholdStaffService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
