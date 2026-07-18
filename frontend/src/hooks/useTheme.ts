'use client'

import { useState, useEffect } from 'react'

export function useTheme() {
  const [isDark, setIsDark] = useState(true) // dark by default

  useEffect(() => {
    const apply = () => {
      const attr = document.documentElement.getAttribute('data-theme')
      const hasLight = document.documentElement.classList.contains('light')
      setIsDark(attr !== 'light' && !hasLight)
    }

    apply()

    const obs = new MutationObserver(apply)
    obs.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme', 'class'],
    })
    return () => obs.disconnect()
  }, [])

  return { isDark }
}
