import { useState, useEffect, useRef } from 'react'
import { usePlayerStore } from '../store/playerStore'

export interface LyricLine {
  time: number
  text: string
}

export interface LyricsData {
  plainLyrics: string
  syncedLyrics: LyricLine[]
  source: 'lrclib' | 'none'
}

const lyricsCache = new Map<string, LyricsData>()

export function useLyrics() {
  const { currentTrack } = usePlayerStore()
  const [lyrics, setLyrics] = useState<LyricsData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [activeLine, setActiveLine] = useState(-1)
  const trackRef = useRef<string | null>(null)
  const fetchingRef = useRef(false)
  const linesRef = useRef<LyricLine[]>([])

  // Fetch lyrics when track changes
  useEffect(() => {
    if (!currentTrack) {
      setLyrics(null); setActiveLine(-1)
      linesRef.current = []; trackRef.current = null
      return
    }

    const id = currentTrack.id
    if (id === trackRef.current) return
    trackRef.current = id

    const cached = lyricsCache.get(id)
    if (cached) {
      setLyrics(cached); linesRef.current = cached.syncedLyrics
      setIsLoading(false); setActiveLine(-1)
      return
    }

    setIsLoading(true); setLyrics(null)
    linesRef.current = []; setActiveLine(-1)

    const doFetch = async () => {
      if (fetchingRef.current) return
      fetchingRef.current = true

      try {
        const artist = encodeURIComponent(currentTrack.artist)
        const title = encodeURIComponent(currentTrack.title)

        const fetchFrom = async (url: string) => {
          if (window.electronAPI?.fetchLyrics) return await window.electronAPI.fetchLyrics(url)
          const res = await fetch(url)
          if (!res.ok) return { error: `HTTP ${res.status}`, status: res.status }
          return { data: await res.json(), status: res.status }
        }

        let result = await fetchFrom(`https://lrclib.net/api/get?artist_name=${artist}&track_name=${title}`)

        if (result.error || result.status !== 200) {
          const q = encodeURIComponent(`${currentTrack.title} ${currentTrack.artist}`)
          result = await fetchFrom(`https://lrclib.net/api/search?q=${q}`)
          if (result.error || result.status !== 200) throw new Error('Not found')
          const m = Array.isArray(result.data) ? result.data[0] : null
          if (!m || (!m.syncedLyrics && !m.plainLyrics)) throw new Error('No lyrics')
          const d = { plainLyrics: m.plainLyrics || '', syncedLyrics: parseSync(m.syncedLyrics || ''), source: 'lrclib' as const }
          lyricsCache.set(id, d); linesRef.current = d.syncedLyrics; setLyrics(d)
          setIsLoading(false); fetchingRef.current = false; return
        }

        const d = { plainLyrics: result.data.plainLyrics || '', syncedLyrics: parseSync(result.data.syncedLyrics || ''), source: 'lrclib' as const }
        lyricsCache.set(id, d); linesRef.current = d.syncedLyrics; setLyrics(d)
      } catch { setLyrics({ plainLyrics: '', syncedLyrics: [], source: 'none' }); linesRef.current = [] }
      setIsLoading(false); fetchingRef.current = false
    }
    doFetch()
  }, [currentTrack])

  // ─── Subscribe progress pake interval KECIL (setiap 500ms) bukan tiap progress ───
  useEffect(() => {
    const lines = linesRef.current
    if (!lines.length) { setActiveLine(-1); return }

    const idxRef = { current: -1 }
    const tick = () => {
      const p = usePlayerStore.getState().progress
      let idx = -1
      for (let i = lines.length - 1; i >= 0; i--) { if (p >= lines[i].time) { idx = i; break } }
      if (idx !== idxRef.current) { idxRef.current = idx; setActiveLine(idx) }
    }

    tick()
    const id = setInterval(tick, 500)
    return () => clearInterval(id)
  }, [lyrics])

  // Reset activeLine on track change
  useEffect(() => { setActiveLine(-1) }, [currentTrack?.id])

  return { lyrics, isLoading, activeLine }
}

function parseSync(raw: string): LyricLine[] {
  if (!raw) return []
  const l: LyricLine[] = []
  const r = /\[(\d{1,3}):(\d{2})\.(\d{2,3})\](.*)/g
  let m
  while ((m = r.exec(raw)) !== null) {
    const t = m[4]?.trim()
    if (t) l.push({ time: parseInt(m[1]) * 60 + parseInt(m[2]) + parseInt(m[3].padEnd(3, '0')) / 1000, text: t })
  }
  l.sort((a, b) => a.time - b.time)
  return l
}
