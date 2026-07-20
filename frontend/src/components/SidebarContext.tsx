'use client'

import { createContext, useContext, useState, ReactNode } from 'react'

export type HomeTab     = 'home' | 'matches' | 'rankings' | 'news' | 'tournament'
export type MatchFilter = 'live' | 'next' | 'completed' | 'all'

type SidebarContextType = {
  homeTab:       HomeTab
  setHomeTab:    (t: HomeTab) => void
  matchFilter:   MatchFilter
  setMatchFilter:(f: MatchFilter) => void
  drawerOpen:    boolean
  openDrawer:    () => void
  closeDrawer:   () => void
  searchOpen:    boolean
  setSearchOpen: (v: boolean) => void
  notifOn:       boolean
  setNotifOn:    (v: boolean) => void
}

const SidebarCtx = createContext<SidebarContextType>({
  homeTab:       'home',
  setHomeTab:    () => {},
  matchFilter:   'live',
  setMatchFilter:() => {},
  drawerOpen:    false,
  openDrawer:    () => {},
  closeDrawer:   () => {},
  searchOpen:    false,
  setSearchOpen: () => {},
  notifOn:       false,
  setNotifOn:    () => {},
})

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [homeTab,     setHomeTab]     = useState<HomeTab>('home')
  const [matchFilter, setMatchFilter] = useState<MatchFilter>('live')
  const [drawerOpen,  setDrawerOpen]  = useState(false)
  const [searchOpen,  setSearchOpen]  = useState(false)
  const [notifOn,     setNotifOn]     = useState(false)

  return (
    <SidebarCtx.Provider value={{
      homeTab, setHomeTab,
      matchFilter, setMatchFilter,
      drawerOpen,
      openDrawer:  () => setDrawerOpen(true),
      closeDrawer: () => setDrawerOpen(false),
      searchOpen, setSearchOpen,
      notifOn, setNotifOn,
    }}>
      {children}
    </SidebarCtx.Provider>
  )
}

export function useSidebar() {
  return useContext(SidebarCtx)
}
