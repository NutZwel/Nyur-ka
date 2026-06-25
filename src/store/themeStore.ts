import { create } from 'zustand'
import { Theme } from '../types'

const defaultTheme: Theme = {
  name: 'Rose',
  primary: '#E8A0B4',
  secondary: '#A8C5E0',
  accent: '#E8D48B',
  background: '#F8F4F0',
  surface: '#FFFFFF',
  surfaceAlt: '#F5EDEA',
  text: '#2D2522',
  textSecondary: '#8F7D77',
  border: '#E0D4CE',
  fontFamily: 'Inter, system-ui, sans-serif',
  borderRadius: 16,
  compact: true,
  blur: false,
  blurAmount: 20,
  spacing: 4,
  animations: true,
}

interface ThemeState {
  theme: Theme
  availableThemes: { name: string; theme: Partial<Theme> }[]
  isThemeEditorOpen: boolean
  loadTheme: () => Promise<void>
  setTheme: (theme: Theme) => void
  updateTheme: (partial: Partial<Theme>) => void
  resetTheme: () => void
  toggleThemeEditor: () => void
  applyPreset: (name: string) => void
}

const presets: { name: string; theme: Partial<Theme> }[] = [
  {
    name: 'Rose',
    theme: {
      primary: '#E8A0B4', secondary: '#A8C5E0', accent: '#E8D48B',
      background: '#F8F4F0', surface: '#FFFFFF', surfaceAlt: '#F5EDEA',
      text: '#2D2522', textSecondary: '#8F7D77', border: '#E0D4CE',
    }
  },
  {
    name: 'Mist',
    theme: {
      primary: '#94A3B8', secondary: '#7EACB8', accent: '#B8C5A0',
      background: '#F0F2F5', surface: '#FFFFFF', surfaceAlt: '#E8ECF0',
      text: '#1E293B', textSecondary: '#64748B', border: '#CBD5E1',
    }
  },
  {
    name: 'Dusk',
    theme: {
      primary: '#A78BBA', secondary: '#7A9EC7', accent: '#C9A87C',
      background: '#1A1625', surface: '#252036', surfaceAlt: '#302A44',
      text: '#E8E4F0', textSecondary: '#9A92B0', border: '#3D3555',
    }
  },
  {
    name: 'Moss',
    theme: {
      primary: '#8FA88A', secondary: '#97B2A8', accent: '#C8B88A',
      background: '#F4F6F0', surface: '#FFFFFF', surfaceAlt: '#EDF0E8',
      text: '#1C2820', textSecondary: '#6A7A6E', border: '#D0D8C8',
    }
  },
  {
    name: 'Coffee',
    theme: {
      primary: '#C4956A', secondary: '#A8B8C0', accent: '#D4A88A',
      background: '#F5F0EA', surface: '#FFFFFF', surfaceAlt: '#EDE5DC',
      text: '#2C2218', textSecondary: '#8A7A6A', border: '#D8CEC4',
    }
  },
  {
    name: 'Night',
    theme: {
      primary: '#8A9EC8', secondary: '#7A8DA0', accent: '#C8A8A0',
      background: '#0F0F18', surface: '#1A1A28', surfaceAlt: '#242438',
      text: '#E0E4EC', textSecondary: '#888CA0', border: '#32324A',
    }
  },
]

export const useThemeStore = create<ThemeState>((set, get) => ({
  theme: defaultTheme,
  availableThemes: presets,
  isThemeEditorOpen: false,

  loadTheme: async () => {
    try {
      const saved = await window.electronAPI?.getTheme()
      if (saved) set({ theme: { ...defaultTheme, ...saved } })
    } catch (e) { console.warn('Could not load theme', e) }
  },

  setTheme: (theme: Theme) => {
    set({ theme })
    window.electronAPI?.setTheme(theme)
  },

  updateTheme: (partial: Partial<Theme>) => {
    const updated = { ...get().theme, ...partial }
    set({ theme: updated })
    window.electronAPI?.setTheme(updated)
  },

  resetTheme: () => {
    set({ theme: defaultTheme })
    window.electronAPI?.setTheme(defaultTheme)
  },

  toggleThemeEditor: () => set(state => ({ isThemeEditorOpen: !state.isThemeEditorOpen })),

  applyPreset: (name: string) => {
    const preset = presets.find(p => p.name === name)
    if (preset) {
      const updated = { ...get().theme, ...preset.theme, name }
      set({ theme: updated })
      window.electronAPI?.setTheme(updated)
    }
  },
}))
