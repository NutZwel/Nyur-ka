import { useEffect, useState, useRef, useCallback } from 'react'
import { useThemeStore } from '../store/themeStore'
import { usePlayerStore } from '../store/playerStore'

export default function SplashScreen({ onFinish }: { onFinish: () => void }) {
  const theme = useThemeStore(s => s.theme)
  const [step, setStep] = useState(0)
  const [pct, setPct] = useState(0)
  const finishedRef = useRef(false)
  const loadedRef = useRef(false)

  const finish = useCallback(() => {
    if (finishedRef.current) return
    finishedRef.current = true
    onFinish()
  }, [onFinish])

  // Animasi logo
  useEffect(() => {
    if (step >= 8) return
    const t = setTimeout(() => setStep(s => s + 1), 250)
    return () => clearTimeout(t)
  }, [step])

  // Load playback state + progress
  useEffect(() => {
    setPct(20)
    const t1 = setTimeout(() => setPct(40), 300)
    const t2 = setTimeout(() => setPct(60), 600)
    const t3 = setTimeout(() => setPct(80), 1000)

    usePlayerStore.getState().loadPlayback().then(() => {
      setPct(100)
      loadedRef.current = true
    }).catch(() => {
      setPct(100)
      loadedRef.current = true
    })

    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3) }
  }, [])

  // Finish saat loaded + minimum 2s
  useEffect(() => {
    if (!loadedRef.current) return
    const t = setTimeout(finish, 1200)
    return () => clearTimeout(t)
  }, [pct, finish])

  // Fallback max 4s
  useEffect(() => {
    const t = setTimeout(finish, 4000)
    return () => clearTimeout(t)
  }, [finish])

  const frames = [
    `<svg viewBox="0 0 80 80"><circle cx="40" cy="40" r="28" fill="none" stroke="currentColor" stroke-width="3" opacity="0.3"/></svg>`,
    `<svg viewBox="0 0 80 80"><circle cx="40" cy="40" r="28" fill="none" stroke="currentColor" stroke-width="3" opacity="0.6"/></svg>`,
    `<svg viewBox="0 0 80 80"><circle cx="40" cy="40" r="28" fill="none" stroke="currentColor" stroke-width="3" opacity="0.9"/></svg>`,
    `<svg viewBox="0 0 80 80"><circle cx="40" cy="40" r="28" fill="none" stroke="currentColor" stroke-width="3" opacity="0.3"/><line x1="20" y1="55" x2="40" y2="28" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" opacity="0.6"/></svg>`,
    `<svg viewBox="0 0 80 80"><circle cx="40" cy="40" r="28" fill="none" stroke="currentColor" stroke-width="3" opacity="0.3"/><line x1="20" y1="55" x2="40" y2="28" stroke="currentColor" stroke-width="3.5" stroke-linecap="round"/><line x1="42" y1="30" x2="58" y2="50" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" opacity="0.6"/></svg>`,
    `<svg viewBox="0 0 80 80"><ellipse cx="22" cy="54" rx="10" ry="8" fill="currentColor" opacity="0.5"/><ellipse cx="52" cy="46" rx="10" ry="8" fill="currentColor" opacity="0.5"/><rect x="28" y="12" width="5" height="44" rx="2.5" fill="currentColor"/><rect x="56" y="4" width="5" height="44" rx="2.5" fill="currentColor"/><path d="M33,14 Q54,4 56,6" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" opacity="0.7"/></svg>`,
    `<svg viewBox="0 0 80 80"><ellipse cx="22" cy="54" rx="10" ry="8" fill="currentColor" opacity="0.8"/><ellipse cx="52" cy="46" rx="10" ry="8" fill="currentColor" opacity="0.8"/><rect x="28" y="12" width="5" height="44" rx="2.5" fill="currentColor"/><rect x="56" y="4" width="5" height="44" rx="2.5" fill="currentColor"/><path d="M33,14 Q54,4 56,6" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round"/></svg>`,
    `<svg viewBox="0 0 80 80"><ellipse cx="22" cy="54" rx="10" ry="8" fill="currentColor" opacity="0.9"/><ellipse cx="52" cy="46" rx="10" ry="8" fill="currentColor" opacity="0.9"/><rect x="28" y="12" width="5" height="44" rx="2.5" fill="currentColor"/><rect x="56" y="4" width="5" height="44" rx="2.5" fill="currentColor"/><path d="M33,14 Q54,4 56,6" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round"/></svg>`,
  ]

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      background: `linear-gradient(180deg, ${theme.background} 0%, ${theme.surface} 100%)`,
      color: theme.text,
    }}>
      <div style={{ width: 110, height: 110, animation: step >= 6 ? 'splashPulse 2s ease-in-out infinite' : 'none' }}
        dangerouslySetInnerHTML={{ __html: frames[Math.min(step, frames.length - 1)] }} />

      <div style={{ marginTop: 20, fontSize: 26, fontWeight: 700, letterSpacing: 3 }}>
        NYU<span style={{ color: theme.primary }}>'</span>RKA
      </div>

      <div style={{ marginTop: 40, width: 200, height: 3, borderRadius: 2, background: theme.surfaceAlt, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, borderRadius: 2, background: `linear-gradient(90deg, ${theme.primary}, ${theme.secondary})`, transition: 'width 0.3s ease' }} />
      </div>

      <div style={{ position: 'absolute', bottom: 24, fontSize: 10, color: theme.textSecondary + '60' }}>
        v1.0.1
      </div>
    </div>
  )
}
