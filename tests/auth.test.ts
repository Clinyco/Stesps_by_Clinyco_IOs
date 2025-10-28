import { describe, expect, it } from 'vitest';
import { NextRequest } from 'next/server';
import { resolveUser } from '../src/lib/auth';

function createRequest(headers?: Record<string, string>) {
  return new NextRequest('https://example.com/agent', {
    headers: new Headers(headers)
  });
}

describe('resolveUser', () => {
  it('detecta agente permitido', () => {
    process.env.ALLOWED_AGENT_EMAILS = 'agente@clinyco.cl';
    const req = createRequest({ 'x-user-email': 'agente@clinyco.cl' });
    const user = resolveUser(req);
    expect(user.isAgent).toBe(true);
  });

  it('marca usuario sin permisos', () => {
    process.env.ALLOWED_AGENT_EMAILS = 'agente@clinyco.cl';
    const req = createRequest({ 'x-user-email': 'otro@clinyco.cl' });
    const user = resolveUser(req);
    expect(user.isAgent).toBe(false);
  });
});
