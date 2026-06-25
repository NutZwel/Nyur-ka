import { ipcMain, BrowserWindow } from 'electron'
import { search } from 'play-dl'
import { execSync } from 'child_process'

let getSpotifyToken: () => string | null = () => null

export function registerPlaylistIPCs(getToken: () => string | null) {
  getSpotifyToken = getToken

  ipcMain.handle('playlist-extract', async (_event, url: string) => {
    try {
      console.log('Extracting playlist from:', url)

      // YouTube playlist
      if (url.includes('youtube.com/playlist') || url.includes('youtu.be') || url.includes('youtube.com/watch')) {
        return await extractYoutubePlaylist(url)
      }

      // Spotify playlist
      if (url.includes('spotify.com/playlist') || url.includes('spotify.com/album') || url.includes('open.spotify.com')) {
        return await extractSpotifyPlaylist(url)
      }

      // Fallback: search YouTube
      return await extractYoutubePlaylist(url)
    } catch (err) {
      console.error('Playlist extract error:', err)
      return { error: (err as Error).message }
    }
  })
}

async function extractYoutubePlaylist(url: string) {
  const listMatch = url.match(/[&?]list=([a-zA-Z0-9_-]+)/)
  const playlistId = listMatch?.[1]
  const tracks: any[] = []

  if (playlistId) {
    console.log('YouTube playlist ID:', playlistId)
    try {
      const output = execSync(
        `yt-dlp --flat-playlist --print "%(id)s|%(title)s|%(uploader)s|%(duration)s" --no-warnings "https://www.youtube.com/playlist?list=${playlistId}"`,
        { encoding: 'utf8', timeout: 60000, maxBuffer: 10 * 1024 * 1024 }
      )
      const lines = output.trim().split('\n').filter(l => l.trim())
      for (const line of lines.slice(0, 50)) {
        const p = line.split('|')
        if (p.length >= 2) {
          const dur = parseInt(p[3]) || 0
          tracks.push({
            id: `yt-${p[0]}`,
            title: p[1],
            artist: p[2] || 'Unknown',
            album: 'YouTube Playlist',
            albumArt: `https://i.ytimg.com/vi/${p[0]}/hqdefault.jpg`,
            duration: dur,
            uri: `https://www.youtube.com/watch?v=${p[0]}`,
            youtubeId: p[0],
            youtubeUrl: `https://www.youtube.com/watch?v=${p[0]}`,
          })
        }
      }
    } catch (e) {
      console.error('yt-dlp playlist error:', e)
      // Fallback to search
      const results = await search(url, { limit: 15, source: { youtube: 'video' } })
      for (const r of results) {
        tracks.push(ytResultToTrack(r))
      }
    }
  } else {
    // No playlist ID — search
    const results = await search(url, { limit: 15, source: { youtube: 'video' } })
    for (const r of results) {
      tracks.push(ytResultToTrack(r))
    }
  }

  console.log(`Found ${tracks.length} tracks from YouTube`)
  return { tracks }
}

function ytResultToTrack(r: any) {
  return {
    id: `yt-${r.id}`,
    title: r.title,
    artist: r.channel?.name || 'Unknown',
    album: 'YouTube',
    albumArt: r.thumbnails?.[0]?.url || '',
    duration: r.durationInSec || 0,
    uri: r.url,
    youtubeId: r.id,
    youtubeUrl: r.url,
  }
}

