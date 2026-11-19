import districtData from './mozambique-districts.json'

// Districts: https://github.com/open-admin-data/mozambique-administrative-divisions
// (CC BY 4.0). Maputo City uses the seven municipal districts named by INE.
export const MOZAMBIQUE_AREAS = Object.keys(districtData).sort((a, b) => a.localeCompare(b, 'pt'))
export type MozambiqueArea = (typeof MOZAMBIQUE_AREAS)[number]

export function districtsForArea(area: string): string[] {
  return (districtData as Record<string, string[]>)[area] ?? []
}

export const DEFAULT_AREA = 'Cidade de Maputo'
export const DEFAULT_DISTRICT = 'KaMpfumu'
