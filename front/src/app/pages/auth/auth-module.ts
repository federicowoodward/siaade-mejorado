import { RouterModule } from '@angular/router';
import { AUTH_ROUTES } from './auth.router';
import { NgModule } from '@angular/core';

//aca manejar logica de redireccion y uso de guards y auth service
@NgModule({
  imports: [
    RouterModule.forChild(AUTH_ROUTES),
    // otros imports...
  ],
  // declarations...
})
export class AuthModule {}
