import { Controller, Post, Body, Put, Param, Delete, Get, HttpCode, HttpStatus, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto, UpdateUserDto, UserResponseDto } from './dto';

@ApiTags('Users Management')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create new user' })
  @ApiResponse({ status: 201, description: 'User created successfully' })
  async createUser(@Body() createUserDto: CreateUserDto) {
    try {
      const user = await this.usersService.create(createUserDto);
      return {
        data: user,
        message: 'User created successfully'
      };
    } catch (error: any) {
      return {
        error: error?.message || 'Unknown error',
        message: 'Failed to create user'
      };
    }
  }

  @Get()
  @ApiOperation({ summary: 'Get all users' })
  @ApiResponse({ status: 200, description: 'Users retrieved successfully' })
  // @UseGuards(JwtAuthGuard, RolesGuard)
  // @Roles('ADMIN_GENERAL', 'SECRETARIO')
  async getAllUsers(): Promise<{ data: UserResponseDto[], message: string }> {
    try {
      const users = await this.usersService.findAll();
      return {
        data: users,
        message: 'Users retrieved successfully'
      };
    } catch (error: any) {
      throw new BadRequestException({
        error: 'Failed to get users',
        message: error.message || 'Unknown error occurred'
      });
    }
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiResponse({ status: 200, description: 'User retrieved successfully' })
  async getUserById(@Param('id') id: string) {
    try {
      const user = await this.usersService.findById(id);
      return {
        data: user,
        message: 'User retrieved successfully'
      };
    } catch (error: any) {
      return {
        error: error?.message || 'Unknown error',
        message: 'Failed to retrieve user'
      };
    }
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update user' })
  @ApiResponse({ status: 200, description: 'User updated successfully' })
  async updateUser(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    try {
      const user = await this.usersService.update(id, updateUserDto);
      return {
        data: user,
        message: 'User updated successfully'
      };
    } catch (error: any) {
      return {
        error: error?.message || 'Unknown error',
        message: 'Failed to update user'
      };
    }
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete user' })
  @ApiResponse({ status: 200, description: 'User deleted successfully' })
  async deleteUser(@Param('id') id: string) {
    try {
      await this.usersService.delete(id);
      return {
        data: { deleted: true },
        message: 'User deleted successfully'
      };
    } catch (error: any) {
      return {
        error: error?.message || 'Unknown error',
        message: 'Failed to delete user'
      };
    }
  }
}