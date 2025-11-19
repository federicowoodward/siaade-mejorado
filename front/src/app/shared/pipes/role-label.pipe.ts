import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'roleLabel',
  standalone: true,
})
export class RoleLabelPipe implements PipeTransform {
  private roleMap: Record<string, string> = {
    student: 'Alumno',
    teacher: 'Docente',
    preceptor: 'Preceptor',
    secretary: 'Secretario',
    executive_secretary: 'Secretario directivo',
  };

  transform(roleKey: string): string {
    return this.roleMap[roleKey] || roleKey;
  }
}