async function extractSpotifyPlaylist(url: string) {
  const playlistMatch = url.match(/playlist\/([a-zA-Z0-9]+)/)
  const albumMatch = url.match(/album\/([a-zA-Z0-9]+)/)
  const id = playlistMatch?.[1] || albumMatch?.[1]
  if (!id) return { error: 'Could not find playlist/album ID in URL' }

  console.log('Spotify ID:', id)

  // Try with token if available
  const token = getSpotifyToken()
  if (token) {
    try {
      const endpoint = playlistMatch
        ? `https://api.spotify.com/v1/playlists/${id}/tracks?limit=50`
        : `https://api.spotify.com/v1/albums/${id}/tracks?limit=50`
      const res = await fetch(endpoint, { headers: { Authorization: `Bearer ${token}` } })
      if (res.ok) {
        const data = await res.json()
        const items = data.items || data.tracks?.items || []
        if (items.length) {
          const tracks = items
            .filter((i: any) => i.track || i.name)
            .map((i: any) => {
              const t = i.track || i
              return {
                id: `sp-${t.id}`,
                title: t.name,
                artist: t.artists?.map((a: any) => a.name).join(', ') || 'Unknown',
                album: t.album?.name || 'Spotify Playlist',
                albumArt: t.album?.images?.[0]?.url || '',
                duration: Math.round((t.duration_ms || 0) / 1000),
                uri: t.external_urls?.spotify || t.uri || t.id,
              }
            })
          return { tracks }
        }
      }
    } catch { /* fallback to search */ }
  }

  // Use hidden BrowserWindow to get Spotify session token + fetch playlist
  console.log('Opening hidden browser for Spotify...')
  const tracks: any[] = await extractSpotifyViaBrowser(id)

  if (tracks.length > 0) {
    console.log(`Got ${tracks.length} tracks from Spotify browser`)
    return { tracks }
  }

  // Last resort: search YouTube for the playlist name
  console.log('Searching YouTube as fallback...')
  const results = await search(`spotify playlist ${id} songs`, { limit: 15, source: { youtube: 'video' } })
  if (results.length > 0) {
    return { tracks: results.map(ytResultToTrack) }
  }

  return { error: 'Could not extract playlist. The playlist may be private or empty.' }
}

async function extractSpotifyViaBrowser(playlistId: string): Promise<any[]> {
  return new Promise((resolve) => {
    const tracks: any[] = []
    const timeout = setTimeout(() => { if (!win?.isDestroyed()) win.close(); resolve([]) }, 15000)

    const win = new BrowserWindow({
      width: 800,
      height: 600,
      show: false,
      webPreferences: { nodeIntegration: false, contextIsolation: true }
    })

    win.webContents.on('did-finish-load', async () => {
      try {
        const url = win.webContents.getURL()
        // After loading playlist page, extract session and fetch API
        if (url.includes('open.spotify.com/playlist/' + playlistId)) {
          // Try to get access token from localStorage
          const result = await win.webContents.executeJavaScript(`
            (async () => {
              // Try to get from localStorage
              const stored = Object.keys(localStorage).find(k => k.includes('session') || k.includes('token'));
              let token = stored ? localStorage.getItem(stored) : null;

              // Try to parse access token from stored session
              if (token) {
                try {
                  const parsed = JSON.parse(token);
                  token = parsed.accessToken || parsed;
                } catch {}
              }

              // Try to extract from /get_access_token
              if (!token) {
                try {
                  const r = await fetch('/get_access_token?reason=transport&productType=web_player');
                  const d = await r.json();
                  token = d.accessToken || d.accessToken;
                } catch {}
              }

              // Fetch playlist tracks if we have token
              if (token && typeof token === 'string') {
                try {
                  const r = await fetch('https://api.spotify.com/v1/playlists/${playlistId}/tracks?limit=50', {
                    headers: { Authorization: 'Bearer ' + token }
                  });
                  const data = await r.json();
                  if (data.items) {
                    return JSON.stringify(data.items.map((item, i) => {
                      const t = item.track || item;
                      return {
                        id: 'sp-' + (t.id || i),
                        title: t.name || 'Unknown',
                        artist: (t.artists || []).map(a => a.name).join(', ') || 'Unknown',
                        album: t.album?.name || 'Spotify Playlist',
                        albumArt: t.album?.images?.[0]?.url || '',
                        duration: Math.round((t.duration_ms || 0) / 1000),
                        uri: '',
                      };
                    }));
                  }
                } catch {}
              }
              return '[]';
            })()
          `)

          if (result && result !== '[]') {
            const parsed = JSON.parse(result)
            tracks.push(...parsed)
          }
          clearTimeout(timeout)
          win.close()
        }
      } catch {
        clearTimeout(timeout)
        win.close()
      }
    })

    win.webContents.on('did-fail-load', () => {
      clearTimeout(timeout)
      resolve([])
    })

    win.webContents.on('destroyed', () => {
      resolve(tracks)
    })

    win.loadURL(`https://open.spotify.com/playlist/${playlistId}`)
  })
}
