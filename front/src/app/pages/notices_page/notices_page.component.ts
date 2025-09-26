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
export class NoticesPageComponent {
    private noticesSrv = inject(NoticesService);

  // Signal de avisos (leer con notices())
    notices = this.noticesSrv.notices;

  // formulario
    newNotice: Partial<Notice> = { title: '', content: '', visibleFor: 'student' };

    addNotice() {
    if (!this.newNotice.title?.trim() || !this.newNotice.content?.trim()) return;

    this.noticesSrv.add({
    id: Date.now(),
    title: this.newNotice.title!.trim(),
    content: this.newNotice.content!,            // HTML del editor
    visibleFor: this.newNotice.visibleFor!,      // 'student' | 'teacher'
    createdBy: 'Preceptor Demo',
    createdAt: new Date()
    });

    this.newNotice = { title: '', content: '', visibleFor: 'student' };
}

    deleteNotice(id: number) {
    this.noticesSrv.remove(id);
}
}