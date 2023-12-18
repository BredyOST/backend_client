import { Test, TestingModule } from '@nestjs/testing';
import { HandymanAndBuilderController } from './handyman-and-builder.controller';
import { HandymanAndBuilderService } from './handyman-and-builder.service';

describe('HandymanAndBuilderController', () => {
  let controller: HandymanAndBuilderController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HandymanAndBuilderController],
      providers: [HandymanAndBuilderService],
    }).compile();

    controller = module.get<HandymanAndBuilderController>(HandymanAndBuilderController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
