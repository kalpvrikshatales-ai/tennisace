'use client'

import { useState } from 'react'
import SplashScreen from './SplashScreen'
import Sidebar from './Sidebar'
import { SidebarProvider } from './SidebarContext'
import ThemeInitializer from './ThemeInitializer'

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const [splashComplete, setSplashComplete] = useState(false)

  return (
    <SidebarProvider>
      <ThemeInitializer />
      {!splashComplete && <SplashScreen onComplete={() => setSplashComplete(true)} />}

      {/* Permanent sidebar (desktop) / Drawer (mobile) */}
      <Sidebar />

      {/* Main content — offset on desktop to clear sidebar */}
      <div className="md:ml-[220px]">
        {children}
      </div>
    </SidebarProvider>
  )
}
