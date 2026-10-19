import { useState } from 'react'
import type { StateTotal } from '../types'

type SortKey = 'name' | 'total'

type Props = {
  states: StateTotal[]
  units: string
  onSelect: (code: string) => void
}

export function StateTable({ states, units, onSelect }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>('total')
  const [ascending, setAscending] = useState(false)

  const sorted = [...states].sort((a, b) => {
    const cmp = sortKey === 'name'
      ? a.name.localeCompare(b.name)
      : a.total - b.total
    return ascending ? cmp : -cmp
  })

  function toggleSort(key: SortKey) {
    if (key === sortKey) {
      setAscending(!ascending)
    } else {
      setSortKey(key)
      setAscending(key === 'name')
    }
  }

  return (
    <table>
      <thead>
        <tr>
          <th onClick={() => toggleSort('name')} style={{ cursor: 'pointer' }}>
            State
          </th>
          <th onClick={() => toggleSort('total')} style={{ cursor: 'pointer' }}>
            Generation ({units})
          </th>
        </tr>
      </thead>
      <tbody>
        {sorted.map((s) => (
          <tr
            key={s.code}
            onClick={() => onSelect(s.code)}
            style={{ cursor: 'pointer' }}>
            <td>{s.name}</td>
            <td>{s.total.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}