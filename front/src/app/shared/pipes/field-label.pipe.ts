import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'fieldLabel',
  standalone: true,
})
export class FieldLabelPipe implements PipeTransform {
  private baseMap: Record<string, string> = {
    // user
    role: 'Rol',
    name: 'Nombre',
    lastName: 'Apellido',
    email: 'Correo electrónico',
    cuil: 'CUIL',
    password: 'Contraseña',

    // user_info / comunes
    documentType: 'Tipo de documento',
    documentValue: 'Número de documento',
    phone: 'Teléfono',
    emergencyName: 'Nombre contacto emergencia',
    emergencyPhone: 'Teléfono emergencia',

    // common_data
    sex: 'Sexo',
    birthDate: 'Fecha de nacimiento',

    // dirección
    street: 'Calle',
    number: 'Número',
    floor: 'Piso',
    apartment: 'Departamento',
    neighborhood: 'Barrio',
    locality: 'Localidad',
    province: 'Provincia',
    postalCode: 'Código Postal',

    // roleExtras (para student / secretary)
    legajo: 'Legajo',
    isActive: 'Activo',
    studentStartYear: 'Año de inicio',
    career: 'Carrera',
    commission: 'Comision',
    commissions: 'Comisiones',
    subjects: 'Materias',
    isDirective: 'Es directivo',
  };

  private roleMap: Record<string, string> = {
    student: 'Alumno',
    teacher: 'Docente',
    preceptor: 'Preceptor',
    secretary: 'Secretaría',
  };

  transform(fieldKey: string, value?: unknown): string {
    let key = fieldKey;

    // Remover prefijos como "user.role", "common_data.sex", "roleExtras.legajo"
    if (key.includes('.')) {
      key = key.split('.').pop() as string;
    }

    // Si el pipe se usa para mostrar el VALOR (cuando lo llamás con el segundo arg)
    if (value !== undefined) {
      // Rol con traducción
      if (key === 'role' && typeof value === 'string') {
        return this.roleMap[value] || value;
      }

      // Booleanos
      if (value === true) return 'Sí';
      if (value === false) return 'No';
    }

    // Si es un label
    return this.baseMap[key] || key;
  }
}
