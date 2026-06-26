import { useEffect, useRef, useCallback } from 'react'
import { Play, Pause, SkipForward, SkipBack, X, Maximize2 } from 'lucide-react'
import { useThemeStore } from '../store/themeStore'
import { usePlayerStore } from '../store/playerStore'

function invertHex(hex: string): string {
  const c = hex.replace('#', '')
  const r = (255 - parseInt(c.substring(0,2), 16)).toString(16).padStart(2,'0')
  const g = (255 - parseInt(c.substring(2,4), 16)).toString(16).padStart(2,'0')
  const b = (255 - parseInt(c.substring(4,6), 16)).toString(16).padStart(2,'0')
  return `#${r}${g}${b}`
}

export default function FullscreenPlayer({ onClose }: { onClose: () => void }) {
  const { theme } = useThemeStore()
  const { currentTrack, isPlaying, progress, duration, togglePlay, nextTrack, prevTrack } = usePlayerStore()
  const overlayRef = useRef<HTMLDivElement>(null)

  const fmt = (s: number) => {
    if (!s || isNaN(s)) return '0:00'
    return `${Math.floor(s / 60)}:${Math.floor(s % 60).toString().padStart(2, '0')}`
  }

  const progressPct = duration > 0 ? (progress / duration) * 100 : 0

  // Escape / double-click to close
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const handleBgClick = useCallback((e: React.MouseEvent) => {
    if (e.target === overlayRef.current) onClose()
  }, [onClose])

  const seek = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const pct = (e.clientX - rect.left) / rect.width
    const target = pct * duration
    const audio = document.querySelector('audio')
    if (audio) audio.currentTime = target
  }, [duration])

  if (!currentTrack) return null

  const blurColor = invertHex(theme.background)

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[9998] flex flex-col items-center justify-center animate-fadeIn"
      style={{
        background: theme.background,
        color: theme.text,
      }}
      onClick={handleBgClick}
    >
      {/* Close button */}
      <button className="absolute top-4 right-4 btn-icon z-10" onClick={onClose}
        style={{ background: `${theme.primary}20`, color: theme.text }}>
        <X size={18} />
      </button>

      {/* Blur background cover */}
      {currentTrack.albumArt && (
        <>
          <div className="absolute inset-0 opacity-30"
            style={{
              backgroundImage: `url(${currentTrack.albumArt})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              filter: 'blur(40px) brightness(0.5)',
              transform: 'scale(1.2)',
            }}
          />
          {/* Animated gradient blobs */}
          <div className="absolute w-[300px] h-[300px] rounded-full opacity-20"
            style={{
              background: theme.primary,
              filter: 'blur(80px)',
              animation: 'float 8s ease-in-out infinite',
              top: '10%',
              left: '5%',
            }}
          />
          <div className="absolute w-[250px] h-[250px] rounded-full opacity-20"
            style={{
              background: theme.secondary,
              filter: 'blur(80px)',
              animation: 'float 10s ease-in-out infinite reverse',
              bottom: '15%',
              right: '10%',
            }}
          />
        </>
      )}

      {/* Main content */}
      <div className="relative flex flex-col items-center z-10" style={{ gap: 24, maxWidth: 500, width: '100%', padding: '0 24px' }}>
        {/* Cover art — bulat & muter kayak vinyl */}
        <div className="relative flex items-center justify-center">
          {/* Shadow bulat */}
          {currentTrack.albumArt && (
            <div className="absolute rounded-full"
              style={{
                width: Math.min(320, window.innerWidth - 100) + 40,
                height: Math.min(320, window.innerWidth - 100) + 40,
                background: invertHex(theme.background),
                opacity: 0.25,
                filter: 'blur(30px)',
                transform: 'translateY(12px)',
              }}
            />
          )}

          {/* Outer spinning ring */}
          <div
            className="rounded-full border-2 border-transparent"
            style={{
              width: Math.min(320, window.innerWidth - 100) + 24,
              height: Math.min(320, window.innerWidth - 100) + 24,
              borderColor: `${theme.primary}30`,
              borderTopColor: isPlaying ? theme.primary : 'transparent',
              animation: isPlaying ? 'spin-slow 4s linear infinite' : 'none',
              position: 'relative',
            }}
          >
            {/* Inner spinning ring */}
            <div className="absolute inset-1 rounded-full border border-transparent"
              style={{
                borderLeftColor: isPlaying ? `${theme.secondary}80` : 'transparent',
                animation: isPlaying ? 'spin-slow 6s linear infinite reverse' : 'none',
              }}
            />
          </div>

          {/* Cover — bulat */}
          <div
            className="absolute rounded-full overflow-hidden"
            style={{
              width: Math.min(320, window.innerWidth - 100),
              height: Math.min(320, window.innerWidth - 100),
              boxShadow: `0 20px 60px ${theme.primary}40, inset 0 0 20px rgba(0,0,0,0.3)`,
            }}
          >
            {currentTrack.albumArt ? (
              <img
                src={currentTrack.albumArt}
                alt=""
                className={`w-full h-full object-cover ${isPlaying ? 'animate-spin-slow' : ''}`}
                style={{ transition: 'all 0.3s ease' }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center" style={{ background: theme.surfaceAlt }}>
                <Disc3 size={60} style={{ color: theme.textSecondary }} />
              </div>
            )}
          </div>

          {/* Center hole — vinyl look */}
          {currentTrack.albumArt && (
            <div className="absolute rounded-full flex items-center justify-center"
              style={{
                width: 48,
                height: 48,
                background: theme.background,
                boxShadow: `0 0 12px ${theme.primary}40, inset 0 0 8px ${theme.primary}20`,
              }}
            >
              <div className="rounded-full" style={{ width: 16, height: 16, background: `${theme.primary}30` }} />
            </div>
          )}
        </div>

        {/* Track info */}
        <div className="text-center w-full">
          <div className="text-2xl font-bold truncate" style={{ color: theme.text }}>{currentTrack.title}</div>
          <div className="text-base truncate mt-1" style={{ color: theme.textSecondary }}>{currentTrack.artist}</div>
          <div className="text-xs truncate mt-0.5" style={{ color: theme.textSecondary + '90' }}>{currentTrack.album}</div>
        </div>

        {/* Progress */}
        <div className="w-full">
          <div className="relative h-1.5 rounded-full cursor-pointer group"
            style={{ background: theme.surfaceAlt }}
            onClick={seek}>
            <div className="rounded-full h-full transition-all" style={{ width: `${progressPct}%`, background: theme.primary, boxShadow: `0 0 8px ${theme.primary}60` }} />
            <div className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ left: `calc(${progressPct}% - 7px)`, background: theme.primary, boxShadow: `0 0 10px ${theme.primary}80` }} />
          </div>
          <div className="flex justify-between mt-1.5">
            <span className="text-xs tabular-nums font-mono" style={{ color: theme.textSecondary }}>{fmt(progress)}</span>
            <span className="text-xs tabular-nums font-mono" style={{ color: theme.textSecondary }}>{fmt(duration)}</span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-5">
          <button className="btn-icon !w-10 !h-10" onClick={prevTrack}><SkipBack size={22} /></button>
          <button className="flex items-center justify-center rounded-full transition-all active:scale-90"
            style={{
              width: 64, height: 64,
              background: `linear-gradient(135deg, ${theme.primary}, ${theme.secondary})`,
              color: '#fff',
              boxShadow: `0 8px 32px ${theme.primary}50`,
            }}
            onClick={togglePlay}>
            {isPlaying ? <Pause size={28} fill="#fff" /> : <Play size={28} fill="#fff" />}
          </button>
          <button className="btn-icon !w-10 !h-10" onClick={nextTrack}><SkipForward size={22} /></button>
        </div>
      </div>
    </div>
  )
}
