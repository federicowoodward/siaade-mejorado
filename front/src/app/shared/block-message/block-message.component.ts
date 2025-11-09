import {
  AfterViewInit,
  Component,
  ElementRef,
  Input,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import type { ButtonSeverity } from 'primeng/button';

export type BlockMessageVariant =
  | 'institutional'
  | 'official'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info';

type BlockMessageActionSeverity =
  | Exclude<ButtonSeverity, null | undefined>
  | 'warning';

export interface BlockMessageAction {
  label: string;
  icon?: string;
  severity?: BlockMessageActionSeverity | null;
  ariaLabel?: string;
  disabled?: boolean;
  command?: () => void;
}

@Component({
  selector: 'app-block-message',
  standalone: true,
  imports: [CommonModule, ButtonModule],
  templateUrl: './block-message.component.html',
  styleUrl: './block-message.component.scss',
})
export class BlockMessageComponent implements AfterViewInit {
  @Input() variant: BlockMessageVariant = 'institutional';
  @Input() title = 'Accion bloqueada';
  @Input() message: string | string[] = '';
  @Input() reasonCode?: string | null;
  @Input() ariaLive: 'assertive' | 'polite' = 'assertive';
  @Input() role: 'alert' | 'status' | 'region' = 'alert';
  @Input() icon?: string;
  @Input() autoFocus = false;
  @Input() actions: BlockMessageAction[] = [];

  @ViewChild('wrapper', { static: true }) wrapper?: ElementRef<HTMLDivElement>;

  ngAfterViewInit(): void {
    if (this.autoFocus && this.wrapper) {
      setTimeout(() => this.wrapper?.nativeElement.focus(), 0);
    }
  }

  asList(payload: string | string[]): string[] {
    if (Array.isArray(payload)) {
      return payload.filter((line) => !!line?.trim());
    }
    return payload ? [payload] : [];
  }

  resolveIcon(): string {
    if (this.icon) return this.icon;
    switch (this.variant) {
      case 'official':
        return 'pi pi-shield';
      case 'success':
        return 'pi pi-check-circle';
      case 'warning':
        return 'pi pi-exclamation-triangle';
      case 'danger':
        return 'pi pi-ban';
      case 'info':
        return 'pi pi-info-circle';
      default:
        return 'pi pi-lock';
    }
  }

  onAction(action: BlockMessageAction): void {
    if (action.disabled) return;
    action.command?.();
  }

  resolveSeverity(action: BlockMessageAction): ButtonSeverity {
    const value = action?.severity ?? 'secondary';
    const normalized = value === 'warning' ? 'warn' : value;
    return normalized as ButtonSeverity;
  }

  trackByAction(index: number, action: BlockMessageAction): string {
    return action?.label ?? String(index);
  }
}

