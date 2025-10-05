export interface CreateBatchCriteria {
  roles?: string[];          // roles a incluir
  excludeRoles?: string[];   // roles a excluir
  onlyActive?: boolean;      // placeholder futuro
}

export interface CreateBatchInput {
  subject: string;
  body?: string;             // cuerpo plano / HTML
  template?: string;         // nombre de plantilla (futuro)
  criteria: CreateBatchCriteria;
  dryRun?: boolean;
}

export interface BatchRecord {
  id: string;
  subject: string;
  body: string;
  total: number;
  sent: number;
  failed: number;
  status: 'pending' | 'processing' | 'completed' | 'completed_with_errors' | 'canceled';
  createdAt: Date;
  startedAt?: Date;
  finishedAt?: Date;
}

export interface RecipientRecord {
  email: string;
  status: 'pending' | 'sending' | 'sent' | 'failed' | 'canceled';
  error?: string;
}

export interface BatchStatus extends BatchRecord {
  recipients?: RecipientRecord[];
}
