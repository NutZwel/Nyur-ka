import { create } from 'zustand'

interface AppState {
  page: 'player' | 'search' | 'queue' | 'playlist' | 'settings' | 'theme-editor'
  alwaysOnTop: boolean
  isLoggedIn: boolean
  isMinimalView: boolean
  searchQuery: string

  setPage: (page: AppState['page']) => void
  setAlwaysOnTop: (val: boolean) => void
  setLoggedIn: (val: boolean) => void
  toggleMinimalView: () => void
  setSearchQuery: (q: string) => void
}

export const useAppStore = create<AppState>((set) => ({
  page: 'player',
  alwaysOnTop: false,
  isLoggedIn: false,
  isMinimalView: false,
  searchQuery: '',

  setPage: (page) => set({ page }),
  setAlwaysOnTop: (val) => set({ alwaysOnTop: val }),
  setLoggedIn: (val) => set({ isLoggedIn: val }),

  toggleMinimalView: () => {
    set(state => ({ isMinimalView: !state.isMinimalView }))
  },

  setSearchQuery: (q) => set({ searchQuery: q }),
}))
