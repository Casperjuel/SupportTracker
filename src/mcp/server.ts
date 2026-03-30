#!/usr/bin/env node

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { z } from 'zod'
import { readFileSync, writeFileSync, existsSync } from 'fs'
import { join } from 'path'
import { homedir } from 'os'

// Try new store path first, fall back to old for migration
const APP_SUPPORT = join(homedir(), 'Library', 'Application Support')
const NEW_STORE = join(APP_SUPPORT, 'supporttracker', 'supporttracker_data.json')
const OLD_STORE = join(APP_SUPPORT, 'grant-compass-supporttracker', 'gc_support_data.json')
const STORE_PATH = existsSync(NEW_STORE) ? NEW_STORE : existsSync(OLD_STORE) ? OLD_STORE : NEW_STORE

// ── Helpers ──

function readStore(): Record<string, any> {
  if (!existsSync(STORE_PATH)) return {}
  return JSON.parse(readFileSync(STORE_PATH, 'utf8'))
}

function writeStore(store: Record<string, any>) {
  writeFileSync(STORE_PATH, JSON.stringify(store, null, 2))
}

function getData(): any[] {
  const store = readStore()
  return Array.isArray(store.st_data_v1) ? store.st_data_v1 : []
}

function setData(data: any[]) {
  const store = readStore()
  store.st_data_v1 = data
  writeStore(store)
}

function getFields(): Record<string, any> {
  const store = readStore()
  const fields = store.st_fields_v1
  if (fields && typeof fields === 'object' && !Array.isArray(fields) && Object.keys(fields).length > 0) {
    return fields
  }
  // Return defaults
  return {
    kanal: { label: 'Kanal', type: 'toggle', options: ['Telefon', 'Intercom'] },
    brugertype: { label: 'Brugertype', type: 'select', options: ['Ansøger', 'Fond / administrator'] },
    kategori: { label: 'Kategori', type: 'select', options: ['Login og adgang', 'Ansøgningsskema og udfyldelse', 'Upload af bilag', 'Delt adgang / flere brugere', 'Teknisk fejl på platformen', 'Afslag og bevilling', 'Onboarding', 'Afrapportering', 'Andet'] },
    tid: { label: 'Tidsforbrug', type: 'select', options: ['Kort (under 5 min)', 'Medium (5–15 min)', 'Lang (over 15 min)'] },
    losning: { label: 'Løsning', type: 'select', options: ['Løst i samtalen', 'Henvist til vejledning', 'Eskaleret internt', 'Fejl rapporteret til udvikling', 'Ikke løst'] },
    forebyg: { label: 'Forebyggelig', type: 'select', options: ['Ukendt', 'Ja – bedre vejledning', 'Ja – platformsforbedring', 'Ja – bedre kommunikation', 'Nej'] },
    fond: { label: 'Fond', type: 'combobox', options: [] },
    note: { label: 'Beskrivelse', type: 'textarea' },
  }
}

function setFields(fields: Record<string, any>) {
  const store = readStore()
  store.st_fields_v1 = fields
  writeStore(store)
}

// ── MCP Server ──

const server = new McpServer({
  name: 'supporttracker',
  version: '1.0.0',
})

// ── Resources ──

server.resource(
  'entries',
  'supporttracker://entries',
  async () => {
    const data = getData()
    return {
      contents: [{
        uri: 'supporttracker://entries',
        mimeType: 'application/json',
        text: JSON.stringify(data, null, 2),
      }],
    }
  }
)

server.resource(
  'fields',
  'supporttracker://fields',
  async () => {
    const fields = getFields()
    return {
      contents: [{
        uri: 'supporttracker://fields',
        mimeType: 'application/json',
        text: JSON.stringify(fields, null, 2),
      }],
    }
  }
)

server.resource(
  'summary',
  'supporttracker://summary',
  async () => {
    const data = getData()
    const total = data.length
    const countBy = (field: string) => {
      const c: Record<string, number> = {}
      for (const d of data) {
        if (d[field]) c[d[field]] = (c[d[field]] || 0) + 1
      }
      return Object.entries(c).sort((a, b) => b[1] - a[1])
    }

    const preventable = data.filter((d: any) => typeof d.forebyg === 'string' && d.forebyg.startsWith('Ja')).length
    const solved = data.filter((d: any) => d.losning === 'Løst i samtalen').length

    const summary = {
      total,
      preventable,
      preventablePct: total > 0 ? Math.round((preventable / total) * 100) : 0,
      solvedDirectly: solved,
      resolutionRate: total > 0 ? Math.round((solved / total) * 100) : 0,
      topCategories: countBy('kategori').slice(0, 5),
      topChannels: countBy('kanal'),
      topResolutions: countBy('losning'),
      topPreventableReasons: countBy('forebyg').filter(([k]) => k.startsWith('Ja')),
    }

    return {
      contents: [{
        uri: 'supporttracker://summary',
        mimeType: 'application/json',
        text: JSON.stringify(summary, null, 2),
      }],
    }
  }
)

