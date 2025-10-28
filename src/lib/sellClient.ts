import matter from 'gray-matter';
import { marked } from 'marked';
import YAML from 'yaml';

export interface TipRecord {
  id: string;
  title: string;
  body_md: string;
  body_html: string;
  tags: string[];
  status: 'draft' | 'published';
  updated_at: string;
  updated_by?: string;
}

const BASE_URL = process.env.SELL_BASE_URL ?? 'https://api.getbase.com';
const ACCESS_TOKEN = process.env.SELL_ACCESS_TOKEN ?? '';
const CONTACT_ID = process.env.SELL_TIPS_CONTACT_ID ? Number(process.env.SELL_TIPS_CONTACT_ID) : undefined;
const ENABLE_CUSTOM_OBJECTS = process.env.ENABLE_CUSTOM_OBJECTS === 'true';

const USER_AGENT = 'Clinyco-Steps/1.0 (+https://clinyco.cl)';

class SellUnauthorizedError extends Error {}
class SellTooManyRequestsError extends Error {}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function sellFetch(path: string, init: RequestInit = {}, attempt = 0): Promise<Response> {
  if (!ACCESS_TOKEN) {
    throw new Error('SELL_ACCESS_TOKEN no configurado');
  }
  const headers = new Headers(init.headers);
  headers.set('Authorization', `Bearer ${ACCESS_TOKEN}`);
  headers.set('Accept', 'application/json');
  headers.set('User-Agent', USER_AGENT);
  if (init.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers
  });

  if (response.status === 401) {
    throw new SellUnauthorizedError('Token inválido para Zendesk Sell');
  }

  if (response.status === 429) {
    if (attempt >= 3) {
      throw new SellTooManyRequestsError('Límite de rate alcanzado');
    }
    const retryAfter = Number(response.headers.get('retry-after') ?? '1');
    await sleep((attempt + 1) * retryAfter * 1000);
    return sellFetch(path, init, attempt + 1);
  }

  return response;
}

function ensureContactId(): number {
  if (!CONTACT_ID || Number.isNaN(CONTACT_ID)) {
    throw new Error('SELL_TIPS_CONTACT_ID no configurado');
  }
  return CONTACT_ID;
}

function noteFrontMatter(tip: Omit<TipRecord, 'body_html' | 'id'>) {
  return {
    title: tip.title,
    status: tip.status,
    tags: tip.tags,
    updated_by: tip.updated_by,
    updated_at: tip.updated_at
  };
}

export function noteToTip(note: any): TipRecord {
  const content: string = note?.data?.content ?? '';
  const parsed = matter(content || '');
  const front = parsed.data as Record<string, unknown>;
  const markdown = parsed.content || '';
  const status = front.status === 'published' ? 'published' : 'draft';
  const tagsFront = Array.isArray(front.tags) ? (front.tags as string[]) : [];
  const noteTags = Array.isArray(note?.data?.tags) ? (note.data.tags as string[]) : [];
  const tags = Array.from(new Set([...tagsFront, ...noteTags.filter((tag) => tag !== 'tip')])) as string[];
  const title = (front.title as string) || note?.data?.title || 'Tip sin título';
  const updatedAt = (front.updated_at as string) || note?.data?.updated_at || note?.data?.created_at;
  const updatedBy = (front.updated_by as string) || note?.data?.creator?.email;

  return {
    id: String(note?.data?.id ?? note?.id ?? ''),
    title,
    body_md: markdown,
    body_html: marked.parse(markdown),
    tags,
    status,
    updated_at: updatedAt,
    updated_by: updatedBy
  };
}

async function listNotes(includeDrafts: boolean): Promise<TipRecord[]> {
  const perPage = 100;
  const statusQuery = includeDrafts ? '' : '&status=published';
  const response = await sellFetch(
    `/v2/notes?resource_type=contact&resource_id=${ensureContactId()}&per_page=${perPage}&sort_by=updated_at:desc${statusQuery}`
  );
  const payload = await response.json();
  const notes = Array.isArray(payload?.data) ? payload.data : [];
  return notes.map((note: any) => noteToTip(note));
}

async function getNote(id: string): Promise<TipRecord> {
  const response = await sellFetch(`/v2/notes/${id}`);
  const payload = await response.json();
  return noteToTip(payload);
}

