import { SetMetadata } from "@nestjs/common";
import { ROLE } from "../roles.constants";

export const ALLOW_ROLES_KEY = "allow_roles";

export const AllowRoles = (...roles: ROLE[]) =>
  SetMetadata(ALLOW_ROLES_KEY, roles);
