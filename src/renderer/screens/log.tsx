import { useState } from 'react'
import { Card, CardContent } from 'renderer/components/ui/card'
import { Button } from 'renderer/components/ui/button'
import { Badge } from 'renderer/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from 'renderer/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from 'renderer/components/ui/select'
import { useStore } from 'renderer/context/store'
import { Download, Trash2, ListX } from 'lucide-react'

export function LogView() {
  const { data, fields, deleteEntry } = useStore()
  const [filters, setFilters] = useState<Record<string, string>>({})

  const selectFields = Object.entries(fields).filter(([, f]) => f.type === 'select' || f.type === 'toggle')

  let filtered = [...data]
  for (const [key, val] of Object.entries(filters)) {
    if (!val || val === 'all') continue
    if (key === 'forebyg') {
      filtered = filtered.filter(
        (d) => typeof d[key] === 'string' && (d[key] as string).startsWith('Ja')
      )
    } else {
      filtered = filtered.filter((d) => d[key] === val)
    }
  }

  function exportCSV() {
    if (!data.length) return
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
    a.download = `gc-support-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
  }

  const tidVariant = (val: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
    if (val.includes('Kort')) return 'secondary'
    if (val.includes('Lang')) return 'destructive'
    return 'outline'
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Alle henvendelser</h2>
        <p className="text-sm text-muted-foreground mt-1">
          {data.length} henvendelser i alt
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {selectFields.map(([key, f]) => (
          <Select
            key={key}
            value={filters[key] || 'all'}
            onValueChange={(val) =>
              setFilters((prev) => ({ ...prev, [key]: val }))
            }
          >
            <SelectTrigger className="w-44 h-8 text-xs">
              <SelectValue placeholder={`Alle ${f.label.toLowerCase()}`} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle {f.label.toLowerCase()}</SelectItem>
              {key === 'forebyg' ? (
                <SelectItem value="Ja">Kun forebyggelige</SelectItem>
              ) : (
                f.options?.map((opt) => (
                  <SelectItem key={opt} value={opt}>
                    {opt}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        ))}
        <Button variant="outline" size="sm" className="ml-auto" onClick={exportCSV}>
          <Download className="size-3.5 mr-1.5" />
          CSV
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <ListX className="size-10 mb-3" />
              <p className="text-sm">Ingen henvendelser matcher filteret</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Dato</TableHead>
                  {Object.entries(fields).map(([key, f]) => (
                    <TableHead key={key}>{f.label}</TableHead>
                  ))}
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((d) => (
                  <TableRow key={d.id}>
                    <TableCell className="text-muted-foreground whitespace-nowrap text-xs">
                      {d.dato}
                    </TableCell>
                    {Object.entries(fields).map(([key]) => {
                      const val = String(d[key] || '-')
                      if (key === 'brugertype') {
                        return (
                          <TableCell key={key}>
                            <Badge variant={val === 'Ansøger' ? 'default' : 'secondary'}>
                              {val}
                            </Badge>
                          </TableCell>
                        )
                      }
                      if (key === 'tid') {
                        const short = val.includes('Kort') ? 'Kort' : val.includes('Lang') ? 'Lang' : val.includes('Medium') ? 'Medium' : val
                        return (
                          <TableCell key={key}>
                            <Badge variant={tidVariant(val)}>{short}</Badge>
                          </TableCell>
                        )
                      }
                      if (key === 'forebyg') {
                        return (
                          <TableCell key={key}>
                            {val.startsWith('Ja') && (
                              <Badge variant="outline" className="border-chart-5 text-chart-5">
                                Ja
                              </Badge>
                            )}
                          </TableCell>
                        )
                      }
                      if (key === 'note') {
                        return (
                          <TableCell
                            key={key}
                            className="max-w-[200px] truncate text-xs text-muted-foreground"
                            title={val}
                          >
                            {val}
                          </TableCell>
                        )
                      }
                      return (
                        <TableCell key={key} className="text-xs">
                          {val}
                        </TableCell>
                      )
                    })}
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-7 text-muted-foreground hover:text-destructive"
                        onClick={() => {
                          if (confirm('Slet denne henvendelse?'))
                            deleteEntry(d.id)
                        }}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
