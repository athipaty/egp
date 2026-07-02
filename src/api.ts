import axios from 'axios'

const BASE = import.meta.env.VITE_API_URL || '/api/abt'

const api = axios.create({ baseURL: BASE })

export interface EgpItem {
  _id?: string
  link: string
  anounceType: string
  title: string
  date: string | null
  desc?: string
  winner?: string | null
  amount?: number | null
  method?: string | null
}

export interface EgpRssResponse {
  items: EgpItem[]
  fetchedAt?: string | null
  stale?: boolean
  staleAt?: string | null
  notice?: string
}

export interface MaintenanceInfo {
  maintenance: true
  notice?: string
  hours?: string
}

export const getEgpRss = (anounceType: string) =>
  api.get<EgpRssResponse>('/egp-rss', { params: anounceType ? { anounceType } : {} })

export const getEgpRssNational = (anounceType: string) =>
  api.get<EgpRssResponse>('/egp-rss-national', { params: anounceType ? { anounceType } : {} })
