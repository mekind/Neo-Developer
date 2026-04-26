const initialActions = ['Move with arrow keys later', 'Open chat panel later', 'Interact with nearby objects later']

export function InteractionPanel() {
  return (
    <section className="panel">
      <h2>Interaction UI Placeholder</h2>
      <p>
        This shell reserves space for the gather-like interaction layer without committing to realtime,
        auth, or voice features yet.
      </p>

      <ul className="action-list">
        {initialActions.map((action) => (
          <li key={action}>{action}</li>
        ))}
      </ul>
    </section>
  )
}
