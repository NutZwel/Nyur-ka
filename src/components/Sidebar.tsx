import {
  Home, Search, ListMusic, Palette, Settings,
  Disc3
} from 'lucide-react'
import { useThemeStore } from '../store/themeStore'
import { useAppStore } from '../store/appStore'
import { usePlayerStore } from '../store/playerStore'
import PixelWhale from './PixelWhale'

const navItems = [
  { id: 'player' as const, label: 'Now Playing', icon: Home },
  { id: 'search' as const, label: 'Search', icon: Search },
  { id: 'queue' as const, label: 'Queue', icon: ListMusic },
  { id: 'theme-editor' as const, label: 'Themes', icon: Palette },
  { id: 'settings' as const, label: 'Settings', icon: Settings },
]

export default function Sidebar() {
  const { theme } = useThemeStore()
  const { page, setPage } = useAppStore()
  const { currentTrack, isPlaying } = usePlayerStore()

  return (
    <nav
      className="flex flex-col py-3 shrink-0 items-center"
      style={{
        width: 64,
        background: theme.surface,
        borderRight: `1px solid ${theme.border}30`,
      }}
    >
      {/* App logo - Pixel Whale */}
      <div
        className="w-10 h-10 rounded-2xl flex items-center justify-center mb-4 overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${theme.primary}, ${theme.secondary})`,
          boxShadow: `0 4px 12px ${theme.primary}40`,
        }}
      >
        <PixelWhale size={36} />
      </div>

      {/* Navigation */}
      <div className="flex flex-col items-center gap-1 flex-1">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = page === item.id
          return (
            <button
              key={item.id}
              className="flex flex-col items-center justify-center gap-0.5 rounded-xl transition-all group"
              style={{
                width: 48,
                height: 48,
                color: isActive ? theme.primary : theme.textSecondary,
                background: isActive ? `${theme.primary}15` : 'transparent',
                fontSize: 8,
                position: 'relative',
              }}
              onClick={() => setPage(item.id)}
              title={item.label}
            >
              {isActive && (
                <div
                  style={{
                    position: 'absolute',
                    left: -8,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: 3,
                    height: 20,
                    borderRadius: 4,
                    background: theme.primary,
                    boxShadow: `0 0 8px ${theme.primary}60`,
                  }}
                />
              )}
              <Icon size={18} strokeWidth={isActive ? 2.5 : 1.5} />
              <span className="font-medium">{item.label.split(' ')[0]}</span>
            </button>
          )
        })}
      </div>

      {/* Now playing indicator */}
      {currentTrack && (
        <div
          className="mt-2 p-2 rounded-xl flex items-center justify-center animate-fadeIn"
          style={{ background: `${theme.primary}12` }}
        >
          <Disc3
            size={20}
            style={{ color: theme.primary }}
            className={isPlaying ? 'animate-spin-slow' : ''}
          />
        </div>
      )}
    </nav>
  )
}
