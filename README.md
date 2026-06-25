# Sonic Overlay 🎵

Aplikasi desktop **music player** compact dengan integrasi **Spotify** dan **YouTube**, fitur **overlay mode** (floating di atas aplikasi lain), dan **kustomisasi tema** yang detail.

## ✨ Fitur

- 🎵 **Pemutar Musik** — Putar lagu dari YouTube dengan kualitas audio tinggi
- 🔍 **Search** — Cari lagu dari YouTube dan Spotify secara real-time
- 📋 **Queue Management** — Atur antrian lagu, shuffle, loop
- 🎨 **Theme Customization** — Kustom penuh:
  - 6 tema preset (Ocean, Midnight, Sunset, Forest, Cherry, Cyberpunk)
  - Custom color picker untuk setiap elemen
  - Border radius, spacing, font
  - Blur effect & animasi toggle
- 🪟 **Overlay Mode** — Window kecil compact yang selalu di atas (always-on-top)
- 🎚 **Equalizer Visual** — Animasi equalizer real-time
- 🎯 **Minimal & Interaktif** — UI ringan dengan animasi smooth

## 🚀 Cara Install & Run

### 1. Clone & Install Dependencies

```bash
git clone <repo-url>
cd sonic-overlay
npm install
```

### 2. Setup Spotify (Optional — untuk search playlist & album)

Buat aplikasi di [Spotify Developer Dashboard](https://developer.spotify.com/dashboard/):

1. Login ke Spotify Developer
2. Create App → masukkan nama `Sonic Overlay`
3. Add Redirect URI: `http://localhost:8888/callback`
4. Save
5. Copy **Client ID** dan **Client Secret**

Edit file `electron/spotify.ts`:

```typescript
const SPOTIFY_CLIENT_ID = 'YOUR_CLIENT_ID'
const SPOTIFY_CLIENT_SECRET = 'YOUR_CLIENT_SECRET'
```

### 3. Jalankan Development Mode

```bash
npm run electron:dev
```

### 4. Build untuk Production

```bash
npm run electron:build
```

## 🎮 Cara Pakai

| Tombol | Fungsi |
|--------|--------|
| 🔍 **Search** | Cari lagu (YouTube otomatis + Spotify) |
| ▶️ **Play** | Putar lagu dari hasil pencarian |
| 📋 **Queue** | Lihat & atur antrian lagu |
| 🎨 **Theme** | Kustom tampilan aplikasi |
| ⚙️ **Settings** | Login Spotify, overlay, opacity, always-on-top |
| ◈ **Overlay** | Mode floating window compact |

### Overlay Mode

Klik tombol **Overlay** di title bar untuk mengaktifkan mode overlay. Window kecil akan muncul di pojok kanan bawah layar. Kamu bisa drag window tersebut ke posisi manapun.

## 🧩 Struktur Project

```
src/
├── components/
│   ├── PlayerView.tsx      # Halaman utama pemutar
│   ├── SearchView.tsx      # Pencarian lagu
│   ├── QueueView.tsx       # Antrian lagu
│   ├── SettingsView.tsx    # Pengaturan
│   ├── ThemeEditor.tsx     # Editor tema
│   ├── NowPlayingBar.tsx   # Bottom bar mini player
│   ├── TitleBar.tsx        # Custom title bar
│   └── Sidebar.tsx         # Navigasi sidebar
├── store/
│   ├── playerStore.ts      # State player
│   ├── themeStore.ts       # State tema
│   └── appStore.ts         # State aplikasi
├── hooks/
│   └── useAudioPlayer.ts   # Audio playback hook
├── types/
│   └── index.ts            # Type definitions
├── App.tsx                 # Root component
└── OverlayApp.tsx          # Overlay window component
electron/
├── main.ts                 # Electron main process
├── preload.ts              # Preload / context bridge
├── spotify.ts              # Spotify API integration
└── youtube.ts              # YouTube search integration
```

## ⚙️ Teknologi

- **Electron** — Desktop framework
- **React + TypeScript** — UI
- **Zustand** — State management
- **Tailwind CSS** — Styling
- **Vite** — Build tool
- **play-dl** — YouTube search & streaming
- **Spotify Web API** — Metadata & playlists
- **Lucide React** — Icons

## 🎨 Theme Customization

Di halaman **Theme**, kamu bisa:

1. Pilih **preset** (6 tema bawaan)
2. Custom **warna** per-elemen dengan color picker
3. Atur **border radius** (0-24px)
4. Atur **spacing** (0-12px)
5. Pilih **font family** 
6. Toggle **blur effect** + atur intensity
7. Toggle **animations**
8. Lihat **preview** langsung

## 📝 Catatan

- Audio streaming menggunakan YouTube sebagai sumber (seperti bot Discord pada umumnya)
- Login Spotify bersifat opsional, berguna untuk search playlist/album
- Aplikasi ini untuk penggunaan pribadi

---

Made with ❤️
