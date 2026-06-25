import { ipcMain } from 'electron'
import { search } from 'play-dl'
import { spawn, execSync } from 'child_process'
import { createServer } from 'http'

let activeStream: any = null
let activeServer: any = null

// Auto-install or find yt-dlp
let ytDlpPath = 'yt-dlp'

function ensureYtDlp(): boolean {
  try {
    execSync('yt-dlp --version', { stdio: 'ignore', timeout: 5000 })
    ytDlpPath = 'yt-dlp'
    return true
  } catch {
    try {
      execSync('python -m yt_dlp --version', { stdio: 'ignore', timeout: 5000 })
      ytDlpPath = 'python -m yt_dlp'
      return true
    } catch {
      try {
        execSync('python3 -m yt_dlp --version', { stdio: 'ignore', timeout: 5000 })
        ytDlpPath = 'python3 -m yt_dlp'
        return true
      } catch {
        // Try installing yt-dlp
        try {
          execSync('pip install yt-dlp', { stdio: 'pipe', timeout: 30000 })
          ytDlpPath = 'yt-dlp'
          return true
        } catch {
          try {
            execSync('pip3 install yt-dlp', { stdio: 'pipe', timeout: 30000 })
            ytDlpPath = 'yt-dlp'
            return true
          } catch {
            return false
          }
        }
      }
    }
  }
}

// Helper: run yt-dlp synchronously
function ytdlExec(args: string, options?: any): string {
  if (ytDlpPath === 'yt-dlp') {
    return execSync(`yt-dlp ${args}`, { encoding: 'utf8', timeout: 30000, ...options })
  } else {
    // python -m yt_dlp or python3 -m yt_dlp
    return execSync(`${ytDlpPath} ${args}`, { encoding: 'utf8', timeout: 30000, ...options })
  }
}

function ytdlExecBuffer(args: string): Buffer {
  if (ytDlpPath === 'yt-dlp') {
    return execSync(`yt-dlp ${args}`, { encoding: 'buffer', timeout: 120000, maxBuffer: 100 * 1024 * 1024 })
  } else {
    return execSync(`${ytDlpPath} ${args}`, { encoding: 'buffer', timeout: 120000, maxBuffer: 100 * 1024 * 1024 })
  }
}

function ytdlSpawn(args: string[]) {
  if (ytDlpPath === 'yt-dlp') {
    return spawn('yt-dlp', args)
  } else {
    const parts = ytDlpPath.split(' ')
    return spawn(parts[0], [...parts.slice(1), ...args])
  }
}

// Cache: pre-loaded streams (key = videoId)
const streamCache = new Map<string, { data: Buffer[]; port: number; server: any }>()

