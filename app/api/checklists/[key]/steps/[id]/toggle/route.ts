import { NextRequest, NextResponse } from 'next/server';
import { assertAgent } from '../../../../../../../src/lib/rbac';
import { buildStepFromPayload } from '../../../../../../../src/lib/stepPayload';
import { getStepById, updateStep } from '../../../../../../../src/lib/sellClient';
import { Step } from '../../../../../../../src/types/steps';

export async function POST(req: NextRequest, { params }: { params: { key: string; id: string } }) {
  try {
    const key = params.key;
    const id = params.id;
    const email = assertAgent(req as unknown as Request);
    const queryDealId = req.nextUrl.searchParams.get('deal_id') ?? undefined;
    const dealId = queryDealId ? queryDealId.trim() || undefined : undefined;
    const existing = await getStepById(key, id, { dealId });
    if (!existing) {
      return NextResponse.json({ error: 'Paso no encontrado' }, { status: 404 });
    }

    const serverStep = existing.step;
    const nextStatus: 'pending' | 'done' = serverStep.status === 'done' ? 'pending' : 'done';
    const mergedInput = { ...serverStep, status: nextStatus };
    const overrides: Partial<Step> = {
      ...serverStep,
      status: nextStatus,
      checklist_key: (serverStep as Step & { checklist_key?: string }).checklist_key ?? key,
      deal_id: serverStep.deal_id ?? dealId,
    };
    const step = buildStepFromPayload(mergedInput, email, overrides);
    const { step: updated } = await updateStep(existing.noteId, key, step, { dealId: step.deal_id ?? dealId });
    return NextResponse.json({ data: updated });
  } catch (error) {
    const status = (error as any)?.status ?? 500;
    const message = (error as Error).message || 'Error inesperado';
    return NextResponse.json({ error: message }, { status });
  }
}
