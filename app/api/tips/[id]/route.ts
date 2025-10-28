import { NextRequest, NextResponse } from 'next/server';
import { getTip, removeTip, saveTip } from '@/src/lib/sellClient';
import { assertTipIsSafe } from '@/src/lib/safeContent';
import { assertAgent, resolveUser } from '@/src/lib/auth';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const tip = await getTip(params.id);
  const user = resolveUser(req);
  if (tip.status !== 'published' && !user.isAgent) {
    return NextResponse.json({ error: 'Tip no disponible' }, { status: 404 });
  }
  const response = NextResponse.json({ data: tip });
  response.headers.set('Cache-Control', 's-maxage=120, stale-while-revalidate=60');
  return response;
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  let user;
  try {
    user = assertAgent(req);
  } catch (error) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  let body: any;
  try {
    body = await req.json();
  } catch (error) {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 });
  }

  const title = String(body?.title ?? '').trim();
  const body_md = String(body?.body_md ?? '').trim();
  const tags = Array.isArray(body?.tags) ? body.tags.map((tag: string) => String(tag).trim()).filter(Boolean) : [];
  const status = body?.status === 'published' ? 'published' : 'draft';

  try {
    assertTipIsSafe({ title, body_md });
  } catch (error) {
    return NextResponse.json({ error: 'Contenido no permitido' }, { status: 422 });
  }

  const tip = await saveTip(params.id, {
    title,
    body_md,
    tags,
    status,
    updated_at: new Date().toISOString(),
    updated_by: user.email ?? undefined
  });

  return NextResponse.json({ data: tip });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    assertAgent(req);
  } catch (error) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  await removeTip(params.id);
  return NextResponse.json({ ok: true });
}
