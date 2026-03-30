import { useState, useRef, useEffect } from 'react'
import { Card, CardContent } from 'renderer/components/ui/card'
import { Button } from 'renderer/components/ui/button'
import { Input } from 'renderer/components/ui/input'
import { Textarea } from 'renderer/components/ui/textarea'
import { Label } from 'renderer/components/ui/label'
import { Badge } from 'renderer/components/ui/badge'
import { ToggleGroup, ToggleGroupItem } from 'renderer/components/ui/toggle-group'
import { CreatableSelect } from 'renderer/components/creatable-select'
import { ComboboxField } from 'renderer/components/combobox-field'
import { useStore } from 'renderer/context/store'
import { toast } from 'sonner'
import { CheckCircle2, Zap } from 'lucide-react'

export function RegisterView() {
  const { fields, addEntry, updateFields, data } = useStore()
  const [formData, setFormData] = useState<Record<string, string>>({
    dato: new Date().toISOString().split('T')[0],
  })
  const formRef = useRef<HTMLFormElement>(null)
  const firstSelectRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    setTimeout(() => firstSelectRef.current?.focus(), 100)
  }, [])

  function updateField(key: string, value: string) {
    setFormData((prev) => ({ ...prev, [key]: value }))
  }

  async function handleOptionCreated(fieldKey: string, newOption: string) {
    const field = fields[fieldKey]
    if (!field || field.type !== 'select') return
    const updated = {
      ...fields,
      [fieldKey]: {
        ...field,
        options: [...(field.options || []), newOption],
      },
    }
    await updateFields(updated)
    toast.success(`"${newOption}" tilføjet til ${field.label}`)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    for (const [key, field] of Object.entries(fields)) {
      if (field.required && !formData[key]) {
        toast.error(`Udfyld feltet: ${field.label}`)
        return
      }
    }

    await addEntry(formData)
    toast.success('Henvendelse registreret', {
      icon: <CheckCircle2 className="size-4" />,
    })

    setFormData({ dato: new Date().toISOString().split('T')[0] })
    setTimeout(() => firstSelectRef.current?.focus(), 100)
  }

  function repeatLast() {
    if (data.length === 0) return
    const last = data[0]
    const prefill: Record<string, string> = {
      dato: new Date().toISOString().split('T')[0],
    }
    for (const key of Object.keys(fields)) {
      if (key !== 'note' && key !== 'fond' && last[key]) {
        prefill[key] = String(last[key])
      }
    }
    setFormData(prefill)
    toast.info('Udfyldt fra seneste henvendelse')
  }

  const fieldEntries = Object.entries(fields)
  const toggleFields = fieldEntries.filter(([, f]) => f.type === 'toggle')
  const selectFields = fieldEntries.filter(([, f]) => f.type === 'select')
  const otherFields = fieldEntries.filter(([, f]) => f.type !== 'select' && f.type !== 'toggle' && f.type !== 'combobox')
  const comboboxFields = fieldEntries.filter(([, f]) => f.type === 'combobox')
  let isFirstSelect = true

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Ny henvendelse</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Udfyld efter endt samtale – tager under 30 sekunder
          </p>
        </div>
        {data.length > 0 && (
          <Button variant="outline" size="sm" onClick={repeatLast} className="gap-1.5">
            <Zap className="size-3.5" />
            Gentag seneste
          </Button>
        )}
      </div>

      <Card>
        <CardContent className="pt-6">
          <form ref={formRef} onSubmit={handleSubmit}>
            {/* Date row */}
            <div className="mb-4">
              <Label htmlFor="dato" className="text-xs text-muted-foreground">Dato</Label>
              <Input
                id="dato"
                type="date"
                value={formData.dato || ''}
                onChange={(e) => updateField('dato', e.target.value)}
                required
                className="w-44 mt-1"
              />
            </div>

            {/* Toggle fields */}
            {toggleFields.length > 0 && (
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                {toggleFields.map(([key, field]) => (
                  <div key={key} className="space-y-1.5">
                    <Label className="text-xs">{field.label}</Label>
                    <ToggleGroup
                      type="single"
                      value={formData[key] || ''}
                      onValueChange={(val) => { if (val) updateField(key, val) }}
                      className="justify-start"
                    >
                      {field.options?.map((opt) => (
                        <ToggleGroupItem
                          key={opt}
                          value={opt}
                          className="px-4 text-xs data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
                        >
                          {opt}
                        </ToggleGroupItem>
                      ))}
                    </ToggleGroup>
                  </div>
                ))}
              </div>
            )}

            {/* Select fields in a tight grid for speed */}
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
              {selectFields.map(([key, field]) => {
                const isFirst = isFirstSelect
                if (isFirst) isFirstSelect = false
                return (
                  <div key={key} className="space-y-1.5">
                    <Label htmlFor={key} className="text-xs">
                      {field.label}
                      {!field.required && (
                        <span className="text-muted-foreground font-normal ml-1">(valgfrit)</span>
                      )}
                    </Label>
                    <CreatableSelect
                      id={key}
                      value={formData[key] || ''}
                      options={field.options || []}
                      triggerRef={isFirst ? firstSelectRef : undefined}
                      onValueChange={(val) => updateField(key, val)}
                      onOptionCreated={(val) => handleOptionCreated(key, val)}
                    />
                  </div>
                )
              })}
            </div>

            {/* Combobox fields (typeahead) */}
            {comboboxFields.length > 0 && (
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                {comboboxFields.map(([key, field]) => (
                  <div key={key} className="space-y-1.5">
                    <Label className="text-xs">
                      {field.label}
                      {!field.required && (
                        <span className="text-muted-foreground font-normal ml-1">(valgfrit)</span>
                      )}
                    </Label>
                    <ComboboxField
                      value={formData[key] || ''}
                      options={field.options || []}
                      placeholder={field.placeholder || `Søg ${field.label.toLowerCase()}...`}
                      searchPlaceholder={`Søg ${field.label.toLowerCase()}...`}
                      onValueChange={(val) => updateField(key, val)}
                      onOptionCreated={(val) => handleOptionCreated(key, val)}
                    />
                  </div>
                ))}
              </div>
            )}

            {/* Text/textarea fields */}
            {otherFields.length > 0 && (
              <div className="grid grid-cols-2 gap-4 mb-4">
                {otherFields.map(([key, field]) => (
                  <div
                    key={key}
                    className={`space-y-1.5 ${field.full ? 'col-span-2' : ''}`}
                  >
                    <Label htmlFor={key} className="text-xs">
                      {field.label}
                      {!field.required && (
                        <span className="text-muted-foreground font-normal ml-1">(valgfrit)</span>
                      )}
                    </Label>
                    {field.type === 'textarea' ? (
                      <Textarea
                        id={key}
                        value={formData[key] || ''}
                        onChange={(e) => updateField(key, e.target.value)}
                        placeholder={field.placeholder}
                        rows={2}
                      />
                    ) : (
                      <Input
                        id={key}
                        value={formData[key] || ''}
                        onChange={(e) => updateField(key, e.target.value)}
                        placeholder={field.placeholder}
                      />
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Quick summary of what's filled */}
            {Object.keys(formData).filter((k) => k !== 'dato' && formData[k]).length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-4">
                {Object.entries(formData)
                  .filter(([k, v]) => k !== 'dato' && v && fields[k]?.type === 'select')
                  .map(([k, v]) => (
                    <Badge key={k} variant="secondary" className="text-[10px]">
                      {v}
                    </Badge>
                  ))}
              </div>
            )}

            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setFormData({ dato: new Date().toISOString().split('T')[0] })
                }}
              >
                Ryd
              </Button>
              <Button type="submit">
                <CheckCircle2 className="size-4 mr-1.5" />
                Gem henvendelse
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
