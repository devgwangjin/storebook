import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export const supabase = (supabaseUrl && supabaseAnonKey)
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null


export type Client = {
  id: number
  code: string
  name: string
  business_no: string
  representative: string
  business_type: string
  business_item: string
  manager: string
  phone: string
  email: string
  address: string
  note: string
  is_active: boolean
  created_at: string
}

export type Product = {
  id: number
  code: string
  name: string
  unit: string
  initial_stock: number
  note: string
  is_active: boolean
  created_at: string
}

export type Material = {
  id: number
  code: string
  name: string
  unit: string
  initial_stock: number
  safety_stock: number
  note: string
  is_active: boolean
  created_at: string
}

export type BomItem = {
  id: number
  product_id: number
  material_id: number
  quantity: number
  product?: Product
  material?: Material
}

export type MaterialTransaction = {
  id: number
  date: string
  client_id: number | null
  material_id: number
  quantity: number
  type: 'in' | 'out'
  note: string
  created_at: string
  client?: Client
  material?: Material
}

export type ProductShipment = {
  id: number
  date: string
  client_id: number | null
  product_id: number
  quantity: number
  note: string
  created_at: string
  client?: Client
  product?: Product
}
