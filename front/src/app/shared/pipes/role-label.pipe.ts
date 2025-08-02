// #ASUMIENDO CODIGO: src/app/shared/pipes/role-label.pipe.ts
import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'roleLabel',
  standalone: true,
})
export class RoleLabelPipe implements PipeTransform {
  private roleMap: Record<string, string> = {
    student:   'Alumno',
    teacher:   'Docente',
    preceptor: 'Preceptor',
    secretary: 'Secretario',
  };

  transform(roleKey: string): string {
    return this.roleMap[roleKey] || roleKey;
  }
}
