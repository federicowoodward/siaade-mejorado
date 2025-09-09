import {
  Controller,
  Post,
  Body,
  Put,
  Param,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse } from "@nestjs/swagger";
import { CreationMode, UsersService } from "./users.service";
import { CreatePreceptorDto } from "./dto/create-preceptor.dto";
import { CreateSecretaryDto } from "./dto/create-secretary.dto";
import { CreateTeacherDto } from "./dto/create-teacher.dto";
import { CreateStudentDto } from "./dto/create-student.dto";

@ApiTags("Users Management")
@Controller("users")
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post("secretary")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Alta usuario secretario (isDirective opcional)" })
  @ApiResponse({ status: 201, description: "Secretary created" })
  createSecretary(@Body() dto: CreateSecretaryDto) {
    return this.usersService.createSecretary(dto);
  }

  @Post("preceptor")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Alta de preceptor con datos extra (user_info)" })
  @ApiResponse({ status: 201, description: "Preceptor created" })
  createPreceptor(@Body() dto: CreatePreceptorDto) {
    return this.usersService.createPreceptor(dto);
  }

  @Post("teacher")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary:
      "Alta docente (con user_info y common_data; address_data opcional dentro de common_data)",
  })
  @ApiResponse({ status: 201, description: "Teacher created" })
  createTeacher(@Body() dto: CreateTeacherDto) {
    return this.usersService.createTeacher(dto);
  }

  @Post("student")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary:
      "Alta estudiante (con user_info, common_data ; address_data opcional)",
  })
  @ApiResponse({ status: 201, description: "Student created" })
  createStudent(@Body() dto: CreateStudentDto) {
    return this.usersService.createStudent(dto);
  }

  // -----------------------------

  @Get()
  @ApiOperation({ summary: "Get all users" })
  @ApiResponse({ status: 200, description: "Users retrieved successfully" })
  // @UseGuards(JwtAuthGuard, RolesGuard)
  // @Roles('ADMIN_GENERAL', 'SECRETARIO')
  async getAllUsers(): Promise<{ data: any[]; message: string }> {
    try {
      const users = await this.usersService.findAll();
      return {
        data: users,
        message: "Users retrieved successfully",
      };
    } catch (error: any) {
      throw new BadRequestException({
        error: "Failed to get users",
        message: error.message || "Unknown error occurred",
      });
    }
  }

  @Get(":id")
  @ApiOperation({ summary: "Get user by ID" })
  @ApiResponse({ status: 200, description: "User retrieved successfully" })
  async getUserById(@Param("id") id: string) {
    try {
      const user = await this.usersService.findById(id);
      return {
        data: user,
        message: "User retrieved successfully",
      };
    } catch (error: any) {
      return {
        error: error?.message || "Unknown error",
        message: "Failed to retrieve user",
      };
    }
  }

  @Put(":id")
  @ApiOperation({ summary: "Update user" })
  @ApiResponse({ status: 200, description: "User updated successfully" })
  async updateUser(@Param("id") id: string, @Body() updateUserDto: any) {
    try {
      const user = await this.usersService.update(id, updateUserDto);
      return {
        data: user,
        message: "User updated successfully",
      };
    } catch (error: any) {
      return {
        error: error?.message || "Unknown error",
        message: "Failed to update user",
      };
    }
  }

  @Delete(":id")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Delete user" })
  @ApiResponse({ status: 200, description: "User deleted successfully" })
  async deleteUser(@Param("id") id: string) {
    try {
      await this.usersService.delete(id);
      return {
        data: { deleted: true },
        message: "User deleted successfully",
      };
    } catch (error: any) {
      return {
        error: error?.message || "Unknown error",
        message: "Failed to delete user",
      };
    }
  }
}
