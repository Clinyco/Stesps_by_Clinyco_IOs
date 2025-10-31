import { NextRequest, NextResponse } from 'next/server';
import { createStep, listStepsByChecklistKey } from '../../../../../src/lib/sellClient';
import { assertAgent } from '../../../../../src/lib/rbac';
import { buildStepFromPayload } from '../../../../../src/lib/stepPayload';
import { Step } from '../../../../../src/types/steps';

function toJson(data: unknown, init: ResponseInit = {}) {
  return NextResponse.json(data, init);
}

export async function GET(_req: NextRequest, { params }: { params: { key: string } }) {
  try {
    const key = params.key;
    const result = await listStepsByChecklistKey(key);
    const steps = result.map((item) => item.step).sort((a, b) => a.order - b.order);
    const response = toJson({ data: steps });
    response.headers.set('Cache-Control', 's-maxage=60, stale-while-revalidate=60');
    return response;
  } catch (error) {
    const status = (error as any)?.status ?? 500;
    const message = (error as Error).message || 'Error inesperado';
    return toJson({ error: message }, { status });
  }
}

export async function POST(req: NextRequest, { params }: { params: { key: string } }) {
  try {
    const key = params.key;
    const email = assertAgent(req as unknown as Request);
    const payload = await req.json();
    const step = buildStepFromPayload(payload, email, { checklist_key: key } as Partial<Step>);
    const { step: created } = await createStep(key, step);
    return toJson({ data: created }, { status: 201 });
  } catch (error) {
    const status = (error as any)?.status ?? 500;
    const message = (error as Error).message || 'Error inesperado';
    return toJson({ error: message }, { status });
  }
}
