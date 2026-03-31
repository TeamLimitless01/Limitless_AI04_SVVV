"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"

interface NumberTickerProps {
  value: number
  duration?: number
  className?: string
}

export default function NumberTicker({ value, duration = 2000, className = "" }: NumberTickerProps) {
  const [displayValue, setDisplayValue] = useState(0)

  useEffect(() => {
    let start = 0
    const increment = value / (duration / 16)
    const timer = setInterval(() => {
      start += increment
      if (start >= value) {
        setDisplayValue(value)
        clearInterval(timer)
      } else {
        setDisplayValue(Math.floor(start))
      }
    }, 16)

    return () => clearInterval(timer)
  }, [value, duration])

  return (
    <motion.span className={className} initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
      {displayValue.toLocaleString()}
    </motion.span>
  )
}
