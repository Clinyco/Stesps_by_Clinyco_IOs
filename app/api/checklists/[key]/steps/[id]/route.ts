import { NextRequest, NextResponse } from 'next/server';
import { assertAgent } from '../../../../../../src/lib/rbac';
import { buildStepFromPayload } from '../../../../../../src/lib/stepPayload';
import { deleteStep, getStepById, updateStep } from '../../../../../../src/lib/sellClient';
import { Step } from '../../../../../../src/types/steps';

function toJson(data: unknown, init: ResponseInit = {}) {
  return NextResponse.json(data, init);
}

export async function PUT(req: NextRequest, { params }: { params: { key: string; id: string } }) {
  try {
    const key = params.key;
    const id = params.id;
    const email = assertAgent(req as unknown as Request);
    const queryDealId = req.nextUrl.searchParams.get('deal_id') ?? undefined;
    const payload = await req.json();
    const payloadDealId = typeof payload.deal_id === 'string' ? payload.deal_id.trim() : undefined;
    const lookupDealId = payloadDealId ?? (queryDealId ? queryDealId.trim() || undefined : undefined);
    const existing = await getStepById(key, id, { dealId: lookupDealId });
    if (!existing) {
      return toJson({ error: 'Paso no encontrado' }, { status: 404 });
    }

    const serverStep = existing.step;
    const requestUpdatedAt = typeof payload.updated_at === 'string' ? Date.parse(payload.updated_at) : NaN;
    const serverUpdatedAt = Date.parse(serverStep.updated_at);
    if (!Number.isNaN(requestUpdatedAt) && requestUpdatedAt < serverUpdatedAt) {
      return toJson({ error: 'Conflicto de versión' }, { status: 409 });
    }

    const effectiveDealId = payloadDealId ?? serverStep.deal_id ?? (queryDealId ? queryDealId.trim() || undefined : undefined);
    const mergedInput = { ...serverStep, ...payload, id, deal_id: effectiveDealId };
    const overrides: Partial<Step> = {
      ...serverStep,
      checklist_key: (serverStep as Step & { checklist_key?: string }).checklist_key ?? key,
      deal_id: effectiveDealId,
    };
    const step = buildStepFromPayload(mergedInput, email, overrides);
    const { step: updated } = await updateStep(existing.noteId, key, step, { dealId: effectiveDealId });
    return toJson({ data: updated });
  } catch (error) {
    const status = (error as any)?.status ?? 500;
    const message = (error as Error).message || 'Error inesperado';
    return toJson({ error: message }, { status });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { key: string; id: string } }) {
  try {
    const key = params.key;
    const id = params.id;
    assertAgent(req as unknown as Request);
    const queryDealId = req.nextUrl.searchParams.get('deal_id') ?? undefined;
    const dealId = queryDealId ? queryDealId.trim() || undefined : undefined;
    const existing = await getStepById(key, id, { dealId });
    if (!existing) {
      return new NextResponse(null, { status: 204 });
    }
    await deleteStep(existing.noteId);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    const status = (error as any)?.status ?? 500;
    const message = (error as Error).message || 'Error inesperado';
    return toJson({ error: message }, { status });
  }
}
