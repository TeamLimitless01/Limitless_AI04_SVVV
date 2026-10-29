import type { ReactNode } from "react"

interface AnimatedSectionProps {
  children: ReactNode
  className?: string
  id?: string
}

export default function AnimatedSection({ children, className = "", id }: AnimatedSectionProps) {
  return (
    <div id={id} className={className}>
      {children}
    </div>
  )
}
