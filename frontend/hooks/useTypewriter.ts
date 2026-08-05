'use client'
import { useState, useEffect, useRef } from 'react'

export function useTypewriter(fullText: string, speedMs: number = 12) {
  const [displayedText, setDisplayedText] = useState('')
  const indexRef = useRef(0)

  useEffect(() => {
    setDisplayedText('')
    indexRef.current = 0
    if (!fullText) return

    const interval = setInterval(() => {
      indexRef.current += 3 // reveal a few characters at a time, feels natural not sluggish
      setDisplayedText(fullText.slice(0, indexRef.current))
      if (indexRef.current >= fullText.length) {
        clearInterval(interval)
      }
    }, speedMs)

    return () => clearInterval(interval)
  }, [fullText, speedMs])

  return displayedText
}