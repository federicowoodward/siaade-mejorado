import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';

export type MoveCommissionOption = { id: number; letter: string | null };

@Component({
  selector: 'app-subject-move-commission-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, DialogModule, ButtonModule],
  templateUrl: './subject-move-commission.dialog.html',
})
export class SubjectMoveCommissionDialog {
  @Input() loading = false;
  @Input() currentCommissionId: number | null = null;
  @Input() options: MoveCommissionOption[] = [];
  @Input() disableMove = false;

  @Output() cancel = new EventEmitter<void>();
  @Output() confirm = new EventEmitter<number>();

  dialogVisible = false;
  selectedNewCommission: number | null = null;
  private closingFromParent = false;

  @Input()
  set visible(value: boolean) {
    this.dialogVisible = value;
    if (!value) {
      this.closingFromParent = true;
      this.resetSelection();
    } else {
      this.closingFromParent = false;
    }
  }

  get isMoveDisabled(): boolean {
    return this.loading || this.disableMove || !this.selectedNewCommission;
  }

  handleHide(): void {
    this.dialogVisible = false;
    this.resetSelection();
    if (!this.closingFromParent) {
      this.cancel.emit();
    }
    this.closingFromParent = false;
  }

  onCancel(): void {
    this.dialogVisible = false;
  }

  onConfirm(): void {
    if (
      this.loading ||
      this.disableMove ||
      !this.selectedNewCommission ||
      this.selectedNewCommission === this.currentCommissionId
    ) {
      return;
    }
    this.confirm.emit(this.selectedNewCommission);
  }

  private resetSelection(): void {
    this.selectedNewCommission = null;
  }
}
