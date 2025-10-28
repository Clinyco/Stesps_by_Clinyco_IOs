import { NextRequest } from 'next/server';

const allowedAgents = (process.env.ALLOWED_AGENT_EMAILS ?? '')
  .split(',')
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean);

export interface RequestUser {
  email: string | null;
  isAgent: boolean;
}

export function resolveUser(req: NextRequest): RequestUser {
  const headerEmail = req.headers.get('x-user-email') ?? '';
  const cookieEmail = req.cookies.get('user-email')?.value ?? '';
  const urlEmail = req.nextUrl.searchParams.get('email') ?? '';
  const email = (headerEmail || cookieEmail || urlEmail).toLowerCase();
  const isAgent = email ? allowedAgents.includes(email) : false;
  return { email: email || null, isAgent };
}

export function assertAgent(req: NextRequest): RequestUser {
  const user = resolveUser(req);
  if (!user.isAgent) {
    throw new Error('FORBIDDEN');
  }
  return user;
}
