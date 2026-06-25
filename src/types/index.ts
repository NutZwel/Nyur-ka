export interface Theme {
  name: string
  primary: string
  secondary: string
  accent: string
  background: string
  surface: string
  surfaceAlt: string
  text: string
  textSecondary: string
  border: string
  error: string
  success: string
  warning: string
  fontFamily: string
  borderRadius: number
  compact: boolean
  blur: boolean
  blurAmount: number
  spacing: number
  animations: boolean
}

export interface Track {
  id: string
  title: string
  artist: string
  album: string
  albumArt: string
  duration: number
  uri: string
  spotifyUrl?: string
  youtubeId?: string
  youtubeUrl?: string
}

export interface SpotifySearchResult {
  tracks: Track[]
  albums: any[]
  playlists: any[]
  artists: any[]
}

export interface Playlist {
  id: string
  name: string
  description: string
  image: string
  tracks: Track[]
  owner: string
  spotifyUrl: string
}

export interface QueueItem {
  track: Track
  addedBy: string
  requestedAt: number
}

export interface PlaybackState {
  currentTrack: Track | null
  isPlaying: boolean
  volume: number
  progress: number
  duration: number
  queue: QueueItem[]
  loopMode: 'none' | 'one' | 'all'
  shuffle: boolean
  equalizer: number[]
}

export interface YoutubeSearchResult {
  id: string
  title: string
  url: string
  duration: number
  thumbnail: string
  channel: string
  views: number
}
