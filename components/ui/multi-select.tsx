"use client"

import * as React from "react"
import { Popover } from "@base-ui/react/popover"
import { cn } from "cn"
import { HugeiconsIcon } from "@hugeicons/react"
import { UnfoldMoreIcon, Tick02Icon } from "@hugeicons/core-free-icons"

type Props = {
  options: string[]
  value: string[]
  onChange: (value: string[]) => void
  placeholder?: string
  className?: string
  id?: string
  allowCustom?: boolean
  "aria-invalid"?: boolean
  "aria-describedby"?: string
}

/**
 * Dropdown de selección múltiple (p. ej. zonas de un asesor). Las opciones salen
 * de valores ya definidos en el sistema; `allowCustom` habilita agregar nuevos.
 */
function MultiSelect({
  options,
  value,
  onChange,
  placeholder = "Seleccionar…",
  className,
  id,
  allowCustom = true,
  ...aria
}: Props) {
  const [nueva, setNueva] = React.useState("")
  const todas = React.useMemo(
    () => Array.from(new Set([...options, ...value])).sort((a, b) => a.localeCompare(b, "es")),
    [options, value]
  )

  function toggle(opt: string) {
    onChange(value.includes(opt) ? value.filter((v) => v !== opt) : [...value, opt])
  }
  function agregar() {
    const v = nueva.trim()
    if (v && !value.includes(v)) onChange([...value, v])
    setNueva("")
  }

  return (
    <Popover.Root>
      <Popover.Trigger
        id={id}
        {...aria}
        className={cn(
          "flex min-h-9 w-full items-center justify-between gap-1.5 rounded-4xl border border-input bg-input/30 px-3 py-1.5 text-sm transition-colors outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-[3px] aria-invalid:ring-destructive/20",
          className
        )}
      >
        <span className={cn("flex flex-1 flex-wrap items-center gap-1 text-left", value.length === 0 && "text-muted-foreground")}>
          {value.length === 0
            ? placeholder
            : value.map((v) => (
                <span key={v} className="rounded-full bg-secondary px-2 py-0.5 text-[12px] font-medium text-white">
                  {v}
                </span>
              ))}
        </span>
        <HugeiconsIcon icon={UnfoldMoreIcon} strokeWidth={2} className="pointer-events-none size-4 shrink-0 text-muted-foreground" />
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner side="bottom" sideOffset={4} align="start" className="isolate z-50">
          <Popover.Popup className="max-h-72 w-(--anchor-width) min-w-52 overflow-y-auto rounded-2xl bg-popover p-1 text-popover-foreground shadow-2xl ring-1 ring-foreground/5 outline-none">
            {todas.length === 0 && (
              <div className="px-3 py-2 text-[13px] text-muted-foreground">No hay opciones.</div>
            )}
            {todas.map((opt) => {
              const on = value.includes(opt)
              return (
                <button
                  type="button"
                  key={opt}
                  onClick={() => toggle(opt)}
                  className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm transition-colors hover:bg-muted"
                >
                  <span className={cn("flex size-4 shrink-0 items-center justify-center rounded-[6px] border border-input", on && "border-primary bg-primary text-primary-foreground")}>
                    {on && <HugeiconsIcon icon={Tick02Icon} strokeWidth={2} className="size-3.5" />}
                  </span>
                  {opt}
                </button>
              )
            })}
            {allowCustom && (
              <div className="flex items-center gap-1.5 border-t border-muted p-1.5">
                <input
                  value={nueva}
                  onChange={(e) => setNueva(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault()
                      agregar()
                    }
                  }}
                  placeholder="Agregar nueva…"
                  className="h-8 flex-1 rounded-full border border-input bg-input/30 px-3 text-[13px] outline-none focus-visible:border-ring"
                />
                <button
                  type="button"
                  onClick={agregar}
                  className="rounded-full bg-secondary px-3 py-1.5 text-[12px] font-bold text-white disabled:opacity-50"
                  disabled={!nueva.trim()}
                >
                  Agregar
                </button>
              </div>
            )}
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  )
}

export { MultiSelect }
