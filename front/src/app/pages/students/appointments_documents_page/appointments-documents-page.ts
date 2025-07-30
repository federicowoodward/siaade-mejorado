import { Component } from '@angular/core';
import { Button } from 'primeng/button';

@Component({
  selector: 'app-appointments-documents-page',
  imports: [Button],
  templateUrl: './appointments-documents-page.html',
  styleUrl: './appointments-documents-page.scss',
})
export class AppointmentsDocumentsPage {
  
  downloadCertificate() {
    //integrar servicio de generacion y datos de usuario
    window.open('assets/doc.pdf', '_blank');
  }
}
