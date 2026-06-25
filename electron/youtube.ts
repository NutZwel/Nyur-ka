import { ipcMain } from 'electron'
import { search } from 'play-dl'
import { spawn } from 'child_process'
import { createServer } from 'http'

let activeStream: any = null
let activeServer: any = null

// Cache: pre-loaded streams (key = videoId)
const streamCache = new Map<string, { data: Buffer[]; port: number; server: any }>()

export function registerYoutubeIPCs() {
  ipcMain.handle('youtube-search', async (_event, query: string) => {
    try {
      if (query.includes('youtube.com/watch') || query.includes('youtu.be/') || query.includes('youtube.com/shorts/')) {
        try {
          const { execSync } = require('child_process')
          const meta = execSync(`yt-dlp --print "%(id)s|%(title)s|%(uploader)s|%(duration)s|%(thumbnail)s" --no-warnings "${query}"`, { encoding: 'utf8', timeout: 15000 })
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
      killStream()
      const videoId = extractId(videoUrl)

      // Check cache first
      if (videoId && streamCache.has(videoId)) {
        const cached = streamCache.get(videoId)!
        console.log('Cache hit:', videoId)
        // Start serving from cache
        const port = await serveFromCache(cached.data)
        // Get metadata
        let title = 'Unknown', duration = 0
        try {
          const { execSync } = require('child_process')
          const meta = execSync(`yt-dlp --print "%(title)s|%(duration)s" --no-warnings "${videoUrl}"`, { encoding: 'utf8', timeout: 8000 })
          const p = meta.trim().split('|'); title = p[0] || 'Unknown'; duration = parseInt(p[1]) || 0
        } catch {}
        return { streamUrl: `http://127.0.0.1:${port}/`, duration, title, videoId }
      }

      // Get metadata quickly
      const { execSync } = require('child_process')
      let title = 'Unknown', duration = 0
      const id = videoId || 'unknown'
      try {
        const meta = execSync(`yt-dlp --print "%(title)s|%(duration)s" --no-warnings "${videoUrl}"`, { encoding: 'utf8', timeout: 8000 })
        const p = meta.trim().split('|'); title = p[0] || 'Unknown'; duration = parseInt(p[1]) || 0
      } catch {}

      // Start local streaming server
      const port = await startStreamServer(videoUrl)

      return {
        streamUrl: `http://127.0.0.1:${port}/`,
        duration, title, videoId: id,
      }
    } catch (err) {
      console.error('Stream error:', err)
      return { error: (err as Error).message }
    }
  })

  ipcMain.handle('youtube-preload', async (_event, videoUrl: string) => {
    try {
      const videoId = extractId(videoUrl)
      if (!videoId || streamCache.has(videoId)) return true
      console.log('Preloading:', videoId)

      // Start background download
      const proc = spawn('yt-dlp', [
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
    let offset = 0
    const server = createServer((_req, res) => {
      const data = Buffer.concat(chunks)
      res.writeHead(200, {
        'Content-Type': 'audio/mp4',
        'Content-Length': data.length,
        'Access-Control-Allow-Origin': '*',
      })
      res.end(data)
    })
    server.listen(0, '127.0.0.1', () => {
      const addr = server.address()
      if (addr && typeof addr === 'object') { activeServer = server; resolve(addr.port) }
      else reject(new Error('Failed'))
    })
    server.on('error', reject)
  })
}

function startStreamServer(videoUrl: string): Promise<number> {
  return new Promise((resolve, reject) => {
    killStream()

    const server = createServer((_req, res) => {
      const proc = spawn('yt-dlp', [
        '-f', 'bestaudio[ext=m4a]/bestaudio',
        '-o', '-', '--no-warnings', videoUrl,
      ], { stdio: ['ignore', 'pipe', 'pipe'] })

      activeStream = proc
      res.writeHead(200, {
        'Content-Type': 'audio/mp4',
        'Transfer-Encoding': 'chunked',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-cache',
      })

      proc.stdout.on('data', (chunk: Buffer) => res.write(chunk))
      proc.stdout.on('end', () => res.end())
      proc.on('error', () => res.end())
      proc.stderr.on('data', (d: Buffer) => console.log('yt-dlp:', d.toString().trim()))
      _req.on('close', () => { if (activeStream === proc) proc.kill('SIGKILL') })
    })

    server.listen(0, '127.0.0.1', () => {
      const addr = server.address()
      if (addr && typeof addr === 'object') { activeServer = server; resolve(addr.port) }
      else reject(new Error('Failed'))
    })
    server.on('error', reject)
  })
}
