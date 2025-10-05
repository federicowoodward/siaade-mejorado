import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RolesService } from '../core/services/role.service';
import { FormsModule } from '@angular/forms';
import { BotMailService } from './bot-mail.service';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-bot-fab',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonModule],
  template: `
  <div *ngIf="canShow()" class="bot-fab-wrapper">
    <div *ngIf="!open()" class="bot-fab-bubble" (click)="toggle()">
      <span class="bubble-text">Bot Mail</span>
      <div class="avatar"><i class="pi pi-send"></i></div>
    </div>

    <div *ngIf="open()" class="bot-panel shadow-4">
      <div class="panel-header">
        <div class="avatar small"><i class="pi pi-send"></i></div>
        <h4 class="m-0">Asistente de Correos</h4>
        <button pButton icon="pi pi-times" class="p-button-text p-button-sm" (click)="toggle()"></button>
      </div>

      <form (ngSubmit)="submit()" class="panel-body" *ngIf="mode() === 'form'">
        <label>Asunto</label>
        <input type="text" [(ngModel)]="subject" name="subject" required />

        <label class="mt-2">Mensaje (HTML o texto)</label>
        <textarea rows="5" [(ngModel)]="body" name="body" required></textarea>

        <label class="mt-2">Roles destinatarios</label>
        <div class="roles">
          <label *ngFor="let r of selectableRoles">
            <input type="checkbox" [value]="r" (change)="toggleRole(r,$event)" [checked]="selectedRoles().includes(r)" /> {{ r }}
          </label>
        </div>

        <div class="mt-2 flex gap-2">
          <button pButton type="button" label="Dry Run" (click)="dryRun()" [disabled]="sending()"></button>
          <button pButton type="submit" label="Enviar" class="p-button-success" [disabled]="sending()"></button>
        </div>

        <div *ngIf="sending()" class="mt-2 text-sm text-info">Procesando…</div>
      </form>

      <div *ngIf="mode() === 'preview'" class="panel-body">
        <p><strong>Previsualización</strong></p>
        <p>Total estimado: {{ previewCount }}</p>
        <button pButton label="Confirmar Envío" (click)="confirmSend()" class="p-button-success"></button>
        <button pButton label="Volver" class="p-button-secondary ml-2" (click)="mode.set('form')"></button>
      </div>

      <div class="panel-footer">
        <small *ngIf="batches().length">Últimos lotes:</small>
        <ul class="batch-list" *ngIf="batches().length">
          <li *ngFor="let b of batches() | slice:0:5">
            <span class="id">{{ b.id }}</span>
            <span>{{ b.subject }}</span>
            <span>{{ b.sent }}/{{ b.total }} ({{ b.status }})</span>
          </li>
        </ul>
      </div>
    </div>
  </div>
  `,
  styles: [`
  .bot-fab-wrapper { position: fixed; bottom: 1.25rem; right: 1.25rem; z-index: 1100; font-family: var(--font-family, inherit); }
  .bot-fab-bubble { cursor: pointer; display: flex; align-items: center; background: #fff; border-radius: 999px; padding: .4rem .75rem .4rem .4rem; box-shadow: 0 4px 14px -4px rgba(0,0,0,.3); transition: box-shadow .2s; }
  .bot-fab-bubble:hover { box-shadow: 0 6px 18px -4px rgba(0,0,0,.4); }
  .bubble-text { margin-right: .5rem; font-size: .85rem; font-weight: 500; }
  .avatar { width: 40px; height: 40px; border-radius: 50%; background: linear-gradient(135deg,#6366f1,#4338ca); display:flex; align-items:center; justify-content:center; color:#fff; }
  .avatar.small { width:28px; height:28px; font-size:.75rem; margin-right:.5rem; }
  .bot-panel { width: 350px; background:#fff; border-radius: .75rem; overflow:hidden; display:flex; flex-direction:column; }
  .panel-header { display:flex; align-items:center; gap:.5rem; padding:.6rem .75rem; background:#f1f5f9; }
  .panel-body { padding:.75rem .9rem; display:flex; flex-direction:column; }
  .panel-body input, .panel-body textarea { width:100%; font-size:.85rem; }
  .panel-footer { padding:.5rem .75rem .75rem; background:#fafafa; }
  .roles { display:flex; flex-wrap:wrap; gap:.5rem; font-size:.75rem; }
  .batch-list { list-style:none; margin:.25rem 0 0; padding:0; max-height:120px; overflow:auto; font-size:.65rem; }
  .batch-list li { display:grid; grid-template-columns: 64px 1fr auto; gap:.4rem; padding:.25rem 0; border-bottom:1px solid #eee; }
  .batch-list li:last-child { border-bottom:none; }
  `]
})
export class BotFabComponent {
  private rolesService = inject(RolesService);
  private mail = inject(BotMailService);

  open = signal(false);
  mode = signal<'form' | 'preview'>('form');
  subject = '';
  body = '';
  selectedRoles = signal<string[]>(['teacher']);
  previewCount = 0;

  sending = this.mail.sending;
  batches = this.mail.batches;

  selectableRoles = ['teacher','student','preceptor','secretary'];

  canShow = computed(() => this.rolesService.isOneOf(['secretary','preceptor']));

  toggle() { this.open.set(!this.open()); }

  toggleRole(r: string, ev: Event) {
    const checked = (ev.target as HTMLInputElement).checked;
    this.selectedRoles.update(list => checked ? [...list, r] : list.filter(x => x!==r));
  }

  dryRun() {
    this.mail.createDraft({ subject: this.subject, body: this.body, roles: this.selectedRoles(), dryRun: true })
      .then(r => { this.previewCount =  r.total || 120; this.mode.set('preview'); });
  }

  confirmSend() {
    this.mail.createDraft({ subject: this.subject, body: this.body, roles: this.selectedRoles(), dryRun: false })
      .then(r => {
        this.mail.simulateProgress(r.id);
        this.mode.set('form');
        this.subject=''; this.body='';
      });
  }

  submit() {
    this.confirmSend();
  }
}
