import { Component, inject } from '@angular/core';
import { Button } from 'primeng/button';
import { DocumentsService } from '../../../core/services/documents_generations.service';

@Component({
  selector: 'app-appointments-documents-page',
  imports: [Button],
  templateUrl: './appointments-documents-page.html',
  styleUrl: './appointments-documents-page.scss',
})
export class AppointmentsDocumentsPage {
  private documentsService = inject(DocumentsService);
  
  downloadCertificate() {
    this.documentsService.downloadStudentCertificate();
  }
}