async function createNote(input: Omit<TipRecord, 'id' | 'body_html'>): Promise<TipRecord> {
  const fm = YAML.stringify(noteFrontMatter(input));
  const content = `---\n${fm}---\n${input.body_md}`;
  const response = await sellFetch('/v2/notes', {
    method: 'POST',
    body: JSON.stringify({
      data: {
        resource_type: 'contact',
        resource_id: ensureContactId(),
        content,
        tags: ['tip', ...input.tags],
        type: 'regular'
      },
      meta: { type: 'note' }
    })
  });
  const payload = await response.json();
  return noteToTip(payload);
}

async function updateNote(id: string, input: Omit<TipRecord, 'id' | 'body_html'>): Promise<TipRecord> {
  const fm = YAML.stringify(noteFrontMatter(input));
  const content = `---\n${fm}---\n${input.body_md}`;
  const response = await sellFetch(`/v2/notes/${id}`, {
    method: 'PUT',
    body: JSON.stringify({
      data: {
        content,
        tags: ['tip', ...input.tags]
      }
    })
  });
  const payload = await response.json();
  return noteToTip(payload);
}

async function deleteNote(id: string): Promise<void> {
  await sellFetch(`/v2/notes/${id}`, { method: 'DELETE' });
}

function coRecordToTip(record: any): TipRecord {
  const attrs = record?.data?.attributes ?? record?.attributes ?? {};
  const markdown = String(attrs.body_md ?? '');
  return {
    id: String(record?.data?.id ?? record?.id ?? ''),
    title: String(attrs.title ?? 'Tip sin título'),
    body_md: markdown,
    body_html: marked.parse(markdown),
    tags: Array.isArray(attrs.tags) ? (attrs.tags as string[]) : [],
    status: attrs.status === 'published' ? 'published' : 'draft',
    updated_at: attrs.updated_at ?? attrs.updatedAt ?? new Date().toISOString(),
    updated_by: attrs.updated_by ?? attrs.updatedBy
  };
}

async function listCustomObjects(includeDrafts: boolean): Promise<TipRecord[]> {
  const statusFilter = includeDrafts ? '' : '&filter[status]=published';
  const response = await sellFetch(`/v2/custom_objects/tip/records?sort_by=updated_at:desc${statusFilter}`);
  const payload = await response.json();
  const records = Array.isArray(payload?.data) ? payload.data : [];
  return records.map((record: any) => coRecordToTip(record));
}

async function getCustomObject(id: string): Promise<TipRecord> {
  const response = await sellFetch(`/v2/custom_objects/tip/records/${id}`);
  const payload = await response.json();
  return coRecordToTip(payload);
}

async function createCustomObject(input: Omit<TipRecord, 'id' | 'body_html'>): Promise<TipRecord> {
  const response = await sellFetch('/v2/custom_objects/tip/records', {
    method: 'POST',
    body: JSON.stringify({
      data: {
        attributes: {
          title: input.title,
          body_md: input.body_md,
          tags: input.tags,
          status: input.status,
          updated_by: input.updated_by,
          updated_at: input.updated_at
        }
      }
    })
  });
  const payload = await response.json();
  return coRecordToTip(payload);
}

async function updateCustomObject(id: string, input: Omit<TipRecord, 'id' | 'body_html'>): Promise<TipRecord> {
  const response = await sellFetch(`/v2/custom_objects/tip/records/${id}`, {
    method: 'PUT',
    body: JSON.stringify({
      data: {
        attributes: {
          title: input.title,
          body_md: input.body_md,
          tags: input.tags,
          status: input.status,
          updated_by: input.updated_by,
          updated_at: input.updated_at
        }
      }
    })
  });
  const payload = await response.json();
  return coRecordToTip(payload);
}

async function deleteCustomObject(id: string): Promise<void> {
  await sellFetch(`/v2/custom_objects/tip/records/${id}`, { method: 'DELETE' });
}

export async function listTips(includeDrafts: boolean): Promise<TipRecord[]> {
  if (ENABLE_CUSTOM_OBJECTS) {
    return listCustomObjects(includeDrafts);
  }
  return listNotes(includeDrafts);
}

export async function getTip(id: string): Promise<TipRecord> {
  if (ENABLE_CUSTOM_OBJECTS) {
    return getCustomObject(id);
  }
  return getNote(id);
}

export async function saveTip(id: string | null, input: Omit<TipRecord, 'id' | 'body_html'>): Promise<TipRecord> {
  if (ENABLE_CUSTOM_OBJECTS) {
    return id ? updateCustomObject(id, input) : createCustomObject(input);
  }
  return id ? updateNote(id, input) : createNote(input);
}

export async function removeTip(id: string): Promise<void> {
  if (ENABLE_CUSTOM_OBJECTS) {
    return deleteCustomObject(id);
  }
  return deleteNote(id);
}
