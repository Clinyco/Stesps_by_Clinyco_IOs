import { Step } from '../types/steps';
import { assertStepIsSafe } from './safety';

const VALID_STATUS = new Set(['pending', 'done']);

function generateId() {
  if (globalThis.crypto && 'randomUUID' in globalThis.crypto) {
    return globalThis.crypto.randomUUID();
  }
  return `step-${Math.random().toString(16).slice(2)}`;
}

export function normalizeStatus(status: unknown): 'pending' | 'done' {
  const value = typeof status === 'string' ? status.toLowerCase() : '';
  if (!VALID_STATUS.has(value)) {
    throw Object.assign(new Error('Estado inválido'), { status: 422 });
  }
  return value as 'pending' | 'done';
}

export function parseOrder(value: unknown): number {
  const order = Number(value);
  if (!Number.isFinite(order)) {
    throw Object.assign(new Error('Orden inválido'), { status: 422 });
  }
  return order;
}

export function buildStepFromPayload(input: any, email: string, overrides: Partial<Step> = {}): Step {
  if (!input || typeof input !== 'object') {
    throw Object.assign(new Error('Payload inválido'), { status: 422 });
  }
  if (!input.title || typeof input.title !== 'string') {
    throw Object.assign(new Error('Título requerido'), { status: 422 });
  }
  const status = normalizeStatus(input.status ?? overrides.status ?? 'pending');
  const order = parseOrder(input.order ?? overrides.order ?? 0);
  const supportTicketId = input.support_ticket_id != null ? Number(input.support_ticket_id) : overrides.support_ticket_id;
  if (supportTicketId !== undefined && !Number.isFinite(supportTicketId)) {
    throw Object.assign(new Error('support_ticket_id inválido'), { status: 422 });
  }
  const dealIdInput = input.deal_id ?? overrides.deal_id;
  let dealId: string | undefined;
  if (dealIdInput !== undefined) {
    if (typeof dealIdInput !== 'string') {
      throw Object.assign(new Error('deal_id inválido'), { status: 422 });
    }
    const trimmed = dealIdInput.trim();
    dealId = trimmed || undefined;
  }

  const step: Step = {
    id: typeof input.id === 'string' && input.id ? input.id : overrides.id || generateId(),
    title: input.title,
    desc: input.desc ?? overrides.desc,
    href: input.href ?? overrides.href,
    note: input.note ?? overrides.note,
    status,
    order,
    support_ticket_id: supportTicketId,
    deal_id: dealId,
    updated_by: email,
    updated_at: new Date().toISOString(),
  };

  (step as Step & { checklist_key?: string }).checklist_key =
    (overrides as Step & { checklist_key?: string }).checklist_key ?? input.checklist_key;

  assertStepIsSafe(step);
  return step;
}
