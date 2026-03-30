import { useState, useRef } from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from 'renderer/components/ui/select'
import { Input } from 'renderer/components/ui/input'
import { Plus } from 'lucide-react'

interface CreatableSelectProps {
  id?: string
  value: string
  options: string[]
  placeholder?: string
  className?: string
  triggerRef?: React.Ref<HTMLButtonElement>
  onValueChange: (value: string) => void
  onOptionCreated: (value: string) => void
}

export function CreatableSelect({
  id,
  value,
  options,
  placeholder = 'Vælg...',
  className,
  triggerRef,
  onValueChange,
  onOptionCreated,
}: CreatableSelectProps) {
  const [newValue, setNewValue] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  function handleCreate() {
    const trimmed = newValue.trim()
    if (!trimmed) return
    if (options.includes(trimmed)) {
      onValueChange(trimmed)
      setNewValue('')
      return
    }
    onOptionCreated(trimmed)
    onValueChange(trimmed)
    setNewValue('')
  }

  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger
        id={id}
        ref={triggerRef}
        className={value ? className : `text-muted-foreground ${className || ''}`}
      >
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((opt) => (
          <SelectItem key={opt} value={opt}>
            {opt}
          </SelectItem>
        ))}

        {/* Inline create */}
        <div
          className="flex items-center gap-1.5 px-1 pt-1.5 mt-1 border-t border-border"
          onKeyDown={(e) => e.stopPropagation()}
        >
          <Input
            ref={inputRef}
            value={newValue}
            onChange={(e) => setNewValue(e.target.value)}
            placeholder="Ny mulighed..."
            className="h-7 text-xs"
            onKeyDown={(e) => {
              e.stopPropagation()
              if (e.key === 'Enter') {
                e.preventDefault()
                handleCreate()
              }
            }}
          />
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              handleCreate()
            }}
            className="shrink-0 flex items-center justify-center size-7 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
          >
            <Plus className="size-3.5" />
          </button>
        </div>
      </SelectContent>
    </Select>
  )
}
