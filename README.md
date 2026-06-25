# Nyu'rka 🐋🎵

Aplikasi desktop **music player** compact dengan integrasi **Spotify** dan **YouTube**, kustomisasi **tema pastel**, dan **paus pixel** yang lucu 🐋

## ✨ Fitur

- 🎵 **Pemutar Musik** — Putar lagu dari YouTube dengan streaming audio
- 🔍 **Search** — Cari lagu dari YouTube dan Spotify
- 📋 **Import Playlist** — Paste link YouTube / Spotify playlist
- 📋 **Queue Management** — Atur antrian, shuffle, loop
- 🔄 **Auto-Next & Auto-Recommend** — Putar lagu serupa saat queue habis
- 🎨 **Theme Customization** — 6 tema pastel (Rose, Mist, Dusk, Moss, Coffee, Night)
  - Custom color picker untuk setiap elemen
  - Border radius, spacing, font
  - Blur effect & animasi toggle
- 🐋 **Pixel Whale Mascot** — Animasi paus pixel di layar utama
- 🤖 **Dancing Robot** — Robot pixel dance pas gak ada lagu
- 💾 **Playback Persistence** — Queue & lagu terakhir tersimpan
- 🎯 **Compact & Interaktif** — UI ringan dengan animasi smooth

## 🚀 Cara Install & Run

### 1. Clone & Install Dependencies

```bash
git clone https://github.com/NutZwel/Nyur-ka.git
cd Nyur-ka
npm install
```

### 2. Setup Spotify (Opsional — untuk search playlist & album)

Buat aplikasi di [Spotify Developer Dashboard](https://developer.spotify.com/dashboard/):

1. Login ke Spotify Developer
2. Create App → masukkan nama `Nyurka`
3. Add Redirect URI: `http://localhost:8888/callback`
4. Save
5. Copy **Client ID** dan **Client Secret**

Edit file `electron/spotify.ts`:

```typescript
const SPOTIFY_CLIENT_ID = 'YOUR_CLIENT_ID'
const SPOTIFY_CLIENT_SECRET = 'YOUR_CLIENT_SECRET'
```

Atau tempel token langsung di **Settings → Manual Token**.

### 3. Jalankan

```bash
npm start
```

Atau **double klik Nyurka.lnk** di desktop (shortcut + icon sudah include).

## 🎮 Cara Pakai

| Tombol | Fungsi |
|--------|--------|
| 🔍 **Search** | Cari lagu + paste link playlist YouTube/Spotify |
| ▶️ **Play** | Putar lagu dari hasil pencarian |
| 📋 **Queue** | Lihat & atur antrian lagu |
| 🎨 **Theme** | Kustom tampilan aplikasi |
| ⚙️ **Settings** | Spotify token, always-on-top, compact view |

### Import Playlist
1. Klik icon **📋** di sebelah search bar
2. Paste link **YouTube playlist** atau **Spotify playlist**
3. Klik **Add** — semua lagu masuk queue!

## 🧩 Struktur Project

```
src/
├── components/
│   ├── PlayerView.tsx      # Halaman utama pemutar
│   ├── SearchView.tsx      # Pencarian + playlist import
│   ├── QueueView.tsx       # Antrian lagu
│   ├── SettingsView.tsx    # Pengaturan
│   ├── ThemeEditor.tsx     # Editor tema
│   ├── NowPlayingBar.tsx   # Bottom bar mini player
│   ├── TitleBar.tsx        # Custom title bar
│   ├── Sidebar.tsx         # Navigasi sidebar
│   ├── PixelWhale.tsx      # Animasi paus 🐋
│   └── DancingRobot.tsx    # Robot dance 🤖
├── store/                  # State management (Zustand)
├── hooks/                  # Audio playback hook
├── types/                  # Type definitions
└── App.tsx                 # Root component

electron/
├── main.ts                 # Electron main process
├── preload.ts              # Context bridge
├── spotify.ts              # Spotify API
├── youtube.ts              # YouTube streaming
└── playlist.ts             # Playlist extractor
```

## ⚙️ Teknologi

- **Electron** — Desktop framework
- **React + TypeScript** — UI
- **Zustand** — State management
- **Tailwind CSS** — Styling
- **Vite** — Build tool
- **yt-dlp** — YouTube audio streaming
- **play-dl** — YouTube search
- **Spotify Web API** — Metadata & playlists
- **Lucide React** — Icons

## 🎨 Theme Presets

| Theme | Style |
|-------|-------|
| 🌸 **Rose** | Pink pastel, soft & warm |
| 🌫️ **Mist** | Gray kalem, profesional |
| 🌙 **Dusk** | Dark ungu, cozy |
| 🌿 **Moss** | Hijau earthy, natural |
| ☕ **Coffee** | Coklat hangat |
| 🌃 **Night** | Dark biru, minimalis |

## 📝 Catatan

- Audio streaming menggunakan **yt-dlp** sebagai sumber (YouTube)
- Login Spotify bersifat opsional
- Playlist Spotify butuh token (Settings → Manual Token)
- **Playlist YouTube 100% work** tanpa login
- Aplikasi ini untuk penggunaan pribadi

---

🐋 Made with love
