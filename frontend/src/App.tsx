import { useEffect, useState } from 'react'
import { fetchStates, fetchYears } from './api'
import { StateTable } from './components/StateTable'
import { YearPicker } from './components/YearPicker'
import type { StatesResponse } from './types'

function App() {
  const [years, setYears] = useState<number[]>([])
  const [year, setYear] = useState<number | null>(null)
  const [data, setData] = useState<StatesResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchYears()
      .then((res) => {
        setYears(res.years)
        setYear(res.latest)
      })
      .catch((err) => setError(err.message))
  }, [])

  useEffect(() => {
    if (year === null) return
    setData(null)
    fetchStates(year)
      .then(setData)
      .catch((err) => setError(err.message))
  }, [year])

  if (error) return <p>Error: {error}</p>
  if (year === null) return <p>Loading…</p>

  return (
    <div style={{ padding: '2rem', fontFamily: 'system-ui' }}>
      <h1>GridMap</h1>
      <YearPicker years={years} selected={year} onChange={setYear} />
      {data ? <StateTable states={data.states} units={data.units} /> : <p>Loading…</p>}
    </div>
  )
}

export default App