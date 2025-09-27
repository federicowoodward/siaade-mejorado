import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EditorModule } from 'primeng/editor';
import { ButtonModule } from 'primeng/button';
import { NoticesService, Notice } from '../../core/services/notices.service';
import { RolesService } from '../../core/services/role.service';

@Component({
    selector: 'app-notices-page',
    standalone: true,
    imports: [CommonModule, FormsModule, EditorModule, ButtonModule],
    templateUrl: './notices_page.component.html',
    styleUrls: ['./notices_page.component.scss']
})
export class NoticesPageComponent {
    private noticesSrv = inject(NoticesService);
  private roles = inject(RolesService);

    notices = this.noticesSrv.notices;

  canManage = computed(() => this.roles.isOneOf(['secretary', 'preceptor']));

  // formulario
    newNotice: Partial<Notice> = { title: '', content: '', visibleFor: 'student' };

    addNotice() {
    if (!this.newNotice.title?.trim() || !this.newNotice.content?.trim()) return;

    this.noticesSrv.create({
      title: this.newNotice.title!.trim(),
      content: this.newNotice.content!,
      // visibleFor 'student' | 'teacher' | 'all'
      visibleFor: (this.newNotice.visibleFor as any) ?? 'all',
    });

    this.newNotice = { title: '', content: '', visibleFor: 'student' };
}

    deleteNotice(id: number) {
  this.noticesSrv.remove(id);
}
}