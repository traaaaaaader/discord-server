import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from '@app/core-lib';
import { EditUserDto } from '@app/database';

describe('UsersController', () => {
  let controller: UsersController;
  let usersService: UsersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: {
            findOne: jest.fn(),
            edit: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    usersService = module.get<UsersService>(UsersService);
  });

  describe('get', () => {
    it('should call usersService.findOne with userId', async () => {
      const userId = 'user-123';
      
      await controller.get(userId);
      expect(usersService.findOne).toHaveBeenCalledWith({ id: userId });
    });
  });

  describe('editUser', () => {
    it('should call usersService.edit with correct params', async () => {
      const payload = {
        userId: 'user-123',
        body: { name: 'newusername' } as EditUserDto,
      };

      await controller.editUser(payload);
      expect(usersService.edit).toHaveBeenCalledWith(
        payload.userId,
        payload.body
      );
    });
  });
});