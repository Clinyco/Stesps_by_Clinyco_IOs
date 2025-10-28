'use client';

import { useEffect, useMemo, useState } from 'react';

type Tip = {
  id: string;
  title: string;
  body_md: string;
  tags: string[];
  status: 'draft' | 'published';
  updated_at: string;
  updated_by?: string;
};

const defaultTip: Tip = {
  id: '',
  title: '',
  body_md: '',
  tags: [],
  status: 'draft',
  updated_at: new Date().toISOString()
};

export default function AgentDashboard() {
  const [tips, setTips] = useState<Tip[]>([]);
  const [selected, setSelected] = useState<Tip>(defaultTip);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [error, setError] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const lower = search.toLowerCase();
    return tips.filter(
      (tip) =>
        tip.title.toLowerCase().includes(lower) ||
        tip.tags.some((tag) => tag.toLowerCase().includes(lower)) ||
        tip.body_md.toLowerCase().includes(lower)
    );
  }, [search, tips]);

  const loadTips = async () => {
    setLoading(true);
    const res = await fetch('/api/tips?all=1');
    if (!res.ok) {
      setError('No se pudieron cargar los tips');
      setLoading(false);
      return;
    }
    const data = (await res.json()) as { data: Tip[] };
    setTips(data.data);
    setLoading(false);
  };

  useEffect(() => {
    void loadTips();
  }, []);

  const resetForm = () => setSelected(defaultTip);

  const submitTip = async (publish: boolean) => {
    setLoading(true);
    setError(null);
    const method = selected.id ? 'PUT' : 'POST';
    const endpoint = selected.id ? `/api/tips/${selected.id}` : '/api/tips';
    const body = {
      title: selected.title,
      body_md: selected.body_md,
      tags: selected.tags,
      status: publish ? 'published' : selected.status
    };
    const res = await fetch(endpoint, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    if (!res.ok) {
      setError('No se pudo guardar el tip');
      setLoading(false);
      return;
    }
    await loadTips();
    resetForm();
  };

  const removeTip = async () => {
    if (!selected.id) return;
    setLoading(true);
    const res = await fetch(`/api/tips/${selected.id}`, { method: 'DELETE' });
    if (!res.ok) {
      setError('No se pudo eliminar el tip');
      setLoading(false);
      return;
    }
    await loadTips();
    resetForm();
  };

  const onTagChange = (value: string) => {
    setSelected((current) => ({ ...current, tags: value.split(',').map((t) => t.trim()).filter(Boolean) }));
  };

  return (
    <section className="agent">
      <h2>Panel de Agentes</h2>
      <p className="muted">
        Solo agentes autorizados pueden editar. El acceso se valida en el servidor mediante la lista de correos
        permitidos.
      </p>
      <div className="grid">
        <aside>
          <input
            type="search"
            placeholder="Buscar por título o etiqueta"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button type="button" onClick={resetForm} className="secondary">
            Nuevo tip
          </button>
          {loading && <p>Cargando…</p>}
          {error && <p className="error">{error}</p>}
          <ul className="list">
            {filtered.map((tip) => (
              <li key={tip.id}>
                <button type="button" onClick={() => setSelected(tip)} className={tip.id === selected.id ? 'active' : ''}>
                  <strong>{tip.title || 'Sin título'}</strong>
                  <small>
                    {tip.status} · {new Date(tip.updated_at).toLocaleString('es-CL')}
                  </small>
                </button>
              </li>
            ))}
          </ul>
        </aside>
        <form
          className="editor"
          onSubmit={(event) => {
            event.preventDefault();
            void submitTip(false);
          }}
        >
          <label>
            Título
            <input value={selected.title} onChange={(e) => setSelected({ ...selected, title: e.target.value })} />
          </label>
          <label>
            Etiquetas (separadas por coma)
            <input value={selected.tags.join(', ')} onChange={(e) => onTagChange(e.target.value)} />
          </label>
          <label>
            Estado
            <select
              value={selected.status}
              onChange={(e) => setSelected({ ...selected, status: e.target.value as Tip['status'] })}
            >
              <option value="draft">Borrador</option>
              <option value="published">Publicado</option>
            </select>
          </label>
          <label>
            Contenido (Markdown)
            <textarea
              rows={12}
              value={selected.body_md}
              onChange={(e) => setSelected({ ...selected, body_md: e.target.value })}
            />
          </label>
          <div className="actions">
            <button type="submit" disabled={loading}>
              Guardar
            </button>
            <button
              type="button"
              onClick={() => {
                void submitTip(true);
              }}
              disabled={loading}
            >
              Publicar
            </button>
            <button type="button" onClick={removeTip} className="danger" disabled={!selected.id || loading}>
              Eliminar
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}
