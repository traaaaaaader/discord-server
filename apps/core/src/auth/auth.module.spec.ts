import { Test } from '@nestjs/testing';
import { AuthModule } from './auth.module';
import { AuthModule as AuthLibModule, UsersModule } from '@app/core-lib';

describe('AuthModule', () => {
  it('should compile the module', async () => {
    const module = await Test.createTestingModule({
      imports: [AuthModule],
    }).compile();

    expect(module).toBeDefined();
    expect(module.get(AuthLibModule)).toBeInstanceOf(AuthLibModule);
    expect(module.get(UsersModule)).toBeInstanceOf(UsersModule);
  });
});
