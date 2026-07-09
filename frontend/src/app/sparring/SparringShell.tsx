'use client'

import { useTheme } from '@/hooks/useTheme'
import SparringBottomBar from './SparringBottomBar'

export default function SparringShell({ children }: { children: React.ReactNode }) {
  const { isDark } = useTheme()
  return (
    <div className={`sparring-root${isDark ? '' : ' light'}`}>
      {children}
      <SparringBottomBar />
    </div>
  )
}
