import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { SupportEntry, SharedDbConfig } from 'shared/types'

let client: SupabaseClient | null = null

export function getClient(config: SharedDbConfig): SupabaseClient | null {
  if (!config.enabled || !config.url || !config.key) return null

  if (!client || (client as any).__url !== config.url) {
    client = createClient(config.url, config.key)
    ;(client as any).__url = config.url
  }
  return client
}

export function resetClient() {
  client = null
}

export async function testConnection(config: SharedDbConfig): Promise<{ ok: boolean; error?: string }> {
  if (!config.url || !config.key) {
    return { ok: false, error: 'URL og nøgle skal udfyldes' }
  }

  try {
    const testClient = createClient(config.url, config.key)
    const { error } = await testClient.from('entries').select('id').limit(1)

    if (error) {
      // Table might not exist yet
      if (error.code === '42P01' || error.message.includes('does not exist')) {
        return { ok: false, error: 'Tabellen "entries" findes ikke. Opret den først (se SQL nedenfor).' }
      }
      return { ok: false, error: error.message }
    }

    return { ok: true }
  } catch (e: any) {
    return { ok: false, error: e.message || 'Kunne ikke forbinde' }
  }
}

export async function fetchRemoteEntries(config: SharedDbConfig): Promise<SupportEntry[]> {
  const c = getClient(config)
  if (!c) return []

  const { data, error } = await c
    .from('entries')
    .select('*')
    .order('dato', { ascending: false })

  if (error) {
    console.error('Supabase fetch error:', error)
    return []
  }

  return (data || []).map((row: any) => ({
    ...row,
    id: row.id,
  }))
}

export async function pushEntry(config: SharedDbConfig, entry: SupportEntry): Promise<boolean> {
  const c = getClient(config)
  if (!c) return false

  const { error } = await c.from('entries').upsert(entry, { onConflict: 'id' })

  if (error) {
    console.error('Supabase push error:', error)
    return false
  }
  return true
}

export async function deleteRemoteEntry(config: SharedDbConfig, id: number): Promise<boolean> {
  const c = getClient(config)
  if (!c) return false

  const { error } = await c.from('entries').delete().eq('id', id)

  if (error) {
    console.error('Supabase delete error:', error)
    return false
  }
  return true
}

export async function syncToRemote(config: SharedDbConfig, entries: SupportEntry[]): Promise<boolean> {
  const c = getClient(config)
  if (!c) return false

  const { error } = await c.from('entries').upsert(entries, { onConflict: 'id' })

  if (error) {
    console.error('Supabase sync error:', error)
    return false
  }
  return true
}

export const SETUP_SQL = `-- Run this in your Supabase SQL editor
create table if not exists entries (
  id bigint primary key,
  dato text not null,
  kanal text,
  brugertype text,
  kategori text,
  tid text,
  losning text,
  forebyg text,
  fond text,
  note text,
  created_at timestamptz default now()
);

-- Enable Row Level Security (optional)
alter table entries enable row level security;

-- Allow all authenticated users to read/write
create policy "Allow all" on entries
  for all using (true) with check (true);
`
