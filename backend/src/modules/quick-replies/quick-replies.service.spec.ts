import { Test, TestingModule } from '@nestjs/testing';
import { QuickRepliesService } from './quick-replies.service';

describe('QuickRepliesService', () => {
  let service: QuickRepliesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [QuickRepliesService],
    }).compile();

    service = module.get<QuickRepliesService>(QuickRepliesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
