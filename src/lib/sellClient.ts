import { Step } from '../types/steps';
import { makeStepTags, parseNoteContentToStep, serializeStepToNoteContent } from './stepSerialization';

const SELL_BASE_URL = (process.env.SELL_BASE_URL || '').replace(/\/+$/, '');
const SELL_ACCESS_TOKEN = process.env.SELL_ACCESS_TOKEN || '';
const SELL_TIPS_CONTACT_ID = process.env.SELL_TIPS_CONTACT_ID || '';

if (!SELL_BASE_URL) {
  console.warn('SELL_BASE_URL is not configured. Zendesk Sell integration will be disabled.');
}
if (!SELL_ACCESS_TOKEN) {
  console.warn('SELL_ACCESS_TOKEN is not configured. Zendesk Sell integration will be disabled.');
}
if (!SELL_TIPS_CONTACT_ID) {
  console.warn('SELL_TIPS_CONTACT_ID is not configured. Zendesk Sell integration will be disabled.');
}

const MAX_RETRIES = 3;
const RETRY_BASE_DELAY = 500;

type SellNote = {
  id: number;
  content: string;
  tags?: string[];
};

type StepListOptions = {
  dealId?: string;
};

async function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function unwrap<T>(payload: any): T[] {
  if (!payload) return [];
  if (Array.isArray(payload.data)) return payload.data as T[];
  if (Array.isArray(payload.items)) {
    return payload.items
      .map((item: any) => item?.data)
      .filter(Boolean) as T[];
  }
  return [];
}