export function registerYoutubeIPCs() {
  // Ensure yt-dlp is available
  const ytAvailable = ensureYtDlp()

  // IPC for renderer to check yt-dlp status
  ipcMain.handle('yt-dlp-status', () => {
    return { available: ytAvailable, path: ytDlpPath }
  })

  ipcMain.handle('youtube-search', async (_event, query: string) => {
    try {
      if (!ytAvailable) return { error: 'yt-dlp not installed' }
      if (query.includes('youtube.com/watch') || query.includes('youtu.be/') || query.includes('youtube.com/shorts/')) {
        try {
          const meta = ytdlExec(`--print "%(id)s|%(title)s|%(uploader)s|%(duration)s|%(thumbnail)s" --no-warnings "${query}"`, { timeout: 15000 })
          const parts = meta.trim().split('|')
          if (parts.length >= 2) return [{
            id: parts[0], title: parts[1], url: `https://www.youtube.com/watch?v=${parts[0]}`,
            duration: parseInt(parts[3]) || 0, thumbnail: parts[4] || `https://i.ytimg.com/vi/${parts[0]}/hqdefault.jpg`,
            channel: parts[2] || 'Unknown', views: 0,
          }]
        } catch {}
      }
      const results = await search(query, { limit: 15, source: { youtube: 'video' } })
      return results.map(r => ({
        id: r.id, title: r.title, url: r.url, duration: r.durationInSec,
        thumbnail: r.thumbnails?.[0]?.url || '', channel: r.channel?.name || '', views: r.views,
      }))
    } catch { return { error: 'Search failed' } }
  })

  ipcMain.handle('youtube-get-stream', async (_event, videoUrl: string) => {
    try {
      if (!ytAvailable) return { error: 'yt-dlp not installed' }
      killStream()
      const videoId = extractId(videoUrl)

      if (videoId && streamCache.has(videoId)) {
        const cached = streamCache.get(videoId)!
        console.log('Cache hit:', videoId)
        const port = await serveFromCache(cached.data)
        return { streamUrl: `http://127.0.0.1:${port}/`, duration: 0, title: '', videoId }
      }

      let title = 'Unknown', duration = 0
      const id = videoId || 'unknown'
      try {
        const meta = ytdlExec(`--print "%(title)s|%(duration)s" --no-warnings "${videoUrl}"`, { timeout: 8000 })
        const p = meta.trim().split('|'); title = p[0] || 'Unknown'; duration = parseInt(p[1]) || 0
      } catch {}

      console.log('Downloading audio...')
      const raw = ytdlExecBuffer(`-f "bestaudio[ext=m4a]/bestaudio" -o - --no-warnings --no-progress "${videoUrl}"`)
      const buffer = Buffer.from(raw)
      console.log('Downloaded:', (buffer.length / 1024 / 1024).toFixed(1), 'MB')

      if (videoId) {
        streamCache.set(videoId, { data: [buffer], port: 0, server: null })
        setTimeout(() => streamCache.delete(videoId), 120000)
      }

      const port = await serveFromCache([buffer])
      return { streamUrl: `http://127.0.0.1:${port}/`, duration, title, videoId: id }
    } catch (err) {
      console.error('Stream error:', err)
      return { error: (err as Error).message }
    }
  })

  ipcMain.handle('youtube-preload', async (_event, videoUrl: string) => {
    try {
      if (!ytAvailable) return false
      const videoId = extractId(videoUrl)
      if (!videoId || streamCache.has(videoId)) return true
      console.log('Preloading:', videoId)

      // Start background download using helper
      const proc = ytdlSpawn([
        '-f', 'bestaudio[ext=m4a]/bestaudio',
        '-o', '-', '--no-warnings', videoUrl,
      ], { stdio: ['ignore', 'pipe', 'pipe'] })

      const chunks: Buffer[] = []
      proc.stdout.on('data', (d: Buffer) => chunks.push(d))
      proc.stdout.on('end', () => {
        if (chunks.length > 0 && videoId) {
          streamCache.set(videoId, { data: chunks, port: 0, server: null })
          console.log('Preload complete:', videoId)
          // Auto-expire after 2 min
          setTimeout(() => streamCache.delete(videoId), 120000)
        }
      })
      proc.on('error', () => {})
    } catch {}
    return true
  })

  ipcMain.handle('youtube-stop-stream', () => { killStream(); return true })
}

function extractId(url: string): string | null {
  const m = url.match(/(?:v=|youtu\.be\/|shorts\/)([a-zA-Z0-9_-]{11})/)
  return m?.[1] || null
}

function killStream() {
  if (activeStream) { activeStream.kill('SIGKILL'); activeStream = null }
  if (activeServer) { activeServer.close(); activeServer = null }
}

function serveFromCache(chunks: Buffer[]): Promise<number> {
  return new Promise((resolve, reject) => {
    killStream()
    const server = createServer((_req, res) => {
      const data = Buffer.concat(chunks)
      // Support Range requests for seeking
      const range = _req.headers.range
      if (range) {
        const parts = range.replace(/bytes=/, '').split('-')
        const start = parseInt(parts[0], 10)
        const end = parts[1] ? parseInt(parts[1], 10) : data.length - 1
        res.writeHead(206, {
          'Content-Range': `bytes ${start}-${end}/${data.length}`,
          'Content-Length': end - start + 1,
          'Content-Type': 'audio/mp4',
          'Accept-Ranges': 'bytes',
          'Access-Control-Allow-Origin': '*',
        })
        res.end(data.slice(start, end + 1))
      } else {
        res.writeHead(200, {
          'Content-Type': 'audio/mp4',
          'Content-Length': data.length,
          'Accept-Ranges': 'bytes',
          'Access-Control-Allow-Origin': '*',
        })
        res.end(data)
      }
    })
    server.listen(0, '127.0.0.1', () => {
      const addr = server.address()
      if (addr && typeof addr === 'object') { activeServer = server; resolve(addr.port) }
      else reject(new Error('Failed'))
    })
    server.on('error', reject)
  })
}
