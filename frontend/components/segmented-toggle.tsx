"use client"

type Option = { label: string; value: string }

export default function SegmentedToggle({
  value,
  onChange,
  options,
  className = "",
}: {
  value: string
  onChange: (v: string) => void
  options: Option[]
  className?: string
}) {
  return (
    <div
      role="tablist"
      aria-orientation="horizontal"
      className={`grid grid-cols-${options.length} rounded-md border border-border bg-muted p-1 text-sm ${className}`}
    >
      {options.map((opt) => {
        const active = opt.value === value
        return (
          <button
            key={opt.value}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(opt.value)}
            className={`rounded-sm px-3 py-2 transition ${
              active ? "bg-background text-foreground shadow" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}
