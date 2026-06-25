import { Play, Pause, SkipForward, SkipBack, Volume2, ListMusic, Disc3 } from 'lucide-react'
import { useThemeStore } from '../store/themeStore'
import { usePlayerStore } from '../store/playerStore'

export default function NowPlayingBar() {
  const { theme } = useThemeStore()
  const { currentTrack, isPlaying, progress, duration, volume, togglePlay, nextTrack, prevTrack, setVolume } = usePlayerStore()

  if (!currentTrack) return null

  const fmt = (s: number) => {
    if (!s || isNaN(s)) return '0:00'
    return `${Math.floor(s / 60)}:${Math.floor(s % 60).toString().padStart(2, '0')}`
  }

  const progressPct = duration > 0 ? (progress / duration) * 100 : 0

  return (
    <div className="shrink-0 px-4 py-2.5 flex items-center gap-3" style={{
      background: theme.surface,
      borderTop: `1px solid ${theme.border}30`,
    }}>
      {/* Track */}
      <div className="flex items-center gap-2.5 min-w-0 flex-[2]">
        <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0 flex items-center justify-center" style={{ background: theme.surfaceAlt }}>
          {currentTrack.albumArt ? <img src={currentTrack.albumArt} alt="" className="w-full h-full object-cover" /> : <Disc3 size={16} style={{ color: theme.textSecondary }} />}
        </div>
        <div className="min-w-0">
          <div className="text-xs font-medium truncate" style={{ color: theme.text }}>{currentTrack.title}</div>
          <div className="text-[10px] truncate" style={{ color: theme.textSecondary }}>{currentTrack.artist}</div>
        </div>
      </div>

      {/* Progress — Click/Drag to seek */}
      <div className="flex-1 hidden md:flex items-center gap-2">
        <div className="flex-1 relative h-2 rounded-full flex items-center cursor-pointer group" style={{ background: theme.surfaceAlt }}
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect()
            const pct = (e.clientX - rect.left) / rect.width
            const target = pct * duration
            const audio = document.querySelector('audio')
            if (audio) audio.currentTime = target
            setProgress(target)
          }}>
          <div className="rounded-full transition-all" style={{ width: `${progressPct}%`, height: 4, background: theme.primary, boxShadow: `0 0 6px ${theme.primary}60` }} />
          <div className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-grab"
            style={{ left: `calc(${progressPct}% - 6px)`, background: theme.primary, boxShadow: `0 0 6px ${theme.primary}80` }} />
        </div>
        <span className="text-[10px] tabular-nums font-mono" style={{ color: theme.textSecondary }}>{fmt(progress)}</span>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-1">
        <button className="btn-icon !w-7 !h-7" onClick={() => prevTrack()}><SkipBack size={13} /></button>
        <button className="flex items-center justify-center rounded-full transition-all active:scale-90" style={{ width: 28, height: 28, background: theme.primary, color: '#fff', boxShadow: `0 2px 8px ${theme.primary}60` }} onClick={togglePlay}>
          {isPlaying ? <Pause size={13} fill="#fff" /> : <Play size={13} fill="#fff" />}
        </button>
        <button className="btn-icon !w-7 !h-7" onClick={() => nextTrack()}><SkipForward size={13} /></button>
      </div>

      {/* Volume */}
      <div className="flex items-center gap-1.5 w-20">
        <Volume2 size={11} style={{ color: theme.textSecondary }} />
        <input type="range" min={0} max={1} step={0.01} value={volume} onChange={(e) => setVolume(parseFloat(e.target.value))}
          className="w-full" style={{ background: `linear-gradient(90deg, ${theme.primary} 0%, ${theme.primary} ${volume * 100}%, ${theme.surfaceAlt} ${volume * 100}%, ${theme.surfaceAlt} 100%)` }} />
      </div>
    </div>
  )
}
