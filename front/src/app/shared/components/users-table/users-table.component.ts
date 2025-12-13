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

type UserRowWithFullName = UserRow & { fullName: string };

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
  visibleRows: UserRowWithFullName[] = [];

  @ViewChild('dt') dt!: Table;
  private actionsCache = new Map<
    string,
    { cacheKey: string; actions: RowAction[] }
  >();

  ngOnChanges(changes: SimpleChanges) {
    const roleChanged = !!changes['viewerRole'];
    const rowsChanged = !!changes['rows'];
    const contextChanged = !!changes['context'];

    if (roleChanged || rowsChanged) {
      this.visibleRows = this.computeVisibleRows();
    }

    if (roleChanged || contextChanged) {
      this.actionsCache.clear();
    } else if (rowsChanged) {
      const ids = new Set(this.rows.map((r) => r.id));
      for (const id of Array.from(this.actionsCache.keys())) {
        if (!ids.has(id)) this.actionsCache.delete(id);
      }
    }
  }

  getRowActions(row: UserRow): RowAction[] {
    if (!this.viewerRole) return [];

    const cacheKey = `${this.viewerRole}-${row.role}-${this.context}`;
    const cached = this.actionsCache.get(row.id);
    if (cached?.cacheKey === cacheKey) return cached.actions;

    const actions = actionsFor(this.viewerRole, row.role, this.context);
    this.actionsCache.set(row.id, { cacheKey, actions });
    return actions;
  }

  onActionClick(action: RowAction, row: UserRow) {
    this.rowAction.emit({ actionId: action.id, row });
  }

  trackAction(_: number, action: RowAction) {
    return action.id;
  }

  clear(table: Table, filterInput: HTMLInputElement) {
    filterInput.value = '';
    this.dt?.filterGlobal('', 'contains');
    this.selectedRole = null;
    table.clear();
  }

  private computeVisibleRows(): UserRowWithFullName[] {
    if (!this.viewerRole) return [];
    return this.rows
      .filter((r) => canSee(this.viewerRole, r.role))
      .map((r) => ({
        ...r,
        fullName: `${r.name ?? ''} ${r.lastName ?? ''}`.trim(),
      }));
  }
}
