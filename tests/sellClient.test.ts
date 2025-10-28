import { describe, expect, it } from 'vitest';
import { noteToTip } from '../src/lib/sellClient';

describe('noteToTip', () => {
  it('parsea front-matter correctamente', () => {
    const note = {
      data: {
        id: 1,
        content: `---\ntitle: "Título"\nstatus: "published"\ntags: ["tip", "general"]\n---\nContenido`,
        tags: ['tip', 'general'],
        updated_at: '2024-01-01T00:00:00Z'
      }
    };
    const tip = noteToTip(note);
    expect(tip.title).toBe('Título');
    expect(tip.status).toBe('published');
    expect(tip.tags).toContain('general');
    expect(tip.body_md.trim()).toBe('Contenido');
  });
});
