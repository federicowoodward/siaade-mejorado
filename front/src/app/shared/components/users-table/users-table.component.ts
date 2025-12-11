// este componetne queda igual, no deberia recibir mod
import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnChanges,
  SimpleChanges,
  ViewChild,
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
import {
  Role,
  UserRow,
  RowAction,
  UsersTableContext,
} from '../../../core/models/users-table.models';
import { actionsFor, canSee } from '../../../core/policy/users.policy';
import { exportPrimengCsv } from '../../utils/primeng-export.utils';

@Component({
  selector: 'app-users-table',
  standalone: true,
  imports: [
    CommonModule,
    TableModule,
    ButtonModule,
    DialogModule,
    FormsModule,
    InputTextModule,
    Tooltip,
    SelectModule,
    RoleLabelPipe,
  ],
  templateUrl: './users-table.component.html',
  styleUrl: './users-table.component.scss',
})
export class UsersTableComponent implements OnChanges {
  // Datos & contexto
  @Input({ required: true }) viewerRole!: Role; // QUIÉN mira
  @Input({ required: true }) context: UsersTableContext = 'default';
  @Input({ required: true }) rows: UserRow[] = []; // Datos ya mapeados
  @Input() roleFilterEnabled = true; // Mostrar combo de filtro por rol

  // Output de acciones
  @Output() rowAction = new EventEmitter<{ actionId: string; row: UserRow }>();

  // Filtros UI locales
  selectedRole: Role | null = null;
  readonly exportColumns: Array<{ field: string; header: string }> = [
    { field: 'name', header: 'Nombre' },
    { field: 'lastName', header: 'Apellido' },
    { field: 'cuil', header: 'DNI/CUIL' },
    { field: 'email', header: 'Email' },
    { field: 'role', header: 'Rol' },
  ];
  readonly exportPrimengCsv = exportPrimengCsv;

  @ViewChild('dt') dt!: Table;

  // Derivados de permisos (cacheados simples)
  getVisibleRows(): UserRow[] {
    if (!this.viewerRole) return [];
    return this.rows.filter((r) => canSee(this.viewerRole, r.role));
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
    this.selectedRole = null;
    table.clear();
  }
}
