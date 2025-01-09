import { Test, TestingModule } from '@nestjs/testing';
import { ServersServiceController } from './servers-service.controller';
import { ServersServiceService } from './servers-service.service';

describe('ServersServiceController', () => {
  let serversServiceController: ServersServiceController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [ServersServiceController],
      providers: [ServersServiceService],
    }).compile();

    serversServiceController = app.get<ServersServiceController>(ServersServiceController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(serversServiceController.getHello()).toBe('Hello World!');
    });
  });
});
