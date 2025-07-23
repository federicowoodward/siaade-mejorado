import { Component, inject, OnInit, computed, signal, effect } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';
import { RolesService } from '../../core/services/role.service';

@Component({
  selector: 'app-welcome-page',
  standalone: true,
  imports: [],
  templateUrl: './welcome-page.html',
  styleUrls: ['./welcome-page.scss'],
})
export class WelcomePage implements OnInit {
  private authService = inject(AuthService);
  private rolesService = inject(RolesService);

  userName = signal<string>('');
  userRole = computed(() => this.rolesService.currentRole());

  ngOnInit() {
    // Escuchamos al observable y seteamos el signal
    this.authService.getUser().subscribe((user) => {
      if (user) {
        this.userName.set(`${user.name} ${user.lastName}`);
      }
    });
  }
}
