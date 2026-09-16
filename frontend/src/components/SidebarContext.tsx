'use client'

import { createContext, useContext, useState, ReactNode } from 'react'

type SidebarContextType = {
  drawerOpen:    boolean
  openDrawer:    () => void
  closeDrawer:   () => void
}

const SidebarCtx = createContext<SidebarContextType>({
  drawerOpen:    false,
  openDrawer:    () => {},
  closeDrawer:   () => {},
})

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [drawerOpen,  setDrawerOpen]  = useState(false)

  return (
    <SidebarCtx.Provider value={{
      drawerOpen,
      openDrawer:  () => setDrawerOpen(true),
      closeDrawer: () => setDrawerOpen(false),
    }}>
      {children}
    </SidebarCtx.Provider>
  )
}

export function useSidebar() {
  return useContext(SidebarCtx)
}
