import { useEffect, useRef } from 'react'
import { Music } from 'lucide-react'
import { useThemeStore } from '../store/themeStore'
import { usePlayerStore } from '../store/playerStore'
import { useLyrics } from '../hooks/useLyrics'

export default function LyricsView() {
  const { theme } = useThemeStore()
  const currentTrack = usePlayerStore(s => s.currentTrack)
  const { lyrics, isLoading, activeLine } = useLyrics()
  const containerRef = useRef<HTMLDivElement>(null)
  const prevActive = useRef(activeLine)
  const firstRender = useRef(true)

  // Pas lyrics berubah (ganti lagu), render HTML-nya, lalu DOM manipulation
  useEffect(() => {
    if (!lyrics?.syncedLyrics?.length) return

    const c = containerRef.current
    if (!c) return

    // Inject HTML — sekali doang per lagu
    const inner = c.querySelector('.lyrics-inner')
    if (!inner) return

    // Reset scroll
    c.scrollTop = 0
    firstRender.current = true

    // Force update style pas pertama
    prevActive.current = -1
  }, [lyrics])

  // Update line style langsung di DOM — gak pake React re-render
  useEffect(() => {
    if (activeLine < 0) return

    const c = containerRef.current
    if (!c) return

    const lines = c.querySelectorAll<HTMLElement>('.lyrics-line')
    if (!lines.length) return

    // Update tiap line langsung di DOM
    for (let i = 0; i < lines.length; i++) {
      const el = lines[i]
      if (i === activeLine) {
        el.style.opacity = '1'
        el.style.color = theme.text
        el.style.fontSize = '24px'
        el.style.fontWeight = '700'
      } else {
        const dist = Math.abs(i - activeLine)
        el.style.opacity = String(Math.max(0.08, 1 - dist * 0.2))
        el.style.color = theme.text + '80'
        el.style.fontSize = '17px'
        el.style.fontWeight = '400'
      }
    }

    // Scroll smooth pake native scroll
    if (prevActive.current !== activeLine || firstRender.current) {
      firstRender.current = false
      prevActive.current = activeLine

      const active = lines[activeLine]
      if (active) {
        const cr = c.getBoundingClientRect()
        const ar = active.getBoundingClientRect()
        c.scrollBy({ top: ar.top - cr.top - cr.height / 2 + ar.height / 2, behavior: 'smooth' })
      }
    }
  }, [activeLine, theme])

  // ─── Synced lyrics — render STRING HTML langsung, bukan React children ───
  if (lyrics?.syncedLyrics?.length) {
    // Build HTML string sekali doang, inject via dangerouslySetInnerHTML
    // Biar React gak re-render tiap line pas activeLine berubah
    const html = lyrics.syncedLyrics.map((line, idx) =>
      `<div class="lyrics-line" style="font-size:17px;font-weight:400;line-height:1.7;text-align:center;width:100%;max-width:400px;padding:5px 24px;margin:0;opacity:0.08;color:${theme.text}80;transition:opacity 0.3s ease,color 0.3s ease">${escapeHtml(line.text)}</div>`
    ).join('')

    return (
      <div className="flex h-full" style={{ color: theme.text }}>
        <div ref={containerRef} className="flex-1 overflow-y-auto" style={{ padding: '25vh 0 25vh 0' }}>
          <div className="flex flex-col items-center lyrics-inner" dangerouslySetInnerHTML={{ __html: html }} />
        </div>
      </div>
    )
  }

  // ─── Plain lyrics ───
  if (lyrics?.plainLyrics) {
    return (
      <div className="flex h-full" style={{ paddingBottom: 16 }}>
        <div ref={containerRef} className="flex-1 overflow-y-auto flex items-start justify-center">
          <div className="text-sm leading-relaxed whitespace-pre-line text-center max-w-[400px]"
            style={{ color: theme.textSecondary, padding: '0 16px' }}>
            {lyrics.plainLyrics}
          </div>
        </div>
      </div>
    )
  }

  // ─── Loading ───
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full" style={{ gap: 20 }}>
        <div className="w-20 h-20 rounded-2xl flex items-center justify-center" style={{ background: theme.surfaceAlt }}>
          <div className="flex items-end gap-[3px] h-10">
            {[3, 5, 4, 7, 5, 8, 4, 6, 3].map((h, i) => (
              <div key={i} className="w-[3px] rounded-full" style={{
                height: h, background: theme.primary,
                animation: `bar 0.6s ease-in-out infinite`,
                animationDelay: `${i * 0.08}s`,
              }} />
            ))}
          </div>
        </div>
        <div className="flex flex-col items-center gap-1">
          <div className="text-xs font-medium" style={{ color: theme.textSecondary }}>Loading Lyrics</div>
          <div className="text-[10px]" style={{ color: theme.textSecondary + '70' }}>{currentTrack?.title}</div>
        </div>
      </div>
    )
  }

  if (!currentTrack) {
    return (
      <div className="flex flex-col items-center justify-center h-full" style={{ gap: 14 }}>
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: theme.surfaceAlt }}>
          <Music size={22} style={{ color: theme.textSecondary }} />
        </div>
        <div className="text-xs font-medium" style={{ color: theme.textSecondary }}>No track playing</div>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center h-full" style={{ gap: 14 }}>
      <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: theme.surfaceAlt }}>
        <Music size={22} style={{ color: theme.textSecondary }} />
      </div>
      <div className="text-xs font-medium" style={{ color: theme.textSecondary }}>No lyrics found</div>
      <div className="text-[10px] text-center max-w-[240px]" style={{ color: theme.textSecondary + '80' }}>
        <span className="truncate block">{currentTrack.title} — {currentTrack.artist}</span>
      </div>
    </div>
  )
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}
