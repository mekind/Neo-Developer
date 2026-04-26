import { useEffect, useState } from 'react'
import { listItems, type Item } from '@/services/items'

const initialActions = ['Live backend items', 'Reusable API config', 'Future endpoint expansion ready']

export function InteractionPanel() {
  const [items, setItems] = useState<Item[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    async function loadItems() {
      try {
        setIsLoading(true)
        setErrorMessage(null)
        const nextItems = await listItems()
        if (isMounted) {
          setItems(nextItems)
        }
      } catch (error) {
        if (isMounted) {
          setErrorMessage(error instanceof Error ? error.message : 'Failed to load items.')
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    void loadItems()

    return () => {
      isMounted = false
    }
  }, [])

  return (
    <section className="panel">
      <h2>Interaction UI Placeholder</h2>
      <p>
        This shell now proves the frontend-to-backend path with live item data while keeping the broader
        gather-like surface intentionally minimal.
      </p>

      <ul className="action-list">
        {initialActions.map((action) => (
          <li key={action}>{action}</li>
        ))}
      </ul>

      <section aria-labelledby="live-items-title" className="panel panel--nested">
        <h3 id="live-items-title">Live items</h3>
        <p>Backend source: configurable Vite API base URL + typed items service.</p>

        {isLoading ? <p>Loading live items…</p> : null}
        {errorMessage ? <p role="alert">{errorMessage}</p> : null}

        {!isLoading && !errorMessage ? (
          <ul className="action-list" aria-label="Live items list">
            {items.map((item) => (
              <li key={item.id}>
                <strong>{item.name}</strong>
                {item.description ? ` — ${item.description}` : ''} ({item.price.toLocaleString()} KRW)
              </li>
            ))}
          </ul>
        ) : null}
      </section>
    </section>
  )
}
