import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EditorModule } from 'primeng/editor';
import { ButtonModule } from 'primeng/button';
import { NoticesService, Notice } from '../../core/services/notices.service';

@Component({
    selector: 'app-notices-page',
    standalone: true,
    imports: [CommonModule, FormsModule, EditorModule, ButtonModule],
    templateUrl: './notices_page.component.html',
    styleUrls: ['./notices_page.component.scss']
})
// notices-page.component.ts

export class NoticesPageComponent {
    private noticesSrv = inject(NoticesService);

    notices = this.noticesSrv.notices;

  // formulario
    newNotice: Partial<Notice> = { title: '', content: '', visibleFor: 'student' };

  // 👇 mapa español → inglés
    roleMap: Record<string, 'student' | 'teacher'> = {
    alumno: 'student',
    profesor: 'teacher'
    };

    addNotice() {
    if (!this.newNotice.title?.trim() || !this.newNotice.content?.trim()) return;

    this.noticesSrv.add({
    id: Date.now(),
    title: this.newNotice.title!.trim(),
    content: this.newNotice.content!,
      visibleFor: this.roleMap[this.newNotice.visibleFor as string] || 'student',  // ✅ traducimos
    createdBy: 'Preceptor Demo',
    createdAt: new Date()
    });

    this.newNotice = { title: '', content: '', visibleFor: 'student' };
}

    deleteNotice(id: number) {
    this.noticesSrv.remove(id);
}
}
