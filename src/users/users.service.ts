import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User, UserResponse } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<UserResponse> {
    const { email, password, fullName, phoneNumber, role, isActive } =
      createUserDto;

    // Check if user already exists
    const existingUser = await this.findByEmail(email);
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = this.usersRepository.create({
      fullName,
      email,
      password: hashedPassword,
      phoneNumber,
      role,
      isActive: isActive !== undefined ? isActive : true,
    });

    const savedUser = await this.usersRepository.save(user);
    return this.mapToUserResponse(savedUser);
  }

  async findAll(params?: {
    role?: string;
    isActive?: boolean;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<{
    users: UserResponse[];
    total: number;
    page: number;
    limit: number;
  }> {
    const page = params?.page || 1;
    const limit = params?.limit || 10;
    const skip = (page - 1) * limit;

    const where: Record<string, any> = {};

    if (params?.role) {
      where.role = params.role;
    }

    if (params?.isActive !== undefined) {
      where.isActive = params.isActive;
    }

    if (params?.search) {
      // For search, we'll use a more complex query
      const queryBuilder = this.usersRepository.createQueryBuilder('user');

      queryBuilder.where(
        '(user.fullName ILIKE :search OR user.email ILIKE :search)',
        { search: `%${params.search}%` },
      );

      if (params?.role) {
        queryBuilder.andWhere('user.role = :role', { role: params.role });
      }

      if (params?.isActive !== undefined) {
        queryBuilder.andWhere('user.isActive = :isActive', {
          isActive: params.isActive,
        });
      }

      queryBuilder.orderBy('user.createdAt', 'DESC').skip(skip).take(limit);

      const [users, total] = await queryBuilder.getManyAndCount();

      return {
        users: users.map((user) => this.mapToUserResponse(user)),
        total,
        page,
        limit,
      };
    }

    // Simple query without search
    const [users, total] = await this.usersRepository.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });

    return {
      users: users.map((user) => this.mapToUserResponse(user)),
      total,
      page,
      limit,
    };
  }

  async findOne(id: string): Promise<UserResponse> {
    const user = await this.usersRepository.findOne({ where: { id } });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return this.mapToUserResponse(user);
  }

  async findByEmail(email: string): Promise<User | null> {
    return await this.usersRepository.findOne({
      where: { email },
      select: [
        'id',
        'fullName',
        'email',
        'password',
        'phoneNumber',
        'role',
        'isActive',
        'hashedRefreshToken',
        'createdAt',
        'updatedAt',
      ],
    });
  }

  async update(
    id: string,
    updateUserDto: UpdateUserDto,
  ): Promise<UserResponse> {
    // Check if user exists
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    if (updateUserDto.email) {
      // Check if email is already taken by another user
      const existingUser = await this.findByEmail(updateUserDto.email);
      if (existingUser && existingUser.id !== id) {
        throw new ConflictException('Email already in use');
      }
    }

    if (Object.keys(updateUserDto).length === 0) {
      throw new BadRequestException('No fields to update');
    }

    // Update user
    Object.assign(user, updateUserDto);
    const updatedUser = await this.usersRepository.save(user);

    return this.mapToUserResponse(updatedUser);
  }

  async remove(id: string): Promise<{ message: string }> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    await this.usersRepository.remove(user);

    return { message: `User with ID ${id} has been removed` };
  }

  async deactivate(id: string): Promise<UserResponse> {
    return this.update(id, { isActive: false });
  }

  async activate(id: string): Promise<UserResponse> {
    return this.update(id, { isActive: true });
  }

  async getUsersByRole(role: string): Promise<UserResponse[]> {
    const users = await this.usersRepository.find({
      where: { role },
      order: { createdAt: 'DESC' },
    });

    return users.map((user) => this.mapToUserResponse(user));
  }

  async getActiveUsers(): Promise<UserResponse[]> {
    const users = await this.usersRepository.find({
      where: { isActive: true },
      order: { createdAt: 'DESC' },
    });

    return users.map((user) => this.mapToUserResponse(user));
  }

  async getUserStats(): Promise<{
    total: number;
    active: number;
    inactive: number;
    byRole: Record<string, number>;
  }> {
    const total = await this.usersRepository.count();
    const active = await this.usersRepository.count({
      where: { isActive: true },
    });
    const inactive = await this.usersRepository.count({
      where: { isActive: false },
    });

    // Get count by role
    const roleResult = await this.usersRepository
      .createQueryBuilder('user')
      .select('user.role', 'role')
      .addSelect('COUNT(*)', 'count')
      .groupBy('user.role')
      .getRawMany();

    const byRole: Record<string, number> = {};
    roleResult.forEach((row: { role: string; count: string }) => {
      byRole[row.role] = parseInt(row.count, 10);
    });

    return {
      total,
      active,
      inactive,
      byRole,
    };
  }

  private mapToUserResponse(user: User): UserResponse {
    return {
      id: user.id,
      username: user.username,
      fullName: user.fullName,
      email: user.email,
      phoneNumber: user.phoneNumber,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
