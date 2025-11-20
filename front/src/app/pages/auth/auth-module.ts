import { RouterModule } from '@angular/router';
import { AUTH_ROUTES } from './auth.router';
import { NgModule } from '@angular/core';

@NgModule({
  imports: [RouterModule.forChild(AUTH_ROUTES)],
})
export class AuthModule {}
