export default function Home() {
  return (
    <main style={{ fontFamily: 'system-ui, sans-serif', padding: '2rem', maxWidth: '40rem' }}>
      <h1>OpenClaw</h1>
      <p>MyClaw agent runtime. This service exposes only HTTP API endpoints.</p>
      <ul>
        <li>
          <code>GET /api/health</code> — service status
        </li>
        <li>
          <code>POST /api/invoke</code> — agent invocation (Phase 2)
        </li>
        <li>
          <code>POST /api/tick</code> — cron alert tick (Phase 6)
        </li>
      </ul>
      <p style={{ color: '#666', fontSize: '0.875rem' }}>
        See <code>docs/openclaw/</code> for architecture and API contract.
      </p>
    </main>
  );
}
