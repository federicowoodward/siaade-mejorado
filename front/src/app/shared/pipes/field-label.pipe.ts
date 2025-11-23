import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'fieldLabel',
  standalone: true,
})
export class FieldLabelPipe implements PipeTransform {
  private fieldMap: Record<string, string> = {
    name: 'Nombre',
    lastName: 'Apellido',
    email: 'Correo electrónico',
    cuil: 'CUIL',
    documentType: 'Tipo de documento',
    documentValue: 'Número de documento',
    phone: 'Teléfono',
    emergencyName: 'Nombre contacto emergencia',
    emergencyPhone: 'Teléfono emergencia',
    sex: 'Sexo',
    birthDate: 'Fecha de nacimiento',
    street: 'Calle',
    number: 'Número',
    floor: 'Piso',
    apartment: 'Departamento',
    neighborhood: 'Barrio',
    locality: 'Localidad',
    province: 'Provincia',
    postalCode: 'Código Postal',
    password: 'Contraseña',
  };

  transform(fieldKey: string): string {
    return this.fieldMap[fieldKey] || fieldKey;
  }
}
