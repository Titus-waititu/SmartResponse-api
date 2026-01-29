import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { DatabaseService } from '../database/database.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserResponse } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(private databaseService: DatabaseService) {}

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
    const userId = crypto.randomUUID();
    const active = isActive !== undefined ? isActive : true;

    await this.databaseService['sql']`
      INSERT INTO users (id, full_name, email, password, phone_number, role, is_active, created_at, updated_at)
      VALUES (${userId}, ${fullName}, ${email}, ${hashedPassword}, ${phoneNumber || null}, ${role}, ${active}, NOW(), NOW())
    `;

    const user = await this.findOne(userId);
    return user;
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
    const offset = (page - 1) * limit;

    let whereConditions: string[] = [];
    let queryParams: any[] = [];

    // Build WHERE clause dynamically
    if (params?.role) {
      whereConditions.push('role = $' + (queryParams.length + 1));
      queryParams.push(params.role);
    }

    if (params?.isActive !== undefined) {
      whereConditions.push('is_active = $' + (queryParams.length + 1));
      queryParams.push(params.isActive);
    }

    if (params?.search) {
      whereConditions.push(
        '(full_name ILIKE $' +
          (queryParams.length + 1) +
          ' OR email ILIKE $' +
          (queryParams.length + 1) +
          ')',
      );
      queryParams.push(`%${params.search}%`);
    }

    const whereClause =
      whereConditions.length > 0
        ? 'WHERE ' + whereConditions.join(' AND ')
        : '';

    // Get total count
    const countResult = await this.databaseService['sql']`
      SELECT COUNT(*) as total FROM users ${this.databaseService['sql'](whereClause)}
    `;
    const total = parseInt(countResult[0]?.total || '0');

    // Get users with pagination
    const users = await this.databaseService['sql']`
      SELECT id, full_name, email, phone_number, role, is_active, created_at, updated_at
      FROM users
      ${this.databaseService['sql'](whereClause)}
      ORDER BY created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `;

    return {
      users: users.map((user) => this.mapToUserResponse(user)),
      total,
      page,
      limit,
    };
  }

  async findOne(id: string): Promise<UserResponse> {
    const result = await this.databaseService['sql']`
      SELECT id, full_name, email, phone_number, role, is_active, created_at, updated_at
      FROM users
      WHERE id = ${id}
    `;

    if (!result || result.length === 0) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return this.mapToUserResponse(result[0]);
  }

  async findByEmail(email: string): Promise<any> {
    const result = await this.databaseService['sql']`
      SELECT * FROM users WHERE email = ${email}
    `;
    return result[0] || null;
  }

  async update(
    id: string,
    updateUserDto: UpdateUserDto,
  ): Promise<UserResponse> {
    // Check if user exists
    await this.findOne(id);

    const updates: string[] = [];
    const values: any[] = [];

    if (updateUserDto.fullName) {
      updates.push('full_name = $' + (values.length + 1));
      values.push(updateUserDto.fullName);
    }

    if (updateUserDto.email) {
      // Check if email is already taken by another user
      const existingUser = await this.findByEmail(updateUserDto.email);
      if (existingUser && existingUser.id !== id) {
        throw new ConflictException('Email already in use');
      }
      updates.push('email = $' + (values.length + 1));
      values.push(updateUserDto.email);
    }

    if (updateUserDto.phoneNumber !== undefined) {
      updates.push('phone_number = $' + (values.length + 1));
      values.push(updateUserDto.phoneNumber);
    }

    if (updateUserDto.role) {
      updates.push('role = $' + (values.length + 1));
      values.push(updateUserDto.role);
    }

    if (updateUserDto.isActive !== undefined) {
      updates.push('is_active = $' + (values.length + 1));
      values.push(updateUserDto.isActive);
    }

    if (updates.length === 0) {
      throw new BadRequestException('No fields to update');
    }

    updates.push('updated_at = NOW()');
    values.push(id);

    await this.databaseService['sql']`
      UPDATE users
      SET ${this.databaseService['sql'](updates.join(', '))}
      WHERE id = ${id}
    `;

    return this.findOne(id);
  }

  async remove(id: string): Promise<{ message: string }> {
    // Check if user exists
    await this.findOne(id);

    await this.databaseService['sql']`
      DELETE FROM users WHERE id = ${id}
    `;

    return { message: `User with ID ${id} has been removed` };
  }

  async deactivate(id: string): Promise<UserResponse> {
    return this.update(id, { isActive: false });
  }

  async activate(id: string): Promise<UserResponse> {
    return this.update(id, { isActive: true });
  }

  async getUsersByRole(role: string): Promise<UserResponse[]> {
    const result = await this.databaseService['sql']`
      SELECT id, full_name, email, phone_number, role, is_active, created_at, updated_at
      FROM users
      WHERE role = ${role}
      ORDER BY created_at DESC
    `;

    return result.map((user) => this.mapToUserResponse(user));
  }

  async getActiveUsers(): Promise<UserResponse[]> {
    const result = await this.databaseService['sql']`
      SELECT id, full_name, email, phone_number, role, is_active, created_at, updated_at
      FROM users
      WHERE is_active = true
      ORDER BY created_at DESC
    `;

    return result.map((user) => this.mapToUserResponse(user));
  }

  async getUserStats(): Promise<{
    total: number;
    active: number;
    inactive: number;
    byRole: Record<string, number>;
  }> {
    const totalResult = await this.databaseService['sql']`
      SELECT COUNT(*) as count FROM users
    `;

    const activeResult = await this.databaseService['sql']`
      SELECT COUNT(*) as count FROM users WHERE is_active = true
    `;

    const inactiveResult = await this.databaseService['sql']`
      SELECT COUNT(*) as count FROM users WHERE is_active = false
    `;

    const roleResult = await this.databaseService['sql']`
      SELECT role, COUNT(*) as count
      FROM users
      GROUP BY role
    `;

    const byRole: Record<string, number> = {};
    roleResult.forEach((row) => {
      byRole[row.role] = parseInt(row.count);
    });

    return {
      total: parseInt(totalResult[0]?.count || '0'),
      active: parseInt(activeResult[0]?.count || '0'),
      inactive: parseInt(inactiveResult[0]?.count || '0'),
      byRole,
    };
  }

  private mapToUserResponse(user: any): UserResponse {
    return {
      id: user.id,
      fullName: user.full_name,
      email: user.email,
      phoneNumber: user.phone_number,
      role: user.role,
      isActive: user.is_active,
      createdAt: user.created_at,
      updatedAt: user.updated_at,
    };
  }
}
