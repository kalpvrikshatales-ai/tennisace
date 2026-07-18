'use client'

import { useEffect } from 'react'

export default function ThemeInitializer() {
  useEffect(() => {
    const saved = localStorage.getItem('tennisace-theme') ?? localStorage.getItem('theme')
    const isDark = saved ? saved !== 'light' : true // dark by default
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light')
    if (!isDark) document.documentElement.classList.add('light')
    else document.documentElement.classList.remove('light')
  }, [])

  return null
}
