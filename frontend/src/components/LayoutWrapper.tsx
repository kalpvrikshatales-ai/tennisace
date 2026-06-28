'use client'

import { useState } from 'react'
import SplashScreen from './SplashScreen'

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const [splashComplete, setSplashComplete] = useState(false)

  return (
    <>
      {!splashComplete && <SplashScreen onComplete={() => setSplashComplete(true)} />}
      {children}
    </>
  )
}
