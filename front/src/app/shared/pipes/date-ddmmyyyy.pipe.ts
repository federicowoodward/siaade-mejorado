import { Pipe, PipeTransform } from '@angular/core';
import { formatDDMMYYYY } from '../utils/date-utils';

@Pipe({
  name: 'ddmmyyyy',
  standalone: true,
  pure: true,
})
export class DateDdmmyyyyPipe implements PipeTransform {
  transform(value: string | number | Date | null | undefined): string {
    return formatDDMMYYYY(value);
  }
}

