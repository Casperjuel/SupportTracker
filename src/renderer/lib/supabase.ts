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

// ── Field config sync ──

export async function fetchRemoteFields(config: SharedDbConfig): Promise<Record<string, any> | null> {
  const c = getClient(config)
  if (!c) return null

  const { data, error } = await c
    .from('config')
    .select('*')
    .eq('key', 'fields')
    .single()

  if (error || !data) return null
  return data.value
}

export async function pushFields(config: SharedDbConfig, fields: Record<string, any>): Promise<boolean> {
  const c = getClient(config)
  if (!c) return false

  const { error } = await c
    .from('config')
    .upsert({ key: 'fields', value: fields }, { onConflict: 'key' })

  if (error) {
    console.error('Supabase push fields error:', error)
    return false
  }
  return true
}

// ── Realtime ──

export function subscribeToEntries(
  config: SharedDbConfig,
  onInsert: (entry: SupportEntry) => void,
  onDelete: (id: number) => void,
): (() => void) | null {
  const c = getClient(config)
  if (!c) return null

  const channel = c
    .channel('entries-realtime')
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'entries' },
      (payload) => {
        onInsert(payload.new as SupportEntry)
      }
    )
    .on(
      'postgres_changes',
      { event: 'DELETE', schema: 'public', table: 'entries' },
      (payload) => {
        onDelete((payload.old as any).id)
      }
    )
    .subscribe()

  return () => {
    c.removeChannel(channel)
  }
}

export function subscribeToConfig(
  config: SharedDbConfig,
  onFieldsUpdate: (fields: Record<string, any>) => void,
): (() => void) | null {
  const c = getClient(config)
  if (!c) return null

  const channel = c
    .channel('config-realtime')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'config' },
      (payload) => {
        const row = payload.new as any
        if (row?.key === 'fields' && row?.value) {
          onFieldsUpdate(row.value)
        }
      }
    )
    .subscribe()

  return () => {
    c.removeChannel(channel)
  }
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

-- Shared config (field settings etc.)
create table if not exists config (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz default now()
);

-- Enable Row Level Security (optional)
alter table entries enable row level security;
alter table config enable row level security;

-- Allow all authenticated users to read/write
create policy "Allow all" on entries
  for all using (true) with check (true);
create policy "Allow all" on config
  for all using (true) with check (true);

-- Enable realtime for live sync
alter publication supabase_realtime add table entries;
alter publication supabase_realtime add table config;
`