// ── Tools ──

server.tool(
  'list_entries',
  'List support entries, optionally filtered. Returns the most recent entries first.',
  {
    limit: z.number().optional().describe('Max number of entries to return (default 20)'),
    kategori: z.string().optional().describe('Filter by category'),
    kanal: z.string().optional().describe('Filter by channel (Telefon / Intercom)'),
    brugertype: z.string().optional().describe('Filter by user type (Ansøger / Fond / administrator)'),
    losning: z.string().optional().describe('Filter by resolution'),
    forebyggelig: z.boolean().optional().describe('Only show preventable entries'),
    search: z.string().optional().describe('Search in note text'),
    from_date: z.string().optional().describe('Only entries from this date (YYYY-MM-DD)'),
    to_date: z.string().optional().describe('Only entries until this date (YYYY-MM-DD)'),
  },
  async (params) => {
    let data = getData()

    if (params.kategori) data = data.filter((d: any) => d.kategori === params.kategori)
    if (params.kanal) data = data.filter((d: any) => d.kanal === params.kanal)
    if (params.brugertype) data = data.filter((d: any) => d.brugertype === params.brugertype)
    if (params.losning) data = data.filter((d: any) => d.losning === params.losning)
    if (params.forebyggelig) data = data.filter((d: any) => typeof d.forebyg === 'string' && d.forebyg.startsWith('Ja'))
    if (params.search) {
      const q = params.search.toLowerCase()
      data = data.filter((d: any) => (d.note || '').toLowerCase().includes(q))
    }
    if (params.from_date) data = data.filter((d: any) => d.dato >= params.from_date!)
    if (params.to_date) data = data.filter((d: any) => d.dato <= params.to_date!)

    const limit = params.limit || 20
    data = data.slice(0, limit)

    return {
      content: [{
        type: 'text' as const,
        text: JSON.stringify(data, null, 2),
      }],
    }
  }
)

server.tool(
  'create_entry',
  'Create a new support entry in the tracker.',
  {
    dato: z.string().describe('Date in YYYY-MM-DD format'),
    kanal: z.string().describe('Channel: Telefon or Intercom'),
    brugertype: z.string().describe('User type: Ansøger or Fond / administrator'),
    kategori: z.string().describe('Category of the inquiry'),
    tid: z.string().describe('Time spent: Kort (under 5 min), Medium (5–15 min), or Lang (over 15 min)'),
    losning: z.string().describe('Resolution: Løst i samtalen, Henvist til vejledning, Eskaleret internt, Fejl rapporteret til udvikling, or Ikke løst'),
    forebyg: z.string().optional().describe('Preventable? Ukendt, Ja – bedre vejledning, Ja – platformsforbedring, Ja – bedre kommunikation, or Nej'),
    fond: z.string().optional().describe('Fund name if relevant'),
    note: z.string().optional().describe('Short description of the inquiry'),
  },
  async (params) => {
    const data = getData()
    const entry = {
      id: Date.now(),
      dato: params.dato,
      kanal: params.kanal,
      brugertype: params.brugertype,
      kategori: params.kategori,
      tid: params.tid,
      losning: params.losning,
      forebyg: params.forebyg || 'Ukendt',
      fond: params.fond || '',
      note: params.note || '',
    }
    data.unshift(entry)
    setData(data)

    return {
      content: [{
        type: 'text' as const,
        text: `Entry created with ID ${entry.id}. Total entries: ${data.length}`,
      }],
    }
  }
)

server.tool(
  'delete_entry',
  'Delete a support entry by its ID.',
  {
    id: z.number().describe('The entry ID to delete'),
  },
  async (params) => {
    const data = getData()
    const before = data.length
    const filtered = data.filter((d: any) => d.id !== params.id)
    if (filtered.length === before) {
      return { content: [{ type: 'text' as const, text: `Entry ${params.id} not found.` }] }
    }
    setData(filtered)
    return { content: [{ type: 'text' as const, text: `Entry ${params.id} deleted. ${filtered.length} entries remaining.` }] }
  }
)

