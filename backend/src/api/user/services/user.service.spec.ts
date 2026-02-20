import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from 'src/database/entities/user.entity';
import { Role } from 'src/database/entities/role.entity';
import { ConflictException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

describe('UserService', () => {
  let service: UserService;
  // let userRepository: Repository<User>;

  const mockRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    manager: {
      getRepository: jest.fn().mockReturnValue({
        find: jest.fn(),
      }),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: getRepositoryToken(User),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    // userRepository = module.get<Repository<User>>(getRepositoryToken(User));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createByAdmin', () => {
    it('should create a user with roles', async () => {
      const dto = { email: 'test@test.com', password: 'password' };
      const roleIds = [1];
      const roles = [{ id: 1, name: 'Customer' }];
      const hashedPassword = 'hashedPassword';

      mockRepository.manager.getRepository(Role).find.mockResolvedValue(roles);
      jest
        .spyOn(bcrypt, 'hash')
        .mockImplementation(() => Promise.resolve(hashedPassword));
      mockRepository.create.mockReturnValue({
        ...dto,
        password: hashedPassword,
        roles,
      });
      mockRepository.save.mockResolvedValue({
        id: 1,
        ...dto,
        password: hashedPassword,
        roles,
      });

      const result = await service.createByAdmin(dto as any, roleIds);

      expect(
        mockRepository.manager.getRepository(Role).find,
      ).toHaveBeenCalledWith({ where: { id: expect.any(Object) } });
      expect(mockRepository.create).toHaveBeenCalledWith({
        email: dto.email,
        password: hashedPassword,
        roles,
      });
      expect(result).toEqual({
        id: 1,
        ...dto,
        password: hashedPassword,
        roles,
      });
    });
  });

  describe('resetPassword', () => {
    it('should reset user password', async () => {
      const user = { id: 1, password: 'oldPassword' };
      const newPassword = 'newPassword';
      const hashedPassword = 'hashedNewPassword';

      mockRepository.findOne.mockResolvedValue(user);
      jest
        .spyOn(bcrypt, 'hash')
        .mockImplementation(() => Promise.resolve(hashedPassword));
      mockRepository.save.mockResolvedValue({
        ...user,
        password: hashedPassword,
      });

      await service.resetPassword(1, newPassword);

      expect(mockRepository.save).toHaveBeenCalledWith({
        ...user,
        password: hashedPassword,
      });
    });
  });

  describe('changePassword', () => {
    it('should change password if old password matches', async () => {
      const user = { id: 1, password: 'hashedOldPassword' };
      const oldPassword = 'oldPassword';
      const newPassword = 'newPassword';
      const hashedNewPassword = 'hashedNewPassword';

      mockRepository.findOne.mockResolvedValue(user);
      jest
        .spyOn(bcrypt, 'compare')
        .mockImplementation(() => Promise.resolve(true));
      jest
        .spyOn(bcrypt, 'hash')
        .mockImplementation(() => Promise.resolve(hashedNewPassword));
      mockRepository.save.mockResolvedValue({
        ...user,
        password: hashedNewPassword,
      });

      await service.changePassword(1, oldPassword, newPassword);

      expect(mockRepository.save).toHaveBeenCalledWith({
        ...user,
        password: hashedNewPassword,
      });
    });

    it('should throw ConflictException if old password does not match', async () => {
      const user = { id: 1, password: 'hashedOldPassword' };
      mockRepository.findOne.mockResolvedValue(user);
      jest
        .spyOn(bcrypt, 'compare')
        .mockImplementation(() => Promise.resolve(false));

      await expect(
        service.changePassword(1, 'wrongPassword', 'new'),
      ).rejects.toThrow(ConflictException);
    });
  });
});
