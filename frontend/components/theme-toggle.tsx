"use client"

import { useTheme } from "next-themes"
import { useEffect, useState } from "react"

export default function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  if (!mounted) return null

  const isDark = (theme ?? resolvedTheme) === "dark"

  return (
    <button
      type="button"
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="rounded-md border border-border bg-background/70 px-3 py-2 text-xs font-medium text-foreground shadow-sm backdrop-blur hover:bg-background/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      {isDark ? "Light" : "Dark"}
    </button>
  )
}
