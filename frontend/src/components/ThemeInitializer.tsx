'use client'

import { useEffect } from 'react'

// Reads the saved theme from localStorage and applies data-theme to <html>
// on every page load — not just when HomeClient/ThemeToggle mounts.
export default function ThemeInitializer() {
  useEffect(() => {
    const saved = localStorage.getItem('theme')
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    const isDark = saved ? saved === 'dark' : prefersDark
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light')
  }, [])

  return null
}