function buildUrl(path: string): string {
  if (!SELL_BASE_URL) {
    throw new Error('SELL_BASE_URL is not configured');
  }
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${SELL_BASE_URL}${normalized}`;
}

export async function sellFetch(path: string, init: RequestInit = {}): Promise<Response> {
  if (!SELL_ACCESS_TOKEN) {
    throw new Error('SELL_ACCESS_TOKEN is not configured');
  }
  const headers = new Headers(init.headers || {});
  headers.set('Authorization', `Bearer ${SELL_ACCESS_TOKEN}`);
  headers.set('Accept', 'application/json');
  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const url = buildUrl(path);
  let attempt = 0;
  let lastError: unknown;

  while (attempt <= MAX_RETRIES) {
    try {
      const response = await fetch(url, { ...init, headers });
      if (response.status === 429 && attempt < MAX_RETRIES) {
        const retryAfter = Number(response.headers.get('Retry-After'));
        const delayMs = Number.isFinite(retryAfter) && retryAfter > 0
          ? retryAfter * 1000
          : RETRY_BASE_DELAY * Math.pow(2, attempt);
        await delay(delayMs);
        attempt += 1;
        continue;
      }
      if (response.status === 401 || response.status === 403) {
        const message = await response.text();
        throw new Error(`Zendesk Sell auth failed (${response.status}): ${message}`);
      }
      if (!response.ok) {
        const message = await response.text();
        throw new Error(`Zendesk Sell error (${response.status}): ${message}`);
      }
      return response;
    } catch (err) {
      lastError = err;
      if (attempt >= MAX_RETRIES) {
        break;
      }
      await delay(RETRY_BASE_DELAY * Math.pow(2, attempt));
      attempt += 1;
    }
  }

  throw lastError instanceof Error ? lastError : new Error('Unknown error calling Zendesk Sell');
}

function normalizeDealId(dealId?: string): string | undefined {
  const trimmed = dealId?.trim();
  return trimmed ? trimmed : undefined;
}

function ensureMetadata(step: Step, key: string, dealId?: string): Step {
  const stepWithMeta = { ...step } as Step & { checklist_key?: string; deal_id?: string };
  stepWithMeta.checklist_key = key;
  if (dealId !== undefined) {
    stepWithMeta.deal_id = dealId;
  }
  return stepWithMeta;
}

function ensureConfigured() {
  if (!SELL_BASE_URL || !SELL_ACCESS_TOKEN || !SELL_TIPS_CONTACT_ID) {
    throw new Error('Zendesk Sell environment variables are missing');
  }
}

function matchesChecklistTags(tags: string[] | undefined, key: string, stepId?: string, dealId?: string): boolean {
  if (!tags || tags.length === 0) return false;
  const hasChecklist = tags.includes(`checklist:${key}`);
  const hasStep = stepId ? tags.includes(`step:${stepId}`) : true;
  const hasDeal = dealId ? tags.includes(`deal:${dealId}`) : true;
  return hasChecklist && hasStep && hasDeal && tags.includes('step');
}

export async function listStepsByChecklistKey(key: string, options: StepListOptions = {}): Promise<{ noteId: string; step: Step }[]> {
  ensureConfigured();
  const response = await sellFetch(`/v2/notes?resource_type=contact&resource_id=${encodeURIComponent(SELL_TIPS_CONTACT_ID)}&per_page=100&sort_by=updated_at:desc`);
  const payload = await response.json();
  const notes = unwrap<SellNote>(payload);
  const normalizedDealId = normalizeDealId(options.dealId);

  const filtered = notes.filter((note) => matchesChecklistTags(note.tags, key, undefined, normalizedDealId));
  return filtered.map((note) => {
    const step = parseNoteContentToStep(note.content);
    const dealId = normalizeDealId((step as Step & { deal_id?: string }).deal_id ?? normalizedDealId);
    const withMeta = ensureMetadata(step, key, dealId);
    return {
      noteId: String(note.id),
      step: withMeta,
    };
  }).sort((a, b) => a.step.order - b.step.order);
}

export async function getStepById(key: string, stepId: string, options: StepListOptions = {}): Promise<{ noteId: string; step: Step } | null> {
  const all = await listStepsByChecklistKey(key, options);
  return all.find(({ step }) => step.id === stepId) ?? null;
}

export async function createStep(key: string, step: Step, options: StepListOptions = {}): Promise<{ noteId: string; step: Step }> {
  ensureConfigured();
  const normalizedDealId = normalizeDealId(options.dealId ?? step.deal_id);
  const stepWithMeta = ensureMetadata(step, key, normalizedDealId);
  const body = {
    data: {
      resource_type: 'contact',
      resource_id: SELL_TIPS_CONTACT_ID,
      content: serializeStepToNoteContent(stepWithMeta),
      tags: makeStepTags(key, step.id, normalizedDealId),
      type: 'regular',
    },
    meta: { type: 'note' },
  };

  const response = await sellFetch('/v2/notes', {
    method: 'POST',
    body: JSON.stringify(body),
  });
  const payload = await response.json();
  const [createdNote] = unwrap<SellNote>(payload);
  const note = createdNote || payload.data;
  if (!note) {
    throw new Error('Respuesta inesperada al crear nota de paso');
  }
  const createdStep = parseNoteContentToStep(note.content);
  const dealId = normalizeDealId((createdStep as Step & { deal_id?: string }).deal_id ?? normalizedDealId);
  const withMeta = ensureMetadata(createdStep, key, dealId);
  return { noteId: String(note.id), step: withMeta };
}

export async function updateStep(noteId: string, key: string, step: Step, options: StepListOptions = {}): Promise<{ noteId: string; step: Step }> {
  ensureConfigured();
  const normalizedDealId = normalizeDealId(options.dealId ?? step.deal_id);
  const stepWithMeta = ensureMetadata(step, key, normalizedDealId);
  const body = {
    data: {
      content: serializeStepToNoteContent(stepWithMeta),
      tags: makeStepTags(key, step.id, normalizedDealId),
    },
    meta: { type: 'note' },
  };

  const response = await sellFetch(`/v2/notes/${encodeURIComponent(noteId)}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  });
  const payload = await response.json();
  const [updatedNote] = unwrap<SellNote>(payload);
  const note = updatedNote || payload.data;
  if (!note) {
    throw new Error('Respuesta inesperada al actualizar nota de paso');
  }
  const updatedStep = parseNoteContentToStep(note.content);
  const dealId = normalizeDealId((updatedStep as Step & { deal_id?: string }).deal_id ?? normalizedDealId);
  const withMeta = ensureMetadata(updatedStep, key, dealId);
  return { noteId: String(note.id), step: withMeta };
}

export async function deleteStep(noteId: string): Promise<void> {
  ensureConfigured();
  await sellFetch(`/v2/notes/${encodeURIComponent(noteId)}`, {
    method: 'DELETE',
  });
}
