import { Minus, X, Square } from 'lucide-react'
import { useThemeStore } from '../store/themeStore'

export default function TitleBar() {
  const { theme } = useThemeStore()

  return (
    <div
      className="drag-region flex items-center justify-between px-4 shrink-0"
      style={{
        background: theme.surface,
        borderBottom: `1px solid ${theme.border}50`,
        height: 44,
      }}
    >
      <div className="flex items-center gap-2.5">
        <div
          className="w-2.5 h-2.5 rounded-full animate-float"
          style={{ background: theme.primary, opacity: 0.8 }}
        />
        <span
          className="text-sm font-semibold tracking-wide"
          style={{ color: theme.text, opacity: 0.8 }}
        >
          nyu'rka
        </span>
      </div>

      <div className="flex items-center gap-1 -mr-2">
        <button className="btn-icon !w-8 !h-8 !rounded-lg" onClick={() => window.electronAPI?.minimize()}>
          <Minus size={14} />
        </button>
        <button className="btn-icon !w-8 !h-8 !rounded-lg" onClick={() => window.electronAPI?.maximize()}>
          <Square size={12} />
        </button>
        <button
          className="btn-icon !w-8 !h-8 !rounded-lg hover:!bg-red-400 hover:!text-white"
          onClick={() => window.electronAPI?.close()}
        >
          <X size={14} />
        </button>
      </div>
    </div>
  )
}
