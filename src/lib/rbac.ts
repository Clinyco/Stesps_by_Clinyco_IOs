const allowed = (process.env.ALLOWED_AGENT_EMAILS || '')
  .split(',')
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean);

export function isAgent(email: string | null | undefined): boolean {
  if (!email) return false;
  return allowed.includes(email.trim().toLowerCase());
}

export function assertAgent(req: Request): string {
  const headerEmail = req.headers.get('x-agent-email');
  const email = headerEmail?.trim().toLowerCase();
  if (!email || !isAgent(email)) {
    throw Object.assign(new Error('Agent not authorized'), { status: 403 });
  }
  return email;
}