server.tool(
  'get_insights',
  'Get analytical insights and statistics from the support data.',
  {},
  async () => {
    const data = getData()
    const total = data.length
    if (total === 0) {
      return { content: [{ type: 'text' as const, text: 'No data yet.' }] }
    }

    const countBy = (field: string) => {
      const c: Record<string, number> = {}
      for (const d of data) { if (d[field]) c[d[field]] = (c[d[field]] || 0) + 1 }
      return Object.entries(c).sort((a, b) => b[1] - a[1])
    }

    const now = new Date()
    const twoWeeksAgo = new Date(now.getTime() - 14 * 86400000)
    const fourWeeksAgo = new Date(now.getTime() - 28 * 86400000)

    const recent = data.filter((d: any) => new Date(d.dato) >= twoWeeksAgo)
    const prior = data.filter((d: any) => { const dt = new Date(d.dato); return dt >= fourWeeksAgo && dt < twoWeeksAgo })

    const preventable = data.filter((d: any) => typeof d.forebyg === 'string' && d.forebyg.startsWith('Ja'))
    const solved = data.filter((d: any) => d.losning === 'Løst i samtalen').length
    const escalated = data.filter((d: any) => d.losning === 'Eskaleret internt').length
    const unsolved = data.filter((d: any) => d.losning === 'Ikke løst').length
    const long = data.filter((d: any) => d.tid === 'Lang (over 15 min)')

    const totalMinutes = data.reduce((s: number, d: any) => {
      if (d.tid === 'Kort (under 5 min)') return s + 3
      if (d.tid === 'Medium (5–15 min)') return s + 10
      if (d.tid === 'Lang (over 15 min)') return s + 20
      return s + 5
    }, 0)

    // Growing categories
    const recentCats = Object.fromEntries(countBy.call(null, 'kategori').map(([k]) => {
      const rc = recent.filter((d: any) => d.kategori === k).length
      const pc = prior.filter((d: any) => d.kategori === k).length
      return [k, { recent: rc, prior: pc, growth: pc > 0 ? Math.round(((rc - pc) / pc) * 100) : rc > 0 ? 100 : 0 }]
    }))

    const insights = {
      total,
      recentTwoWeeks: recent.length,
      priorTwoWeeks: prior.length,
      volumeTrend: prior.length > 0 ? `${Math.round(((recent.length - prior.length) / prior.length) * 100)}%` : 'N/A',
      resolutionRate: `${Math.round((solved / total) * 100)}%`,
      preventableRate: `${Math.round((preventable.length / total) * 100)}%`,
      preventableBreakdown: {
        vejledning: data.filter((d: any) => d.forebyg === 'Ja – bedre vejledning').length,
        platform: data.filter((d: any) => d.forebyg === 'Ja – platformsforbedring').length,
        kommunikation: data.filter((d: any) => d.forebyg === 'Ja – bedre kommunikation').length,
      },
      escalated,
      unsolved,
      longConversations: long.length,
      estimatedTotalHours: Math.round(totalMinutes / 60),
      topCategories: countBy('kategori').slice(0, 5),
      topResolutions: countBy('losning'),
      categoryTrends: Object.fromEntries(
        Object.entries(recentCats).filter(([, v]: any) => v.growth > 20 || v.growth < -20).slice(0, 5)
      ),
    }

    return {
      content: [{
        type: 'text' as const,
        text: JSON.stringify(insights, null, 2),
      }],
    }
  }
)

server.tool(
  'get_fields',
  'Get the current field configuration (what fields exist, their types, and options).',
  {},
  async () => {
    const fields = getFields()
    return {
      content: [{
        type: 'text' as const,
        text: JSON.stringify(fields, null, 2),
      }],
    }
  }
)

server.tool(
  'add_field_option',
  'Add a new option to a select/toggle/combobox field.',
  {
    field: z.string().describe('Field key (e.g. kategori, kanal, fond)'),
    option: z.string().describe('The new option value to add'),
  },
  async (params) => {
    const fields = getFields()
    const field = fields[params.field]
    if (!field) {
      return { content: [{ type: 'text' as const, text: `Field "${params.field}" not found. Available: ${Object.keys(fields).join(', ')}` }] }
    }
    if (!field.options) {
      return { content: [{ type: 'text' as const, text: `Field "${params.field}" is not a select/toggle/combobox field.` }] }
    }
    if (field.options.includes(params.option)) {
      return { content: [{ type: 'text' as const, text: `Option "${params.option}" already exists in "${params.field}".` }] }
    }
    field.options.push(params.option)
    setFields(fields)
    return { content: [{ type: 'text' as const, text: `Added "${params.option}" to "${params.field}". Options: ${field.options.join(', ')}` }] }
  }
)

// ── Start ──

async function main() {
  const transport = new StdioServerTransport()
  await server.connect(transport)
}

main().catch(console.error)
