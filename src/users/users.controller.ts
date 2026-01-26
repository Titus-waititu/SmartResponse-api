import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  // ParseIntPipe,
  ParseFloatPipe,
  ValidationPipe,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { UserRole } from 'src/types';
import { Public } from 'src/auth/decorators/public.decorator';

@ApiTags('users')
@UseGuards(RolesGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @Public()
  // @Roles(UserRole.ADMIN, UserRole.VENDOR, UserRole.CUSTOMER)
  @ApiOperation({ summary: 'Create a new user' })
  @ApiResponse({ status: 201, description: 'User created successfully.' })
  @ApiResponse({ status: 400, description: 'Bad request.' })
  @ApiResponse({ status: 409, description: 'User with email already exists.' })
  create(@Body(ValidationPipe) createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get all users' })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Search users by username or email',
  })
  @ApiResponse({ status: 200, description: 'Users retrieved successfully.' })
  findAll(@Query('search') search?: string) {
    if (search) {
      return this.usersService.findAll(search);
    }
    return this.usersService.findAll();
  }

  @Get(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiResponse({ status: 200, description: 'User retrieved successfully.' })
  @ApiResponse({ status: 404, description: 'User not found.' })
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update user by ID' })
  @ApiResponse({ status: 200, description: 'User updated successfully.' })
  @ApiResponse({ status: 404, description: 'User not found.' })
  update(
    @Param('id') id: string,
    @Body(ValidationPipe) updateUserDto: UpdateUserDto,
  ) {
    return this.usersService.update(id, updateUserDto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete user by ID' })
  @ApiResponse({ status: 200, description: 'User deleted successfully.' })
  @ApiResponse({ status: 404, description: 'User not found.' })
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }

  @Get('responders/nearby')
  @Roles(
    UserRole.ADMIN,
    UserRole.POLICE,
    UserRole.MEDICAL,
    UserRole.FIRE_DEPARTMENT,
  )
  @ApiOperation({ summary: 'Find emergency responders near location' })
  @ApiQuery({ name: 'latitude', required: true, description: 'Latitude' })
  @ApiQuery({ name: 'longitude', required: true, description: 'Longitude' })
  @ApiQuery({
    name: 'radius',
    required: false,
    description: 'Radius in KM (default: 10)',
  })
  @ApiResponse({
    status: 200,
    description: 'Nearby responders retrieved successfully.',
  })
  findRespondersNearby(
    @Query('latitude', ParseFloatPipe) latitude: number,
    @Query('longitude', ParseFloatPipe) longitude: number,
    @Query('radius') radius?: string,
  ) {
    const radiusKm = radius ? parseFloat(radius) : 10;
    return this.usersService.findRespondersNearLocation(
      latitude,
      longitude,
      radiusKm,
    );
  }

  @Get('insurance-agents/city/:city')
  @Roles(UserRole.ADMIN, UserRole.REPORTER)
  @ApiOperation({ summary: 'Find insurance agents by city' })
  @ApiResponse({
    status: 200,
    description: 'Insurance agents by city retrieved successfully.',
  })
  findInsuranceAgentsByCity(@Param('city') city: string) {
    return this.usersService.findInsuranceAgentsByCity(city);
  }

  @Get('system/stats')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get system statistics' })
  @ApiResponse({
    status: 200,
    description: 'System stats retrieved successfully.',
  })
  getSystemStats() {
    return this.usersService.getSystemStats();
  }

  @Get('role/:role')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get users by role' })
  @ApiResponse({
    status: 200,
    description: 'Users by role retrieved successfully.',
  })
  findByRole(@Param('role') role: string) {
    return this.usersService.findByRole(role as UserRole);
  }
}
