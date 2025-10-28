import { assertTipIsSafe } from '../src/lib/safeContent';
import { describe, expect, it } from 'vitest';

describe('assertTipIsSafe', () => {
  it('permite contenido neutro', () => {
    expect(() =>
      assertTipIsSafe({
        title: 'Consejo diario',
        body_md: 'Recuerda hidratarte y seguir la guía del equipo Clínyco.'
      })
    ).not.toThrow();
  });

  it('bloquea emails externos', () => {
    expect(() =>
      assertTipIsSafe({
        title: 'Contacto',
        body_md: 'Escribe a paciente@example.com'
      })
    ).toThrowError('Contenido no permitido');
  });

  it('bloquea números largos', () => {
    expect(() =>
      assertTipIsSafe({
        title: 'Seguimiento',
        body_md: 'Código: 123456789'
      })
    ).toThrowError('Contenido no permitido');
  });
});
