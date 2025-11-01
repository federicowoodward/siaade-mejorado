import { Controller, Get, Param, UseGuards } from "@nestjs/common";
import { UsersService } from "./users.service";
import { UserResponseDto } from "../manage/dto/create-user.dto";
import { JwtAuthGuard } from "@/guards/jwt-auth.guard";
import { RolesGuard } from "@/shared/rbac/guards/roles.guard";
import { AllowRoles } from "@/shared/rbac/decorators/allow-roles.decorator";
import { Action } from "@/shared/rbac/decorators/action.decorator";
import { ROLE } from "@/shared/rbac/roles.constants";

@Controller("users/read")
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Action("users.readOne")
  @AllowRoles(ROLE.EXECUTIVE_SECRETARY, ROLE.PRECEPTOR)
  async getUserInfo(@Param("id") id: string): Promise<UserResponseDto | null> {
    return this.usersService.getUserInfo(id);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Action("users.readAll")
  @AllowRoles(ROLE.EXECUTIVE_SECRETARY, ROLE.SECRETARY)
  async getAllUsers(): Promise<UserResponseDto[]> {
    return this.usersService.getAllUsers();
  }
}

