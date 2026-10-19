import { useState } from 'react'
import { ComposableMap, Geographies, Geography } from 'react-simple-maps'
import type { StateTotal } from '../types'

const FIPS_TO_CODE: Record<string, string> = {
  '01': 'AL', '02': 'AK', '04': 'AZ', '05': 'AR', '06': 'CA', '08': 'CO',
  '09': 'CT', '10': 'DE', '11': 'DC', '12': 'FL', '13': 'GA', '15': 'HI',
  '16': 'ID', '17': 'IL', '18': 'IN', '19': 'IA', '20': 'KS', '21': 'KY',
  '22': 'LA', '23': 'ME', '24': 'MD', '25': 'MA', '26': 'MI', '27': 'MN',
  '28': 'MS', '29': 'MO', '30': 'MT', '31': 'NE', '32': 'NV', '33': 'NH',
  '34': 'NJ', '35': 'NM', '36': 'NY', '37': 'NC', '38': 'ND', '39': 'OH',
  '40': 'OK', '41': 'OR', '42': 'PA', '44': 'RI', '45': 'SC', '46': 'SD',
  '47': 'TN', '48': 'TX', '49': 'UT', '50': 'VT', '51': 'VA', '53': 'WA',
  '54': 'WV', '55': 'WI', '56': 'WY',
}

const NO_DATA = '#3a3a3a'

type Props = {
  states: StateTotal[]
  selected: string | null
  onSelect: (code: string) => void
}

export function StateMap({ states, selected, onSelect }: Props) {
  const [hovered, setHovered] = useState<string | null>(null)

  console.log('STATES:', states.length, states[0])
  const totals = new Map(states.map((s) => [s.code, s.total]))
  const names = new Map(states.map((s) => [s.code, s.name]))
  const max = Math.max(...states.map((s) => s.total), 1)

  function codeFor(geoId: unknown): string | undefined {
    const fips = String(geoId).padStart(2, '0')
    return FIPS_TO_CODE[fips]
  }

  function colorFor(code: string | undefined) {
    if (!code) return NO_DATA
    const total = totals.get(code)
    if (total === undefined) return NO_DATA
    const intensity = Math.sqrt(total / max)
    return `hsl(210, 75%, ${88 - intensity * 58}%)`
  }

  const hoveredTotal = hovered ? totals.get(hovered) : undefined

  return (
    <div>
      <div style={{ height: '1.5rem', marginBottom: '0.5rem' }}>
        {hovered && hoveredTotal !== undefined && (
          <strong>
            {names.get(hovered)}:{' '}
            {hoveredTotal.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </strong>
        )}
      </div>

      <ComposableMap projection="geoAlbersUsa" width={900} height={500}>
        <Geographies geography="/states-10m.json">
          {({ geographies }) =>
            geographies.map((geo) => {
              const code = codeFor(geo.id)
              
              console.log(geo.id, typeof geo.id, code)
              const fill = colorFor(code)
              const isSelected = code === selected
              return (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  onClick={() => code && onSelect(code)}
                  onMouseEnter={() => setHovered(code ?? null)}
                  onMouseLeave={() => setHovered(null)}
                  style={{
                    default: {
                      fill,
                      stroke: isSelected ? '#f0c419' : '#555',
                      strokeWidth: isSelected ? 2 : 0.5,
                      outline: 'none',
                    },
                    hover: {
                      fill,
                      stroke: '#f0c419',
                      strokeWidth: 1.5,
                      outline: 'none',
                      cursor: 'pointer',
                    },
                    pressed: { fill, outline: 'none' },
                  }}
                />
              )
            })
          }
        </Geographies>
      </ComposableMap>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
        <span style={{ fontSize: '0.85rem' }}>Low</span>
        <div
          style={{
            width: 200,
            height: 12,
            background: 'linear-gradient(to right, hsl(210,75%,88%), hsl(210,75%,30%))',
          }}
        />
        <span style={{ fontSize: '0.85rem' }}>High</span>
      </div>
    </div>
  )
}