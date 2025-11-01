import { Step } from '../types/steps';

const FRONT_MATTER_REGEX = /^---\s*\n([\s\S]*?)\n---\s*\n?/;

type FrontMatter = Record<string, string>;

const VALID_STATUS = new Set(['pending', 'done']);

function parseFrontMatter(content: string): { data: FrontMatter; body: string } {
  const match = content.match(FRONT_MATTER_REGEX);
  if (!match) {
    throw new Error('Step note content missing front-matter header');
  }
  const [, fm] = match;
  const body = content.slice(match[0].length);
  const data: FrontMatter = {};
  fm.split(/\r?\n/).forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const idx = trimmed.indexOf(':');
    if (idx === -1) return;
    const key = trimmed.slice(0, idx).trim();
    let value = trimmed.slice(idx + 1).trim();
    if (value === 'null' || value === '~') {
      value = '';
    }
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    data[key] = value;
  });
  return { data, body };
}

function coerceStatus(value: string | undefined): 'pending' | 'done' {
  const normalized = (value || '').toLowerCase();
  if (!VALID_STATUS.has(normalized)) {
    throw new Error(`Invalid step status: ${value}`);
  }
  return normalized as 'pending' | 'done';
}

function formatValue(value: unknown): string {
  if (value === undefined || value === null || value === '') {
    return '';
  }
  if (typeof value === 'number') {
    return String(value);
  }
  const str = String(value);
  if (/^[A-Za-z0-9_\-]+$/.test(str)) {
    return str;
  }
  return JSON.stringify(str);
}

export function serializeStepToNoteContent(step: Step): string {
  if (!VALID_STATUS.has(step.status)) {
    throw new Error(`Invalid step status: ${step.status}`);
  }
  const checklistKey = (step as Step & { checklist_key?: string }).checklist_key ?? '';
  const frontMatterLines = [
    ['type', 'step'],
    ['checklist_key', checklistKey],
    ['step_id', step.id],
    ['title', step.title],
    ['desc', step.desc ?? ''],
    ['href', step.href ?? ''],
    ['note', step.note ?? ''],
    ['status', step.status],
    ['order', step.order],
    ['support_ticket_id', step.support_ticket_id ?? ''],
    ['updated_by', step.updated_by],
    ['updated_at', step.updated_at],
  ] as const;

  const lines = frontMatterLines
    .map(([key, value]) => `${key}: ${formatValue(value)}`)
    .join('\n');

  return `---\n${lines}\n---\n`;
}

export function parseNoteContentToStep(content: string): Step {
  const { data } = parseFrontMatter(content);
  if (data.type && data.type !== 'step') {
    throw new Error(`Unsupported note type: ${data.type}`);
  }

  const id = data.step_id;
  if (!id) throw new Error('Step missing identifier');
  const title = data.title || '';
  if (!title) throw new Error('Step missing title');
  const order = Number(data.order ?? '0');
  if (!Number.isFinite(order)) {
    throw new Error(`Invalid step order: ${data.order}`);
  }
  const status = coerceStatus(data.status);
  const updatedAt = data.updated_at;
  if (!updatedAt || Number.isNaN(Date.parse(updatedAt))) {
    throw new Error(`Invalid updated_at value: ${updatedAt}`);
  }
  const supportTicketId = data.support_ticket_id ? Number(data.support_ticket_id) : undefined;
  if (supportTicketId !== undefined && Number.isNaN(supportTicketId)) {
    throw new Error(`Invalid support_ticket_id: ${data.support_ticket_id}`);
  }

  const step: Step = {
    id,
    title,
    desc: data.desc || undefined,
    href: data.href || undefined,
    note: data.note || undefined,
    status,
    order,
    support_ticket_id: supportTicketId,
    updated_by: data.updated_by || 'unknown@clinyco.cl',
    updated_at: updatedAt,
  };

  if (data.checklist_key) {
    (step as Step & { checklist_key?: string }).checklist_key = data.checklist_key;
  }

  return step;
}

export function makeStepTags(key: string, stepId: string): string[] {
  const normalizedKey = key.trim();
  const normalizedStep = stepId.trim();
  if (!normalizedKey) throw new Error('Checklist key is required to build tags');
  if (!normalizedStep) throw new Error('Step id is required to build tags');
  return ['step', `checklist:${normalizedKey}`, `step:${normalizedStep}`];
}
