"use client"

import * as React from "react"
import { Check, ChevronsUpDown, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface MultiSelectProps {
  options: { value: string; label: string }[]
  selected: string[]
  onChange: (selected: string[]) => void
  placeholder?: string
  className?: string
}

export function MultiSelect({
  options,
  selected,
  onChange,
  placeholder = "Tanlang...",
  className,
}: MultiSelectProps) {
  const [open, setOpen] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState("")

  // Memoize the label lookup for better performance
  const labelMap = React.useMemo(() => {
    const map = new Map<string, string>()
    options.forEach((opt) => {
      if (opt.value && opt.label) {
        map.set(String(opt.value), String(opt.label))
      }
    })
    return map
  }, [options])

  // Reset search when popover closes
  React.useEffect(() => {
    if (!open) {
      setSearchQuery("")
    }
  }, [open])

  const handleUnselect = (item: string) => {
    onChange(selected.filter((i) => i !== item))
  }

  const handleSelect = (item: string) => {
    if (selected.includes(item)) {
      onChange(selected.filter((i) => i !== item))
    } else {
      onChange([...selected, item])
    }
  }

  // Filter options based on search query
  const filteredOptions = React.useMemo(() => {
    if (!searchQuery.trim()) {
      return options
    }
    const query = searchQuery.toLowerCase().trim()
    return options.filter((opt) => {
      const label = String(opt.label || "").toLowerCase()
      return label.includes(query)
    })
  }, [options, searchQuery])

  // Get display label for a selected value
  const getLabel = (value: string) => {
    const normalizedValue = String(value)
    const label = labelMap.get(normalizedValue)
    if (label) {
      return label
    }
    // Fallback: try to find in options directly
    const option = options.find((opt) => String(opt.value) === normalizedValue)
    return option?.label || value
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between min-h-10 h-auto", className)}
        >
          <div className="flex gap-1 flex-wrap">
            {selected.length === 0 ? (
              <span className="text-muted-foreground">{placeholder}</span>
            ) : (
              selected.map((item) => {
                const label = getLabel(item)
                return (
                  <Badge
                    variant="secondary"
                    key={item}
                    className="mr-1 mb-1"
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      handleUnselect(item)
                    }}
                  >
                    {label}
                    <span
                      role="button"
                      tabIndex={0}
                      className="ml-1 ring-offset-background rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 cursor-pointer"
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault()
                          handleUnselect(item)
                        }
                      }}
                      onMouseDown={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                      }}
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        handleUnselect(item)
                      }}
                    >
                      <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                    </span>
                  </Badge>
                )
              })
            )}
          </div>
          <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start" onOpenAutoFocus={(e) => e.preventDefault()}>
        <Command shouldFilter={false}>
          <CommandInput 
            placeholder="Qidirish..." 
            value={searchQuery}
            onValueChange={setSearchQuery}
          />
          <CommandList>
            {filteredOptions.length === 0 ? (
              <CommandEmpty>Topilmadi.</CommandEmpty>
            ) : (
              <CommandGroup>
                {filteredOptions.map((option) => {
                  const isSelected = selected.includes(String(option.value))
                  return (
                    <CommandItem
                      key={option.value}
                      value={option.value}
                      onSelect={() => {
                        handleSelect(String(option.value))
                        setSearchQuery("")
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          isSelected ? "opacity-100" : "opacity-0",
                        )}
                      />
                      {option.label}
                    </CommandItem>
                  )
                })}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

