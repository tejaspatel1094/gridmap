import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { FALLBACK_COLOR, FUEL_COLORS } from '../fuelColors'
import type { GenerationResponse } from '../types'

type Props = {
  data: GenerationResponse
  onBack: (() => void) | null
}

export function FuelBreakdown({ data, onBack }: Props) {
  const chartData = data.fuels.map((f) => ({
    name: f.name,
    generation: f.generation,
    code: f.code,
  }))

  return (
    <div>
      <h2>
        {data.name} — {data.year}
      </h2>
      {onBack && <button onClick={onBack}>← Back to US total</button>}

      <p>
        Total: {data.total.toLocaleString(undefined, { maximumFractionDigits: 0 })}{' '}
        {data.units}
      </p>

      <div style={{ width: '100%', height: 320 }}>
        <ResponsiveContainer>
          <BarChart data={chartData} margin={{ top: 10, right: 20, bottom: 60, left: 60 }}>
            <XAxis dataKey="name" angle={-45} textAnchor="end" interval={0} />
            <YAxis />
            <Tooltip
              formatter={(value: number) =>
                value.toLocaleString(undefined, { maximumFractionDigits: 0 })
              }
            />
            <Bar dataKey="generation">
              {chartData.map((entry) => (
                <Cell key={entry.code} fill={FUEL_COLORS[entry.code] ?? FALLBACK_COLOR} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <table>
        <thead>
          <tr>
            <th>Fuel</th>
            <th>Generation</th>
            <th>Share</th>
          </tr>
        </thead>
        <tbody>
          {data.fuels.map((f) => (
            <tr key={f.code}>
              <td>
                <span
                  style={{
                    display: 'inline-block',
                    width: 12,
                    height: 12,
                    marginRight: 8,
                    background: FUEL_COLORS[f.code] ?? FALLBACK_COLOR,
                  }}
                />
                {f.name}
              </td>
              <td>{f.generation.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
              <td>{f.percent.toFixed(1)}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}