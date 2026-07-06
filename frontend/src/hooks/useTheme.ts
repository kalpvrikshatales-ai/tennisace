'use client'

import { useState, useEffect } from 'react'

// Reads data-theme from <html> and re-renders whenever ThemeToggle changes it.
export function useTheme() {
  const [isDark, setIsDark] = useState(true)   // sparring is dark by default

  useEffect(() => {
    const apply = () => {
      const attr = document.documentElement.getAttribute('data-theme')
      // If no attribute yet, fall back to localStorage
      if (!attr) {
        const saved = localStorage.getItem('theme')
        const sysDark = window.matchMedia('(prefers-color-scheme: dark)').matches
        setIsDark(saved ? saved === 'dark' : sysDark)
      } else {
        setIsDark(attr !== 'light')
      }
    }

    apply()

    const obs = new MutationObserver(apply)
    obs.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    })
    return () => obs.disconnect()
  }, [])

  return { isDark }
}
