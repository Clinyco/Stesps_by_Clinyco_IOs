import { NextRequest, NextResponse } from 'next/server';
import { listTips, saveTip } from '@/src/lib/sellClient';
import { assertTipIsSafe } from '@/src/lib/safeContent';
import { assertAgent, resolveUser } from '@/src/lib/auth';

export async function GET(req: NextRequest) {
  const includeDrafts = req.nextUrl.searchParams.get('all') === '1';
  if (includeDrafts) {
    const user = resolveUser(req);
    if (!user.isAgent) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
  }
  const tips = await listTips(includeDrafts);
  const response = NextResponse.json({ data: tips });
  response.headers.set('Cache-Control', 's-maxage=120, stale-while-revalidate=60');
  return response;
}

export async function POST(req: NextRequest) {
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

  const tip = await saveTip(null, {
    title,
    body_md,
    tags,
    status,
    updated_at: new Date().toISOString(),
    updated_by: user.email ?? undefined
  });

  return NextResponse.json({ data: tip }, { status: 201 });
}
