import Link from 'next/link';

async function fetchTips() {
  const res = await fetch(`${process.env.APP_BASE_URL || ''}/api/tips`, {
    next: { revalidate: 120 }
  });
  if (!res.ok) {
    throw new Error('No se pudieron cargar los tips');
  }
  return res.json() as Promise<{ data: Array<{ id: string; title: string; tags: string[]; updated_at: string }> }>;
}

export default async function TipsIndexPage() {
  const { data } = await fetchTips();
  return (
    <section>
      <h2>Tips publicados</h2>
      <ul>
        {data.map((tip) => (
          <li key={tip.id}>
            <Link href={`/tips/${tip.id}`}>
              {tip.title} <small>({new Date(tip.updated_at).toLocaleString('es-CL')})</small>
            </Link>
            {tip.tags?.length ? <span> · {tip.tags.join(', ')}</span> : null}
          </li>
        ))}
      </ul>
    </section>
  );
}
