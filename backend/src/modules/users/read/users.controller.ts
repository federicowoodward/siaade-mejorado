import { Controller, Get, Param, Req, UseGuards, ForbiddenException } from "@nestjs/common";
import { UsersService } from "./users.service";
import { UserResponseDto } from "../manage/dto/create-user.dto";
import { JwtAuthGuard } from "@/guards/jwt-auth.guard";
import { RolesGuard } from "@/shared/rbac/guards/roles.guard";
import { AllowRoles } from "@/shared/rbac/decorators/allow-roles.decorator";
import { Action } from "@/shared/rbac/decorators/action.decorator";
import { ROLE } from "@/shared/rbac/roles.constants";
import { Request } from "express";

@Controller("users/read")
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Action("users.readOne")
  @AllowRoles(
    ROLE.EXECUTIVE_SECRETARY,
    ROLE.SECRETARY,
    ROLE.PRECEPTOR,
    ROLE.TEACHER,
  )
  async getUserInfo(
    @Param("id") id: string,
    @Req() req: Request,
  ): Promise<UserResponseDto | null> {
    const auth = req.user as { id?: string; role?: ROLE | null } | undefined;

    if (auth?.role === ROLE.TEACHER && auth?.id) {
      const user = await this.usersService.getUserInfoForTeacher(id, auth.id);
      if (!user) {
        throw new ForbiddenException();
      }
      return user;
    }

    return this.usersService.getUserInfo(id);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Action("users.readAll")
  @AllowRoles(
    ROLE.EXECUTIVE_SECRETARY,
    ROLE.SECRETARY,
    ROLE.TEACHER,
  )
  async getAllUsers(@Req() req: Request): Promise<UserResponseDto[]> {
    const auth = req.user as { id?: string; role?: ROLE | null } | undefined;

    if (auth?.role === ROLE.TEACHER && auth?.id) {
      return this.usersService.getAllUsersForTeacher(auth.id);
    }

    return this.usersService.getAllUsers();
  }
}
