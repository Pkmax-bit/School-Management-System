"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { ChevronDown } from "lucide-react"

interface SelectContextValue {
  value: string
  onValueChange: (value: string) => void
  open: boolean
  setOpen: (open: boolean) => void
}

const SelectContext = React.createContext<SelectContextValue | null>(null)

interface SelectProps {
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
  children: React.ReactNode
  className?: string
}

export function Select({ value, defaultValue, onValueChange, children, className }: SelectProps) {
  const [internalValue, setInternalValue] = React.useState(defaultValue || "")
  const [open, setOpen] = React.useState(false)
  const selectIdRef = React.useRef<string>(`select-${Math.random().toString(36).substr(2, 9)}`)
  
  const currentValue = value ?? internalValue
  const handleChange = React.useCallback((newValue: string) => {
    if (value === undefined) {
      setInternalValue(newValue)
    }
    onValueChange?.(newValue)
    setOpen(false)
  }, [value, onValueChange])

  return (
    <SelectContext.Provider value={{ value: currentValue, onValueChange: handleChange, open, setOpen }}>
      <div className={cn("relative", className)} data-select-id={selectIdRef.current}>
        {children}
      </div>
    </SelectContext.Provider>
  )
}

interface SelectTriggerProps {
  children: React.ReactNode
  className?: string
}

export function SelectTrigger({ children, className }: SelectTriggerProps) {
  const context = React.useContext(SelectContext)
  const triggerRef = React.useRef<HTMLButtonElement>(null)
  
  if (!context) {
    throw new Error("SelectTrigger must be used within Select")
  }

  // Lấy select ID từ parent sau khi mount
  const [selectId, setSelectId] = React.useState('')
  
  React.useEffect(() => {
    if (triggerRef.current) {
      const parent = triggerRef.current.closest('[data-select-id]')
      const id = parent?.getAttribute('data-select-id') || ''
      setSelectId(id)
    }
  }, [])

  return (
    <button
      ref={triggerRef}
      type="button"
      data-select-trigger
      data-select-id={selectId}
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        context.setOpen(!context.open)
      }}
      className={cn(
        "flex h-10 w-full items-center justify-between rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1",
        className
      )}
      aria-expanded={context.open}
      aria-haspopup="listbox"
    >
      {children}
      <ChevronDown className={cn("h-4 w-4 opacity-50 transition-transform", context.open && "rotate-180")} />
    </button>
  )
}

interface SelectValueProps {
  placeholder?: string
  className?: string
}

export function SelectValue({ placeholder, className }: SelectValueProps) {
  const context = React.useContext(SelectContext)
  if (!context) {
    throw new Error("SelectValue must be used within Select")
  }

  return (
    <span className={cn("block truncate", className)}>
      {context.value || placeholder || "Chọn..."}
    </span>
  )
}

interface SelectContentProps {
  children: React.ReactNode
  className?: string
}

export function SelectContent({ children, className }: SelectContentProps) {
  const context = React.useContext(SelectContext)
  const contentRef = React.useRef<HTMLDivElement>(null)
  const [position, setPosition] = React.useState({ top: 0, left: 0, width: 0 })

  const updatePosition = React.useCallback(() => {
    if (!contentRef.current) return

    // Tìm parent container (.relative) và trigger cùng ID
    const parent = contentRef.current.closest('.relative[data-select-id]') as HTMLElement
    if (!parent) return

    const selectId = parent.getAttribute('data-select-id')
    if (!selectId) return

    // Tìm trigger có cùng select ID
    const trigger = parent.querySelector(`[data-select-trigger][data-select-id="${selectId}"]`) as HTMLElement
    if (!trigger) {
      // Fallback: tìm trigger bất kỳ trong parent
      const fallbackTrigger = parent.querySelector('[data-select-trigger]') as HTMLElement
      if (!fallbackTrigger) return
      
      const parentRect = parent.getBoundingClientRect()
      const triggerRect = fallbackTrigger.getBoundingClientRect()
      
      setPosition({
        top: triggerRect.bottom - parentRect.top + 4,
        left: triggerRect.left - parentRect.left,
        width: Math.max(triggerRect.width, 200),
      })
      return
    }

    const parentRect = parent.getBoundingClientRect()
    const triggerRect = trigger.getBoundingClientRect()
    
    setPosition({
      top: triggerRect.bottom - parentRect.top + 4,
      left: triggerRect.left - parentRect.left,
      width: Math.max(triggerRect.width, 200),
    })
  }, [])

  // Update position synchronously when opening
  React.useLayoutEffect(() => {
    if (!context?.open) return
    updatePosition()
  }, [context?.open, updatePosition])

  React.useEffect(() => {
    if (!context?.open) return

    // Update on scroll/resize
    window.addEventListener('scroll', updatePosition, true)
    window.addEventListener('resize', updatePosition)

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (
        contentRef.current &&
        !contentRef.current.contains(target) &&
        !target.closest('[data-select-trigger]')
      ) {
        context.setOpen(false)
      }
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        context.setOpen(false)
      }
    }

    // Delay để tránh click event bubble
    const timeoutId = setTimeout(() => {
      document.addEventListener("mousedown", handleClickOutside, true)
      document.addEventListener("keydown", handleEscape)
    }, 10)

    return () => {
      clearTimeout(timeoutId)
      window.removeEventListener('scroll', updatePosition, true)
      window.removeEventListener('resize', updatePosition)
      document.removeEventListener("mousedown", handleClickOutside, true)
      document.removeEventListener("keydown", handleEscape)
    }
  }, [context])

  if (!context) {
    throw new Error("SelectContent must be used within Select")
  }

  if (!context.open) {
    return null
  }

  return (
    <div
      ref={contentRef}
      className={cn(
        "absolute z-[100] min-w-[8rem] overflow-hidden rounded-md border border-gray-200 bg-white text-gray-900 shadow-lg",
        className
      )}
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
        width: `${Math.max(position.width, 200)}px`,
        maxHeight: '300px',
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="p-1 max-h-[300px] overflow-y-auto">
        {children}
      </div>
    </div>
  )
}

interface SelectItemProps {
  value: string
  children: React.ReactNode
  className?: string
  disabled?: boolean
}

export function SelectItem({ value, children, className, disabled }: SelectItemProps) {
  const context = React.useContext(SelectContext)
  if (!context) {
    throw new Error("SelectItem must be used within Select")
  }

  const isSelected = context.value === value

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!disabled) {
      context.onValueChange(value)
    }
  }

  return (
    <div
      role="option"
      aria-selected={isSelected}
      onClick={handleClick}
      className={cn(
        "relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none focus:bg-accent focus:text-accent-foreground hover:bg-accent hover:text-accent-foreground",
        isSelected && "bg-accent text-accent-foreground",
        disabled && "pointer-events-none opacity-50",
        className
      )}
    >
      {children}
    </div>
  )
}
