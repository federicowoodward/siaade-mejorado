import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EditorModule } from 'primeng/editor';
import { ButtonModule } from 'primeng/button';

interface Notice {
    id: number;
    title: string;
    content: string;
    visibleFor: 'alumno' | 'profesor';
    createdBy: string;
    createdAt: Date;
}

@Component({
    selector: 'app-notices-page',
    standalone: true,
    imports: [CommonModule, FormsModule, EditorModule, ButtonModule],
    templateUrl: './notices_page.component.html',
    styleUrls: ['./notices_page.component.scss']
})
export class NoticesPageComponent {
  userRole: 'alumno' | 'profesor' | 'preceptor' = 'preceptor'; // ejemplo: cambiar para probar

notices: Notice[] = [
    {
    id: 1,
    title: 'Inscripciones abiertas',
    content: '<p>Desde el 1 al 30 de Noviembre</p>',
    visibleFor: 'alumno',
    createdBy: 'Preceptor Juan',
    createdAt: new Date()
    }
];

    newNotice: Partial<Notice> = { title: '', content: '', visibleFor: 'alumno' };

get filteredNotices(): Notice[] {
    if (this.userRole === 'preceptor') {
      return this.notices; // ve todo
    }
    return this.notices.filter(n => n.visibleFor === this.userRole);
}

    addNotice() {
    if (!this.newNotice.title || !this.newNotice.content) return;

    this.notices.push({
    id: this.notices.length + 1,
    title: this.newNotice.title!,
    content: this.newNotice.content!,
    visibleFor: this.newNotice.visibleFor!,
    createdBy: 'Preceptor Demo',
    createdAt: new Date()
    });

    this.newNotice = { title: '', content: '', visibleFor: 'alumno' };
    }
}
