import { Test, TestingModule } from '@nestjs/testing';
import { HandymanAndBuilderService } from './handyman-and-builder.service';

describe('HandymanAndBuilderService', () => {
  let service: HandymanAndBuilderService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [HandymanAndBuilderService],
    }).compile();

    service = module.get<HandymanAndBuilderService>(HandymanAndBuilderService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
