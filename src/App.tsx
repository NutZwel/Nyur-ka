import { useEffect, useRef } from 'react'
import { useThemeStore } from './store/themeStore'
import { useAppStore } from './store/appStore'
import { usePlayerStore } from './store/playerStore'
import { useAudioPlayer } from './hooks/useAudioPlayer'
import TitleBar from './components/TitleBar'
import Sidebar from './components/Sidebar'
import PlayerView from './components/PlayerView'
import SearchView from './components/SearchView'
import QueueView from './components/QueueView'
import SettingsView from './components/SettingsView'
import ThemeEditor from './components/ThemeEditor'
import NowPlayingBar from './components/NowPlayingBar'

export default function App() {
  const { theme, loadTheme } = useThemeStore()
  const { page } = useAppStore()
  const { currentTrack, savePlayback, loadPlayback } = usePlayerStore()
  const loadedRef = useRef(false)

  // Initialize audio player hooks
  useAudioPlayer()

  useEffect(() => {
    loadTheme()
    checkLoginStatus()

    // Load playback state from last session
    if (!loadedRef.current) {
      loadedRef.current = true
      loadPlayback()
    }
  }, [])

  // Auto-save playback when track changes
  const prevTrackIdRef = useRef<string | null>(null)
  useEffect(() => {
    if (currentTrack && currentTrack.id !== prevTrackIdRef.current) {
      prevTrackIdRef.current = currentTrack.id
      setTimeout(() => savePlayback(), 500)
    }
  }, [currentTrack])

  const checkLoginStatus = async () => {
    if (window.electronAPI) {
      const loggedIn = await window.electronAPI.spotifyIsLoggedIn()
      useAppStore.getState().setLoggedIn(loggedIn)
    }
  }

  // Apply theme to CSS variables
  useEffect(() => {
    const root = document.documentElement
    root.style.setProperty('--primary', theme.primary)
    root.style.setProperty('--secondary', theme.secondary)
    root.style.setProperty('--accent', theme.accent)
    root.style.setProperty('--bg', theme.background)
    root.style.setProperty('--surface', theme.surface)
    root.style.setProperty('--surface-alt', theme.surfaceAlt)
    root.style.setProperty('--text', theme.text)
    root.style.setProperty('--text-secondary', theme.textSecondary)
    root.style.setProperty('--border', theme.border)
    root.style.setProperty('--error', theme.error)
    root.style.setProperty('--success', theme.success)
    root.style.setProperty('--warning', theme.warning)
    root.style.setProperty('--radius', `${theme.borderRadius}px`)
    root.style.setProperty('--spacing', `${theme.spacing}px`)
    root.style.setProperty('--font', theme.fontFamily)
    root.style.fontFamily = theme.fontFamily

    if (theme.blur) {
      root.style.setProperty('--glass-bg', `rgba(from ${theme.surface} r g b / 0.6)`)
    }

    root.style.transition = theme.animations ? 'all 0.2s ease' : 'none'
  }, [theme])

  const renderPage = () => {
    switch (page) {
      case 'player':
        return <PlayerView />
      case 'search':
        return <SearchView />
      case 'queue':
        return <QueueView />
      case 'settings':
        return <SettingsView />
      case 'theme-editor':
        return <ThemeEditor />
      default:
        return <PlayerView />
    }
  }

  return (
    <div
      className="h-screen flex flex-col overflow-hidden"
      style={{
        backgroundColor: theme.background,
        color: theme.text,
        fontFamily: theme.fontFamily,
      }}
    >
      <TitleBar />
      <div className="flex flex-1 overflow-hidden" style={{ gap: `${theme.spacing}px` }}>
        <Sidebar />
        <main className="flex-1 overflow-y-auto p-3 animate-fadeIn" style={{ padding: `${8 + theme.spacing}px` }}>
          {renderPage()}
        </main>
      </div>
      {currentTrack && <NowPlayingBar />}
    </div>
  )
}
