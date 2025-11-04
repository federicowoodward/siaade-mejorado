import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-reset-password-page',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    InputTextModule,
    PasswordModule,
    ButtonModule,
    ToastModule,
  ],
  providers: [MessageService],
  templateUrl: './reset-password-page.html',
  styleUrl: './reset-password-page.scss',
})
export class ResetPasswordPage {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private auth = inject(AuthService);
  private message = inject(MessageService);

  token: string | null = null;

  form = this.fb.group({
    password: ['', [Validators.required, Validators.minLength(6)]],
    confirm: ['', [Validators.required]],
  });

  ngOnInit() {
    this.token = this.route.snapshot.queryParamMap.get('token');
  }

  submitting = false;

  async submit() {
    if (!this.token) {
      this.message.add({ severity: 'warn', summary: 'Atención', detail: 'Falta el token.' });
      return;
    }
    const { password, confirm } = this.form.value;
    if (!password || !confirm || password !== confirm) {
      this.message.add({ severity: 'warn', summary: 'Atención', detail: 'Las contraseñas no coinciden.' });
      return;
    }
    this.submitting = true;
    this.auth.confirmPasswordReset(this.token, password).subscribe({
      next: () => {
        this.message.add({ severity: 'success', summary: 'Listo', detail: 'Tu contraseña fue actualizada.' });
        this.router.navigate(['/auth']);
      },
      error: () => {
        this.message.add({ severity: 'error', summary: 'Error', detail: 'No se pudo actualizar la contraseña.' });
      },
      complete: () => (this.submitting = false),
    });
  }
}
