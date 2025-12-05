"use client"

import * as React from "react"
import { cn } from "./utils"

export interface SwitchProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  checked?: boolean
  onCheckedChange?: (checked: boolean) => void
}

/**
 * Đơn giản hóa: Switch dạng button, API tương thích với shadcn:
 * - props.checked
 * - props.onCheckedChange(checked:boolean)
 */
export const Switch = React.forwardRef<HTMLButtonElement, SwitchProps>(
  ({ checked = false, onCheckedChange, className, disabled, ...props }, ref) => {
    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
      if (disabled) return
      onCheckedChange?.(!checked)
      props.onClick?.(event)
    }

    return (
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-disabled={disabled}
        ref={ref}
        onClick={handleClick}
        className={cn(
          "inline-flex h-6 w-11 items-center rounded-full border transition-colors",
          checked
            ? "bg-blue-600 border-blue-600"
            : "bg-slate-200 border-slate-300",
          disabled && "opacity-50 cursor-not-allowed",
          className
        )}
        {...props}
      >
        <span
          className={cn(
            "inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform",
            checked ? "translate-x-5" : "translate-x-1"
          )}
        />
      </button>
    )
  }
)

Switch.displayName = "Switch"

export default Switch


