import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Put,
  Req,
  UseGuards,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiBody,
  ApiConflictResponse,
  ApiOkResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import { Request } from "express";
import { CreationMode, UsersService } from "./users.service";
import { CreatePreceptorDto } from "./dto/create-preceptor.dto";
import { CreateSecretaryDto } from "./dto/create-secretary.dto";
import { CreateTeacherDto } from "./dto/create-teacher.dto";
import { CreateStudentDto } from "./dto/create-student.dto";
import { UsersPatchService } from "@/shared/services/users-patch/users-patch.service";
import { UserProfileReaderService } from "@/shared/services/user-profile-reader/user-profile-reader.service";
import { JwtAuthGuard } from "@/guards/jwt-auth.guard";
import { RolesGuard } from "@/shared/rbac/guards/roles.guard";
import { AllowRoles } from "@/shared/rbac/decorators/allow-roles.decorator";
import { ROLE } from "@/shared/rbac/roles.constants";

@ApiTags("Users")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@AllowRoles(
  ROLE.EXECUTIVE_SECRETARY,
  ROLE.SECRETARY,
  ROLE.PRECEPTOR,
  ROLE.TEACHER,
)
@Controller("users")
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly usersPatchService: UsersPatchService,
    private readonly userReader: UserProfileReaderService,
  ) {}

  @Post("secretary")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Alta usuario secretario (isDirective opcional)" })
  @ApiResponse({ status: 201, description: "Secretary created" })
  @AllowRoles(ROLE.EXECUTIVE_SECRETARY, ROLE.SECRETARY)
  createSecretary(@Body() dto: CreateSecretaryDto) {
    return this.usersService.createSecretary(dto);
  }

  @Post("preceptor")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Alta de preceptor con datos extra (user_info)" })
  @ApiResponse({ status: 201, description: "Preceptor created" })
  @AllowRoles(ROLE.EXECUTIVE_SECRETARY, ROLE.SECRETARY)
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
  @AllowRoles(ROLE.EXECUTIVE_SECRETARY, ROLE.SECRETARY)
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
  @AllowRoles(ROLE.EXECUTIVE_SECRETARY, ROLE.SECRETARY)
  createStudent(@Body() dto: CreateStudentDto) {
    return this.usersService.createStudent(dto);
  }

  // ---------------- BLOQUEO / DESBLOQUEO -----------------

  @Patch(":id/block")
  @ApiOperation({
    summary: "Bloquea un usuario y (opcional) asigna motivo visible",
  })
  @ApiBody({
    schema: {
      type: "object",
      properties: { reason: { type: "string", nullable: true } },
    } as any,
  })
  @AllowRoles(ROLE.PRECEPTOR, ROLE.SECRETARY, ROLE.EXECUTIVE_SECRETARY)
  async blockUser(
    @Param("id") id: string,
    @Body() body: { reason?: string | null },
    @Req() _req: Request,
  ) {
    const reason = (body?.reason ?? "").trim();
    const data = await this.usersService.blockUser(id, reason);
    return { data, message: "Usuario bloqueado" };
  }

  @Patch(":id/unblock")
  @ApiOperation({ summary: "Desbloquea un usuario y limpia el motivo" })
  @AllowRoles(ROLE.PRECEPTOR, ROLE.SECRETARY, ROLE.EXECUTIVE_SECRETARY)
  async unblockUser(@Param("id") id: string, @Req() _req: Request) {
    const data = await this.usersService.unblockUser(id);
    return { data, message: "Usuario desbloqueado" };
  }

  // Activar/Inactivar (soft delete reversible)
  @Patch(":id/activate")
  @ApiOperation({
    summary:
      "Marca un usuario como ACTIVO (reversión de inactivo/eliminado lógico)",
  })
  @AllowRoles(ROLE.SECRETARY, ROLE.EXECUTIVE_SECRETARY)
  async activateUser(@Param("id") id: string) {
    const data = await this.usersService.setUserActiveState(id, true);
    return { data, message: "Usuario activado" };
  }

  @Patch(":id/inactivate")
  @ApiOperation({
    summary:
      "Marca un usuario como INACTIVO (equivalente a eliminado lógico, bloquea login)",
  })
  @AllowRoles(ROLE.SECRETARY, ROLE.EXECUTIVE_SECRETARY)
  async inactivateUser(@Param("id") id: string) {
    const data = await this.usersService.setUserActiveState(id, false);
    return { data, message: "Usuario inactivado" };
  }

  // -----------------------------

  @Get()
  @ApiOperation({ summary: "Get all users" })
  @ApiResponse({ status: 200, description: "Users retrieved successfully" })
  @AllowRoles(
    ROLE.EXECUTIVE_SECRETARY,
    ROLE.SECRETARY,
    ROLE.PRECEPTOR,
    ROLE.TEACHER,
  )
  async getAllUsers(@Req() req: Request): Promise<{
    data: any[];
    message: string;
  }> {
    try {
      const auth = req.user as { id?: string; role?: ROLE | null } | undefined;
      const isTeacher = auth?.role === ROLE.TEACHER && !!auth?.id;
      const users = isTeacher
        ? await this.usersService.findAllForTeacher(auth!.id as string)
        : await this.usersService.findAll();
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
  @AllowRoles(
    ROLE.EXECUTIVE_SECRETARY,
    ROLE.SECRETARY,
    ROLE.PRECEPTOR,
    ROLE.TEACHER,
  )
  async getUserById(@Param("id") id: string, @Req() req: Request) {
    try {
      const auth = req.user as { id?: string; role?: ROLE | null } | undefined;
      if (auth?.role === ROLE.TEACHER && auth?.id) {
        const allowed = await this.usersService.userBelongsToTeacher(
          id,
          auth.id,
        );
        if (!allowed) {
          throw new ForbiddenException("Access to this user is forbidden");
        }
      }

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
  @AllowRoles(ROLE.PRECEPTOR, ROLE.SECRETARY, ROLE.EXECUTIVE_SECRETARY)
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
  @ApiConflictResponse({
    description: "User cannot be deleted due to linked subjects",
  })
  @AllowRoles(ROLE.EXECUTIVE_SECRETARY, ROLE.SECRETARY)
  async deleteUser(@Param("id") id: string) {
    await this.usersService.deleteTx(id);
    return { data: { deleted: true }, message: "User deleted successfully" };
  }
}
