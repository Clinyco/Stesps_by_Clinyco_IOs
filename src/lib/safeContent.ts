const EMAIL_REGEX = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/gi;
const LONG_NUMBER_REGEX = /\b\d{9,}\b/g;
const BLOCKED_TERMS = [/diagn[oó]stico/i, /historial cl[ií]nico/i, /resultados? m[eé]dicos?/i, /rut/i, /ssn/i];

export interface TipInput {
  title: string;
  body_md: string;
}

export function assertTipIsSafe(tip: TipInput): void {
  const combined = `${tip.title}\n${tip.body_md}`;
  if (combined.length > 10000) {
    throw new Error('Contenido no permitido');
  }

  const emails = combined.match(EMAIL_REGEX) ?? [];
  const unsafeEmail = emails.find((email) => !email.endsWith('@clinyco.cl'));
  if (unsafeEmail) {
    throw new Error('Contenido no permitido');
  }

  if (LONG_NUMBER_REGEX.test(combined)) {
    throw new Error('Contenido no permitido');
  }

  if (BLOCKED_TERMS.some((regex) => regex.test(combined))) {
    throw new Error('Contenido no permitido');
  }
}
