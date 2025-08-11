import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { PersonalDataComponent } from '../../../shared/components/personal_data/personal-data-component';
import { CommonModule } from '@angular/common';
import { Button } from 'primeng/button';
import { GoBackService } from '../../../core/services/go_back.service';

@Component({
  selector: 'app-user-detail-page',
  standalone: true,
  imports: [PersonalDataComponent, CommonModule, Button],
  templateUrl: './user-detail-page.html',
  styleUrl: './user-detail-page.scss',
})
export class UserDetailPage implements OnInit {
  private goBack = inject(GoBackService)
  userId!: string;

  constructor(private route: ActivatedRoute, private router: Router) {}

  ngOnInit() {
    this.userId = this.route.snapshot.paramMap.get('id') ?? '';
  }

  back(): void {
    this.goBack.back();
  }
}
