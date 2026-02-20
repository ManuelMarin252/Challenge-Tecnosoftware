import { Test, TestingModule } from '@nestjs/testing';
import { AuthGuard } from '../../auth/guards/auth.guard';
import { UserController } from './user.controller';
import { UserService } from '../services/user.service';

// Fully mock the entities to prevent loading their relationships
jest.mock('src/database/entities/user.entity', () => ({
  User: class User {},
}));

jest.mock('src/database/entities/product.entity', () => ({
  Product: class Product {},
  VariationTypes: { NONE: 'NONE' },
}));

jest.mock('src/database/entities/category.entity', () => ({
  Category: class Category {},
}));

jest.mock('src/database/entities/role.entity', () => ({
  Role: class Role {},
}));

// Also mock relative paths just in case to catch all imports
jest.mock('../../../database/entities/user.entity', () => ({
  User: class User {},
}));

jest.mock('../../../database/entities/product.entity', () => ({
  Product: class Product {},
  VariationTypes: { NONE: 'NONE' },
}));

jest.mock('../../../database/entities/category.entity', () => ({
  Category: class Category {},
}));

jest.mock('../../../database/entities/role.entity', () => ({
  Role: class Role {},
}));

import { User } from '../../../database/entities/user.entity';

describe('UserController', () => {
  let controller: UserController;
  let fakeUserService: Partial<UserService>;
  beforeEach(async () => {
    fakeUserService = {
      createUser: () => {
        return Promise.resolve({
          id: 1,
          email: 'testuser@example.com',
          password: 'password',
        } as User);
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        {
          provide: UserService,
          useValue: fakeUserService,
        },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: () => true }) // Mock AuthGuard
      .compile();

    controller = module.get<UserController>(UserController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
