import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { JwtAuthGuard } from './jwt-auth.guard';

@Injectable()
export class OwnerGuard extends JwtAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean | Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const targetId: string | undefined = request.params?.id || request.body?.id || request.body?.userId;

    if (!user?.id || !targetId) return false;
    return user.id === targetId;
  }
}
