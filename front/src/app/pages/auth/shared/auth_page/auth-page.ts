import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-auth-page',
  standalone: true,
  templateUrl: './auth-page.html',
  styleUrls: ['./auth-page.scss'],
  providers: [MessageService],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    InputTextModule,
    PasswordModule,
    ButtonModule,
    ToastModule,
  ],
})
export class AuthPage {
  form: FormGroup;

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private router: Router,
    private message: MessageService
  ) {
    this.form = this.fb.group({
      identity: ['', Validators.required],
      password: ['', Validators.required],
    });
  }

  login() {
    const { identity, password } = this.form.value;

    this.auth
      .loginFlexible(identity, password) // ver función especial abajo 👇
      .subscribe((success) => {
        if (success) {
          this.router.navigate(['/welcome']);
        } else {
          this.message.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Usuario o contraseña incorrectos',
          });
        }
      });
  }

  goToReset() {
    this.router.navigate(['/auth/reset-password']);
  }
}
