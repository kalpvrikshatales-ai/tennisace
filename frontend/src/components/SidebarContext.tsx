'use client'

import { createContext, useContext, useState, ReactNode } from 'react'

export type HomeTab     = 'matches' | 'rankings' | 'news' | 'wimbledon'
export type MatchFilter = 'live' | 'next' | 'completed' | 'all'

type SidebarContextType = {
  homeTab:       HomeTab
  setHomeTab:    (t: HomeTab) => void
  matchFilter:   MatchFilter
  setMatchFilter:(f: MatchFilter) => void
  drawerOpen:    boolean
  openDrawer:    () => void
  closeDrawer:   () => void
}

const SidebarCtx = createContext<SidebarContextType>({
  homeTab:       'matches',
  setHomeTab:    () => {},
  matchFilter:   'live',
  setMatchFilter:() => {},
  drawerOpen:    false,
  openDrawer:    () => {},
  closeDrawer:   () => {},
})

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [homeTab,     setHomeTab]     = useState<HomeTab>('matches')
  const [matchFilter, setMatchFilter] = useState<MatchFilter>('live')
  const [drawerOpen,  setDrawerOpen]  = useState(false)

  return (
    <SidebarCtx.Provider value={{
      homeTab, setHomeTab,
      matchFilter, setMatchFilter,
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
