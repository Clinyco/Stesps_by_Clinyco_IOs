import { Step } from '../types/steps';

const SENSITIVE_KEYWORDS = [
  /diagn[oó]st/i,
  /resultado/i,
  /presi[oó]n/i,
  /medicaci[oó]n/i,
  /tratamiento/i,
  /enfermedad/i,
];

const EXTERNAL_EMAIL = /\b[a-z0-9._%+-]+@(?!clinyco\.[a-z]{2,})([a-z0-9.-]+\.[a-z]{2,})\b/i;
const LONG_NUMBER = /\b\d{8,}\b/;

export function assertStepIsSafe(step: Partial<Step>) {
  const fields = [step.title, step.desc, step.note, step.href]
    .filter((value): value is string => typeof value === 'string');

  for (const field of fields) {
    if (!field) continue;
    if (EXTERNAL_EMAIL.test(field)) {
      throw Object.assign(new Error('Contenido sensible detectado: email externo'), { status: 422 });
    }
    if (LONG_NUMBER.test(field)) {
      throw Object.assign(new Error('Contenido sensible detectado: identificadores prolongados'), { status: 422 });
    }
    if (SENSITIVE_KEYWORDS.some((regex) => regex.test(field))) {
      throw Object.assign(new Error('Contenido sensible detectado: términos clínicos'), { status: 422 });
    }
  }
}
