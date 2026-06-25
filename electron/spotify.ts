import { ipcMain, BrowserWindow } from 'electron'
import Store from 'electron-store'

const SPOTIFY_CLIENT_ID = 'YOUR_SPOTIFY_CLIENT_ID' // User needs to replace this
const SPOTIFY_CLIENT_SECRET = 'YOUR_SPOTIFY_CLIENT_SECRET'
const REDIRECT_URI = 'http://localhost:8888/callback'
const SCOPES = [
  'user-read-private',
  'user-read-email',
  'playlist-read-private',
  'playlist-read-collaborative',
  'user-library-read',
  'user-top-read',
  'user-read-playback-state',
].join(' ')

// In-memory token storage
let accessToken: string | null = null
let refreshToken: string | null = null

export function registerSpotifyIPCs(store: Store<any>, _mainWindow: BrowserWindow) {
  // Load saved tokens
  accessToken = store.get('spotifyToken') as string | null
  refreshToken = store.get('spotifyRefreshToken') as string | null

  ipcMain.handle('spotify-login', async () => {
    const authUrl = `https://accounts.spotify.com/authorize?client_id=${SPOTIFY_CLIENT_ID}&response_type=code&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=${encodeURIComponent(SCOPES)}`

    // Open auth window
    const authWindow = new BrowserWindow({
      width: 500,
      height: 700,
      title: 'Spotify Login',
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
      }
    })

    authWindow.loadURL(authUrl)

    return new Promise<boolean>((resolve) => {
      authWindow.webContents.on('will-redirect', async (_event, url) => {
        if (url.startsWith(REDIRECT_URI)) {
          const urlObj = new URL(url)
          const code = urlObj.searchParams.get('code')

          if (code) {
            try {
              const tokenResult = await exchangeCode(code)
              accessToken = tokenResult.access_token
              refreshToken = tokenResult.refresh_token

              store.set('spotifyToken', accessToken)
              store.set('spotifyRefreshToken', refreshToken)

              authWindow.close()
              resolve(true)
            } catch (err) {
              console.error('Auth error:', err)
              authWindow.close()
              resolve(false)
            }
          }
        }
      })

      // Handle navigation as well
      authWindow.webContents.on('will-navigate', async (_event, url) => {
        if (url.startsWith(REDIRECT_URI)) {
          const urlObj = new URL(url)
          const code = urlObj.searchParams.get('code')

          if (code) {
            try {
              const tokenResult = await exchangeCode(code)
              accessToken = tokenResult.access_token
              refreshToken = tokenResult.refresh_token

              store.set('spotifyToken', accessToken)
              store.set('spotifyRefreshToken', refreshToken)

              authWindow.close()
              resolve(true)
            } catch (err) {
              console.error('Auth error:', err)
              authWindow.close()
              resolve(false)
            }
          }
        }
      })

      authWindow.on('closed', () => {
        resolve(false)
      })
    })
  })

  ipcMain.handle('spotify-search', async (_event, query: string) => {
    return spotifyFetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track,artist,album,playlist&limit=20`)
  })

  ipcMain.handle('spotify-get-track', async (_event, id: string) => {
    return spotifyFetch(`https://api.spotify.com/v1/tracks/${id}`)
  })

  ipcMain.handle('spotify-get-playlist', async (_event, id: string) => {
    return spotifyFetch(`https://api.spotify.com/v1/playlists/${id}`)
  })

  ipcMain.handle('spotify-get-album', async (_event, id: string) => {
    return spotifyFetch(`https://api.spotify.com/v1/albums/${id}`)
  })

  ipcMain.handle('spotify-get-recommendations', async (_event, seedTrack: string) => {
    return spotifyFetch(`https://api.spotify.com/v1/recommendations?seed_tracks=${seedTrack}&limit=12`)
  })

  ipcMain.handle('spotify-get-token', () => accessToken)
  ipcMain.handle('spotify-is-logged-in', () => !!accessToken)

  // Manual token set
  ipcMain.handle('spotify-set-token', async (_event, token: string) => {
    if (!token || token.length < 20) return false
    accessToken = token
    store.set('spotifyToken', token)
    return true
  })
}

async function exchangeCode(code: string) {
  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': 'Basic ' + Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString('base64'),
    },
    body: new URLSearchParams({
      code,
      redirect_uri: REDIRECT_URI,
      grant_type: 'authorization_code',
    } as any).toString(),
  })

  return response.json()
}

async function refreshAccessToken() {
  if (!refreshToken) return null

  try {
    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic ' + Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString('base64'),
      },
      body: new URLSearchParams({
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      } as any).toString(),
    })

    const data = await response.json()
    accessToken = data.access_token
    if (data.refresh_token) refreshToken = data.refresh_token
    return accessToken
  } catch (err) {
    console.error('Token refresh error:', err)
    return null
  }
}

async function spotifyFetch(url: string): Promise<any> {
  if (!accessToken) return { error: 'Not logged in' }

  try {
    const response = await fetch(url, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    })

    if (response.status === 401) {
      const newToken = await refreshAccessToken()
      if (newToken) {
        const retry = await fetch(url, {
          headers: { 'Authorization': `Bearer ${newToken}` }
        })
        return retry.json()
      }
      return { error: 'Token expired' }
    }

    return response.json()
  } catch (err) {
    console.error('Spotify fetch error:', err)
    return { error: 'Request failed' }
  }
}
