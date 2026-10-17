import type { GenerationResponse, StatesResponse, YearsResponse } from './types'

async function get<T>(url: string): Promise<T> {
  const res = await fetch(url)
  if (!res.ok) {
    throw new Error(`Request failed: ${res.status} ${res.statusText}`)
  }
  return res.json() as Promise<T>
}

export function fetchYears() {
  return get<YearsResponse>('/api/years')
}

export function fetchStates(year: number) {
  return get<StatesResponse>(`/api/states?year=${year}`)
}

export function fetchGeneration(year: number, state: string) {
  return get<GenerationResponse>(`/api/generation?year=${year}&state=${state}`)
}