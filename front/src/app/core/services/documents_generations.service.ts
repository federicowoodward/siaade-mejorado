import { Injectable } from '@angular/core';

// en este servicio vamos a manejar descarga y generacion de documentos (en caso de exisitir muchas opciones pasa a ser un orquestador)
@Injectable({ providedIn: 'root' })
export class DocumentsService {
  downloadStudentCertificate() {
    //integrar servicio de generacion y datos de usuario
    window.open('assets/doc.pdf', '_blank');
  }
}
