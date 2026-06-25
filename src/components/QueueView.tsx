import { Play, Trash2, Music, ArrowUpDown, Disc3, GripVertical } from 'lucide-react'
import { useThemeStore } from '../store/themeStore'
import { usePlayerStore } from '../store/playerStore'

export default function QueueView() {
  const { theme } = useThemeStore()
  const { queue, queueIndex, currentTrack, removeFromQueue, clearQueue, toggleShuffle, shuffle } = usePlayerStore()

  if (queue.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full animate-fadeIn" style={{ gap: 16 }}>
        <div className="w-20 h-20 rounded-2xl flex items-center justify-center" style={{ background: theme.surfaceAlt, border: `2px dashed ${theme.border}` }}>
          <Music size={28} style={{ color: theme.textSecondary }} />
        </div>
        <div className="text-center">
          <div className="text-sm font-medium" style={{ color: theme.text }}>Queue is empty</div>
          <div className="text-xs mt-1" style={{ color: theme.textSecondary }}>Search and add music</div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full animate-fadeIn" style={{ gap: 8 }}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-semibold" style={{ color: theme.text }}>Queue</div>
          <div className="text-xs" style={{ color: theme.textSecondary }}>{queue.length} tracks</div>
        </div>
        <div className="flex items-center gap-1">
          <button className="btn-icon !w-8 !h-8" onClick={toggleShuffle} style={{ color: shuffle ? theme.accent : theme.textSecondary }}>
            <ArrowUpDown size={14} />
          </button>
          <button className="btn-icon !w-8 !h-8" onClick={clearQueue} style={{ color: theme.error }}>
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Now Playing */}
      {currentTrack && queue[queueIndex] && (
        <div className="p-3 rounded-2xl" style={{ background: `${theme.primary}10`, border: `1px solid ${theme.primary}25` }}>
          <div className="text-[10px] font-semibold mb-1.5 tracking-wider" style={{ color: theme.primary }}>NOW PLAYING</div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0 flex items-center justify-center" style={{ background: theme.surfaceAlt }}>
              {currentTrack.albumArt ? <img src={currentTrack.albumArt} alt="" className="w-full h-full object-cover" /> :
                <Disc3 size={16} style={{ color: theme.primary }} className="animate-spin-slow" />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium truncate" style={{ color: theme.text }}>{currentTrack.title}</div>
              <div className="text-[10px] truncate" style={{ color: theme.textSecondary }}>{currentTrack.artist}</div>
            </div>
          </div>
        </div>
      )}

      {/* Queue list */}
      <div className="flex-1 overflow-y-auto space-y-1">
        {queue.map((item, idx) => (
          <div key={`${item.track.id}-${idx}`}
            className="flex items-center gap-2 p-2 rounded-xl transition-all group"
            style={{ background: idx === queueIndex ? `${theme.primary}08` : 'transparent' }}>
            <div className="w-4 text-center text-[10px] shrink-0" style={{ color: idx === queueIndex ? theme.primary : theme.textSecondary }}>
              {idx === queueIndex ? (
                <div className="flex gap-[2px] items-center justify-center">
                  <div className="w-[3px] h-3 rounded-full" style={{ background: theme.primary, animation: 'bar 0.4s ease-in-out infinite' }} />
                  <div className="w-[3px] h-2 rounded-full" style={{ background: theme.primary, animation: 'bar 0.6s ease-in-out infinite' }} />
                </div>
              ) : idx + 1}
            </div>
            <div className="w-8 h-8 rounded-lg overflow-hidden shrink-0 flex items-center justify-center" style={{ background: theme.surfaceAlt }}>
              {item.track.albumArt ? <img src={item.track.albumArt} alt="" className="w-full h-full object-cover" /> : <Music size={12} style={{ color: theme.textSecondary }} />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs truncate" style={{ color: idx === queueIndex ? theme.primary : theme.text }}>{item.track.title}</div>
              <div className="text-[10px] truncate" style={{ color: theme.textSecondary }}>{item.track.artist}</div>
            </div>
            <button className="btn-icon !w-7 !h-7 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => removeFromQueue(idx)}>
              <Trash2 size={12} style={{ color: theme.error }} />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
