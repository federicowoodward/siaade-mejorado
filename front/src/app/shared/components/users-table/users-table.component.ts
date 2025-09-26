import {
  Component, Input, Output, EventEmitter, signal, OnChanges, SimpleChanges, ViewChild
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Table, TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { FormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { Tooltip } from 'primeng/tooltip';
import { SelectModule } from 'primeng/select';
import { RoleLabelPipe } from '../../pipes/role-label.pipe';
import { Role, UserRow, RowAction, UsersTableContext } from '../../../core/models/users-table.models';
import { actionsFor, canSee } from '../../../core/policy/users.policy';

@Component({
  selector: 'app-users-table',
  standalone: true,
  imports: [
    CommonModule, TableModule, ButtonModule, DialogModule, FormsModule,
    InputTextModule, Tooltip, SelectModule, RoleLabelPipe
  ],
  templateUrl: './users-table.component.html',
  styleUrl: './users-table.component.scss',
})
export class UsersTableComponent implements OnChanges {
  // Datos & contexto
  @Input({ required: true }) viewerRole!: Role;                  // QUIÉN mira
  @Input({ required: true }) context: UsersTableContext = 'default';
  @Input({ required: true }) rows: UserRow[] = [];               // Datos ya mapeados
  @Input() roleFilterEnabled = true;                             // Mostrar combo de filtro por rol

  // Output de acciones
  @Output() rowAction = new EventEmitter<{ actionId: string; row: UserRow }>();
  @Output() rowClick  = new EventEmitter<UserRow>();

  // Filtros UI locales
  selectedRole = signal<Role | null>(null);

  @ViewChild('dt') dt!: Table;

  // Derivados de permisos (cacheados simples)
  getVisibleRows(): UserRow[] {
    if (!this.viewerRole) return [];
    return this.rows.filter(r => canSee(this.viewerRole, r.role));
  }

  getRowActions(row: UserRow): RowAction[] {
    return actionsFor(this.viewerRole, row.role, this.context);
  }

  ngOnChanges(_: SimpleChanges) {
    // Si cambia context/rol/rows, PrimeTable ya re-renderiza
  }

  onActionClick(action: RowAction, row: UserRow) {
    this.rowAction.emit({ actionId: action.id, row });
  }

  clear(table: Table, filterInput: HTMLInputElement) {
    filterInput.value = '';
    this.dt?.filterGlobal('', 'contains');
    this.selectedRole.set(null);
    table.clear();
  }
}
