import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from 'renderer/components/ui/card'
import { Button } from 'renderer/components/ui/button'
import { Input } from 'renderer/components/ui/input'
import { Label } from 'renderer/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from 'renderer/components/ui/select'
import { Badge } from 'renderer/components/ui/badge'
import { Separator } from 'renderer/components/ui/separator'
import { useStore } from 'renderer/context/store'
import { toast } from 'sonner'
import { Plus, X, RotateCcw, Download, Trash2, Sun, Moon, Monitor, ArrowUp, ArrowDown, Copy, Check, Bot } from 'lucide-react'

export function SettingsView() {
  const { fields, updateFields, resetFields, data, clearAllData, theme, setTheme, branding, setBranding } = useStore()
  const [newFieldKey, setNewFieldKey] = useState('')
  const [newFieldLabel, setNewFieldLabel] = useState('')
  const [newFieldType, setNewFieldType] = useState<'select' | 'text' | 'textarea'>('select')

  async function addOption(key: string, value: string) {
    if (!value.trim()) return
    const field = fields[key]
    if (!field || field.type !== 'select') return
    if (field.options?.includes(value.trim())) {
      toast.error('Findes allerede')
      return
    }
    const updated = {
      ...fields,
      [key]: {
        ...field,
        options: [...(field.options || []), value.trim()],
      },
    }
    await updateFields(updated)
    toast.success('Mulighed tilføjet')
  }

  async function removeOption(key: string, idx: number) {
    const field = fields[key]
    if (!field || !field.options) return
    const opts = [...field.options]
    opts.splice(idx, 1)
    const updated = { ...fields, [key]: { ...field, options: opts } }
    await updateFields(updated)
  }

  async function removeField(key: string) {
    if (!confirm(`Fjern feltet "${fields[key].label}"?`)) return
    const { [key]: _, ...rest } = fields
    await updateFields(rest)
    toast.success('Felt fjernet')
  }

  async function addField() {
    const key = newFieldKey.trim().replace(/\s+/g, '_').toLowerCase()
    const label = newFieldLabel.trim()
    if (!key || !label) {
      toast.error('Udfyld feltnavn og label')
      return
    }
    if (fields[key] || key === 'dato' || key === 'id') {
      toast.error('Feltnavn er allerede i brug')
      return
    }
    const updated = {
      ...fields,
      [key]: {
        label,
        type: newFieldType,
        required: false,
        options: (newFieldType === 'select' || newFieldType === 'toggle' || newFieldType === 'combobox') ? [] : undefined,
        placeholder: (newFieldType !== 'select' && newFieldType !== 'toggle' && newFieldType !== 'combobox') ? '' : undefined,
        full: newFieldType === 'textarea',
      },
    }
    await updateFields(updated)
    setNewFieldKey('')
    setNewFieldLabel('')
    toast.success('Felt tilføjet')
  }

  async function moveField(key: string, direction: 'up' | 'down') {
    const keys = Object.keys(fields)
    const idx = keys.indexOf(key)
    if (direction === 'up' && idx <= 0) return
    if (direction === 'down' && idx >= keys.length - 1) return
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1
    const newKeys = [...keys]
    ;[newKeys[idx], newKeys[swapIdx]] = [newKeys[swapIdx], newKeys[idx]]
    const reordered: typeof fields = {}
    for (const k of newKeys) reordered[k] = fields[k]
    await updateFields(reordered)
  }

  function exportJSON() {
    const blob = new Blob(
      [JSON.stringify({ data, fields }, null, 2)],
      { type: 'application/json' }
    )
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `supporttracker-backup-${new Date().toISOString().split('T')[0]}.json`
    a.click()
  }

  function exportCSV() {
    if (!data.length) {
      toast.error('Ingen data at eksportere')
      return
    }
    const fieldKeys = Object.keys(fields)
    const headers = ['Dato', ...fieldKeys.map((k) => fields[k].label)]
    const rows = data.map((d) =>
      [d.dato, ...fieldKeys.map((k) => d[k] || '')]
        .map((v) => `"${String(v || '').replace(/"/g, '""')}"`)
        .join(',')
    )
    const csv = [headers.join(','), ...rows].join('\n')
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `supporttracker-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="text-xl font-semibold">Indstillinger</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Tilpas felter, valgmuligheder og udseende
        </p>
      </div>

      {/* Theme */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Udseende</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            {([
              { mode: 'light' as const, icon: Sun, label: 'Lys' },
              { mode: 'dark' as const, icon: Moon, label: 'Mørk' },
              { mode: 'auto' as const, icon: Monitor, label: 'System' },
            ]).map(({ mode, icon: Icon, label }) => (
              <Button
                key={mode}
                variant={theme === mode ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTheme(mode)}
                className="gap-2"
              >
                <Icon className="size-3.5" />
                {label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Branding */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Branding</CardTitle>
          <CardDescription>Tilpas navn og undertitel i sidebaren</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Organisationsnavn</Label>
              <Input
                value={branding.orgName}
                onChange={(e) => setBranding({ ...branding, orgName: e.target.value })}
                placeholder="Dit firmanavn"
                className="h-8 text-sm"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Undertitel</Label>
              <Input
                value={branding.subtitle}
                onChange={(e) => setBranding({ ...branding, subtitle: e.target.value })}
                placeholder="Supporttracker"
                className="h-8 text-sm"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Fields */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Formularfelter</CardTitle>
          <CardDescription>
            Tilpas dropdown-muligheder eller tilføj nye felter
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-0">
          {Object.entries(fields).map(([key, field], idx) => (
            <div key={key}>
              {idx > 0 && <Separator className="my-4" />}
              <div className="flex items-start justify-between gap-4">
                <div className="flex flex-col gap-1 shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-5 text-muted-foreground"
                    disabled={idx === 0}
                    onClick={() => moveField(key, 'up')}
                  >
                    <ArrowUp className="size-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-5 text-muted-foreground"
                    disabled={idx === Object.keys(fields).length - 1}
                    onClick={() => moveField(key, 'down')}
                  >
                    <ArrowDown className="size-3" />
                  </Button>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-medium text-sm">{field.label}</span>
                    <Badge variant="outline" className="text-[10px] px-1.5">
                      {field.type === 'select' ? 'dropdown' : field.type}
                    </Badge>
                    {field.required && (
                      <Badge variant="secondary" className="text-[10px] px-1.5">påkrævet</Badge>
                    )}
                  </div>

                  {(field.type === 'select' || field.type === 'toggle' || field.type === 'combobox') && (
                    <div className="space-y-2">
                      <div className="flex flex-wrap gap-1.5">
                        {field.options?.map((opt, i) => (
                          <Badge key={opt} variant="secondary" className="gap-1 pr-1 text-xs">
                            {opt}
                            <button
                              type="button"
                              onClick={() => removeOption(key, i)}
                              className="ml-0.5 rounded-full hover:bg-destructive/20 p-0.5"
                            >
                              <X className="size-2.5" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                      <OptionAdder onAdd={(val) => addOption(key, val)} />
                    </div>
                  )}

                  {field.type !== 'select' && field.type !== 'toggle' && field.type !== 'combobox' && (
                    <p className="ml-5.5 text-xs text-muted-foreground">Fritekstfelt</p>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-7 text-muted-foreground hover:text-destructive shrink-0"
                  onClick={() => removeField(key)}
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
            </div>
          ))}

          <Separator className="my-4" />

          {/* Add new field inline */}
          <div className="pt-2">
            <p className="text-xs font-medium text-muted-foreground mb-2">Tilføj nyt felt</p>
            <div className="flex gap-2 items-end">
              <div className="flex-1 space-y-1">
                <Label className="text-[10px] text-muted-foreground">ID</Label>
                <Input
                  value={newFieldKey}
                  onChange={(e) => setNewFieldKey(e.target.value)}
                  placeholder="prioritet"
                  className="h-8 text-xs"
                />
              </div>
              <div className="flex-1 space-y-1">
                <Label className="text-[10px] text-muted-foreground">Label</Label>
                <Input
                  value={newFieldLabel}
                  onChange={(e) => setNewFieldLabel(e.target.value)}
                  placeholder="Prioritet"
                  className="h-8 text-xs"
                />
              </div>
              <div className="w-28 space-y-1">
                <Label className="text-[10px] text-muted-foreground">Type</Label>
                <Select
                  value={newFieldType}
                  onValueChange={(val) => setNewFieldType(val as 'select' | 'text' | 'textarea')}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="select">Dropdown</SelectItem>
                    <SelectItem value="toggle">Toggle</SelectItem>
                    <SelectItem value="combobox">Typeahead</SelectItem>
                    <SelectItem value="text">Tekst</SelectItem>
                    <SelectItem value="textarea">Stort felt</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={addField} size="sm" className="h-8 px-3">
                <Plus className="size-3.5" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* MCP Integration */}
      <McpSection />

      {/* Data management */}
      <Card className="border-destructive/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm text-destructive">Data</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={exportCSV}>
              <Download className="size-3.5 mr-1.5" />
              Eksportér CSV
            </Button>
            <Button variant="outline" size="sm" onClick={exportJSON}>
              <Download className="size-3.5 mr-1.5" />
              Eksportér JSON
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (confirm('Nulstil alle feltindstillinger til standard?')) {
                  resetFields()
                  toast.success('Indstillinger nulstillet')
                }
              }}
            >
              <RotateCcw className="size-3.5 mr-1.5" />
              Nulstil felter
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => {
                if (confirm('Slet ALLE henvendelser? Dette kan ikke fortrydes.')) {
                  clearAllData()
                  toast.success('Alle henvendelser slettet')
                }
              }}
            >
              <Trash2 className="size-3.5 mr-1.5" />
              Slet alle data
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)

  function handleCopy() {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Button variant="ghost" size="icon" className="size-6 shrink-0" onClick={handleCopy}>
      {copied ? <Check className="size-3 text-primary" /> : <Copy className="size-3" />}
    </Button>
  )
}

const claudeDesktopConfig = `{
  "mcpServers": {
    "supporttracker": {
      "command": "npx",
      "args": ["tsx", "<path-to>/SupportTracker/src/mcp/server.ts"]
    }
  }
}`

const claudeCodeConfig = `{
  "mcpServers": {
    "supporttracker": {
      "command": "npx",
      "args": ["tsx", "./src/mcp/server.ts"],
      "cwd": "<path-to>/SupportTracker"
    }
  }
}`

function McpSection() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Bot className="size-4 text-primary" />
          <CardTitle className="text-sm">AI Integration (MCP)</CardTitle>
        </div>
        <CardDescription>
          Forbind med Claude Desktop eller Claude Code for at læse, oprette og analysere henvendelser via AI.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <Label className="text-xs font-medium">Claude Desktop</Label>
            <CopyButton text={claudeDesktopConfig} />
          </div>
          <p className="text-[11px] text-muted-foreground mb-2">
            Tilføj til <code className="bg-muted px-1 py-0.5 rounded text-[10px]">~/Library/Application Support/Claude/claude_desktop_config.json</code>
          </p>
          <pre className="bg-muted rounded-lg p-3 text-[11px] leading-relaxed overflow-x-auto select-text">{claudeDesktopConfig}</pre>
        </div>

        <Separator />

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <Label className="text-xs font-medium">Claude Code</Label>
            <CopyButton text={claudeCodeConfig} />
          </div>
          <p className="text-[11px] text-muted-foreground mb-2">
            Tilføj til <code className="bg-muted px-1 py-0.5 rounded text-[10px]">.mcp.json</code> i projekt-roden
          </p>
          <pre className="bg-muted rounded-lg p-3 text-[11px] leading-relaxed overflow-x-auto select-text">{claudeCodeConfig}</pre>
        </div>

        <Separator />

        <div>
          <Label className="text-xs font-medium mb-2 block">Tilgængelige værktøjer</Label>
          <div className="grid grid-cols-2 gap-1.5">
            {[
              ['list_entries', 'Søg og filtrér henvendelser'],
              ['create_entry', 'Opret ny henvendelse'],
              ['delete_entry', 'Slet en henvendelse'],
              ['get_insights', 'Hent analyse og statistik'],
              ['get_fields', 'Se feltkonfiguration'],
              ['add_field_option', 'Tilføj ny valgmulighed'],
            ].map(([tool, desc]) => (
              <div key={tool} className="flex items-start gap-2 p-2 rounded-md bg-muted/50 text-xs">
                <code className="text-[10px] bg-background px-1 py-0.5 rounded font-mono shrink-0">{tool}</code>
                <span className="text-muted-foreground">{desc}</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function OptionAdder({ onAdd }: { onAdd: (val: string) => void }) {
  const [value, setValue] = useState('')

  function handleAdd() {
    if (value.trim()) {
      onAdd(value.trim())
      setValue('')
    }
  }

  return (
    <div className="flex gap-1.5">
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Ny mulighed..."
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault()
            handleAdd()
          }
        }}
        className="h-7 text-xs flex-1"
      />
      <Button variant="ghost" size="sm" onClick={handleAdd} className="h-7 px-2 text-xs">
        <Plus className="size-3" />
      </Button>
    </div>
  )
}
