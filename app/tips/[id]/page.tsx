import DOMPurify from 'isomorphic-dompurify';

async function fetchTip(id: string) {
  const res = await fetch(`${process.env.APP_BASE_URL || ''}/api/tips/${id}`, {
    next: { revalidate: 120 }
  });
  if (!res.ok) {
    throw new Error('No se pudo cargar el tip');
  }
  return res.json() as Promise<{ data: { id: string; title: string; body_html: string; updated_at: string; tags: string[]; updated_by?: string } }>;
}

interface TipPageProps {
  params: { id: string };
}

export default async function TipDetailPage({ params }: TipPageProps) {
  const { data } = await fetchTip(params.id);
  const sanitized = DOMPurify.sanitize(data.body_html);
  return (
    <article>
      <h2>{data.title}</h2>
      <p>
        Última actualización: {new Date(data.updated_at).toLocaleString('es-CL')} · {data.updated_by || 'Equipo Clínyco'}
      </p>
      {data.tags?.length ? <p>Etiquetas: {data.tags.join(', ')}</p> : null}
      <section dangerouslySetInnerHTML={{ __html: sanitized }} />
    </article>
  );
}
