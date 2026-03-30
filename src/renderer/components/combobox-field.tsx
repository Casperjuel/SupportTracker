import { useState, useMemo } from 'react'
import { Check, ChevronsUpDown, Plus } from 'lucide-react'
import { cn } from 'renderer/lib/utils'
import { Button } from 'renderer/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from 'renderer/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from 'renderer/components/ui/popover'

interface ComboboxFieldProps {
  value: string
  options: string[]
  placeholder?: string
  searchPlaceholder?: string
  emptyText?: string
  className?: string
  onValueChange: (value: string) => void
  onOptionCreated: (value: string) => void
}

export function ComboboxField({
  value,
  options,
  placeholder = 'Vælg...',
  searchPlaceholder = 'Søg...',
  emptyText = 'Ingen resultater.',
  className,
  onValueChange,
  onOptionCreated,
}: ComboboxFieldProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    if (!search) return options
    const lower = search.toLowerCase()
    return options.filter((opt) => opt.toLowerCase().includes(lower))
  }, [options, search])

  const exactMatch = options.some(
    (opt) => opt.toLowerCase() === search.toLowerCase()
  )

  function handleSelect(val: string) {
    onValueChange(val)
    setSearch('')
    setOpen(false)
  }

  function handleCreate() {
    const trimmed = search.trim()
    if (!trimmed || exactMatch) return
    onOptionCreated(trimmed)
    onValueChange(trimmed)
    setSearch('')
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            'w-full justify-between font-normal',
            !value && 'text-muted-foreground',
            className
          )}
        >
          <span className="truncate">{value || placeholder}</span>
          <ChevronsUpDown className="size-3.5 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder={searchPlaceholder}
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            <CommandEmpty>
              {search.trim() ? (
                <button
                  type="button"
                  onClick={handleCreate}
                  className="flex items-center gap-2 w-full px-2 py-1.5 text-sm cursor-pointer hover:bg-accent rounded-sm"
                >
                  <Plus className="size-3.5" />
                  Tilføj "<strong>{search.trim()}</strong>"
                </button>
              ) : (
                emptyText
              )}
            </CommandEmpty>
            <CommandGroup>
              {filtered.map((opt) => (
                <CommandItem
                  key={opt}
                  value={opt}
                  onSelect={() => handleSelect(opt)}
                >
                  <Check
                    className={cn(
                      'size-3.5 mr-2',
                      value === opt ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                  {opt}
                </CommandItem>
              ))}
            </CommandGroup>
            {search.trim() && !exactMatch && filtered.length > 0 && (
              <>
                <CommandSeparator />
                <CommandGroup>
                  <CommandItem onSelect={handleCreate}>
                    <Plus className="size-3.5 mr-2" />
                    Tilføj "<strong>{search.trim()}</strong>"
                  </CommandItem>
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
