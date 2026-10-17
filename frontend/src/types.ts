export type YearsResponse = {
  years: number[]
  latest: number
}

export type StateTotal = {
  code: string
  name: string
  total: number
}

export type StatesResponse = {
  year: number
  units: string
  states: StateTotal[]
}

export type FuelSlice = {
  code: string
  name: string
  generation: number
  percent: number
}

export type GenerationResponse = {
  year: number
  state: string
  name: string
  units: string
  total: number
  fuels: FuelSlice[]
}