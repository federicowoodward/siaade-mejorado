import { Injectable } from '@angular/core';
import { Location } from '@angular/common';

@Injectable({ providedIn: 'root' })
export class GoBackService {
  constructor(private location: Location) {}

  back(): void {
    this.location.back();
  }
}
