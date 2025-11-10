import {
  Controller,
  Post,
  Body,
  Put,
  Param,
  Delete,
  Get,
  Patch,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiOkResponse,
  ApiConflictResponse,
} from "@nestjs/swagger";
import { CreationMode, UsersService } from "./users.service";
import { CreatePreceptorDto } from "./dto/create-preceptor.dto";
import { CreateSecretaryDto } from "./dto/create-secretary.dto";
import { CreateTeacherDto } from "./dto/create-teacher.dto";
import { CreateStudentDto } from "./dto/create-student.dto";
import { UsersPatchService } from "@/shared/services/users-patch/users-patch.service";
import { UserProfileReaderService } from "@/shared/services/user-profile-reader/user-profile-reader.service";
@ApiTags("Users Management")
@Controller("users")
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly usersPatchService: UsersPatchService,
    private readonly userReader: UserProfileReaderService
  ) {}

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

  // ---------------- BLOQUEO / DESBLOQUEO -----------------

  @Patch(':id/block')
  @ApiOperation({ summary: 'Bloquea un usuario y (opcional) asigna motivo visible' })
  @ApiBody({ schema: { type: 'object', properties: { reason: { type: 'string', nullable: true } } } as any })
  async blockUser(@Param('id') id: string, @Body() body: { reason?: string | null }) {
    const reason = (body?.reason ?? '').trim();
    const data = await this.usersService.blockUser(id, reason);
    return { data, message: 'Usuario bloqueado' };
  }

  @Patch(':id/unblock')
  @ApiOperation({ summary: 'Desbloquea un usuario y limpia el motivo' })
  async unblockUser(@Param('id') id: string) {
    const data = await this.usersService.unblockUser(id);
    return { data, message: 'Usuario desbloqueado' };
  }

  // Activar/Inactivar (soft delete reversible)
  @Patch(':id/activate')
  @ApiOperation({ summary: 'Marca un usuario como ACTIVO (reversión de inactivo/eliminado lógico)' })
  async activateUser(@Param('id') id: string) {
    const data = await this.usersService.setUserActiveState(id, true);
    return { data, message: 'Usuario activado' };
  }

  @Patch(':id/inactivate')
  @ApiOperation({ summary: 'Marca un usuario como INACTIVO (equivalente a eliminado lógico, bloquea login)' })
  async inactivateUser(@Param('id') id: string) {
    const data = await this.usersService.setUserActiveState(id, false);
    return { data, message: 'Usuario inactivado' };
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
  @ApiOperation({ summary: "Update user (flat keys)" })
  @ApiResponse({ status: 200, description: "User updated successfully" })
  @ApiBody({
    schema: {
      type: "object",
      additionalProperties: true,
    } as any,
  })
  async updateUser(@Param("id") id: string, @Body() body: Record<string, any>) {
    try {
      await this.usersPatchService.patchUser(id, body);
      // devolvemos el perfil unificado ya existente en tu lector
      const data = await this.userReader.findById(id);
      return { data, message: "User updated successfully" };
    } catch (error: any) {
      throw new BadRequestException(error?.message || "Failed to update user");
    }
  }
  @Delete(":id")
  // @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Delete user" })
  @ApiOkResponse({ description: "User deleted successfully" })
  @ApiConflictResponse({ description: "User cannot be deleted due to linked subjects" })
  async deleteUser(@Param("id") id: string) {
    await this.usersService.deleteTx(id);
    return { data: { deleted: true }, message: "User deleted successfully" };
  }
}
