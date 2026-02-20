import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { Repository, In } from 'typeorm';
import { hash, compare } from 'bcrypt';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/database/entities/user.entity';
import { CreateUserDto } from '../dto/user.dto';
import { Role } from 'src/database/entities/role.entity';
import { UserRelation } from '../dto/user.types';
import { errorMessages } from 'src/errors/custom';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User) private readonly repository: Repository<User>,
  ) {}

  public async createUser(
    body: CreateUserDto,
    ...roles: Role[]
  ): Promise<User> {
    body.password = await hash(body.password, 10);
    const user: User = this.repository.create({
      ...body,
      roles,
    });

    return this.repository.save(user);
  }

  public async findByEmail(
    email: string,
    relations?: UserRelation,
  ): Promise<User> {
    const user: User = await this.repository.findOne({
      where: {
        email,
      },
      relations,
    });
    return user;
  }

  public async comparePassword(password, userPassword): Promise<boolean> {
    return compare(password, userPassword);
  }

  public async findById(id: number, relations?: UserRelation): Promise<User> {
    const user: User = await this.repository.findOne({
      where: {
        id,
      },
      relations,
    });
    if (!user) {
      throw new NotFoundException(errorMessages.user.notFound);
    }
    return user;
  }

  public async save(user: User) {
    return this.repository.save(user);
  }

  public async findAll(): Promise<User[]> {
    return this.repository.find({
      relations: ['roles'],
      order: { id: 'ASC' },
    });
  }

  public async updateRoles(
    userId: number,
    roleIds: number[],
    currentUserId: number,
  ) {
    const userToUpdate = await this.findById(userId, { roles: true });

    // Prevent self-demotion from Admin
    if (userId === currentUserId) {
      const isAdminId = 3;
      const hasAdminRole = userToUpdate.roles.some((r) => r.id === isAdminId);
      const willHaveAdminRole = roleIds.includes(isAdminId);

      if (hasAdminRole && !willHaveAdminRole) {
        throw new ConflictException('You cannot remove your own Admin role');
      }
    }

    const newRoles = await this.repository.manager.getRepository(Role).find({
      where: { id: In(roleIds) },
    });

    userToUpdate.roles = newRoles;
    return this.repository.save(userToUpdate);
  }

  public async createByAdmin(
    body: CreateUserDto,
    roleIds: number[],
  ): Promise<User> {
    const { email, password } = body;
    const roles = await this.repository.manager.getRepository(Role).find({
      where: { id: In(roleIds) },
    });

    const hashedPassword = await hash(password, 10);
    const user = this.repository.create({
      email,
      password: hashedPassword,
      roles,
    });

    return this.repository.save(user);
  }

  public async resetPassword(
    userId: number,
    newPassword: string,
  ): Promise<void> {
    const user = await this.findById(userId);
    user.password = await hash(newPassword, 10);
    await this.repository.save(user);
  }

  public async changePassword(
    userId: number,
    oldPassword: string,
    newPassword: string,
  ): Promise<void> {
    const user = await this.findById(userId);
    const isMatch = await compare(oldPassword, user.password);
    if (!isMatch) {
      throw new ConflictException('Old password does not match');
    }
    user.password = await hash(newPassword, 10);
    await this.repository.save(user);
  }
}
