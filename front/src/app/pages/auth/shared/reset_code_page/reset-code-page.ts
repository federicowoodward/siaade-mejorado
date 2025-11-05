import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-reset-code-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, InputTextModule, ButtonModule, ToastModule],
  providers: [MessageService],
  templateUrl: './reset-code-page.html',
  styleUrl: './reset-code-page.scss',
})
export class ResetCodePage {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private auth = inject(AuthService);
  private message = inject(MessageService);

  form = this.fb.group({
    identity: ['', Validators.required],
    code: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]],
  });

  submitting = false;

  submit() {
    if (this.form.invalid || this.submitting) return;
    const { identity, code } = this.form.value;
    this.submitting = true;
    this.auth.verifyResetCode(identity!, code!).subscribe({
      next: (resp) => {
        const token = resp?.token;
        if (!token) {
          this.message.add({ severity: 'warn', summary: 'Atención', detail: 'No se pudo verificar el código.' });
          this.submitting = false;
          return;
        }
        this.message.add({ severity: 'success', summary: 'Código verificado', detail: 'Continuá para crear tu nueva contraseña.' });
        this.router.navigate(['/auth/reset-password'], { queryParams: { token } });
      },
      error: () => {
        this.message.add({ severity: 'error', summary: 'Código inválido', detail: 'El código es incorrecto o venció.' });
        this.submitting = false;
      },
    });
  }
}
