import { ipcMain } from 'electron'
import { search, video_info } from 'play-dl'
import { spawn, execSync } from 'child_process'

export function registerYoutubeIPCs() {
  ipcMain.handle('youtube-search', async (_event, query: string) => {
    try {
      // If it's a YouTube URL, get video info directly
      if (query.includes('youtube.com/watch') || query.includes('youtu.be/') || query.includes('youtube.com/shorts/')) {
        try {
          const meta = execSync(
            `yt-dlp --print "%(id)s|%(title)s|%(uploader)s|%(duration)s|%(thumbnail)s" --no-warnings "${query}"`,
            { encoding: 'utf8', timeout: 15000 }
          )
          const parts = meta.trim().split('|')
          if (parts.length >= 2) {
            return [{
              id: parts[0],
              title: parts[1],
              url: `https://www.youtube.com/watch?v=${parts[0]}`,
              duration: parseInt(parts[3]) || 0,
              thumbnail: parts[4] || `https://i.ytimg.com/vi/${parts[0]}/hqdefault.jpg`,
              channel: parts[2] || 'Unknown',
              views: 0,
            }]
          }
        } catch {}
      }

      const results = await search(query, { limit: 15, source: { youtube: 'video' } })
      return results.map(r => ({
        id: r.id, title: r.title, url: r.url,
        duration: r.durationInSec, thumbnail: r.thumbnails?.[0]?.url || '',
        channel: r.channel?.name || '', views: r.views,
      }))
    } catch (err) {
      return { error: 'Search failed' }
    }
  })

  ipcMain.handle('youtube-get-stream', async (_event, videoUrl: string) => {
    try {
      // Get metadata
      const meta = await runYtDlp([
        '--print', 'title',
        '--print', 'duration',
        '--no-warnings',
        videoUrl,
      ])
      const metaLines = meta.trim().split('\n')
      const title = metaLines[0] || 'Unknown'
      const duration = parseInt(metaLines[1]) || 0

      // Download audio buffer
      const raw = await runYtDlpBuffer([
        '-f', 'bestaudio[ext=m4a]/bestaudio',
        '-o', '-',
        '--no-warnings',
        '--no-progress',
        videoUrl,
      ])

      if (!raw || raw.length < 1000) {
        return { error: 'Download failed - empty' }
      }

      console.log('Audio ready:', (raw.length / 1024 / 1024).toFixed(1), 'MB')

      // Return as Uint8Array for transfer
      return {
        audioData: Array.from(new Uint8Array(raw)),
        duration,
        title,
      }
    } catch (err) {
      console.error('Stream error:', err)
      return { error: (err as Error).message }
    }
  })

  ipcMain.handle('youtube-stop-stream', () => {
    return true
  })
}

function runYtDlp(args: string[]): Promise<string> {
  return new Promise((resolve, reject) => {
    const proc = spawn('yt-dlp', args)
    let out = ''
    proc.stdout.on('data', (d: Buffer) => out += d.toString())
    proc.on('close', (code) => {
      if (code === 0) resolve(out)
      else reject(new Error('yt-dlp exited ' + code))
    })
    proc.on('error', reject)
  })
}

function runYtDlpBuffer(args: string[]): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const proc = spawn('yt-dlp', args)
    const chunks: Buffer[] = []
    proc.stdout.on('data', (d: Buffer) => chunks.push(d))
    proc.on('close', (code) => {
      if (code === 0) resolve(Buffer.concat(chunks))
      else reject(new Error('yt-dlp exited ' + code))
    })
    proc.on('error', reject)
  })
}
