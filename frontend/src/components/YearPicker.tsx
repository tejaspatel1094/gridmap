type Props = {
  years: number[]
  selected: number
  onChange: (year: number) => void
}

export function YearPicker({ years, selected, onChange }: Props) {
  return (
    <label>
      Year:{' '}
      <select value={selected} onChange={(e) => onChange(Number(e.target.value))}>
        {years.map((y) => (
          <option key={y} value={y}>
            {y}
          </option>
        ))}
      </select>
    </label>
  )
}