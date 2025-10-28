import Link from 'next/link';

export default function HomePage() {
  return (
    <section>
      <h2>Bienvenida</h2>
      <p>
        Consulta los tips publicados o ingresa al panel de agentes para gestionar el repositorio
        centralizado desde Zendesk Sell.
      </p>
      <ul>
        <li>
          <Link href="/tips">Tips publicados</Link>
        </li>
        <li>
          <Link href="/agent">Panel de agente</Link>
        </li>
        <li>
          <a href="/client-steps.html">Pasos para clientes</a>
        </li>
        <li>
          <a href="/agent-steps.html">Pasos para agentes</a>
        </li>
      </ul>
    </section>
  );
}
