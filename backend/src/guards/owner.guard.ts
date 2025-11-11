// TODO: REVIEW_CONFLICT_SIAD [logic]

/* incoming_branch_snapshot:

   import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";

   import { JwtAuthGuard } from "./jwt-auth.guard";

   

   @Injectable()

   export class OwnerGuard extends JwtAuthGuard implements CanActivate {

     canActivate(context: ExecutionContext): boolean | Promise<boolean> {

       const request = context.switchToHttp().getRequest();

       const user = request.user;

       const params = request.params ?? {};

       const body = request.body ?? {};

       const query = request.query ?? {};

       const targetId: string | undefined =

         params.id ||

         params.studentId ||

         params.userId ||

         body.id ||

         body.userId ||

         query.id ||

         query.studentId;

   

       if (!user?.id || !targetId) return false;

       return user.id === targetId;

     }

   }

*/

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

// KEEP: HEAD (lógica vigente hasta revisión)

