import { useEffect, useState } from 'react'
import { fetchGeneration, fetchStates, fetchYears } from './api'
import { FuelBreakdown } from './components/FuelBreakdown'
import { StateTable } from './components/StateTable'
import { YearPicker } from './components/YearPicker'
import type { GenerationResponse, StatesResponse } from './types'
import { StateMap } from './components/StateMap'

function App() {
  const [years, setYears] = useState<number[]>([])
  const [year, setYear] = useState<number | null>(null)
  const [selected, setSelected] = useState<string | null>(null)
  const [states, setStates] = useState<StatesResponse | null>(null)
  const [breakdown, setBreakdown] = useState<GenerationResponse | null>(null)
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
    setStates(null)
    fetchStates(year).then(setStates).catch((err) => setError(err.message))
  }, [year])

  useEffect(() => {
    if (year === null) return
    setBreakdown(null)
    fetchGeneration(year, selected ?? 'US')
      .then(setBreakdown)
      .catch((err) => setError(err.message))
  }, [year, selected])

  if (error) return <p>Error: {error}</p>
  if (year === null) return <p>Loading…</p>

  return (
    <div style={{ padding: '2rem', fontFamily: 'system-ui', maxWidth: 1100 }}>
      <h1>GridMap</h1>
      <YearPicker years={years} selected={year} onChange={setYear} />

      {breakdown ? (
        <FuelBreakdown
          data={breakdown}
          onBack={selected ? () => setSelected(null) : null}
        />
      ) : (
        <p>Loading…</p>
      )}
{states && (
  <StateMap states={states.states} selected={selected} onSelect={setSelected} />
)}
      <h2>All states</h2>
      {states ? (
        <StateTable states={states.states} units={states.units} onSelect={setSelected} />
      ) : (
        <p>Loading…</p>
      )}
    <footer style={{ marginTop: '3rem', fontSize: '0.85rem', opacity: 0.7 }}>
  Data: <a href="https://www.eia.gov/opendata/" target="_blank" rel="noreferrer">
    US Energy Information Administration
  </a>, Form EIA-923. Utility-scale electric power sector only.
  Figures in thousand megawatthours.
</footer>
    </div>
  )
}

export default App