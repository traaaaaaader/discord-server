import { Test } from '@nestjs/testing';
import { UsersModule } from './users.module';
import { UsersModule as UsersLibModule } from '@app/core-lib';
import { JwtModule } from '@nestjs/jwt';

describe('UsersModule', () => {
  it('should compile the module with JWT', async () => {
    const module = await Test.createTestingModule({
      imports: [UsersModule],
    }).compile();

    expect(module).toBeDefined();
    expect(module.get(UsersLibModule)).toBeInstanceOf(UsersLibModule);
    expect(module.get(JwtModule)).toBeInstanceOf(JwtModule);
  });
});