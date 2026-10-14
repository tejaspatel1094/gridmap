import { useEffect, useState } from 'react'

type Health = {
  api: string
  db: string
}

function App() {
  const [health, setHealth] = useState<Health | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/health')
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json()
      })
      .then(setHealth)
      .catch((err) => setError(err.message))
  }, [])

  if (error) return <p>Error: {error}</p>
  if (!health) return <p>Loading...</p>

  return (
    <div>
      <h1>GridMap</h1>
      <p>api: {health.api}</p>
      <p>db: {health.db}</p>
    </div>
  )
}

export default App