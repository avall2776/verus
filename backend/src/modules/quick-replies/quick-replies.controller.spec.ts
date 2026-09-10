import { Test, TestingModule } from '@nestjs/testing';
import { QuickRepliesController } from './quick-replies.controller';

describe('QuickRepliesController', () => {
  let controller: QuickRepliesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [QuickRepliesController],
    }).compile();

    controller = module.get<QuickRepliesController>(QuickRepliesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
