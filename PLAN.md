# Tsukimi — Master Plan

> **Tsukimi** (tsukimi.my, sebelumnya "Lucy4 Stream") adalah platform streaming web untuk video + direktori cast, anime, dan komik (manga/manhwa/manhua).
> Dokumen ini adalah rencana induk untuk pemilik produk dan engineer. Isinya menggabungkan draft Product, Frontend, Backend, Data/Media, Infra dan Security, ditambah semua koreksi dari critic dan hasil fact-check.
> Tanggal: 2026-10-12 · Status: **draft untuk keputusan**. Item yang belum terverifikasi ditandai **[VERIFIKASI]**, dan item yang perlu pengacara ditandai **[LAWYER]**.

---

## Daftar isi

0. [Ringkasan eksekutif](#0-ringkasan-eksekutif)
1. [Status saat ini](#1-status-saat-ini)
2. [Lingkup produk, persona & MVP](#2-lingkup-produk-persona--mvp)
3. [Arsitektur sistem](#3-arsitektur-sistem)
4. [Frontend](#4-frontend)
5. [Backend & model data](#5-backend--model-data)
6. [Redundansi database](#6-redundansi-database)
7. [Penyimpanan objek & media pipeline](#7-penyimpanan-objek--media-pipeline)
8. [Infrastruktur Kubernetes, CI/CD & observability](#8-infrastruktur-kubernetes-cicd--observability)
9. [Keamanan, privasi & legal](#9-keamanan-privasi--legal)
10. [Roadmap per fase](#10-roadmap-per-fase)
11. [Tim & estimasi](#11-tim--estimasi)
12. [Risiko & mitigasi](#12-risiko--mitigasi)
13. [Keputusan terbuka — pertanyaan untuk pemilik produk](#13-keputusan-terbuka--pertanyaan-untuk-pemilik-produk)
- [Appendix A: Hasil fact-check](#appendix-a-hasil-fact-check)
- [Appendix B: Daftar keputusan kanonik (resolusi kontradiksi)](#appendix-b-daftar-keputusan-kanonik-resolusi-kontradiksi)

---

## 0. Ringkasan eksekutif

**Apa yang dibangun.** Satu platform web dengan tiga vertikal yang memakai satu akun, satu library/watchlist, satu sistem progress, satu pencarian dan satu design system:
- **Video** (katalog, halaman tonton, direktori cast dengan ranking "Popular Actress")
- **Anime** (series → season → episode, SUB/DUB, filler/recap, kalender tayang mingguan yang sadar timezone)
- **Komik** (series, daftar chapter, reader vertikal webtoon / paged RTL-LTR / spread 2 halaman)

Ditambah admin CMS. Tema gelap sebagai default, responsif dari ponsel sampai TV (D-pad).

**Pilihan arsitektur kunci**

| Area | Keputusan |
|---|---|
| Repo | pnpm + Turborepo monorepo di **`/home/errorgeist/LABs/p-project/tsukimi`**. Isi `tsukimi.my` saat ini menjadi `packages/ui`. |
| Frontend | React Router v7 framework mode (SSR), **microfrontend per route**: `apps/shell`, `apps/video`, `apps/anime`, `apps/comics`, `apps/admin` (CSR), lalu `apps/account` di P2. Shell dikomposisi saat build (`packages/shell`), tanpa Module Federation. |
| Styling | StyleX. Strategi kompilasi `packages/ui` diputuskan lewat **spike P0** (A: precompiled `ui.css`, B: source-transformed per app). Default `useCSSLayers: false` sampai batas bawah TV diketahui. |
| Backend | Node.js 24 + TypeScript, Moleculer. **Core NATS** sebagai transporter (RPC), **`@moleculer/channels` di atas NATS JetStream** untuk event durable. Transactional outbox + idempotency. |
| Kontrak API | REST `/api/v1/*`, skema **TypeBox** di `packages/contracts` → OpenAPI 3.1 → `openapi-typescript` + `openapi-fetch` di `packages/sdk`. |
| Auth | **Keycloak** sebagai IdP di belakang **BFF session**. Satu cookie opaque `__Host-tsk_sid` (session di Valkey) + `__Host-tsk_csrf`. Login MVP: email + Google. |
| Database | PostgreSQL 17 di CloudNativePG (3 instance, quorum sync) sebagai **satu-satunya write primary**. **Supabase** sebagai replika logical untuk DR, **mulai P2**. Backup Barman Cloud Plugin ke IDrive e2 (PITR 30 hari). |
| Storage | **IDrive e2 = system of record** (upload, master, backup). **Cloudflare R2 = salinan sekunder sekaligus origin penyajian** media publik, lewat Worker `media-edge` dengan fallback ke e2. |
| CDN | Cloudflare (minimal Pro). HTML publik di-cache anonim, media lewat Worker + token di path, imgproxy dengan format eksplisit di URL. |
| Platform | GKE Standard di `asia-southeast1`. Argo CD + Helm (GitOps), Envoy Gateway (Gateway API), KEDA, ESO + GCP Secret Manager, cert-manager, LGTM stack + Faro RUM. |

**Target MVP (akhir P1).** Private beta untuk ≤ 5.000 pengguna undangan. Mereka bisa login, menjelajah, menonton anime/video via HLS (1080/720/480/360), membaca komik, dan melanjutkan progress lintas perangkat. Editor bisa menjalankan seluruh katalog dari CMS. Ranking dihitung dari Postgres (ClickHouse baru di P2). DR Supabase di P2.

**Timeline (asumsi 3 dev).** P0 Foundation **6 minggu** → P1 MVP **14 minggu** (termasuk 1 minggu buffer) → **private beta ±minggu 21** → P2 Scale ±10 minggu → **public launch ±minggu 31**, dengan syarat keputusan lisensi konten sudah ada. Total P0+P1 ≈ **248 person-day**. Dengan 2 dev, tambahkan ±40%. Dengan 4 dev, kurangi ±20%.

**Tiga hal yang memblokir public launch (bukan engineering):** (1) sumber dan lisensi konten, (2) konfirmasi tertulis dari Cloudflare soal penyajian HLS dari R2 via Worker, (3) kewajiban PDPA/UU PDP (DPO, TIA, notice).

---

## 1. Status saat ini

### 1.1 Repo `/home/errorgeist/LABs/p-project/tsukimi.my`

Isinya **library komponen**, belum aplikasi. Belum ada backend.

| Aspek | Kondisi nyata |
|---|---|
| Nama paket | Sudah **`@tsukimi/ui`** (`package.json`), versi 0.1.0, private. |
| Git | **Belum** repositori git. Belum ada history yang perlu dipertahankan. |
| Stack | React 19, StyleX (`@stylexjs/unplugin` di Vite 8), Motion, Storybook 10, TypeScript. |
| `vite.config.ts` | `useCSSLayers: true`, `unstable_moduleResolution: { type: 'commonJS', rootDir: process.cwd() }`. **`rootDir` bergantung pada cwd**, dan inilah akar masalah hash. |
| Komponen (`src/components`) | AiringCalendar, AnimeCard, AppShell, Badge, BottomNav, Button, CastPolaroid, CastRosterCard, CategoryTile, ChapterList, Chip, ComicCard, ComicReader, EpisodeList, FilterDropdown, Icon, MediaFrame, NavTab, ProgressBar, SearchField, SectionHeader, Sidebar, StatPill, ThemeProvider, TopBar, VideoCard, VideoPlayer, VideoPoster |
| Lainnya | `src/tokens` (defineVars, createTheme dark/light/system, breakpoints via defineConsts), `src/device` (DeviceProvider, spatial nav TV), `src/motion`, `src/seo` (Seo, SeoOptimizer, builder JSON-LD termasuk TVSeries/TVEpisode/ComicSeries/ComicIssue), `src/pages` (10 komposisi halaman), `src/mocks`, `docs/*.md`, `scripts/capture-screenshots.cjs` |

**Sisa jejak "Lucy4" yang harus dibersihkan:** konstanta `SITE` di `src/seo/seo.ts` (`Lucy4 Stream`, `lucy4-stream.example`), storage key `lucy4-theme` di `ThemeProvider`, serta teks di docs dan stories.

**Temuan yang harus ditangani di P0**

| # | Temuan | Lokasi | Aksi |
|---|---|---|---|
| F1 | `headTagsToHtml()` menulis JSON-LD **tanpa escape `<`**. Ini membuka stored XSS kalau judul dari CMS berisi `</script>`. | `src/seo/seo.ts` (±baris 332) | Escape `<`, U+2028, U+2029 seperti `Seo.tsx`, plus unit test. |
| F2 | Nama atribut meta/link diinterpolasi tanpa escape. | `src/seo/seo.ts` (±328–330) | Allow-list nama property/rel. |
| F3 | `VideoPlayer` memakai `<source>` MP4 per kualitas dan SUB/DUB dengan swap `sources`. | `VideoPlayer.tsx` | Adapter hls.js dengan audio group (§4.8). |
| F4 | Mock berisi **nama orang sungguhan** bercampur nama fiktif. | `src/mocks/data.ts` (±54) | Ganti dengan nama fiktif **sebelum** fixtures/seed dibuat, plus cek grep allowlist di CI. |
| F5 | `ThemeProvider` membaca `localStorage` saat init, dan `DeviceProvider` default lebar 1440 di server. | `ThemeProvider.tsx`, `device.tsx` | Hydration-safe (§4.6). |
| F6 | Nav (`TopBar`/`Sidebar`/`BottomNav`) memakai `onNavigate(id)` tanpa `href`. | komponen nav | Tambah `href` + `LinkProvider`. |

**Gotcha StyleX yang sudah terbukti.** Hash var/class bergantung pada nama paket + path file + opsi plugin. Rename sebelumnya merusak CSS dev sampai cache dibersihkan. Konsekuensinya, `packages/ui` harus dikompilasi **konsisten** di semua app (§4.4).

### 1.2 Referensi Figma

File "Web Stream — UI Reference" memakai token desain yang sama. Akunnya Starter plan, dan MCP-nya rate-limited, jadi Figma berfungsi sebagai **referensi visual**. Sumber kebenaran token tetap `packages/ui/src/tokens`. Figma Code Connect baru dipertimbangkan di P3.

### 1.3 Lokasi aplikasi (permintaan "aplikasi pindah ke sini")

Rekomendasi: **root monorepo baru di `/home/errorgeist/LABs/p-project/tsukimi`**. Isi `tsukimi.my` dipindahkan ke `packages/ui`. Langkahnya:
1. `git init` + commit awal tree `tsukimi.my` apa adanya (snapshot).
2. Buat root `tsukimi/`, lalu `git mv` isi ke `packages/ui`. Alternatifnya, inisialisasi git di root baru lalu salin, dengan commit pertama berisi snapshot.
3. Ubah `rootDir` StyleX dari `process.cwd()` ke **root repo** lewat `tooling/stylex-config`.
4. Hapus sisa string Lucy4.

Dokumen `PLAN.md` ini ikut pindah ke `tsukimi/docs/PLAN.md`. Alternatif yang juga sah: jadikan `tsukimi.my` sendiri sebagai root monorepo. Pilihan final ada di pertanyaan terbuka #9.

---

## 2. Lingkup produk, persona & MVP

### 2.1 Definisi produk

| Vertikal | Hierarki | Aksi utama | UI yang sudah ada |
|---|---|---|---|
| Video + cast | Title → (Series → Episode) → Asset | Tonton | VideoPoster, VideoCard, CastPolaroid, CastRosterCard, CategoryTile, VideoPlayer; HomePage, VideoLibraryPage, CastDirectoryPage, CategoriesPage |
| Anime | Series → Season → Episode (SUB/DUB, filler/recap) + slot tayang | Tonton, ikuti jadwal | AnimeCard, EpisodeList, AiringCalendar; AnimePage, AnimeDetailPage, WatchPage |
| Komik | Series → Chapter → Page | Baca | ComicCard, ChapterList, ComicReader; ComicsPage, ComicDetailPage, ComicReaderPage |
| Lintas vertikal | Akun, Library, Progress, Search, Genre | Temukan, lanjutkan | AppShell, TopBar, Sidebar, BottomNav, SearchField, FilterDropdown, Chip, NavTab, ProgressBar, StatPill, ThemeProvider, DeviceProvider, `src/seo/*` |

**Asumsi**
- **A1 Positioning:** cepat dan bebas iklan di MVP, dengan standar "resume satu tap" dan "playback mulai < 2 s". Model bisnis belum ditentukan, tetapi field `access`/entitlement disiapkan karena ChapterList sudah menampilkan badge VIP.
- **A2 Konten:** hanya konten yang haknya dimiliki (milik sendiri, partner, atau berlisensi). Tidak ada scraper atau embed pihak ketiga. Setiap title wajib punya rights record. Ini **gerbang public launch**, bukan gerbang engineering.
- **A3:** target metrik pasca-launch adalah placeholder dan dikalibrasi ulang setelah 4 minggu beta.
- **A4:** 3 dev + 0,5 desainer + 0,5 SRE (bisa salah satu dari 3 dev).
- **A5:** pasar utama **Indonesia + Malaysia** (domain .my). Locale UI `id` (default) + `en`, timezone default `Asia/Jakarta`.
- **A6:** katalog beta ±50 seri anime, ±300 video, ±200 seri komik. Angka di mock (12.480 video, dan seterusnya) hanya placeholder.
- **A7:** **tidak ada konten dewasa.** Vertikal "actress" diperlakukan sebagai konten umum/mature ≤ 18 (§9.6).

### 2.2 Persona

| Persona | Siapa | Pekerjaan utama | Perangkat |
|---|---|---|---|
| **Viewer** ("Raka", 24, Jakarta) | Penonton anime/video malam hari | Lihat yang baru malam ini, lanjutkan tontonan, ganti SUB/DUB, skip intro, ikuti seri dalam WIB | Ponsel 60%, laptop 30%, TV 10% |
| **Reader** ("Sari", 21) | Pembaca manhwa harian | Notifikasi chapter baru, lanjut di halaman yang tepat, scroll vertikal mulus | Ponsel 80%, tablet 20% |
| **Editor/Admin** (internal 1–5 orang) | Kurator katalog | Upload episode 1,5 GB, bulk-upload 60 halaman chapter, set jam tayang JST, featured Home, takedown | Desktop |
| **Partner** (P2) | Studio/penerbit berkontrak | Upload ke title miliknya saja, lihat status proses dan statistik | Desktop |
| **Moderator** (sekunder) | Laporan, takedown, akun | Takedown < 15 menit, suspend akun | Desktop |

### 2.3 Inventaris fitur viewer/reader

Legenda: **Ada** = komponen/halaman sudah ada dengan mock. **Gap** = UI belum ada.

| # | Fitur | UI | Fase |
|---|---|---|---|
| F1 | App shell, tema dark/light/system | Ada | P1 |
| F2 | Home: hero, Popular Actress, Trending, Kategori, rilis baru | Ada | P1 (ranking dari Postgres) |
| F3 | Library video dengan filter/sort | Ada | P1 |
| F4 | Kategori/genre dengan ranking per kategori | Ada | P1 |
| F5 | Direktori cast + ranking mingguan | Ada | P1 |
| F6 | **Profil cast** (bio, filmografi, Person JSON-LD) | Gap | P1 |
| F7 | **Detail + watch video non-anime** | Sebagian | P1 |
| F8 | Player: kualitas, speed, WebVTT, SUB/DUB, skip intro/outro, marker, autoplay-next, PiP, keyboard | Ada (MP4) | P1 (hls.js) |
| F9–F11 | Anime browser, detail season/episode, kalender tayang timezone-aware | Ada | P1 |
| F12–F14 | Komik browse, detail + chapter list, reader | Ada | P1 (VIP gating P3) |
| F15 | **Global search** | Sebagian | P1 |
| F16 | **Auth** (email + Google) | Gap | P1 |
| F17 | **Continue Watching/Reading** | Gap | P1 |
| F18 | **Library/Watchlist/Follow** | Gap | P1 |
| F19 | **Settings** (tema, default SUB/DUB, bahasa subtitle, mode reader, timezone) | Gap | P1 |
| F20 | Riwayat | Gap | P2 |
| F21 | Notifikasi | Gap (ikon saja) | **P2 in-app**, P3 web push/email |
| F22 | Input rating | Sebagian | P2 |
| F23 | Komentar | Gap | P3 |
| F24 | Rekomendasi | Statis | P1 statis → P3 personal |
| F25 | TV 10-foot UI | Ada (device layer) | P1 "berfungsi", P2 polish |
| F26 | i18n UI | Gap | **P1 infra + id/en**, P2 translation pass penuh + `ms` untuk halaman legal |
| F27 | VIP/premium/payments | Gap | P3 (perlu keputusan) |
| F28 | PWA/offline | Gap | P3 |
| F29 | Stat pill TopBar dengan data nyata | Statis | P2 |

### 2.4 Admin CMS (`apps/admin`)

**Keputusan:** satu app, **`apps/admin`**, disajikan di **`admin.tsukimi.my`**. Client-rendered, `noindex`. Staf masuk lewat **Cloudflare Access + Keycloak client `tsukimi-admin`**, dan API-nya `admin.tsukimi.my/api/admin/v1` (deployment `api-admin`). Partner (P2) memakai app yang sama di `partner.tsukimi.my` dengan **Keycloak saja**, tanpa Cloudflare Access. Alasannya, Access ditujukan untuk staf (free tier ±50 user [VERIFIKASI]).

| # | Modul | Fase |
|---|---|---|
| A1 | Titles (video, anime series, comic series): CRUD, slug, sinopsis id/en, genre/tag, **status** (draft → scheduled → published → unlisted → taken_down), cover dengan focal point, studio/penerbit, rating usia, **blok hak** (licensor, teritori, window) | P1 |
| A2 | Season/episode anime: flag filler/recap/premiere/finale, asset per varian audio, intro/outro, marker, subtitle per bahasa | P1 |
| A3 | Upload video: presigned multipart resumable, status job, picker thumbnail, ganti asset tanpa ganti ID | P1 |
| A4 | Chapter komik: bulk upload folder/ZIP/CBZ, natural sort, reorder, deteksi strip panjang, mode baca default per seri | P1 |
| A5 | Jadwal tayang: aturan berulang (mis. "Sab 23:30 JST, 12 ep"), override slot, simpan UTC + TZ sumber, auto-publish | P1 |
| A6 | Profil cast: CRUD, alias, foto berlisensi, link ke title, merge duplikat | P1 |
| A7 | Kurasi Home | P1 minimal (hero + 1 row) → P2 penuh |
| A8 | Taksonomi | P1 |
| A9 | Tools SEO (override meta, audit SeoOptimizer) | P2 |
| A10 | User & role (Keycloak) + **audit log** | P1 audit log + 4 role, P2 UI moderasi |
| A11 | Laporan & takedown | P1 tombol takedown (§9.5), P2 antrean laporan |
| A12 | Portal partner | P2 |
| A13 | Dashboard analitik | P2 (Grafana/ClickHouse) |
| A14 | Bulk import CSV/JSON | P2 |

**Workflow konten (keputusan resolusi fase):**
- **P1:** field status per entity (`draft → scheduled → published → unlisted → taken_down`), CronJob publish terjadwal, **audit-log mixin** (dalam transaksi yang sama, role insert-only) dan histori `content_revision`. Semuanya hidup di service catalog/anime/comics, **tanpa service `v1.cms` terpisah**.
- **P2:** state `in_review`/`approved` dengan aturan **four-eyes**, yang baru diperlukan setelah ada partner atau lebih dari 2 editor. Ditambah tabel drafts dan bulk import, lewat service `cms` yang ruang lingkupnya sempit.

### 2.5 Definisi MVP (akhir P1)

**Tujuan:** private beta ≤ 5.000 pengguna undangan.

**MASUK MVP**
- Semua halaman "Ada" tersambung ke API nyata, ditambah F6, F7, F15–F19.
- HLS 1080/720/480/360 via hls.js, subtitle id/en, SUB/DUB sebagai audio group, progress server-side (resume di perangkat lain ≤ 10 s).
- Reader dengan halaman imgproxy (WebP default, AVIF opt-in) dan progress per halaman.
- Kalender tayang dari jadwal nyata, dengan auto-publish.
- SSR + `<Seo>` + JSON-LD di setiap halaman publik, sitemap, robots, canonical.
- CMS A1–A6, A8, A10, A7 minimal, takedown dengan purge.
- **Ranking/trending dari Postgres** (CronJob malam hari + pinning editorial).
- Locale `id` (default) + `en`.
- Rating usia + gate dasar.
- Dark default, responsif ponsel/tablet/laptop. TV "berfungsi" (D-pad menjangkau semua elemen).

**KELUAR dari MVP:** pembayaran/VIP, iklan, komentar, input rating, rekomendasi personal, notifikasi, portal partner, DRM, app native, PWA offline, multi-profil, download, Supabase DR, ClickHouse, TV polish, login TV device-code, locale `ms`/`ja`.

**Exit criteria MVP (gerbang menuju P2/launch)**
1. Walkthrough setiap journey (§2.6) lulus di Chrome Android, Safari iOS, Chrome/Firefox desktop, dan 1 browser Android TV/Tizen.
2. p75 LCP < 2,5 s, INP < 200 ms, CLS < 0,1 pada Home, detail anime, Watch, Reader (RUM Faro, perangkat kelas Moto G di 4G).
3. Video start time p75 < 2,0 s, rebuffer < 1%, reader next-page p75 < 300 ms.
4. **Upload-complete → playable p90 ≤ 45 menit** untuk episode 1080p 24 menit. Target di-relax dari 30 menit karena transcode masih satu job. Paralelisme per-rung ditinjau di P2.
5. Restore PITR manual berhasil satu kali dan terdokumentasi.
6. Takedown: playback gagal ≤ 2 menit setelah eksekusi (§9.5).
7. Keputusan lisensi konten tercatat. Ini gerbang public launch saja.

### 2.6 Journey inti

- **J1 Discover → Watch (anime):** Home → "Tayang musim ini" → detail (tab season, sembunyikan filler) → Watch (auto-resume, Skip Intro, SUB/DUB) → countdown autoplay-next. *Event:* `impression`, `title_open`, `play_request`, `first_frame_ms`, `progress` (buffered), `complete` (≥ 90%), `next_auto`.
- **J2 Kembali:** Continue Watching di Home, kalender "Followed only" di timezone pengguna. Badge episode baru muncul di P2.
- **J3 Discover → Read:** "Chapter baru hari ini" → detail ("Lanjut Ch. 37 · hlm 14") → reader vertikal → progress (debounce 3 s + saat keluar) → End-of-Chapter → prefetch 3 halaman pertama chapter berikutnya pada 80% scroll.
- **J4 Cast:** Popular actress → profil cast → filmografi → tonton.
- **J5 Search:** typeahead ≤ 100 ms p95, dikelompokkan per vertikal.
- **J6 Editor publish episode:** CMS → seri → season → episode baru → drag master → job card transcode → set intro/outro → lampirkan .vtt id/en → *Scheduled* pada slot Sab 23:30 JST → CronJob publish.
- **J7 Editor upload chapter:** drop ZIP/CBZ → urut, preview, reorder → publish/jadwalkan.
- **J8 Partner (P2):** upload ke draft → review → live → statistik.

### 2.7 Metrik sukses

| Area | Metrik | Target beta | 6 bulan pasca-launch (placeholder) |
|---|---|---|---|
| Reach | DAU/MAU | ≥ 20% | ≥ 25% |
| Video | Watch time/DAU; completion | ≥ 35 min; ≥ 55% | ≥ 45 min; ≥ 60% |
| Komik | Halaman/reader-DAU; completion chapter | ≥ 60; ≥ 70% | ≥ 80; ≥ 75% |
| Retensi | D1/D7/D30 | 35/18/8% | 40/22/12% |
| Loop | CTR Continue row; follow rate | ≥ 30%; ≥ 25% | ≥ 35%; ≥ 35% |
| Search | Sesi search → buka title ≤ 60 s | ≥ 60% | ≥ 70% |
| CWV (RUM p75) | LCP/INP/CLS | < 2,5 s / < 200 ms / < 0,1 | ≥ 90% URL "Good" |
| QoE | Start time p75, rebuffer, gagal playback | < 2,0 s, < 1%, < 0,5% | < 1,5 s, < 0,5%, < 0,3% |
| Reliabilitas | Availability API tonton/baca | 99,5% | 99,9% |
| Ops | Upload→live p90; takedown | **≤ 45 min**; ≤ 15 min | ≤ 20 min (setelah transcode paralel); ≤ 10 min |
| SEO | Sitemap tersubmit; share organik | 100% | ≥ 30% |

### 2.8 Analitik & event (subbagian lintas-seksi)

- **Taksonomi event** mengikuti instrumentasi J1–J7: `impression`, `title_open`, `play_request`, `first_frame`, `progress`, `complete`, `read_page`, `chapter_complete`, `search`, `search_result_click`.
- **P1:** Grafana Faro (web-vitals + QoE hls.js) di `packages/shell` → Alloy → Loki/Tempo. Event produk minimal dicatat sebagai log terstruktur.
- **P2:** `analytics-ingest` (beacon → stream `TSK_TELEMETRY` → ClickHouse), ekspor RUM ke ClickHouse, trending/ranking hourly.
- **Consent gating:** event non-esensial hanya dikirim jika cookie consent analytics = ya (§9.7).

---

## 3. Arsitektur sistem

### 3.1 Diagram keseluruhan

```
                                   Pengguna (ponsel / tablet / laptop / TV)
                                                   │ HTTPS
┌──────────────────────────────────── Cloudflare (Pro+) ──────────────────────────────────────────┐
│ WAF + Super Bot Fight Mode + rate limit · Cache Rules · LB (pool prod-gke → fallback "degraded")│
│                                                                                                  │
│  tsukimi.my ──────────────► (HTML/API ke origin)     assets.tsukimi.my ──► R2 tsukimi-assets     │
│  admin.tsukimi.my (Access) ► (origin)                media.tsukimi.my  ──► Worker media-edge     │
│  img.tsukimi.my ──────────► imgproxy (origin)                               │  KV revocation     │
│                                                                             ├─► R2 tsukimi-media │
│                                                                             └─► IDrive e2 (fallback)
└───────────────────────────────┬─────────────────────────────────────────────────────────────────┘
                                │ Authenticated Origin Pulls, Full (strict)
┌───────────────────────────────▼──────────── GKE asia-southeast1 ────────────────────────────────┐
│ ns tsk-edge:  Envoy Gateway "public" ── HTTPRoutes (digenerate dari nav-manifest) · imgproxy      │
│                                                                                                  │
│ ns tsk-web (SSR RR7, Node 24):  web-shell  web-video  web-anime  web-comics  web-admin(static)    │
│      │  SSR loader → API internal (JWT servis 5 menit dari session)                               │
│ ns tsk-svc (Moleculer, moleculer-runner):                                                         │
│   api-public (/api/v1)  api-admin (/api/admin/v1)  session  catalog[catalog+anime+comics+rights]  │
│   media  progress  search-seo-worker  outbox-relay(+DLQ)   CronJobs (publish, airing, ranking,   │
│                                                            rights-sweep, reconcile)              │
│      ▲ RPC: core NATS          ▲ event durable: @moleculer/channels ⇄ JetStream                   │
│ ns tsk-media: KEDA ScaledJob media-validate · media-transcode · comic-process · image-process     │
│ ns tsk-data:  CNPG tsukimi-pg (3 inst, quorum sync) + Pooler rw/ro · NATS JetStream R3 ·          │
│               valkey-cache · valkey-state (Sentinel) · Meilisearch · Keycloak (+ DB "keycloak")   │
│               [P2] ClickHouse                                                                     │
└──────┬────────────────────────────┬──────────────────────────────────────┬──────────────────────┘
       │ WAL + base (Barman plugin) │ logical replication [P2]             │ S3 API
       ▼                            ▼                                      ▼
  IDrive e2 tsukimi-backups    Supabase PG17 (ap-southeast-1)       IDrive e2 (uploads-staging,
  (+ salinan rclone crypt di R2) read-only sampai failover           originals, media) ──event──► R2
```

### 3.2 Alur data: upload → transcode → CDN

```
apps/admin (Uppy)                         api-admin / media service
 1. POST uploads.init (Idempotency-Key) ─► buat media.assets + uploads, CreateMultipartUpload (e2 staging)
 2. PUT part via presigned URL (64 MiB, 4 paralel) ─────────────────────────────► IDrive e2 tsukimi-uploads-staging
 3. POST uploads.complete ─► CompleteMultipartUpload + outbox "tsk.media.upload.completed.v1" (1 transaksi)
                                    │ outbox-relay (Nats-Msg-Id = outbox.id)
                                    ▼
                         JetStream TSK_JOBS / TSK_DOMAIN
       consumer media-validate ──► ScaledJob (ffprobe, decode head/tail, ClamAV utk arsip/gambar)
            ok  ─► copy staging → originals ─► outbox "tsk.media.transcode.requested.v1"
            gagal ─► "tsk.media.upload.rejected.v1" (alasan tampil di CMS)
       consumer media-transcode ─► ScaledJob (KEDA, 1 job/pesan, msg.working() tiap 30 s)
            FFmpeg → v/{id}/{rv}/ (CMAF HLS 4 rung + audio group + subs + poster + sprites)
            manifest.json DITULIS TERAKHIR ─► update media.assets=ready + media.objects
            ─► outbox "tsk.media.asset.ready.v1" + "tsk.storage.object.written.v1" (per objek)
       consumer storage-replicator ─► HEAD R2 → stream GET e2 → PUT R2 (verifikasi sha256)
                                       → media.objects.secondary_ok = true
       consumer catalog (asset.ready) ─► lampirkan playback ke episode/video → status bisa "published"
Penonton:
  POST /api/v1/playback/{type}/{id} ─► rights.isAvailable + token HMAC (path) ─► URL master
  hls.js ─► media.tsukimi.my/t/{token}/v/{id}/{rv}/master.m3u8
           Worker: verifikasi token → cek KV revocation → cache (key tanpa token) → R2 → (miss/5xx/3 s) e2
```

### 3.3 Alur data: penulisan progress

```
Player: onProgress (throttle 15 s + pause/seek/ended/visibilitychange via sendBeacon)
Reader: onPageChange (debounce 3 s + keluar chapter)
   │ PUT /api/v1/me/progress/{itemType}/{itemId} {position,total,clientTs,seq}  (cookie session)
   ▼
api-public → progress.save ─► Lua di valkey-state: LWW per field (clientTs), HSET pb:{uid}, ZADD NX pb:dirty
   │ 202 (±2 ms)
   ▼
Flusher (tiap 5 s di setiap replika progress):
   klaim ≤ 500 user dari pb:dirty (Lua ZRANGEBYSCORE+ZREM) → HGETALL →
   1 transaksi Postgres (Pooler rw): UPSERT item_progress … WHERE excluded.client_ts > client_ts,
                                     UPSERT series_progress, outbox "tsk.library.item.completed.v1"
                                     HANYA saat completed berubah menjadi true
   → compare-and-delete field yang sudah di-flush; gagal → re-ZADD (data tidak hilang ≤ TTL 1 jam)
Baca: progress.get/continue = Postgres + overlay pb:{uid} (read-your-writes)
Sync multi-perangkat: GET /api/v1/me/progress/sync?cursor=<seq>
```

---

## 4. Frontend

### 4.1 Prinsip

1. **Komposisi saat build, independen saat runtime.** Shell (`packages/shell`) adalah dependency biasa di setiap app. Tidak ada runtime host, Module Federation, atau iframe.
2. **Satu pemilik per prefix URL.** Navigasi di dalam app memakai soft nav React Router. Navigasi lintas app memakai full document load yang diperhalus dengan Speculation Rules dan cross-document View Transitions.
3. **Satu identitas StyleX:** satu versi, satu config, nama paket `@tsukimi/ui` dan path token yang dibekukan.
4. **HTML publik sama untuk semua orang**, sehingga bisa di-cache. Data personal dimuat di sisi klien dari `/api/v1/me/*`.
5. **`@tsukimi/ui` tetap agnostik router dan data.** Link disuntikkan lewat context.

### 4.2 Struktur monorepo

```
tsukimi/                                   # /home/errorgeist/LABs/p-project/tsukimi
├─ pnpm-workspace.yaml   (catalog: satu versi react, @stylexjs/*, motion, react-router, tanstack, hls.js)
├─ turbo.json            (globalDependencies: tooling/stylex/**, pnpm-lock.yaml)
├─ package.json          (packageManager pnpm@10, engines node 24)   .nvmrc = 24
├─ docker-compose.yml    (dev lokal: postgres17, valkey x2, nats-js, minio, meilisearch, keycloak, mailpit)
├─ docs/                 (PLAN.md, ADR/, runbooks/, docs lama dari tsukimi.my)
├─ tooling/
│  ├─ tsconfig/  eslint/  stylex-config/  vite-preset/  visual/  gen-routes/  codemods/
├─ packages/
│  ├─ ui/          @tsukimi/ui        ← isi tsukimi.my sekarang (components, tokens, device, motion, seo, link)
│  ├─ shell/       @tsukimi/shell     AppFrame, nav-manifest.ts, AppLink, theme script, Faro RUM, 404/error
│  ├─ sdk/         @tsukimi/sdk       client openapi-fetch, queryOptions, getSession/requireSession, imgproxy helper
│  ├─ i18n/        @tsukimi/i18n      Lingui config + katalog bersama
│  ├─ fixtures/    @tsukimi/fixtures  mock (nama fiktif) + MSW handlers
│  ├─ contracts/   @tsukimi/contracts TypeBox → OpenAPI 3.1 + skema payload event
│  ├─ db/          @tsukimi/db        Kysely, kysely-codegen, migrations/, runner dual-target
│  ├─ broker-kit/  @tsukimi/broker-kit moleculer.config, mixins (db, outbox, channels, idempotent, audit, authz), errors
│  └─ otel/        @tsukimi/otel      middleware Moleculer OTLP, instrumentasi SSR
├─ apps/
│  ├─ shell/    /  /search  /auth/*  /profile /settings /watchlist (MVP)  /legal/*  /sitemap.xml  /robots.txt
│  ├─ video/    /videos  /watch  /cast  /categories
│  ├─ anime/    /anime  (/anime/schedule, /anime/:slug, /anime/:slug/:ep)
│  ├─ comics/   /comics  /read
│  ├─ admin/    admin.tsukimi.my (CSR, noindex)
│  └─ account/  [P2] /profile /settings /watchlist /history  (dipisah dari shell bila perlu)
├─ services/   api  session  catalog  media  progress  search-seo  outbox-relay   [P2+] ranking analytics-ingest notifications cms entitlements
├─ workers/    media-edge (Cloudflare Worker)
├─ jobs/       media-validate  media-transcode  comic-process  image-process
├─ charts/     tsukimi-lib  web-app  moleculer-service  media-job
├─ infra/terraform/  gcp-project  gke-staging  gke-prod  artifact-registry  cloudflare  dns
└─ loadtest/   skenario k6
```

**Refinement yang ditandai:** halaman akun `/profile`, `/settings`, dan `/watchlist` ada di `apps/shell` selama MVP untuk mengurangi satu deployable. `apps/account` dipisah di P2, sesuai split yang disepakati.

### 4.3 Migrasi `tsukimi.my` → `packages/ui`

| Sekarang | Tujuan | Catatan |
|---|---|---|
| `src/components/*` | `packages/ui/src/components/*` | Stories tetap co-located |
| `src/tokens/*.stylex.ts`, `themes.ts` | `packages/ui/src/tokens/` (**path dibekukan**) | Path token adalah API |
| `src/device`, `src/motion` | `packages/ui/src/...` | Device: prop `initial`. Motion: `LazyMotion` + `domAnimation` |
| `src/seo/*` | `packages/ui/src/seo` + entry server-safe `@tsukimi/ui/seo` | `configureSeo()` menggantikan `SITE`. Fix F1/F2 |
| `src/pages/pages.tsx` | Dipecah ke route module per app. Komposisi visual tetap sebagai `Pages.stories.tsx` | |
| `src/mocks`, `public/sample` | `packages/fixtures` | **Setelah** nama orang sungguhan diganti (F4) |
| `.storybook/preview-head.html` (Google Fonts) | Font self-hosted subset woff2 | Noto Sans JP via `unicode-range` |
| `scripts/capture-screenshots.cjs` | `tooling/visual` (Playwright `toHaveScreenshot`) | |

### 4.4 Strategi StyleX (diputuskan oleh spike P0)

**Akar masalah.** Nama variabel `defineVars`/`createTheme` dan hash `create` diturunkan dari identitas file (nama `package.json` + path relatif + opsi + versi StyleX). Config sekarang memakai `rootDir: process.cwd()`. Fact-check 5b menyatakan **tidak ada panduan resmi** untuk library yang di-precompile.

**Opsi yang dibandingkan di spike P0:**

| | **A. Precompiled** (preferensi sementara) | **B. Source-transformed** (fallback) |
|---|---|---|
| Cara | `packages/ui` dibangun sekali menjadi `dist/index.js` + `ui.<hash>.css` + `manifest.json` (peta token → var). File token diekspor **sebagai source** pada path yang sama, sehingga kode app yang memakai `colors.*` menghasilkan var yang sama. | `packages/ui` dikirim sebagai source TS/StyleX. Setiap app mentransformasinya lewat `@tsukimi/vite-preset` (`externalPackages`/workspace include) dengan `unstable_moduleResolution.rootDir` = root repo yang identik. |
| Plus | `ui.css` di-cache sekali untuk semua app, dan build app tidak sensitif terhadap internal UI | Mengikuti pola yang paling dekat dengan dokumentasi resmi |
| Minus | Tidak ada contoh resmi. Dev memakai `dist` (`vite build --watch`) | Setiap app mengirim salinan atom UI sendiri |

**Acceptance spike (keduanya):** SSR tanpa FOUC, HMR jalan dengan `devPersistToDisk`, nama var token identik di dua app, **dan output tampil benar di build Chromium 76/87**.

**Opsi bersama (`tooling/stylex-config`):**
```ts
export const stylexOptions = ({ app }: { app: string }) => ({
  useCSSLayers: false,                 // @layer tidak didukung < Chromium 99 → TV bisa tampil tanpa style
  classNamePrefix: 'tk',
  dev: process.env.NODE_ENV !== 'production',
  unstable_moduleResolution: { type: 'commonJS', rootDir: REPO_ROOT },   // BUKAN process.cwd()
});
```
`useCSSLayers` baru boleh dinyalakan kalau pemilik produk menetapkan batas bawah TV ≥ Chromium 99 (pertanyaan #4). Hanya ada **satu `build.target`** di `@tsukimi/vite-preset`, dan nilainya ditentukan dari jawaban itu (default `chrome76` jika Tizen/webOS 2019+ didukung).

**Guard rail CI (agnostik strategi):** job `ui-guard` memastikan setiap var `--tk-*` yang dirujuk build app ada di manifest token. Ditambah: `@stylexjs/*` hanya boleh resolve ke satu versi (`pnpm why`), dan `tooling/stylex/**` adalah global dependency Turbo.

### 4.5 App React Router v7

- Setiap app: `react-router.config.ts` (`ssr: true`, `future.v8_middleware`), `routes.ts` eksplisit, `entry.server.tsx` (streaming, CSP nonce, span OTel), `server.ts` (Hono/Express + `/healthz` `/readyz`).
- `vite.config.ts` identik antar app kecuali nama app. `base = https://assets.tsukimi.my/<app>/` di prod.
- `root.tsx` me-link `ui.css` (URL sama untuk semua app) + CSS app + preload font.
- `AppFrame` = ThemeProvider → DeviceProvider → I18nProvider → QueryClientProvider → LinkProvider → AppShell.
- **Navigasi lintas app:** `AppLink` membaca `nav-manifest.ts`. App yang sama memakai RR `<Link prefetch="intent">`, app lain memakai `<a data-xapp>` + Speculation Rules (`prefetch` moderate, `prerender` hanya untuk 5 destinasi TopBar) + `@view-transition`. Konsekuensi yang diterima: mini-player tidak bertahan saat pindah app (pertanyaan #15).

### 4.6 Data layer, tema, perangkat

- **SDK:** `packages/sdk` digenerate dari `/api/v1/openapi.json` (`openapi-typescript` + `openapi-fetch`). Spec di-commit dan CI gagal jika ada drift (`git diff --exit-code`).
- **TanStack Query:** `QueryClient` **per request** di middleware. Loader memanggil `ensureQueryData` → `dehydrate` → `HydrationBoundary`. Data di bawah fold di-stream lewat `<Suspense>`.
- **Base URL:** di server `http://api-public.tsk-svc.svc:3000/api/v1`, di browser `/api/v1` (same origin).
- **Zustand** hanya untuk preferensi player/reader dan toggle UI (`persist` ke localStorage).
- **Tema:** HTML dikirim dengan `data-theme="system"`. Skrip inline (nonce) membaca cookie `tk_theme`/localStorage sebelum paint, dengan default **dark**. Key `lucy4-theme` dimigrasi sekali ke `tk_theme`.
- **Perangkat:** hint dari Client Hints (`Sec-CH-UA-Mobile`, `Sec-CH-Viewport-Width`), regex UA TV, atau cookie `tk_dev` → `DeviceProvider initial`. **Kelas perangkat kasar `m|d|tv` masuk cache key Cloudflare** (Transform Rule).

### 4.7 Auth di frontend (kanonik, lihat §9.1)

- `apps/shell` memiliki `/auth/login`, `/auth/callback`, dan `/auth/logout`. Ketiganya memanggil service `session` (OIDC code + PKCE ke Keycloak).
- Cookie: `__Host-tsk_sid` (opaque, HttpOnly, Secure, SameSite=Lax, 30 hari sliding) dan `__Host-tsk_csrf` (dibaca JS, double-submit).
- Middleware SSR **hanya di route personal** (`/profile`, `/settings`, `/watchlist`, `/history`, `/auth/*`) memanggil `getSession()` dari `@tsukimi/sdk`, lalu memanggil API dengan **JWT internal 5 menit**. **Tidak ada `tk_at`/`tk_rt`**, dan token tidak pernah sampai ke JavaScript.

### 4.8 Caching HTML (kanonik)

| Respons | Cache-Control | Cache key Cloudflare |
|---|---|---|
| Halaman publik (katalog, detail, cast, anime, komik, chapter list) | `public, s-maxage=60, stale-while-revalidate=300` + `Cache-Tag: work:<id>,list:<kind>` | URL + locale (dari path) + kelas perangkat `m\|d\|tv`. **Cookie diabaikan**. |
| `/watch*`, `/read*` | `public, s-maxage=30` (URL media bertanda tangan diambil di klien) | sama |
| `/profile`, `/settings`, `/watchlist`, `/history`, `/auth/*` | `private, no-store` | bypass |

**Aturan keras:** loader route publik **tidak boleh membaca session**. Test CI memastikan route publik tidak mengeluarkan `Set-Cookie` maupun identifier pengguna di HTML.

### 4.9 Video player & reader

- **hls.js** dipakai jika `Hls.isSupported()` (termasuk iOS 17.1+ via ManagedMediaSource). Selain itu fallback ke `<video>` native (Safari lama). Pergantian audio (SUB/DUB) memakai `hls.audioTrack`, subtitle memakai `hls.subtitleTrack`/track native. Sidecar `.vtt` tetap tersedia.
- hls.js di-lazy-load setelah first paint (≈ +60 KB gz). Shaka Player hanya untuk title `drm_required` (P3).
- Reader: placeholder dari `{w,h}` per halaman (tanpa CLS), virtualizer di-lazy-load, prefetch chapter berikutnya.

### 4.10 SEO

- Setiap route merender `<Seo>`. Meta dibangun di loader dengan `@tsukimi/ui/seo` (TVSeries/TVEpisode, ComicSeries/ComicIssue, VideoObject, Person, BreadcrumbList, WebSite + SearchAction).
- `configureSeo({ name: 'Tsukimi', url: 'https://tsukimi.my', titleTemplate: '%s | Tsukimi' })`.
- **hreflang:** `id` (unprefixed), `en` (`/en/...`), `x-default` → `id`. **`ja` tidak dipakai** sampai ada konten berbahasa Jepang.
- **Sitemap (satu generator):** resource route per app (`/anime/sitemap-{n}.xml`, dan seterusnya) membaca endpoint `v1.seo` `sitemap-entries` (sudah difilter teritori dan status), dengan `s-maxage=3600`. Index ada di `apps/shell /sitemap.xml`. Maksimal 45.000 URL per file.
- `robots.txt` men-disallow `/api`, `/read/*/page`, dan route personal. Halaman thin, search, dan filter multi-facet diberi `noindex`.
- Audit `SeoOptimizer` di CI (crawl Playwright 50 URL, skor ≥ 80).

### 4.11 i18n

Lingui v5 dengan katalog per paket. Locale P1 adalah **`id` (default, tanpa prefix) + `en` (`/en`)**. `ms` minimal untuk halaman legal sebelum public launch. Tanggal memakai `Intl.DateTimeFormat` dengan IANA timezone (cookie `tk_tz`, fallback `Asia/Jakarta`). Konten (judul, sinopsis) dilokalisasi lewat API.

### 4.12 Perangkat, TV & budget performa

| Tier | Referensi | LCP | INP | JS awal/route (gz) | CSS (gz) |
|---|---|---|---|---|---|
| Mobile | Moto G Power, 4G | ≤ 2,5 s | ≤ 200 ms | ≤ 170 KB | ≤ 50 KB |
| Tablet | iPad 9 | ≤ 2,2 s | ≤ 200 ms | ≤ 190 KB | ≤ 50 KB |
| Desktop | kabel | ≤ 1,8 s | ≤ 100 ms | ≤ 220 KB | ≤ 55 KB |
| TV | Tizen/webOS (Chromium 76–87 [VERIFIKASI batas bawah]) | ≤ 3,0 s | ≤ 250 ms (key → fokus) | ≤ 140 KB | ≤ 50 KB |

Di TV: `reducedMotion="always"`, tanpa blur/backdrop-filter, rail divirtualisasi (≤ 30 kartu fokus). Semua fitur modern (View Transitions, Speculation Rules) hanya progressive enhancement.

**Penegakan:** **P1** memakai `size-limit` per chunk route (gagal di +5%) + RUM Faro. **P2** menambahkan Lighthouse CI dan ekspor RUM ke ClickHouse.

### 4.13 Testing

| Lapisan | Tool | Kapan |
|---|---|---|
| Unit | Vitest | setiap PR |
| Interaksi komponen | Storybook 10 + `@storybook/addon-vitest` | PR yang menyentuh ui/shell |
| Visual | Playwright `toHaveScreenshot` di image Docker yang dipin (matriks dark/light × mobile/tablet/pc/tv) | setiap PR |
| A11y | addon-a11y (axe), 0 serious/critical | setiap PR |
| Kontrak | Fixtures + MSW di-type terhadap tipe SDK (`tsc`) | setiap PR |
| E2E | Playwright per app di staging (P1). Preview env per PR baru di P3 | merge ke main + nightly |
| Perf | size-limit (P1), LHCI (P2) | PR / nightly |

### 4.14 Rilis, aset & ingress

- **Aset klien:** CI mengunggah `build/client/*` ke **R2 `tsukimi-assets`**, disajikan di `assets.tsukimi.my/<app>/<hash>` dan `assets.tsukimi.my/ui/<hash>.css`. Aset disimpan **minimal 14 hari** untuk skew protection, lalu job lifecycle menghapus hash yang tidak dirujuk lagi setelah 30 hari. **Pod tidak pernah menyajikan aset di prod.**
- **Deploy train:** perubahan di `packages/{ui,shell,sdk,i18n}` atau `tooling/stylex` me-redeploy semua app dengan SHA yang sama. Perubahan yang hanya menyentuh app hanya me-redeploy app itu. Chunk-load error memicu satu kali hard reload.
- **Image:** `turbo prune` + `pnpm deploy`, base `gcr.io/distroless/nodejs24-debian12:nonroot`, < 150 MB.
- **HTTPRoute digenerate** dari `packages/shell/src/nav-manifest.ts` oleh `tooling/gen-routes` ke repo `tsukimi-gitops`: satu HTTPRoute per app, namespace `tsk-web`, `parentRef: tsk-edge/public`, prefix locale `/en` saja. Contoh hasil:

```yaml
apiVersion: gateway.networking.k8s.io/v1
kind: HTTPRoute
metadata: { name: web-anime, namespace: tsk-web }
spec:
  parentRefs: [{ name: public, namespace: tsk-edge }]
  hostnames: ["tsukimi.my"]
  rules:
    - matches: [{ path: { type: PathPrefix, value: /anime } }, { path: { type: PathPrefix, value: /en/anime } }]
      backendRefs: [{ name: web-anime, port: 3000 }]
```

| Prefix (juga di bawah `/en`) | Service |
|---|---|
| `/videos`, `/watch`, `/cast`, `/categories` | `web-video` |
| `/anime` | `web-anime` |
| `/comics`, `/read` | `web-comics` |
| `/api` | `api-public` (ns `tsk-svc`, butuh ReferenceGrant) |
| `/` catch-all (home, search, auth, akun MVP, legal, sitemap, robots) | `web-shell` |
| host `admin.tsukimi.my` (`/` → web-admin, `/api/admin` → api-admin) | `web-admin`, `api-admin` |

Gateway API memilih prefix terpanjang, sehingga catch-all tidak menimpa prefix app.

---

## 5. Backend & model data

### 5.1 Prinsip

- **Satu cluster Postgres, satu schema per bounded context.** Hanya pemilik schema yang boleh menulis ke sana (dipaksa lewat role Postgres per service + lint).
- **Actions untuk request/reply** lewat core NATS. **Fakta lintas sistem lewat outbox → JetStream → `@moleculer/channels`**. `broker.emit`/`broadcast` hanya untuk hint best-effort (mis. cache clean). **Jangan pernah** untuk pekerjaan yang wajib terjadi.
- **Pengiriman at-least-once**, diproses **efektif sekali** lewat dedupe `ops_local.inbox` atau dedupe `Nats-Msg-Id`.
- **Kerja terjadwal = K8s CronJob** yang memanggil action. Tidak ada timer di dalam service.
- **UUIDv7 dibuat di aplikasi** (paket npm `uuid` v7). **Tidak ada `DEFAULT uuidv7()`** di DDL, karena PG17 belum punya fungsi itu dan DDL harus identik di CNPG dan Supabase.

### 5.2 Service (deployable MVP vs nanti)

| Deployable | Isi | Fase |
|---|---|---|
| `api-public`, `api-admin` | moleculer-web: routing, validasi Ajv/TypeBox, rate limit GCRA (Redis), Idempotency-Key, ETag/Cache-Control/Cache-Tag, OpenAPI | P0/P1 |
| `session` (`v1.session`) | Pertukaran kode OIDC, session store (Valkey + `identity.sessions`), minting JWT internal, profil (`identity.users` dengan key Keycloak `sub`), preferensi. [P2] proxy device grant TV | P0 |
| `catalog` (satu image, `SERVICES=catalog,anime,comics,rights`) | `v1.catalog` (video, cast, genre, kategori, marker), `v1.anime` (series, season, episode, versi SUB/DUB, slot tayang), `v1.comics` (series, chapter, manifest halaman), **`v1.rights`** (license_agreement, license_window, work_age_rating, `rights.isAvailable`), status workflow + audit + revisi | P1 |
| `media` | Upload multipart, registry asset/objek, orkestrasi job, `playback.authorize`, subtitle, sprite | P1 |
| `progress` | Save buffered, flusher, continue, overlay, watchlist, follow, sync seq | P1 |
| `search-seo` | Indexer Meilisearch (dokumen membawa `territories`), proxy query, reconcile, slug/redirect, override SEO, endpoint `sitemap-entries`, simpan audit SEO, **ranking Postgres** (action untuk CronJob) | P1 |
| `outbox-relay` | Relay outbox → JetStream + konsumen advisory DLQ (digabung) | P0 |
| `storage-replicator` | e2 → R2 (Deployment tetap 2 replika di P1, autoscale di P2) | P1 |
| `ranking`, `analytics-ingest` | ClickHouse rollup → `ranking.snapshots/entries` (API tidak berubah) | P2 |
| `notifications` | Inbox in-app (P2), web push + email digest (P3) | P2/P3 |
| `cms` | Review/four-eyes, drafts, bulk import | P2 |
| `dlq` (terpisah), `entitlements` | | P2 / P3 |

Worker FFmpeg dan pemroses komik **bukan** service Moleculer. Mereka berupa Job (KEDA) yang menarik pesan dari JetStream.

### 5.3 Gaya API

- **REST + OpenAPI 3.1**, tanpa GraphQL di P1. Alasannya, GET publik bisa di-cache di CDN dan loader SSR sudah menjadi lapisan komposisi.
- **Path kanonik:** gateway dipasang di `/api`, jadi rute publik = `/api/v1/*` dan admin = `admin.tsukimi.my/api/admin/v1/*`. Spec ada di `/api/v1/openapi.json`.
- **Konvensi:**
  - Versi mayor di URL (perubahan aditif saja di dalam satu mayor).
  - Pagination keyset (`?limit=24&cursor=`, maks 100, cursor ditandatangani HMAC, tanpa total di list publik).
  - Sort/filter dari whitelist dengan indeks komposit yang sesuai.
  - Error RFC 9457, `If-Match` untuk PATCH admin, ETag untuk GET publik.
  - **Endpoint publik tidak pernah personal.** Overlay personal datang dari `/api/v1/me/*` (`private, no-store`).
- **Idempotency-Key** wajib pada `uploads.init/complete`, publish admin, report, dan pembelian di masa depan. Disimpan di `valkey-state` `idem:{principal}:{key}` **24 jam** (replay → respons tersimpan, hash beda → 422, konkuren → 409). Operasi bersifat uang juga ditulis ke `ops.idempotency_keys`.

Rute utama (ringkas):
```
GET  /api/v1/home   /videos   /videos/{slug}   /cast   /cast/{slug}   /genres   /categories
GET  /api/v1/anime?season=&status=   /anime/{slug}   /anime/{slug}/seasons/{id}/episodes
GET  /api/v1/anime/schedule?from=&days=7          (instan UTC; klien merender di tz pengguna)
GET  /api/v1/comics?format=   /comics/{slug}   /comics/{slug}/chapters   /comics/{slug}/chapters/{n}
GET  /api/v1/rankings/{board}?period=week          GET /api/v1/search?q=&type=
GET  /api/v1/seo/resolve?path=                      GET /api/v1/seo/sitemap-entries?kind=&page=
POST /api/v1/playback/{itemType}/{itemId}           (private; token media + subtitle + intro/outro)
GET  /api/v1/me   PATCH /api/v1/me/prefs   PUT /api/v1/me/progress/{type}/{id}   GET /api/v1/me/continue
GET  /api/v1/me/progress?items=   GET /api/v1/me/progress/sync?cursor=
PUT|DELETE /api/v1/me/watchlist/{type}/{id}   PUT|DELETE /api/v1/me/follows/{type}/{id}
```

### 5.4 Outline schema (kanonik)

Konvensi: PK `uuid` (v7 dari aplikasi), `created_at/updated_at timestamptz`, `version int` (optimistic lock). Semua tabel yang direplikasi wajib punya PK.

| Schema | Publikasi DR | Tabel utama |
|---|---|---|
| `identity` | ya | `users` (id, **keycloak_sub UNIQUE**, display_name, avatar_asset_id, locale, timezone, status, birthdate placeholder; **tanpa password/role**), `user_prefs` (theme, playback jsonb, reader jsonb), `sessions` (mirror untuk daftar perangkat dan "logout semua") |
| `catalog` | ya | `genres`, `categories`, `studios`, `people`, `cast_members`, `videos` (status, publish_at, access, maturity, denorm view_count/rating), `video_cast`, `video_genres`, `video_categories`, `video_markers`, `ratings` (P2), **`license_agreement`, `license_window`** (territories text[], starts_at, ends_at, bahasa), **`work_age_rating`** |
| `anime` | ya | `series` (broadcast_tz/weekday/time, next_airs_at), `series_genres`, `seasons`, `episodes` (number numeric(5,1), is_filler, is_recap), `episode_versions` (SUB/DUB, PK(episode_id, version)), `airing_rules`, `airing_slots` (airs_at UTC, index airs_at) |
| `comics` | ya | `series` (format, default_mode/direction, latest_chapter_*), `series_credits`, `series_genres`, `chapters` (number numeric(7,2), access, **`pages jsonb [{key,w,h,slice?,sha256?}]`**, page_count) |
| `media` | ya | `assets` (aset domain: kind, owner, status, duration, rv aktif), `objects` (registry fisik, **banyak per asset**, FK asset_id: bucket, key, size, sha256, primary_ok, secondary_ok, replicated_at, verified_at, deleted_at), `uploads`, `transcode_jobs`, `renditions`, `subtitle_tracks`, `asset_segments`, `sprites` |
| `progress` | ya | `item_progress` (**HASH(user_id) 32 partisi, DDL statis sejak hari pertama**), `series_progress` (HASH 16), `watchlist`, `follows` (index (subject_type, subject_id) untuk fan-out) |
| `ranking` | ya | `snapshots` (board, period_key, computed_at, source `pg`/`clickhouse`), `entries` |
| `seo` | ya | `redirects`, `overrides`, `audits` |
| `cms` | ya | `content_revision` (P1), `audit_log` (P1, insert-only, plain table di P1 → partisi bulanan pg_partman di P2), `drafts` (P2) |
| `notify` | ya | `notifications`, `push_subscriptions` (P2) |
| `ops` | ya | `dead_letters`, `idempotency_keys` (TTL 24 jam), `sync_watermarks`, `heartbeat` |
| **`ops_local`** | **tidak** | `outbox`, `inbox`: high-churn, tidak dipartisi, retensi lewat `DELETE` batch (CronJob tiap jam, outbox terpublikasi > 3 hari, inbox > 7 hari) |
| `entitlements` | ya | dicadangkan (P3) |

Database **`keycloak`** terpisah di cluster CNPG yang sama: tercakup PITR Barman, **dikecualikan dari logical replication**, plus `pg_dump` malam hari dan ekspor realm (§6.6).

**Keputusan model data**
- Manifest halaman komik disimpan sebagai `jsonb` di chapter. Tidak ada tabel `chapter_pages`. `comic-process` menulis `pages.json` ke storage, lalu memperbarui `chapters.pages` + `page_count` dalam satu transaksi.
- Riwayat heartbeat penuh tidak masuk Postgres. Di P2 ia masuk ClickHouse.
- Ranking MVP: CronJob malam hari menghitung dari `progress.series_progress/item_progress` (jumlah penonton/pembaca 7 hari) + pinning editorial, lalu menulis ke `ranking.snapshots/entries`. Di P2 sumbernya diganti ClickHouse tanpa mengubah API.

### 5.5 Outbox, stream & consumer

**Sisi tulis:** `outbox.mixin` menulis ke `ops_local.outbox` di transaksi yang sama dengan perubahan domain.

**Relay (`outbox-relay`, 2 replika):**
- **Terhubung langsung ke `tsukimi-pg-rw`, bukan Pooler**, dengan pool khusus berukuran 2. Alasannya, `LISTEN/NOTIFY` dan advisory lock tidak berjalan lewat PgBouncer transaction mode.
- Bangun saat `LISTEN outbox` atau setiap 250 ms.
- `SELECT … FOR UPDATE SKIP LOCKED LIMIT 500` → publish dengan `Nats-Msg-Id = outbox.id` (dedupe window 10 menit) → tunggu PubAck → set `published_at`.

**Stream & subject kanonik**

| Stream | Subject | Retensi | Replika |
|---|---|---|---|
| `TSK_DOMAIN` | `tsk.<context>.<aggregate>.<event>.v1` (mis. `tsk.anime.episode.published.v1`, `tsk.media.asset.ready.v1`, `tsk.storage.object.written.v1`, `tsk.media.upload.completed.v1`) | limits 14 hari, 50 GB, dedupe 10 menit | 3 |
| `TSK_JOBS` | `tsk.media.validate.requested.v1`, `tsk.media.transcode.requested.v1`, `tsk.comic.process.requested.v1`, `tsk.image.process.requested.v1` | **WorkQueue** (filter subject tidak tumpang tindih) | 3 |
| `TSK_TELEMETRY` | `tsk.telemetry.>` | 24 jam, discard old | 3 (P2) |
| `TSK_DLQ` | `tsk.dlq.<consumer>` | 30 hari | 3 |

Consumer durable: `media-validate`, `media-transcode`, `comic-process`, `image-process` (di `TSK_JOBS`); `storage-replicator`, `search-indexer`, `catalog-asset-ready`, `cdn-purge` (di `TSK_DOMAIN`).

**Konfigurasi consumer:** `ack_policy explicit`, `max_deliver 8`, backoff `[1s,5s,30s,2m,10m,30m,1h]`. Error dikelompokkan menjadi `RetryableError` (nak + backoff) dan `FatalError` (term → `TSK_DLQ` + `ops.dead_letters`). Handler idempoten:
- Efek DB: `INSERT INTO ops_local.inbox … ON CONFLICT DO NOTHING` di transaksi yang sama.
- Efek eksternal dibuat alami idempoten: upsert Meilisearch berversi, `HEAD` + sha256 untuk salinan S3.

Re-drive DLQ dilakukan dari admin. Alert berbunyi jika dead letter yang masih terbuka > 0 selama 15 menit.

**Repair:** backfill dengan cursor keyset (`ops.sync_watermarks`), plus `search.reconcile` malam hari.

### 5.6 Caching, rate limit

**Dua Valkey:**
- **`valkey-cache`**: tanpa persistensi, `allkeys-lru`, 1 primary + 1 replica. Untuk cacher Moleculer `mc:{CACHE_NS}:…` dan cache ranking.
- **`valkey-state`**: AOF `everysec`, `noeviction`, Sentinel 3. Untuk session `sess:<sha256(sid)>`, buffer progress `pb:*`, idempotency `idem:*` 24 jam, rate limit `rl:*`, cache `rights:*` 5 menit.

**CDN untuk API publik:** `public, s-maxage=60, stale-while-revalidate=300`, **tanpa `stale-if-error`** (atau maks 300 s), dengan `Cache-Tag: work:<id>`. Purge memakai tag lewat consumer `cdn-purge`. Fallback-nya purge per daftar URL dari sitemap-entries kalau purge-by-tag tidak tersedia di plan yang dipilih [VERIFIKASI].

**Rate limit kanonik:**

| Lapisan | Aturan |
|---|---|
| Cloudflare | `/auth/*` 10/menit/IP, `/api/v1/playback/*` 30/menit/IP, `/api/*` 600/menit/IP |
| Gateway (GCRA di valkey-state) | anon-read 120/10 s per IP; user-read 300/10 s; progress 1/5 s per item + 60/menit; search 20/10 s; upload-init admin 30/menit; header `RateLimit-*` + 429 `Retry-After` |

**Buffer progress:** lihat §3.3. Anggaran kehilangan maksimal ±20 s progress jika primary Valkey hilang tanpa replika. Hitungan beban pada asumsi 100 ribu penonton konkuren: ≈ 6,7 ribu tulis Redis/s → ±14 transaksi Postgres/s.

### 5.7 Runtime Moleculer

- `namespace` per env, `nodeID = <svc>-<pod>`, transporter `NATS` (core), serializer JSON.
- `requestTimeout 5s`, `retryPolicy` hanya untuk `err.retryable`, `circuitBreaker` untuk 5xx (threshold 0,5, minimal 20 request), `bulkhead 20/200`.
- `tracking.shutdownTimeout 10s`, metrik Prometheus di `:3030`.
- **`tracing.enabled: false`.** Tracing ditangani `@tsukimi/otel` (OTLP ke Alloy, `traceparent` di `ctx.meta`). Tidak ada exporter Zipkin.
- **Akses data: Kysely + kysely-codegen.** moleculer-db ditolak karena mengekspos CRUD generik dan `sync()` berbahaya untuk schema. Prisma ditolak karena butuh raw SQL untuk SKIP LOCKED, LWW, dan partisi.
- **Pool:**
  - Service umum: maksimal 10 koneksi lewat **CNPG Pooler (transaction mode)**, `SET LOCAL` hanya di dalam transaksi.
  - Read-heavy: lewat Pooler `-ro`.
  - Advisory lock, LISTEN, dan migrasi: **langsung ke `tsukimi-pg-rw`**.
- **Migrasi:**
  - Satu tool (**Kysely Migrator** + runner dual-target buatan sendiri), satu path **`packages/db/migrations`**, dijalankan sebagai Job Argo **PreSync**.
  - Urutan: perubahan **aditif → Supabase dulu lalu CNPG**, **destruktif → CNPG dulu lalu Supabase**, rename lewat expand/contract.
  - Drift check malam hari (aktif sejak Supabase hidup di P2; sebelum itu runner hanya menargetkan CNPG, tetapi aturan urutan sudah dipakai sejak awal).

### 5.8 Search (subbagian)

- Meilisearch **single node** + snapshot ke object storage. Bisa dibangun ulang penuh dari Postgres (`search.reindex`).
- Index: `videos`, `anime`, `comics`, `cast`. Atribut filterable: `territories`, `status`, `genre`, `format`, `maturity`.
- Upsert berversi dari event, plus reconcile malam hari.
- Target: typeahead p95 < 100 ms. Title yang dipublikasikan sudah bisa dicari ≤ 10 s.

---

## 6. Redundansi database

### 6.1 Topologi

- CNPG `tsukimi-pg` di namespace `tsk-data`: **PostgreSQL 17**, 3 instance tersebar di 3 zona.
- `synchronous: { method: any, number: 1, dataDurability: required }` → RPO 0 di dalam cluster.
- `wal_level=logical`, `max_slot_wal_keep_size=50GB`, volume WAL terpisah, `archive_timeout=60s`.
- Pooler `tsukimi-pg-pooler-rw` dan `-ro` (PgBouncer transaction mode, 3 replika).
- CNPG ≥ 1.27 dengan **Barman Cloud Plugin** (in-tree `barmanObjectStore` deprecated sejak 1.26).
- **Supabase PG17 di `ap-southeast-1`** sebagai subscriber logical. Role app di sana **read-only** sampai failover. **Aktif mulai P2.**

### 6.2 Phasing (keputusan)

| Fase | Pekerjaan |
|---|---|
| **P0** | Spike verifikasi saja: Supabase `CREATE SUBSCRIPTION`, IPv4 add-on, sinkronisasi slot CNPG, checksum e2, ToS Cloudflare |
| **P1** | CNPG HA + Barman PITR ke e2 + **satu restore manual yang terdokumentasi**. Inilah perlindungan nyata untuk beta. |
| **P2** | Replika logical Supabase, monitoring lag, sinkronisasi sequence, runbook failover/failback, game day, drill restore otomatis |

### 6.3 Logical replication CNPG → Supabase (P2)

**Arah:** CNPG sebagai publisher, Supabase sebagai subscriber. Subscriber yang membuka koneksi, jadi **CNPG harus bisa dijangkau dari Supabase**. Pola ini didukung dan didokumentasikan Supabase, tetapi **untuk migrasi, bukan sebagai produk DR**. Kita menyebutnya "supported-but-not-productised".

```sql
-- CNPG (lewat Publication CR di Git atau migration)
CREATE ROLE dr_replicator WITH LOGIN REPLICATION PASSWORD '<ESO>' CONNECTION LIMIT 3;
GRANT USAGE ON SCHEMA identity, catalog, anime, comics, media, progress, ranking, seo, cms, notify, ops TO dr_replicator;
GRANT SELECT ON ALL TABLES IN SCHEMA identity, catalog, anime, comics, media, progress, ranking, seo, cms, notify, ops TO dr_replicator;
CREATE PUBLICATION tsukimi_dr
  FOR TABLES IN SCHEMA identity, catalog, anime, comics, media, progress, ranking, seo, cms, notify, ops
  WITH (publish_via_partition_root = true);          -- ops_local TIDAK termasuk; jangan pakai nama 'supabase_realtime'
-- Supabase (SQL migration / bootstrap job, sebagai postgres)
CREATE SUBSCRIPTION tsukimi_dr_sub
  CONNECTION 'host=pg-repl.tsukimi.my port=5432 dbname=tsukimi user=dr_replicator sslmode=verify-full sslrootcert=system'
  PUBLICATION tsukimi_dr WITH (copy_data = true, slot_name = 'supabase_dr', failover = true);
```

- **Eksposur:** Service LoadBalancer `tsukimi-pg-repl` yang hanya memilih primary, `pg-repl.tsukimi.my` tanpa proxy Cloudflare, TLS dengan CA publik, SCRAM, `pg_hba` khusus `dr_replicator`, `loadBalancerSourceRanges` (IP egress Supabase jika tersedia [VERIFIKASI]).
- **NetworkPolicy:**
  - Kondisi normal: **ingress** dari LB `tsukimi-pg-repl` ke primary CNPG port 5432, hanya untuk `dr_replicator`.
  - **Egress** ke `db.<ref>.supabase.co:5432` hanya selama ada subscription failback, plus egress dari `postgres_exporter`.
  - FQDN NetworkPolicy di GKE mungkin butuh GKE Enterprise [VERIFIKASI]. Kalau tidak tersedia, egress dibatasi lewat CIDR/NAT.
- **Fallback tanpa eksposur publik:** replikator CDC di dalam cluster (PeerDB atau `etl` Supabase) yang membaca publikasi yang sama.
- **Yang tidak ikut direplikasi, dan penanganannya:**

| Tidak direplikasi | Penanganan |
|---|---|
| DDL | Runner migrasi dual-target (§5.7) + drift check malam hari |
| Sequence | Mayoritas PK sudah UUIDv7. Sisanya: CronJob `pg-seq-sync` tiap 5 menit (`setval` + margin 10.000) + langkah wajib saat failover (+100.000) |
| Large objects | Dilarang |
| `ops_local` (outbox/inbox) | Sengaja dikeluarkan. Reconciler membangun ulang yang sedang berjalan setelah failover |
| DB `keycloak` | Dikeluarkan. Dilindungi PITR + `pg_dump` + ekspor realm |
| Partisi pg_partman (P2) | Tabel target di Supabase dibuat sebagai **tabel biasa tanpa partisi** (cocok dengan `publish_via_partition_root=true`). Partisi hash progress dibuat statis identik di kedua sisi |

### 6.4 Monitoring lag (P2)

| Sinyal | Warn | Page |
|---|---|---|
| WAL yang ditahan slot `supabase_dr` | > 2 GB | > 20 GB (batas 50 GB → slot invalid, resync) |
| Lag heartbeat (`ops.heartbeat` tiap 10 s) di Supabase | > 30 s | > 300 s |
| `apply_error_count` naik | apa pun | 5 menit berturut-turut |
| Worker subscription mati / slot tidak aktif | 2 menit | 10 menit |
| Arsip WAL terakhir | > 5 menit | > 15 menit |
| Sync standby in-cluster | lag > 1 s | sync replica < 1 |

### 6.5 RPO / RTO

| Skenario | Mekanisme | RPO | RTO |
|---|---|---|---|
| Pod/node/disk/zona | Failover otomatis CNPG | 0 | ≤ 60 s |
| Cluster/region hilang (P2+) | Failover manual ke Supabase | ≤ 60 s (biasanya < 5 s) | **DB 30 menit**; **layanan 4 jam** (rebuild cluster dingin di `asia-southeast2` lewat Terraform + Argo CD). Selama jeda itu Cloudflare menyajikan pool statis "degraded". |
| Korupsi logis (migrasi buruk, DELETE tanpa WHERE) | PITR Barman. **Supabase bukan backup**, karena korupsi ikut tereplikasi. | ≤ 5 menit | 1–4 jam |
| Backup e2 hilang | Salinan terenkripsi di R2 | ≤ 24 jam (base), ≤ 15 menit (WAL) | +1 jam |

**Risiko yang diterima:** Supabase `ap-southeast-1` berada di metro yang sama dengan GKE prod. Insiden region GCP tidak menjatuhkan Supabase karena provider berbeda, tetapi insiden se-metro bisa menjatuhkan keduanya.

### 6.6 Backup & PITR

- **ObjectStore** (Barman Cloud Plugin):
  - `endpointURL: https://s3.<region>.idrivee2.com`, `destinationPath: s3://tsukimi-backups/pg/tsukimi-pg`.
  - **`retentionPolicy: 30d`**, kompresi WAL snappy.
  - env sidecar `AWS_REQUEST_CHECKSUM_CALCULATION=when_required` dan `AWS_RESPONSE_CHECKSUM_VALIDATION=when_required`.
- `ScheduledBackup` harian 19:00 UTC (02:00 WIB), `target: prefer-standby`.
- **Dump logis mingguan** `pg_dump -Fc`, disimpan **12 minggu**.
- **Keycloak:** `pg_dump` DB `keycloak` setiap malam + `kc.sh export` realm ke `tsukimi-backups/keycloak/`.
- **Salinan sekunder:** rclone `crypt` ke R2 (P1: CronJob malam hari untuk prefix backup; P2: reconcile penuh).
- Object Lock pada `tsukimi-backups` jika region e2 mendukungnya [VERIFIKASI]. Kalau tidak, salinan R2 dipegang kredensial tanpa hak delete.
- **Drill:**
  - P1: satu restore manual ke namespace scratch.
  - P2: CronJob restore bulanan otomatis (validasi jumlah baris ±0,5%, metrik `restore_duration_seconds`) + game day failover/failback per kuartal.
  - Tahunan: restore hanya dari salinan R2.

### 6.7 Runbook FAILOVER CNPG → Supabase (P2, manual)

1. Deklarasikan insiden dan bekukan deploy (sync window Argo: deny).
2. **Fence** primary lama (`kubectl cnpg fencing on tsukimi-pg "*"`) atau scale Pooler ke 0.
3. Catat `ops.heartbeat.ts` dan `pg_stat_subscription` di Supabase. Jendela kehilangan data = waktu insiden − heartbeat.
4. Tunggu apply habis (≤ 2 menit) jika CNPG masih streaming.
5. Di Supabase: `ALTER SUBSCRIPTION … DISABLE; … SET (slot_name = NONE); DROP SUBSCRIPTION …`.
6. Jalankan output `pg-seq-sync` terakhir (`tsukimi-backups/seq-sync/latest.sql`) + margin ekstra 100.000.
7. `GRANT INSERT, UPDATE, DELETE … TO tsukimi_app`, lalu refresh materialized view.
8. Arahkan ulang secret `DATABASE_URL` (ESO) ke pooler **session mode** Supavisor (atau port transaction 6543 tanpa prepared statement), lalu roll deployment.
9. Jalankan reconciler: reindex search, scan backlog `media.objects.secondary_ok=false`, flush buffer progress.
10. Pastikan add-on PITR Supabase aktif + CronJob `pg_dump` tiap 6 jam.
11. Verifikasi sintetik (login, play, baca, tulis progress), lalu umumkan pemulihan.

### 6.8 Runbook FAILBACK Supabase → CNPG baru

1. Bangun CNPG kosong dari Git, migrasi schema saja. Data dir lama **jangan pernah dipakai ulang**.
2. Di Supabase: `CREATE PUBLICATION tsukimi_fb FOR TABLES IN SCHEMA …`.
3. Di CNPG: `Subscription` CR dengan Supabase di `externalClusters`, ke **koneksi langsung** (butuh IPv6 egress atau **add-on IPv4** Supabase; jangan lewat Supavisor), `copy_data=true`, lalu tunggu lag < 1 s.
4. Write freeze ≤ 5 menit: flag gateway `READ_ONLY_MODE=true` + `default_transaction_read_only=on` di Supabase.
5. Pastikan heartbeat dari Supabase sudah sampai di CNPG.
6. `DROP SUBSCRIPTION` di CNPG, lalu sync sequence Supabase → CNPG (+100.000).
7. Balik arah tanpa copy ulang: publikasi `tsukimi_dr` di CNPG, subscription baru di Supabase dengan `copy_data=false, failover=true`.
8. Arahkan ulang `DATABASE_URL` ke Pooler CNPG, `READ_ONLY_MODE=false`, cabut hak tulis di Supabase.
9. Jalankan base backup on-demand segera, karena timeline PITR dimulai ulang.

---

## 7. Penyimpanan objek & media pipeline

### 7.1 Pembagian peran provider (refinement dari desain yang disepakati)

**Temuan fact-check #4:** ketentuan layanan CDN Cloudflare membatasi penyajian video lewat CDN biasa, kecuali lewat produk berbayar (R2/Stream/Images) atau Enterprise. Menyajikan HLS dari IDrive e2 lewat CDN di plan Free/Pro/Business berisiko ditindak.

| Peran | Provider |
|---|---|
| **System of record** (upload, master, backup, sumber replikasi) | **IDrive e2** (egress gratis hingga 3× volume tersimpan, lalu $0,01/GB, tanpa durasi minimum) |
| **Sekunder + origin penyajian media publik** (HLS, halaman komik, gambar ter-normalisasi) | **Cloudflare R2** via Worker `media-edge` (egress $0) |
| Aset frontend | R2 `tsukimi-assets` (tanpa replikasi, bisa dibangun ulang dari CI) |
| Fallback penyajian | e2 (Worker menandatangani GET dengan SigV4 lewat `aws4fetch`) |

Semua batasan yang disepakati tetap terpenuhi: e2 primary, provider kedua, Cloudflare di depan dengan failover. **Wajib:** konfirmasi tertulis Cloudflare bahwa HLS dari R2 via Worker sesuai ToS, sebelum launch (pertanyaan #5). Kontinjensinya: Cloudflare Enterprise, Cloudflare Stream, atau CDN video lain (Bunny/Gcore) untuk `media.`.

Replikasi lintas-region native e2 (e2-ke-e2, maksimal 10 tujuan) **opsional**. Ia hanya melindungi dari outage regional, bukan outage provider.

### 7.2 Layout bucket

```
tsukimi-uploads-staging/   e2 saja · privat · lifecycle 2 hari · abort MPU 1 hari · tidak direplikasi
  u/{uploadId}/{filename}
tsukimi-originals/         e2 + R2 Infrequent Access · privat · disimpan selamanya
  video/{videoId}/source.*   video/{videoId}/subs/{lang}.*   comic/{seriesId}/{chapterId}/source.cbz   image/...
tsukimi-media/             e2 + R2 · publik HANYA via Worker · key write-once berversi
  v/{videoId}/{rv}/master.m3u8, video/{1080p|720p|480p|360p}/…, audio/{ja|id|en}/…, subs/{lang}/v{n}/…,
                   thumbs/…, sprites/sprite_NNN.jpg + sprites.vtt, manifest.json (DITULIS TERAKHIR)
  c/{seriesId}/{chapterId}/{pv}/p0001.webp, p0007_s01.webp …, pages.json
  i/{kind}/{entityId}/{sha256}.webp
tsukimi-backups/           e2 + R2 (rclone crypt) · Object Lock jika tersedia [VERIFIKASI]
  pg/  logical/  keycloak/  seq-sync/  supabase-dumps/  rclone-reports/
tsukimi-assets/            R2 saja · publik (assets.tsukimi.my) · tidak direplikasi · lifecycle 30 hari utk hash tak dirujuk
  {app}/{hash}.js|css   ui/{hash}.css
```

**Lifecycle:**
- Versi `rv`/`pv` yang sudah digantikan dihapus 30 hari kemudian oleh CronJob berbasis DB (bukan aturan lifecycle provider).
- Konten yang di-takedown dihapus 30 hari kemudian, atau segera jika ada permintaan hukum.

**Kredensial per peran:** `uploader` (PutObject staging), `pipeline` (originals + media), `replicator` (baca e2, tulis R2), `cdn-reader` (baca media), `backup` (tulis backups).

**CORS staging:** `PUT` dari `https://admin.tsukimi.my` (dan `partner.tsukimi.my` di P2), `ExposeHeaders: ETag`.

### 7.3 Replikasi

- **Event-driven:** penulis objek menyisipkan `media.objects` + outbox `tsk.storage.object.written.v1` di transaksi yang sama. `storage-replicator` (2 replika di P1, KEDA di P2) menjalankan: HEAD R2 (sha256 cocok → ack) → stream GET e2 → PUT R2 (multipart > 64 MiB) → verifikasi sha256 → `secondary_ok=true`. Kalau sha256 tidak cocok: nak, lalu DLQ setelah 8 kali.
- **Delete** diteruskan ke sekunder **7 hari kemudian** lewat tombstone tertunda. *Pengecualian: takedown hukum langsung menghapus kedua sisi.*
- **Reconcile:**
  - P1: `rclone copy` malam hari hanya untuk `tsukimi-backups` ke remote crypt.
  - P2: `rclone check --one-way --size-only` + `copy --files-from` untuk semua bucket. **Jangan pernah `rclone sync`.**
- Scrubber integritas mingguan (sampel 1% + objek 7 hari terakhir) ada di **P3**. Sampai saat itu, `rclone check` malam hari sudah cukup.

### 7.4 CDN, token & failover media

- **Worker `media-edge` di `media.tsukimi.my`:**
  - URL `/t/{token}/v/{id}/{rv}/…`. Token ditaruh di path, sehingga URI relatif di `.m3u8` ikut membawanya.
  - Langkah: verifikasi HMAC → **cek Workers KV set revokasi** (prefix `videoId/rv` yang ditulis `takedown.execute`) → cache key tanpa token → **R2 dulu → e2** jika miss/5xx/timeout 3 s → metrik `origin=r2|e2`.
  - Alert jika fallback > 1%.
- **Token kanonik:** TTL = **max(6 jam, durasi + 2 jam)**, **tanpa binding IP**, HMAC-SHA256 dengan **dua `kid` aktif dan rotasi bulanan**. Diterbitkan oleh `playback.authorize` setelah `rights.isAvailable`.
- **Cache Rules:**

| Match | Edge TTL | Browser |
|---|---|---|
| `media.` `*.m4s`, `*.mp4`, `*.jpg`, `*.webp`, `*.vtt` | 1 tahun immutable | 1 tahun |
| `media.` `*.m3u8` (VOD berversi) | 1 hari | 60 s |
| `img.*` | 30 hari | 7 hari. **Format eksplisit di URL imgproxy (`…@avif` / `@webp`), cache key = URL.** Cloudflare tidak memvariasikan cache berdasarkan `Accept` di non-Enterprise. |
| `assets.tsukimi.my/*` | 1 tahun immutable | 1 tahun |
| HTML/API | lihat §4.8 dan §5.6 | |

Ekstensi `.m3u8`, `.m4s`, dan `.vtt` **tidak** di-cache default oleh Cloudflare, jadi butuh Cache Rule eksplisit (atau header dari Worker). Aktifkan Tiered Cache.

### 7.5 Pipeline video

**Validasi (`media-validate`):** ffprobe (container mp4/mov/mkv/webm, durasi 10 s–6 jam, ≤ 4K, ≤ 60 fps), decode penuh 30 s awal dan akhir, sha256. Subtitle dikonversi ke UTF-8, diparse SRT/ASS/VTT, timestamp divalidasi, dan tag dibersihkan.

**Transcode (`media-transcode`):** ladder **1080/720/480/360** (360p adalah refinement untuk audiens ID/MY yang mayoritas mobile).

| Rung | Resolusi | H.264 | maxrate/bufsize |
|---|---|---|---|
| 1080p | 1920×1080 | 5.000 kbps High 4.1 | 5.350k / 10.000k |
| 720p | 1280×720 | 2.800 kbps High 3.1 | 3.000k / 5.600k |
| 480p | 854×480 | 1.200 kbps | 1.300k / 2.400k |
| 360p | 640×360 | 700 kbps Main | 750k / 1.400k |
| Audio per bahasa | stereo 48 kHz | AAC-LC 128 kbps | |

- CMAF fMP4, segmen 6 s, GOP 2 s tertutup dan sejajar antar rung (`-force_key_frames "expr:gte(t,n_forced*2)"`, `-sc_threshold 0`, `g = round(fps*2)`).
- Rung di atas tinggi sumber dilewati.
- Audio `EXT-X-MEDIA TYPE=AUDIO GROUP-ID="aud"` (`ja` = SUB default, `id`/`en` = DUB). Subtitle `TYPE=SUBTITLES` WebVTT + sidecar.
- Divalidasi dengan `mediastreamvalidator` di CI (fixture) dan `hls-parser` di runtime.
- Poster: 5 kandidat (scene detect). Sprite: 1 frame / 5 s (10 s jika durasi > 90 menit), 160×90, tile 10×10, plus `sprites.vtt`.
- ASS asli disimpan di originals. Rendering JASSUB di P3.

**Spesifikasi Job kanonik (satu-satunya, dirujuk dari §8):**

```yaml
apiVersion: keda.sh/v1alpha1
kind: ScaledJob
metadata: { name: media-transcode, namespace: tsk-media }
spec:
  jobTargetRef:
    backoffLimit: 0                     # retry dipegang JetStream
    activeDeadlineSeconds: 21600        # 6 jam
    template:
      spec:
        restartPolicy: Never
        nodeSelector: { tsukimi.my/pool: media }          # Spot, mesin 16 vCPU (mis. c3d-highcpu-16)
        tolerations: [{ key: workload, value: media, effect: NoSchedule }]
        terminationGracePeriodSeconds: 25                 # SIGTERM → nak pesan
        containers:
          - name: transcode
            image: <registry>/media-transcode@sha256:...   # node:24 + ffmpeg 7.x statis
            resources: { requests: { cpu: "15", memory: 12Gi, ephemeral-storage: 200Gi }, limits: { memory: 16Gi } }
  pollingInterval: 15
  maxReplicaCount: 20                   # sekaligus batas biaya P1
  scalingStrategy: { strategy: accurate }
  triggers:
    - type: nats-jetstream
      metadata:
        natsServerMonitoringEndpoint: nats.tsk-data.svc:8222   # hanya di dalam cluster
        account: "$G"
        stream: TSK_JOBS
        consumer: media-transcode
        lagThreshold: "1"
```

- Satu Job menarik satu pesan, dengan **AckWait 120 s + `msg.working()` setiap 30 s**.
- **Idempoten per `rv`:** output ditulis ke `v/{id}/{rv}/` dan `manifest.json` ditulis paling akhir. Retry yang menemukan manifest langsung ack dan keluar.
- Pemicu KEDA `nats-jetstream` dengan **ScaledJob di JetStream R3 3-node harus diverifikasi di spike P0**. Fallback-nya scaler Prometheus dari metrik `nats-exporter`.
- ScaledJob lain: `media-validate` (2 vCPU, maks 20), `comic-process` (4 vCPU, maks 30), `image-process` (1 vCPU, maks 20).
- **Wall-clock:** episode 24 menit butuh ±25–30 menit di satu node 16 vCPU. Dengan antrean, validasi dan replikasi, target realistis **p90 ≤ 45 menit**. Di P2, transcode dipecah per rung (job per rendition + finalizer mux/manifest).

### 7.6 Pipeline komik & gambar

1. Unpack (ClamAV via sidecar `clamd`). Guard zip bomb: ≤ 1.000 entri, ≤ 2 GB setelah ekstraksi, rasio ≤ 100, tanpa `..`/symlink. Magic byte dicek.
2. Normalisasi dengan sharp/libvips: auto-orient, strip EXIF/ICC, sRGB, lebar maksimal 1.600 px (manga) / 1.080 px (strip), disimpan sebagai WebP q90.
3. **Slicing strip panjang** (tinggi > 2× lebar atau > 3.000 px): target 2.000 px (min 1.200, maks 2.800), dipotong di baris luminans dengan variansi terendah dalam ±300 px, supaya balon kata tidak terpotong.
4. Tulis `pages.json` → **update `chapters.pages` + `page_count` dalam satu transaksi**.
5. Pre-warm 3 halaman pertama di 2 lebar paling umum.

**imgproxy:**
- HPA 3–30. Hanya URL bertanda tangan, `IMGPROXY_ALLOWED_SOURCES` hanya bucket sendiri, `MAX_SRC_RESOLUTION=50`.
- Bucket lebar tetap: cover 160/240/360/480/720, halaman 720/1080/1440.
- Cover default AVIF q55. Halaman default WebP q80, AVIF opt-in.
- Jalan keluar: jika CPU imgproxy melebihi 2× biaya transcode, buat turunan statis saat `comic-process`.

### 7.7 DRM (opsional, P3)

Hanya untuk lisensi yang mewajibkan: Shaka Packager CMAF `cbcs` → `v/{id}/{rv}-drm/`, vendor multi-DRM (harga perlu penawaran), Shaka Player untuk title `drm_required`. AES-128 clear key **tidak** dipakai.

### 7.8 Rumus biaya (isi dengan angka sendiri; harga = asumsi [VERIFIKASI])

```
Ladder kbps = 5000+2800+1200+700 + 128×L   (L=2 → 9.956 kbps → ≈ 4,48 GB HLS per jam konten)
Storage/bulan ≈ H × [(4,51 GB)×(p_e2 + p_r2) + S_orig×(p_e2 + p_r2ia)]
   contoh H=1.000 jam, master 15 Mbps (6,75 GB/jam), p_e2 $0,005, p_r2 $0,015, p_r2ia $0,010 ≈ $191/bulan
Transcode ≈ 16 vCPU-jam per jam konten × $0,015 ≈ $0,24 per jam konten (sekali)
Worker ≈ 1.210 request per viewing-hour → 1 juta viewing-hour/bulan ≈ $363 (di atas kuota Workers Paid)
Egress R2 = $0; egress e2 = $0 sampai 3× volume tersimpan, lalu $0,01/GB (hanya terjadi saat fallback/replikasi)
Bandingkan CDN video ±$0,03/GB Asia: 1 juta viewing-hour × 1,35 GB ≈ $40 ribu/bulan
Komik: 20.000 chapter × 60 hlm × 0,3 MB ≈ 360 GB ≈ $7/bulan (dua provider)
Backup PG: 200 GB DB, 30 base, 20 GB WAL/hari ≈ 2,4 TB ≈ $48/bulan
```

### 7.9 Ringkasan komitmen RPO/RTO storage

| Lapisan | RPO | RTO |
|---|---|---|
| Jalur penyajian (R2 down) | 0 | otomatis < 5 s per request (fallback e2) |
| e2 primary hilang | lag replikator (< 5 menit) | ≤ 1 jam untuk mengarahkan jalur tulis ke R2 |
| Pipeline media down | 0 (antre di JetStream) | job dilanjutkan setelah pulih |

---

## 8. Infrastruktur Kubernetes, CI/CD & observability

### 8.1 Asumsi

Audiens utama di Indonesia + Malaysia, jadi region **Singapura `asia-southeast1`**. VOD saja. Tim kecil, jadi control plane managed. Byte video tidak pernah lewat pod. Untuk sizing: konkuren puncak = 8% DAU, 40% di antaranya menonton, bitrate rata-rata 2,5 Mbps.

### 8.2 Topologi & lingkungan

| Env | Bentuk | Kapan |
|---|---|---|
| `dev` | **docker-compose** di laptop: Postgres 17 (`wal_level=logical`), Valkey ×2, NATS JetStream, MinIO, Meilisearch, Keycloak, Mailpit. Service/app berjalan lewat `pnpm dev`. k3d + Tilt opsional di P2 untuk menguji chart. | P0 |
| `staging` | GKE **zonal** `asia-southeast1-b`, cluster `tsk-stg`. Pool system + pool general **Spot**, data di on-demand. | P0 |
| `prod` | GKE **regional** (3 zona), cluster `tsk-prod`. **Dibuat di 2 minggu terakhir P1** untuk beta. | akhir P1 |
| `dr` | Tidak berjalan. Rebuild di `asia-southeast2` (Jakarta) lewat Terraform + GitOps, RTO layanan 4 jam. | P2 drill |

**Pool prod:**

| Pool | Mesin (contoh) | Min–maks per zona | Kapasitas | Isi |
|---|---|---|---|---|
| `system` | e2-standard-4 | 1–1 | on-demand | Argo CD, cert-manager, ESO, KEDA, Envoy CP, monitoring |
| `web` | n2d-standard-4 | 1–4 | on-demand | Envoy data plane, SSR, imgproxy |
| `services` | n2d-standard-8 | 1–5 | on-demand (P2: 30% Spot untuk consumer) | Moleculer, CronJob |
| `data` | n2d-highmem-8 | 1–2 | **on-demand saja**, taint | CNPG, Pooler, NATS, Valkey, Meilisearch, Keycloak, [P2] ClickHouse |
| `media` | **16 vCPU highcpu** (mis. c3d-highcpu-16) | 0–7 | **Spot**, taint `workload=media` | Job FFmpeg/komik/gambar (1 transcode per node) |

GKE dipilih karena control plane HA regional, Spot, Dataplane V2, Workload Identity, serta Artifact Registry dan Secret Manager di region yang sama. Fallback lebih murah: DOKS/LKE Singapura (multi-zona lebih lemah). Self-hosted bare metal tidak disarankan untuk ukuran tim ini.

### 8.3 Namespace

```
platform: argocd cert-manager external-secrets envoy-gateway-system keda cnpg-system monitoring logging tracing
          [P2] kyverno velero
tsukimi:  tsk-edge (Gateway "public", imgproxy) · tsk-web (SSR + admin static) · tsk-svc (Moleculer, CronJob)
          tsk-media (ScaledJob) · tsk-data (CNPG, Pooler, NATS, Valkey ×2, Meilisearch, Keycloak, [P2] ClickHouse)
```
Label PSS `restricted` di semua `tsk-*` (kecuali `tsk-data` = `baseline`), plus ResourceQuota dan LimitRange.

### 8.4 Edge

- **Ingress: Envoy Gateway** (implementasi Gateway API). ingress-nginx tidak dipakai karena status pengembangannya dihentikan [VERIFIKASI status]. HTTPRoute digenerate (§4.14) dan ReferenceGrant dipakai untuk backend lintas namespace.
- **Cloudflare:**
  - **Plan minimal Pro**: Full (strict), Authenticated Origin Pulls diverifikasi Envoy `ClientTrafficPolicy`, `loadBalancerSourceRanges` = rentang IP Cloudflare.
  - WAF managed + OWASP, rate limit §5.6.
  - **Super Bot Fight Mode** dengan skip rule WAF untuk `media.tsukimi.my` dan bot terverifikasi. Bot Fight Mode versi Free tidak bisa di-scope.
  - Load Balancing (add-on mulai ±$5/bulan) dengan pool `prod-gke` (health `/healthz/edge`) → fallback `degraded` (situs statis Pages/Workers).
  - **Workers Paid** (±$5/bulan) untuk `media-edge`.
- **DNS & host:**

| Record | Target | Catatan |
|---|---|---|
| `tsukimi.my` | LB `web-lb` → Gateway prod | SSR + `/api` |
| `www` | redirect ke apex | |
| `admin.tsukimi.my` | Gateway (Cloudflare Access + Keycloak) | `web-admin` + `api-admin` |
| `partner.tsukimi.my` | Gateway (Keycloak saja) | P2 |
| `img.tsukimi.my` | imgproxy | |
| `media.tsukimi.my` | Worker `media-edge` | |
| `assets.tsukimi.my` | domain kustom R2 `tsukimi-assets` | |
| `pg-repl.tsukimi.my` | LB `tsukimi-pg-repl` (**tidak di-proxy**) | P2 |
| `staging.tsukimi.my`, `argocd.ops…`, `grafana.ops…` | Cloudflare Access | |
| `status.tsukimi.my` | status page eksternal | tidak bergantung pada cluster |

- **TLS:** cert-manager Let's Encrypt DNS-01 (token Cloudflare dengan scope zona). Tanpa service mesh. P2: NATS TLS + nkeys, CNPG `verify-full`.
- **Email transaksional:** provider dipilih di P0 (**Amazon SES ap-southeast-1**, Postmark, atau Resend). SPF/DKIM/DMARC untuk `tsukimi.my` lewat Terraform Cloudflare DNS. Dipakai Keycloak (verifikasi, reset), pengakuan takedown, ekspor privasi.

### 8.5 Secrets

**GCP Secret Manager + External Secrets Operator** (Workload Identity, tanpa key statis). Nama `tsk-<env>-<scope>-<name>`, `refreshInterval: 1h`, Reloader untuk rollout. Fallback di luar GCP: **Infisical** (provider ESO). Tidak ada SOPS atau secret di Git.

### 8.6 GitOps

- Satu Argo CD per cluster, app-of-apps + ApplicationSets.
- Sync wave: CRD → operator → konfigurasi platform → data → services → web.
- Dua repo: `tsukimi` (monorepo + `charts/`) dan `tsukimi-gitops` (state env: tag digest, values, HTTPRoute hasil generate).
- Chart OCI di Artifact Registry: `tsukimi-lib` + `web-app`, `moleculer-service`, `media-job`.
- Promosi: bot commit digest ke staging → smoke test → PR "promote to prod" → disetujui manusia.
- RollingUpdate `maxUnavailable 0`. Argo Rollouts canary di **P3**.

### 8.7 CI/CD (GitHub Actions)

```
setup (pnpm store + Turbo remote cache) → affected (turbo --filter='...[origin/main]')
 ├─ lint (eslint, tsc, hadolint, helm lint + kubeconform), gitleaks, frozen lockfile + onlyBuiltDependencies
 ├─ test (vitest; broker test dengan NATS testcontainer; migrasi di PG17 ephemeral)
 ├─ ui-guard (semua var --tk-* yang dirujuk tiap app ada di manifest token; satu versi @stylexjs)
 ├─ public-cache-guard (route publik: tanpa Set-Cookie, tanpa identifier user)
 ├─ storybook + visual + a11y
 ├─ size-limit (P1)        ├─ LHCI (P2)
 ├─ build-image (buildx, distroless nodejs24-debian12) → Trivy (gagal pada CRITICAL yang ada fix-nya) → Syft SBOM
 ├─ sign (cosign keyless via GitHub OIDC)
 ├─ push (Artifact Registry asia-southeast1, Workload Identity Federation)
 └─ upload aset klien → R2 tsukimi-assets
deploy (main): bot bump digest staging → Argo CD sync
```

- Renovate (dikelompokkan mingguan, `minimumReleaseAge 3 days`). Actions dipin per SHA.
- **Kyverno `verifyImages` di P2.** Penandatanganan cosign sudah berjalan sejak P0.
- Preview env per PR dengan branch DB ada di **P3**. Sampai saat itu yang dipakai preview Storybook (Cloudflare Pages) + staging.

### 8.8 Autoscaling

| Workload | Mekanisme | Min/maks (prod 100k DAU) |
|---|---|---|
| SSR per app | KEDA ScaledObject (CPU 60% + RPS/pod > 40) | 2–3 / 20 |
| api-public | KEDA (CPU 60% + RPS/pod > 300) | 3 / 30 |
| Service Moleculer | HPA CPU 65% | 2 / 15 |
| Consumer event | KEDA `nats-jetstream` (lag > 1.000/replika) | 1 / 20 (P2; P1 tetap) |
| Transcode | ScaledJob §7.5 | 0 / 20 |
| imgproxy | HPA CPU 70% | 2–3 / 30 |

Tidak ada CPU limit untuk pod Node.js (menghindari throttling CFS). Pod data memakai Guaranteed QoS. `NODE_OPTIONS=--max-old-space-size` diset 75% dari limit. PDB `maxUnavailable: 1`. Topology spread per zona. **NetworkPolicy default-deny** + allowlist (Envoy → web/api, web → api, svc/media → data, egress object storage 443, monitoring, OTLP; aturan CNPG ↔ Supabase sesuai §6.3).

### 8.9 Sizing (titik awal, dikalibrasi dengan k6)

| | 10k DAU | 100k DAU | 1M DAU |
|---|---|---|---|
| Konkuren puncak / stream video | 800 / 320 | 8.000 / 3.200 | 80.000 / 32.000 |
| Egress video puncak (CDN) | 0,8 Gbps | 8 Gbps | 80 Gbps |
| Egress video/bulan | ~55 TB | ~550 TB | ~5,5 PB |
| RPS origin HTML / API | ~10 / ~100 | ~80 / ~1.000 | ~800 / ~10.000 |
| Heartbeat progress/s | ~20 | ~210 | ~2.100 |
| CNPG | 3 × 2 vCPU/8 GB | 3 × 4/16 GB | 3 × 16/128 GB + 2 read replica |
| NATS | 3 × 0,5 vCPU | 3 × 1 vCPU | 3–5 × 4 vCPU |
| valkey-cache / valkey-state | 1+1 × 1 GB / 3 × 1 GB | 1+1 × 4 GB / 3 × 4 GB | Valkey Cluster |
| Meilisearch | 1 × 2/4 GB | 1 × 4/16 GB (+ standby) | evaluasi sharding |
| ClickHouse (P2+) | 1 × 2/8 GB | 2 × 4/16 GB | 2 shard × 2 replika |
| Keycloak | 2 × 0,5 vCPU/1 GB | 3 × 1/2 GB | 3–5 × 2/4 GB |
| Total vCPU on-demand (perkiraan) | ~40 | ~120 | ~600 |

### 8.10 Biaya bulanan kasar (USD, ±40%, harga list [VERIFIKASI])

| Item | **Pra-launch P0–P1 (staging saja)** | 10k DAU | 100k DAU | 1M DAU |
|---|---|---|---|---|
| GKE compute prod | — | $1.000–1.600 | $3.500–5.500 | $16k–26k |
| Staging (zonal, banyak Spot) | **$300–500** | $250–400 | $500–800 | $1k–2k |
| Disk, LB, snapshot | $30–60 | $150–250 | $500–900 | $2,5k–5k |
| Storage e2 + R2 (+assets) | $10–30 | $75–150 | $450–900 | $2,2k–5k |
| Supabase (P2+) | — | $60–150 | $200–600 | $1k–3k |
| Cloudflare: **Pro + LB (≥ $5) + Workers Paid ($5)** | $35–50 | $50–100 | $300–600 (Business) | $5k–15k+ (Enterprise) |
| Email, observability storage, registry, lainnya | $10–30 | $50–130 | $200–500 | $1,2k–3k |
| **Total** | **≈ $400–700** | **≈ $1,7k–2,8k** | **≈ $5,7k–9,8k** | **≈ $29k–59k** |

**Kontrol biaya:**
- GCP budget alert (50/80/100% dari plafon).
- Alert biaya Cloudflare/R2.
- `maxReplicaCount` transcode sebagai plafon biaya.
- CUD 1 tahun mulai P2.
- **Plafon bulanan perlu ditetapkan pemilik produk** (pertanyaan #6).

### 8.11 Observability & SLO

**Stack (self-hosted, pool system):**
- kube-prometheus-stack (Mimir/Grafana Cloud di P3).
- Loki (14 hari, stream audit 90 hari).
- Tempo (7 hari).
- Grafana Alloy (DaemonSet + gateway tail-sampling: 100% error/lambat, 5% sisanya).
- **Grafana Faro di `packages/shell`** (endpoint `/_rum`, rate-limited) sejak P1.
- Grafana di belakang Access.

**OTel:**
- `@tsukimi/otel` membungkus action/event Moleculer dan meneruskan `traceparent` di `ctx.meta`.
- SSR memakai `instrumentation.server.ts` (`node --import`), `withSpan()` di loader, `Server-Timing`.
- Konsumen JetStream menautkan span producer.

**SLO (28 hari):**

| SLI | SLO |
|---|---|
| Availability web/API | 99,5% beta → 99,9% launch |
| TTFB SSR origin | p95 < 500 ms |
| API baca / tulis | p95 < 200 / 400 ms |
| Video start time | p75 < 2,0 s, p95 < 4,0 s |
| Rebuffer | < 1% beta, < 0,8% launch |
| Halaman komik pertama | p95 < 1,5 s |
| Progress tersimpan ≤ 60 s | 99,99% |
| **Upload-complete → playable** | **p90 ≤ 45 menit** |

**Alerting:**
- Burn rate SLO lewat Sloth.
- Alertmanager: page → PagerDuty (free) atau Grafana IRM, tiket → Telegram/Slack, dead-man's switch → Healthchecks.io.
- Alert page: SLO burn, primary CNPG, lag sync, umur arsip WAL, storage NATS > 80%, lag consumer naik 15 menit, sertifikat < 14 hari, backup > 26 jam, health origin Cloudflare, `pb:dirty` > 30 s, outbox tertua > 60 s.
- Setiap alert punya `runbook_url`.

**Load test:** k6 Operator di staging (`browse_anon`, `watch` tanpa segmen, `read_comic`, `search`, `auth`). P1: 1k stream konkuren. P2: 20k penonton konkuren, soak 2× 2 jam, spike 3×.

### 8.12 Backup state cluster

Desired state ada di Git + Terraform state (GCS berversi). Postgres: §6.6. Meilisearch dan ClickHouse bisa dibangun ulang (plus snapshot). Velero + CSI snapshot di **P2**. Secret ada di Secret Manager (berversi).

---

## 9. Keamanan, privasi & legal

> Ini panduan engineering, **bukan nasihat hukum**. Item **[LAWYER]** wajib ditinjau pengacara Malaysia dan/atau Indonesia sebelum launch.

### 9.1 Autentikasi & session (kanonik)

- **Keycloak** (Operator, 2 replika) sebagai IdP untuk viewer, staf, dan (P2) partner. **DB `keycloak` di cluster CNPG** (§5.4, §6.6). Tema Keycloakify memakai token `packages/ui`. SMTP lewat provider email §8.4 dengan template id/en.
- Realm `tsukimi`:
  - Client `tsukimi-web` (confidential, code + PKCE, hanya dipakai service `session`).
  - `tsukimi-admin` (MFA wajib).
  - [P2] `tsukimi-partner` (Organizations [VERIFIKASI status GA]).
  - [P2] `tsukimi-tv` (device grant).
- IdP: **Google** di MVP. Apple/LINE menyusul (pertanyaan #20). Brute-force detection, Turnstile pada register dan login setelah 3 kali gagal.
- **BFF:** service `session` menyimpan `{userId, keycloakSub, roles, kc tokens, exp, ua_hash}` di valkey-state `sess:<sha256(sid)>`, di-mirror ke `identity.sessions`.
- Cookie: `__Host-tsk_sid` (opaque 256-bit, `HttpOnly; Secure; SameSite=Lax; Path=/`, 30 hari sliding untuk viewer, **12 jam idle / 7 hari absolut untuk staf**) + `__Host-tsk_csrf` (double-submit + cek `Origin`/`Sec-Fetch-Site` pada non-GET). SID dirotasi saat login, perubahan hak, atau step-up.
- SSR personal → `getSession()` → JWT internal 5 menit (aud `api`). Browser → `/api/v1` dengan cookie, dan gateway yang me-resolve session.
- **Fallback:** better-auth di dalam service `session` dengan **kontrak cookie yang sama**, sehingga app tidak perlu berubah.

### 9.2 Otorisasi

- **Role kanonik di Keycloak.** MVP mengaktifkan `user`, `editor`, `moderator`, `admin`. `rights_manager` digabung ke `admin` sampai ada staf legal. `superadmin` untuk `role.assign`. Role org partner (`partner_owner`, `partner_uploader`, `partner_viewer`) di P2. **Tidak ada kolom role di Postgres.**
- Middleware `authz` Moleculer **default deny**. Action tanpa blok `auth` membuat CI gagal.
- Filter pemilik/org di lapisan repository (BOLA). RLS untuk schema partner di P2.
- Four-eyes di P2 (§2.4).

### 9.3 Risiko OWASP spesifik Tsukimi

| Risiko | Kontrol |
|---|---|
| XSS (JSON-LD F1, sinopsis, subtitle) | Escape JSON-LD, Markdown + `rehype-sanitize`, sanitizer VTT, **CSP nonce**: `default-src 'self'; script-src 'self' 'nonce-…'; img-src 'self' https://img.tsukimi.my https://assets.tsukimi.my data:; media-src https://media.tsukimi.my blob:; connect-src 'self' https://media.tsukimi.my; style-src 'self' https://assets.tsukimi.my; frame-ancestors 'none'` |
| BOLA | Filter repository, UUIDv7, test lintas user |
| SSRF (imgproxy, fetcher SEO, import URL) | imgproxy bertanda tangan + allowed sources. Fetcher di namespace dengan egress terbatas (blok RFC1918 dan metadata) |
| Upload berbahaya | Presigned PUT dengan prefix tetap, ffprobe sandbox, `-protocol_whitelist file,pipe`, tolak input playlist/concat, pod non-root + rootfs read-only + **tanpa egress kecuali object storage**, ClamAV + batas arsip |
| Mass assignment | **Skema TypeBox per role** (partner tidak bisa set `status`, `license_*`, `age_rating_final`) |
| Konsumsi sumber daya | Rate limit §5.6, Meilisearch `limit ≤ 50` |
| Misconfig | Host admin/ops di belakang Cloudflare Access. `/admin` Keycloak tidak dirutekan publik |
| Open redirect | `returnTo` hanya path relatif yang origin-nya sama |
| Webhook | HMAC + timestamp 5 menit + idempotency key |

### 9.4 Perlindungan konten

| Level | Kapan | Mekanisme | Fase |
|---|---|---|---|
| L0 | Trailer/promo | URL publik | P1 |
| **L1 (default)** | Semua konten berlisensi tanpa klausul DRM | Token path HMAC di Worker (§7.4), imgproxy bertanda tangan 24 jam, KV revokasi | P1 |
| L2 | Lisensor meminta pelacakan bocoran | Watermark forensik A/B atau vendor. Overlay di komik | P3 |
| L3 | Kontrak mewajibkan DRM | Multi-DRM + Shaka | P3 |

Batas 3 stream konkuren per akun ada di **P2**.

### 9.5 Takedown (alur yang menutup celah cache)

`takedown.execute` (moderator/admin) melakukan, **dalam satu alur**:
1. Status → `taken_down` + audit log.
2. Tulis prefix `videoId/rv` (atau chapter `pv`) ke **Workers KV revokasi**. Worker langsung menolak walaupun token masih berlaku.
3. **Purge by tag** `work:<id>` untuk HTML dan API (Cache-Tag ada di keduanya). Kalau purge-by-tag tidak tersedia di plan yang dipilih [VERIFIKASI], purge per daftar URL dari `sitemap-entries`.
4. Hapus dari index search dan sitemap. Invalidasi cache `rights:*`.

Tanpa `stale-if-error` panjang di GET katalog (§5.6). **Acceptance:** playback gagal ≤ 2 menit setelah takedown. Target end-to-end ≤ 15 menit sejak laporan valid (SLA operasional).

**Proses notice-and-action:** form `tsukimi.my/legal/copyright` + `copyright@tsukimi.my`, akui dalam 24 jam, nonaktifkan dalam 48 jam (target < 24 jam), counter-notice 10 hari kerja, repeat-infringer 3 strike/12 bulan. Kewajiban safe-harbour MY/ID: **[LAWYER]**.

### 9.6 Lisensi konten & rights (risiko hukum utama)

- **Aturan keras: tidak ada title, episode, chapter, gambar, atau profil cast yang live tanpa rights record.** Menayangkan anime, komik, atau video dengan cast nyata tanpa lisensi adalah pelanggaran hak cipta (Malaysia: Copyright Act 1987; Indonesia: UU 28/2014). Situs bajakan diblokir aktif oleh regulator Indonesia. Klaim spesifik tentang cakupan streaming di amandemen Copyright Act 2022 dan kewajiban PSE (termasuk SLA takedown) **[LAWYER — belum terverifikasi]**.
- **Modul `rights` di `v1.catalog` (MVP):** `license_agreement`, `license_window` (territories, excluded_territories, starts/ends, bahasa, allows_dub/sub), `work_age_rating`. Satu fungsi `rights.isAvailable({workId, unitId, country, at, viewerAge})` dipakai oleh listing, index search (atribut `territories`), sitemap, dan `playback.authorize`. Negara diambil dari `CF-IPCountry`. Cache Valkey 5 menit, diinvalidasi event.
- **CronJob `rights.sweep` tiap 5 menit** (P1): window berakhir → unpublish, hapus dari search dan sitemap.
- Portal lisensor + penyimpanan PDF kontrak: P2.
- **Profil cast (personality rights):** sumber untuk setiap fakta, foto berlisensi, tanpa bio karangan, link "minta koreksi/penghapusan", dan ranking berdasarkan views/follows (bukan penampilan) yang diberi label demikian. **Tidak ada konten dewasa.** Penamaan vertikal "actress" perlu ditinjau karena persepsi regulator, app store, dan payment provider (UU 44/2008, ITE, CMA 1998) **[LAWYER]**.
- **Rating usia:** diset editor, bukan partner. Gate dasar di MVP: 16+/18 butuh login + DOB, poster diblur untuk pengunjung yang belum login, dikecualikan dari rich results dan sitemap. Komponen `AgeBadge` dan `AgeGate` ditambahkan ke `packages/ui`.

### 9.7 Privasi & perlindungan data

| Hukum | Kewajiban (dikoreksi sesuai fact-check) |
|---|---|
| **Malaysia PDPA 2010 (amandemen 2024)** | **Breach:** lapor ke Commissioner ≤ 72 jam jika ada risiko signifikan atau > 1.000 subjek, lalu **beri tahu pengguna terdampak ≤ 7 hari setelah notifikasi ke Commissioner**. Simpan **breach register 2 tahun**. **DPO ditunjuk dan dinotifikasikan ke Commissioner** (berlaku sejak 1 Jun 2025). **Hak portabilitas data.** **Whitelist dihapus**: transfer lintas negara butuh hukum yang substansial serupa / perlindungan setara, atau consent, plus **TIA**. Prosesor punya kewajiban langsung. Denda hingga RM1 juta. Notice **BM + EN**. |
| **Indonesia UU PDP (UU 27/2022)** | Berlaku penuh sejak 17 Okt 2024. Breach: subjek + otoritas ≤ **3×24 jam**. Transfer berjenjang (negara setara → safeguard kontraktual → consent eksplisit). Consent eksplisit per tujuan + penarikan. DPO kemungkinan wajib (pemantauan sistematis skala besar) + DPIA. **Lembaga pengawas PDP belum terbentuk dan PP pelaksana belum terkonfirmasi, jadi pantau terus.** |
| Anak | Penonton anime/komik banyak yang di bawah umur: age gating, consent orang tua **[LAWYER]**, tanpa iklan perilaku untuk < 18 |

- **Inventaris & retensi:**
  - Profil (Keycloak + `identity`): umur akun + 30 hari.
  - Session/IP: 30 hari setelah berakhir.
  - Progress/watchlist: umur akun.
  - Analitik (P2): hash user bergaram yang dirotasi 90 hari, raw 13 bulan.
  - Log: 30 hari (keamanan 90 hari).
  - Laporan/takedown: 3 tahun **[LAWYER]**.
- **Backup:** "backup kedaluwarsa dalam **30 hari (PITR)** dan **12 minggu (dump logis)**". Kalimat ini masuk privacy notice.
- **Consent:** default hanya cookie strictly necessary (session, CSRF, tema). Analitik opt-in, dan flag server menahan event non-esensial. Ada toggle "Personalisasi dari riwayat saya".
- **Hak subjek data:**
  - Ekspor ZIP (signed URL 72 jam, 1×/7 hari).
  - Hapus dengan grace 14 hari, lalu event `identity.user.deleted` disebar ke semua service lewat checklist `erasure_tasks`.
  - Beta (P1) mendapat ekspor/hapus dasar. Versi lengkap menjadi gerbang launch P2.
- **Sub-processor & DPA:** Cloudflare, IDrive, Supabase, Google Cloud, provider email, (P3) vendor DRM **[LAWYER]**.
- **Gerbang public launch (P2):** tunjuk dan daftarkan DPO, breach register, TIA, runbook insiden 72 jam/7 hari (MY) dan 3×24 jam (ID), notice EN/BM/ID, ToS, kebijakan cookie dan hak cipta.

### 9.8 Secrets & supply chain

Ringkasan dari §8.5/§8.7: Secret Manager + ESO, gitleaks, rotasi (DB 90 hari, key media dual-kid bulanan, key bucket 180 hari dengan scope per bucket), SSR app tanpa secret backend, lockfile beku + `onlyBuiltDependencies`, Renovate dengan release age, osv-scanner + Trivy, Syft, cosign (P0), Kyverno verifyImages (P2), Actions dipin SHA.

### 9.9 Audit log & moderasi

- `cms.audit_log` (actor, action, target, before/after, ip, request_id, reason) ditulis mixin `audited` **dalam transaksi yang sama**. Role app hanya punya hak INSERT. Retensi 3 tahun. Ekspor hash-chain ke bucket WORM di P2.
- Antrean laporan pengguna + moderasi di P2. Konten seksual anak = P0: auto-hide, eskalasi, simpan bukti, lapor ke otoritas **[LAWYER]**. Tanpa komentar di P1.

### 9.10 Checklist pengacara

1. Entitas operator (Sdn Bhd / PT) dan yurisdiksi.
2. Template lisensi + perjanjian partner.
3. PSE Lingkup Privat (ID), Online Safety Act 2025 (MY; waktu berlaku dan ambang lisensi belum terverifikasi), lisensi ASP.
4. Privacy notice/ToS/cookie EN/BM/ID, DPO, DPA, dasar transfer + TIA.
5. Rating usia LPF/LSF, usia minimum, consent orang tua.
6. Profil cast dan positioning vertikal "actress".
7. Kata-kata prosedur takedown dan safe harbour.

---

## 10. Roadmap per fase

Estimasi dalam **person-day (pd)**. Setiap tugas punya satu pemilik seksi (sudah dideduplikasi). Kapasitas efektif diasumsikan ±80–85% dari 3 dev.

### 10.1 P0 Foundation (minggu 1–6) — total **80 pd**

| # | Tugas | Acceptance | pd |
|---|---|---|---|
| P0.1 | **Konversi monorepo:** `git init` + commit snapshot `tsukimi.my`; root `p-project/tsukimi`; pindahkan ke `packages/ui`; `rootDir` = root repo; hapus sisa Lucy4 (SITE, `lucy4-theme`, docs, stories); **ganti nama orang sungguhan di mock (F4) sebelum fixtures dibuat**; cek grep allowlist di CI | `pnpm install && turbo build` + Storybook dari root lulus; screenshot sama dengan baseline sebelum pindah; grep "Lucy4" = 0; grep nama-nyata = 0 | 3 |
| P0.2 | **Dev lokal docker-compose:** Postgres 17 (`wal_level=logical`), Valkey cache + state, NATS JetStream, MinIO (bucket sesuai layout), Meilisearch, Keycloak + Mailpit; `pnpm dev:infra` | Dev baru punya stack jalan < 10 menit; healthcheck semua hijau | 2 |
| P0.3 | **CI dasar:** GitHub Actions lint/typecheck/vitest/Storybook build, Turbo cache, gitleaks, frozen lockfile, guard nama-nyata | PR gagal pada lint/type/secret; durasi CI < 10 menit | 2 |
| P0.4 | **Spike week** (masing-masing menghasilkan ADR): (a) StyleX + RR7 framework SSR, strategi A vs B, termasuk render di Chromium 76/87 (3); (b) `@moleculer/channels` JetStream: backoff, DLQ, pod kill (2); (c) KEDA `nats-jetstream` ScaledJob di JetStream R3 3-node + fallback Prometheus (2); (d) matriks panggilan S3 IDrive e2 yang dipakai SDK/rclone/Barman: presigned multipart, CORS, lifecycle di bucket berversi, checksum (1,5); (e) Supabase `CREATE SUBSCRIPTION`, IPv4, sync slot CNPG (1,5); (f) konfirmasi tertulis Cloudflare soal HLS dari R2 via Worker + cek purge-by-tag di plan (0,5) | 6 ADR dengan ya/tidak + fallback terpilih | 10,5 |
| P0.5 | `packages/ui` SSR-safe: ThemeProvider berbasis cookie + migrasi key, DeviceProvider `initial`, LinkProvider + `href` nav, `configureSeo`, fix F1/F2 (escape JSON-LD, allow-list atribut), global.css bertoken, font self-hosted | renderToString + hydrate setiap story halaman tanpa warning; test payload `</script>` ter-escape | 4,5 |
| P0.6 | `packages/fixtures` + MSW; Vitest + addon-vitest + baseline visual Playwright (Docker dipin) | CI menjalankan unit/interaksi/a11y/visual; perubahan token menghasilkan diff yang bisa direview | 3 |
| P0.7 | `tooling/*`: tsconfig, eslint (plugin StyleX), `stylex-config`, `vite-preset` (satu `build.target`), job `ui-guard` | ui-guard gagal jika satu app memakai opsi StyleX berbeda | 1,5 |
| P0.8 | `packages/contracts` (TypeBox → OpenAPI 3.1) + `packages/db` (Kysely, codegen, runner Migrator dual-target dengan aturan urutan; CI dua kontainer PG17 yang saling mereplikasi) | Migrasi contoh aditif + destruktif lolos di dua target tanpa error replikasi | 4 |
| P0.9 | `packages/broker-kit` (moleculer.config, errors, mixin db/outbox/channels/idempotent/audit/authz) + `packages/otel` + service hello | Service hello terhubung ke NATS; `/metrics` aktif; span muncul di Tempo (staging) | 3 |
| P0.10 | Schema `ops`/`ops_local` + outbox mixin + `outbox-relay` (koneksi langsung, pool 2) + idempotent consumer + DLQ (digabung) + stream TSK_* | Test integrasi: 10k baris outbox direlay; **injeksi duplikat menghasilkan satu efek samping**; event bertahan saat broker restart; re-drive DLQ berfungsi | 5 |
| P0.11 | Gateway `api-public`: Ajv/TypeBox, `/api/v1/openapi.json`, problem+json, GCRA Valkey, Idempotency-Key 24 jam, ETag/Cache-Control/Cache-Tag | 429 + header RateLimit; replay mengembalikan respons tersimpan; **route publik tanpa Set-Cookie** | 4 |
| P0.12 | Keycloak (Operator di staging, kontainer lokal): realm, client web/admin, Google IdP, brute force; **provider email + SPF/DKIM/DMARC + SMTP Keycloak + template id/en**; DB `keycloak` | Register/login/reset/verifikasi email jalan di staging; email lolos DMARC | 3,5 |
| P0.13 | Service `session` (BFF) + `getSession`/`requireSession` di sdk, `__Host-tsk_sid`/`__Host-tsk_csrf`, JWT internal 5 menit, `identity.users` dengan key `sub` | Login dipakai bersama semua app; tidak ada token di storage browser; test CSRF lulus | 5 |
| P0.14 | Domain model v1 + migrasi (identity, catalog + rights, anime, comics, media, progress dengan partisi hash statis, ranking, seo, cms, ops, ops_local) + seed dari fixtures yang sudah bersih | ERD direview; migrasi lolos di DB kosong; seed memuat fixtures | 5 |
| P0.15 | `packages/shell` minimal (AppFrame, nav-manifest, AppLink) + `packages/sdk` (client tergenerate + QueryClient per request) + app RR7 kosong shell/video/anime/comics + admin (CSR) + `tooling/gen-routes` | Setiap app me-render placeholder SSR lewat HTTPRoute hasil generate di staging, dengan shell bersama | 5 |
| P0.16 | Terraform: project GCP, VPC, **GKE staging zonal**, Artifact Registry, Secret Manager, WIF GitHub, state GCS, **budget alert** | `terraform plan` bersih; Actions bisa push tanpa key statis | 3 |
| P0.17 | `tsukimi-gitops` + Argo CD + add-on platform (cert-manager, ESO, Envoy Gateway, KEDA, Reloader, CNPG operator) | `root-staging.yaml` menghidupkan platform dari cluster kosong; sertifikat wildcard terbit | 5 |
| P0.18 | Chart Helm `tsukimi-lib`, `web-app`, `moleculer-service`, `media-job` (OCI) | kubeconform + helm unittest lulus; satu service + satu app ter-deploy hanya dari values | 3 |
| P0.19 | Cloudflare via Terraform: zona (Pro), DNS, Full strict, AOP, WAF, rate limit kanonik, cache rule (§4.8, §7.4), Access untuk staging/admin/ops, Transform Rule kelas perangkat | Origin menolak non-Cloudflare; test `cf-cache-status` sesuai tabel | 3 |
| P0.20 | Pipeline image: buildx, Trivy, Syft, **cosign sign**, push, bot bump staging, upload aset ke R2, Renovate | Merge ke main men-deploy image yang berubah (sudah ditandatangani dan dipindai) ke staging ≤ 15 menit | 3 |
| P0.21 | Bucket e2 + R2 (termasuk `tsukimi-assets`): layout, CORS, kredensial per peran, lifecycle | Setiap kredensial ditolak di luar scope (test otomatis) | 2 |

**Exit P0:** login bersama lintas app di staging, satu event outbox mengalir end-to-end, 6 ADR spike tersedia, dan semua keputusan terbuka #1–#6 sudah dijawab atau punya default yang disetujui.

### 10.2 P1 MVP (minggu 7–20, termasuk buffer 1 minggu) — total **168 pd**

| # | Tugas | Acceptance | pd |
|---|---|---|---|
| P1.1 | CNPG 3 instance + Pooler rw/ro + Barman Cloud Plugin PITR ke e2 (env checksum) + `pg_dump` mingguan + DB `keycloak` dump malam hari + rclone crypt backup ke R2 + **satu restore PITR manual** | Kill primary → failover < 60 s tanpa kehilangan transaksi; PITR ke timestamp berhasil di namespace scratch; runbook ditulis | 5 |
| P1.2 | Data tier: NATS JetStream R3 + stream, `valkey-cache`, `valkey-state` (Sentinel), Meilisearch + snapshot (tanpa ClickHouse) | Kill 1 node NATS tanpa kehilangan pesan; failover Sentinel < 30 s | 3 |
| P1.3 | `catalog`: video, cast, genre, kategori, marker + **modul rights** + CronJob `rights.sweep` 5 menit + status workflow | Semua field VideoCard/CastRosterCard dari API; list p95 < 50 ms di origin; title di luar teritori/window hilang dari listing/search/sitemap/playback ≤ 5 menit | 10 |
| P1.4 | `anime`: series/season/episode/versi SUB-DUB, airing rules/slots, endpoint jadwal, CronJob auto-publish + markAired | EpisodeList/AiringCalendar benar di semua IANA tz; episode pada slot Sab 23:30 JST terbit ≤ 1 menit | 8 |
| P1.5 | `comics`: series, credits, chapter `pages jsonb`, cek akses terkunci | Reader memuat chapter dalam satu panggilan dengan w/h | 5 |
| P1.6 | Status workflow + CronJob publish terjadwal + **audit-log mixin** (transaksi sama, insert-only) + `content_revision` + revert | Setiap tulisan admin punya baris audit dengan diff; role app tidak bisa UPDATE/DELETE audit | 4 |
| P1.7 | `apps/admin`: A1 Titles (termasuk blok hak, rating usia), A6 Cast, A8 Taxonomy, A7 minimal; guard role | Editor membuat seri lengkap dengan cover, genre, hak, dan cast | 8 |
| P1.8 | `apps/admin`: A2 season/episode (SUB/DUB, subtitle, intro/outro, marker) + A5 UI jadwal | Episode tampil di EpisodeList + player dengan skip intro dan dua audio | 6 |
| P1.9 | `apps/admin`: A3 upload (Uppy multipart, status job, retry) + A4 bulk chapter (ZIP/CBZ, natural sort, reorder) | Upload 20 GB bisa dilanjutkan setelah jaringan putus; chapter 60 halaman terbaca < 5 menit | 6 |
| P1.10 | `media`: uploads init/complete (Idempotency-Key), registry assets/objects, `playback.authorize` + token dual-kid | Completion hanya menghasilkan satu event; token kedaluwarsa atau dimanipulasi → 403 | 5 |
| P1.11 | Job `media-validate` (ffprobe, decode, ClamAV arsip/gambar, sanitizer subtitle) | Fixture rusak (mp4 terpotong, zip bomb, path traversal, SRT dengan encoding salah) ditolak dengan alasan | 3 |
| P1.12 | ScaledJob `media-transcode` (spesifikasi §7.5) | Master lolos validator; main di hls.js + Safari dengan SUB/DUB + sprite; job yang dibunuh lalu di-retry menghasilkan output identik; **p90 upload→playable ≤ 45 menit** | 6 |
| P1.13 | `comic-process` (slicing gutter) + `image-process` | Strip 30.000 px dipotong 1.200–2.800 px tanpa memotong balon kata (fixture) | 4 |
| P1.14 | imgproxy (signed, bucket lebar, format eksplisit, pre-warm) | Hit ratio CDN > 90% pada tes jelajah sintetik | 2 |
| P1.15 | Worker `media-edge` (token path, cache key tanpa token, **KV revokasi**, R2 → e2) + `storage-replicator` (2 replika, sha256, tombstone 7 hari) | Binding R2 dimatikan → playback lanjut dari e2; 1.000 objek ada di R2 dengan sha256 cocok ≤ 5 menit | 5 |
| P1.16 | `progress`: save Lua LWW, flusher, continue, overlay, watchlist, follow, sync seq | 7k tulis/s → umur `pb:dirty` < 10 s; kill Postgres → tidak ada progress hilang; resume lintas perangkat ≤ 10 s | 7 |
| P1.17 | `search-seo`: index Meili (+territories), upsert berversi, reconcile, slug/redirect, override, `sitemap-entries` | Title publish bisa dicari ≤ 10 s; rename slug → 301 | 6 |
| P1.18 | Ranking Postgres: CronJob malam hari ke `ranking.snapshots/entries` + pinning editorial | Popular Actress, trending, dan most-read tampil dari snapshot | 2 |
| P1.19 | Shell: AppLink lintas app, skrip tema inline, Speculation Rules, View Transitions, UI auth, halaman akun (profile/settings/watchlist) | Nav lintas app < 400 ms perseptual di Android menengah dengan HTML ter-cache | 6 |
| P1.20 | `apps/video` + home di shell: library, kategori, direktori cast, **profil cast**, **detail/watch video** | Halaman SSR data nyata; Rich Results lulus untuk Person/VideoObject/Breadcrumb | 8 |
| P1.21 | `apps/anime`: list, detail, jadwal, watch + **adapter VideoPlayer hls.js** (audio group, subtitle, fallback native) | Playback di Chrome/Firefox/Safari/Android; start p75 < 2 s di staging | 7 |
| P1.22 | `apps/comics`: list, detail, reader halaman nyata + progress halaman | Next page p75 < 300 ms dengan throttle 4G | 5 |
| P1.23 | Baris Continue, Library/Follow, settings tersimpan di server, filter "Followed only" | Settings sama di semua perangkat | 4 |
| P1.24 | SEO per route + sitemap per app + robots + crawl SeoOptimizer di CI | Index sitemap memuat semua app; skor audit ≥ 80 di 50 URL | 4 |
| P1.25 | i18n Lingui `id` + `en` (infra + string UI) + Intl dengan cookie tz | Ganti locale mempertahankan path; hreflang benar | 3 |
| P1.26 | Dockerfile per app, Cache-Control per jenis route, test CI `public-cache-guard` | Image < 150 MB non-root; HTML publik HIT di Cloudflare pada request kedua, juga untuk user login | 3 |
| P1.27 | Takedown: tombol + Cache-Tag purge + KV revocation + hapus dari search/sitemap | **Playback gagal ≤ 2 menit setelah takedown**; HTML/API diperbarui ≤ 2 menit | 3 |
| P1.28 | Rating usia + AgeBadge/AgeGate + DOB | Pengunjung tanpa login tidak bisa membuka konten 16+/18; tanpa rich data untuk 18 | 2 |
| P1.29 | Observability: kube-prometheus-stack, Loki, Tempo, Alloy, **Faro di packages/shell** (web-vitals + QoE hls.js), size-limit CI, SLO dasar + alert + runbook | Satu trace mengalir browser → SSR → api → action → consumer; panel VST p75/p95 terisi | 6 |
| P1.30 | Autoscaling (KEDA/HPA), PDB, resource requests, **NetworkPolicy default deny** | Ramp k6 men-scale out lalu kembali; egress internet dari `tsk-svc` diblok | 4 |
| P1.31 | Hardening keamanan: authz default deny + lint, suite test BOLA, CSP nonce, hardening upload (no-egress, whitelist protokol), Turnstile | Action tanpa `auth` → CI gagal; akses progress lintas user → 403/404 | 6 |
| P1.32 | **Cluster prod regional** (2 minggu terakhir) + data tier prod + switch LB Cloudflare + alert biaya | Smoke test prod hijau; restore PITR diuji di prod-scratch | 4 |
| P1.33 | k6 (1k stream konkuren) + QA lintas perangkat + hardening beta | **Semua exit criteria MVP §2.5 terpenuhi** | 6 |
| P1.34 | Privacy notice beta (id/en) + banner consent minimal + ekspor/hapus dasar | Event analitik berhenti tanpa consent; ekspor ZIP berisi profil + progress | 2 |

Minggu 20 adalah **buffer** dan tidak diisi tugas baru. Private beta dimulai ±minggu 21.

### 10.3 P2 Scale (±minggu 21–31) — ±100 pd

| # | Tugas | Acceptance | pd |
|---|---|---|---|
| P2.1 | **Supabase DR:** publikasi/subscription (atau PeerDB), role read-only, monitoring lag (§6.4), `pg-seq-sync`, runbook failover/failback dalam bentuk skrip, game day staging | Lag heartbeat p95 < 5 s di bawah beban; failover ≤ 30 menit, failback write freeze ≤ 5 menit, tanpa duplicate key | 10 |
| P2.2 | ClickHouse + `analytics-ingest` + service `ranking` (sumber diganti, API tetap) + ekspor RUM + dashboard A13 | Ranking hourly; dashboard cocok dengan event mentah ±1% | 10 |
| P2.3 | Notifikasi **in-app** (consumer `anime.episode.aired`, `comics.chapter.published`) + riwayat + input rating + stat TopBar | Badge episode baru muncul ≤ 2 menit setelah publish | 7 |
| P2.4 | Portal partner (`partner.tsukimi.my`): Keycloak Organizations, RBAC partner + RLS, `in_review`/four-eyes, drafts, onboarding | Partner hanya melihat/mengunggah title miliknya; approval wajib editor lain | 12 |
| P2.5 | Moderasi/laporan (A11), tools SEO (A9), bulk import (A14), kurasi Home penuh (A7) | Antrean laporan bisa ditindaklanjuti; import idempoten | 10 |
| P2.6 | TV polish (Android TV/Tizen/webOS) + **login device-code** + manajemen perangkat | D-pad key → fokus p75 ≤ 250 ms; TV login tanpa mengetik password | 8 |
| P2.7 | rclone reconcile semua bucket + drill restore bulanan otomatis + Velero + Kyverno verifyImages | Objek yang sengaja dihapus terdeteksi dan diperbaiki; image tanpa tanda tangan ditolak | 6 |
| P2.8 | i18n translation pass penuh + `ms` untuk halaman legal + WCAG 2.2 AA + Lighthouse CI | axe 0 critical; semua string ter-externalisasi | 6 |
| P2.9 | **Gerbang legal launch:** DPO terdaftar, breach register, TIA, notice EN/BM/ID, ToS, kebijakan cookie & hak cipta, ekspor/hapus lengkap, form takedown publik | Checklist §9.10 ditandatangani | 8 |
| P2.10 | Load test 20k penonton konkuren, tuning cache (segmen/halaman ≥ 95% hit), transcode paralel per rung | SLO 99,9% pada 20k; upload→playable p90 ≤ 20 menit | 8 |
| P2.11 | Drill DR regional (`asia-southeast2`), batas 3 stream konkuren, CUD | Drill ≤ 4 jam; stream ke-4 ditolak | 5 |
| P2.12 | pg_partman untuk `notify.notifications`/`cms.audit_log` (target Supabase: tabel biasa), ekspor WORM audit, `storage-replicator` KEDA | Pemeliharaan partisi otomatis; replikasi tidak rusak | 4 |

**Public launch ±minggu 31**, dengan syarat P2.9 lulus dan keputusan lisensi ada.

### 10.4 P3 Growth (minggu 32+, masing-masing butuh keputusan go)

1. Rekomendasi personal (co-watch/co-read dari ClickHouse), dengan uplift ≥ 5% di A/B (12 pd).
2. Web push + email digest (7 pd).
3. Monetisasi: VIP/langganan, entitlement, pembayaran, DRM jika diwajibkan (20 pd + DRM 8 pd).
4. Komentar/reaksi + moderasi, PWA + prefetch chapter offline, multi-profil (12 pd).
5. AV1/HEVC untuk title teratas (5 pd), JASSUB (3 pd), watermark forensik (12 pd).
6. Platform: Mimir/Grafana Cloud, preview env per PR dengan branch DB, Argo Rollouts canary, scrubber integritas mingguan, region kedua yang hangat, Go hot path (berdasarkan hasil k6).
7. Wrapper native (Android TV dulu) jika share TV > 15%. Evaluasi Module Federation jika mini-player lintas vertikal diwajibkan.

---

## 11. Tim & estimasi

### 11.1 Bentuk tim (3 dev, direkomendasikan)

| Peran | Fokus |
|---|---|
| **FE lead** | Monorepo, `packages/ui`/shell/sdk, app publik, player/reader, SEO, i18n, perf |
| **BE lead** | Moleculer, model data, outbox, progress, search, media pipeline |
| **Full-stack/Platform** | `apps/admin`, Terraform/GKE/Argo, Cloudflare, observability, CNPG/backup |
| + 0,5 desainer | Figma, AgeGate, UI admin, tema Keycloakify |
| + pengacara (eksternal) | §9.10, mulai P0 |

### 11.2 Timeline

| Skenario | P0 | P1 | Private beta | P2 | Public launch |
|---|---|---|---|---|---|
| **3 dev (dasar)** — 248 pd P0+P1 | 6 minggu | 14 minggu (termasuk buffer) | **±minggu 21** | ±10 minggu | **±minggu 31** |
| 2 dev (+40%) | ±8–9 minggu | ±20 minggu | ±minggu 29 | ±14 minggu | ±minggu 43 |
| 4 dev (−20%) | ±5 minggu | ±11 minggu | ±minggu 17 | ±8 minggu | ±minggu 25 |

Pekerjaan ini berat di integrasi, jadi penambahan orang tidak mempercepat secara linear. Skenario 4 dev hanya realistis jika dev ke-4 mengambil alih admin CMS atau platform.

**Jika tertinggal di sprint ke-4 P1:** komik masuk beta sebagai read-only tanpa sinkronisasi progress, dan sinkronisasi menyusul di minggu pertama P2.

---

## 12. Risiko & mitigasi

| # | Risiko | Dampak | Mitigasi |
|---|---|---|---|
| R1 | Sumber/lisensi konten belum jelas | Infringement, pemblokiran ISP, kehilangan Cloudflare/payment | Rights record wajib, takedown di MVP, gerbang launch P2, keputusan dengan pengacara di P0 |
| R2 | ToS Cloudflare soal video | Akun di-throttle atau disuspend | R2 sebagai origin penyajian lewat Worker, konfirmasi tertulis (spike f), kontinjensi Enterprise/Stream/CDN video |
| R3 | StyleX + RR7 SSR belum terbukti; hash drift | UI tanpa style | Spike P0 A vs B, `ui-guard`, satu versi, `rootDir` = root repo |
| R4 | `useCSSLayers` di TV lama | TV tampil tanpa style | Default `false`, uji Chromium 76/87, pertanyaan #4 |
| R5 | Kematangan `@moleculer/channels` | Event hilang atau macet | Spike P0, versi dipin, fallback `jetstream.mixin` dengan nats.js langsung |
| R6 | KEDA ScaledJob di JetStream cluster | Transcode tidak ter-scale | Spike P0, fallback scaler Prometheus nats-exporter |
| R7 | Kompatibilitas S3 IDrive e2 tidak penuh | Upload, lifecycle, atau Barman gagal | Matriks per panggilan (spike d), env checksum, salinan R2 |
| R8 | Supabase tidak mendukung pola DR jangka panjang | DR tidak tersedia | Verifikasi P0, fallback PeerDB/etl, DR baru di P2 |
| R9 | Slot logical memenuhi disk CNPG | Primary down | `max_slot_wal_keep_size 50GB`, volume WAL terpisah, alert 2/20 GB |
| R10 | DDL drift CNPG ↔ Supabase | Replikasi macet | Runner dual-target, aturan urutan, drift check, CI dua PG17 |
| R11 | Overengineering platform untuk tim 3 orang | Fitur terlambat | Deployable dipangkas (§5.2), item platform ditunda ke P2/P3, P0 di-time-box 6 minggu |
| R12 | Estimasi meleset | Beta mundur | Daftar tugas tunggal, buffer 1 minggu, aturan fallback komik read-only |
| R13 | Data personal bocor ke cache edge | Insiden privasi | Loader publik tidak membaca session, test CI tanpa Set-Cookie, bypass hanya route personal |
| R14 | Konten yang di-takedown tetap tersaji | Pelanggaran hukum | Cache-Tag di HTML + API, tanpa stale-if-error panjang, KV revokasi, acceptance 2 menit |
| R15 | Upload→live terlalu lambat | Rilis simulcast terlambat | Target p90 45 menit di P1, transcode per rung di P2, maks 20 job |
| R16 | Biaya sebelum ada pendapatan | Kehabisan dana | Hanya staging di P0–P1 (±$400–700/bulan), prod dibuat di akhir P1, budget alert, plafon dari pemilik produk |
| R17 | Kewajiban privasi (PDPA/UU PDP) | Denda, kehilangan kepercayaan | DPO/TIA/breach register sebagai gerbang launch, runbook 72 jam/7 hari/3×24 jam |
| R18 | Persepsi vertikal "actress" sebagai konten dewasa | Pidana, penolakan app store/payment | Kebijakan tanpa konten dewasa, rating oleh editor, review pengacara |
| R19 | Nama orang sungguhan di mock/fixtures | Personality rights/defamation | Diganti di P0.1 sebelum seed, guard CI |
| R20 | Operasi Keycloak (JVM, upgrade) | Beban ops | Operator + DB di CNPG, fallback better-auth dengan kontrak cookie yang sama |
| R21 | Valkey state hilang | Progress beberapa detik hilang | AOF + Sentinel, overlay klien LWW, alert `pb:dirty` |
| R22 | Regional/metro outage (GKE + Supabase di SG) | Downtime ≤ 4 jam | Pool fallback degraded, rebuild di Jakarta, risiko diterima dan tercatat |
| R23 | Biaya CPU imgproxy | Biaya naik | Bucket lebar, Tiered Cache, turunan statis sebagai jalan keluar |
| R24 | Malicious upload (FFmpeg/zip bomb) | RCE atau DoS | Sandbox, whitelist protokol, no-egress, ClamAV, upload hanya oleh staf |

---

## 13. Keputusan terbuka — pertanyaan untuk pemilik produk

Diurutkan dari yang paling memblokir. Default ditulis supaya pekerjaan bisa jalan sambil menunggu.

1. **Sumber dan lisensi konten:** lisensi dari distributor/penerbit, upload partner, produksi sendiri, atau campuran? Title dan teritori mana yang pertama? *(Default: engineering lanjut dengan rights record wajib. Public launch diblokir sampai ada jawaban.)*
2. **Pasar dan bahasa:** Indonesia + Malaysia saat launch? Locale default `id` + `en`, dan `ms` hanya untuk halaman legal, atau `ms` UI penuh? Entitas hukum operator (Sdn Bhd atau PT)? Pengguna EU di luar scope? *(Default: ID+MY, `id` default, `en`, `ms` legal, `ja` tidak dipakai.)*
3. **Vertikal "actress":** apakah ada konten dewasa/gravure? *(Default: tidak ada konten dewasa, maksimal rating 18 umum.)*
4. **Batas bawah TV:** apakah Samsung Tizen/LG webOS 2019+ (Chromium ±76) wajib didukung, atau ≥ Chromium 99? Apakah TV kritikal untuk launch? *(Default: 2019+, `useCSSLayers: false`, TV "berfungsi" di P1 dan dipoles di P2.)*
5. **Plan Cloudflare dan media:** setuju HLS disajikan dari salinan R2 (e2 tetap system of record)? Siap meminta konfirmasi tertulis ke Cloudflare? Kalau ditolak, pilih Enterprise, Stream, atau CDN video lain? *(Default: Pro + LB + Workers Paid, R2 via Worker.)*
6. **Plafon anggaran bulanan:** pra-launch (default ±$700) dan pasca-launch? Apakah GKE oke, atau pilih DOKS/LKE yang lebih murah?
7. **Model bisnis:** gratis/AVOD/langganan/VIP per chapter/early access? (ChapterList sudah punya badge VIP.)
8. **Tim dan tanggal:** konfirmasi 3 dev. Ada tanggal pasti untuk beta atau launch? Siapa yang on-call?
9. **Lokasi monorepo:** `p-project/tsukimi` (rekomendasi) atau `tsukimi.my` sendiri sebagai root? Backend di monorepo yang sama (default ya)? Org/plan GitHub mana?
10. **Residensi data:** apakah data pengguna wajib tetap di Indonesia/Malaysia, atau region Singapura (GKE, Supabase, e2, R2) bisa diterima dengan TIA?
11. **DRM:** apakah ada lisensor yang mewajibkan DRM atau watermark forensik? Berapa anggaran vendor?
12. **Partner self-upload** (portal P2), atau hanya editor internal?
13. **Supabase:** plan mana? Apakah add-on PITR dan IPv4 diterima? Hanya untuk DR, atau juga read-only untuk reporting?
14. **Toleransi kehilangan data saat failover regional:** apakah ≤ 60 s bisa diterima? Apakah RTO layanan 4 jam (cluster dingin) cukup, atau butuh region kedua yang hangat?
15. **Mini-player** yang bertahan antar video/anime/komik: wajib? (Kalau ya, keputusan tanpa Module Federation harus ditinjau ulang.)
16. **Usia minimum** (13 atau 18) dan **profil anak/multi-profil** per akun?
17. **Konten buatan pengguna** (komentar, review, upload): kapan, kalau ada?
18. **Live streaming:** pernah masuk scope, atau VOD saja?
19. **Subtitle ASS** (typesetting/karaoke anime): wajib dipertahankan (JASSUB), atau WebVTT cukup? Rung 360p dan AV1 di masa depan: setuju?
20. **Social login** selain Google (Apple, LINE, Discord, X) saat launch?
21. **Kategori/genre:** satu `/categories` lintas vertikal (app video), atau halaman genre per vertikal (`/anime/genre/x`, `/comics/genre/x`)?
22. **Personalisasi HTML:** apakah personalisasi sisi klien diterima di semua tempat (default), atau ada halaman (mis. home personal) yang harus di-render personal di server tanpa cache?
23. **Tooling SaaS:** apakah Chromatic, Grafana Cloud, atau PagerDuty berbayar boleh dipakai nanti, atau semuanya harus self-hosted?

---

## Appendix A: Hasil fact-check

| # | Klaim | Verdict | Sumber | Implikasi untuk rencana |
|---|---|---|---|---|
| 1a | Supabase bisa menjadi **subscriber** logical replication dari Postgres eksternal (CNPG) | Terkonfirmasi | supabase.com/docs/guides/platform/migrating-to-supabase/postgres | Didokumentasikan untuk migrasi, bukan DR, jadi disebut "supported-but-not-productised". Butuh: CNPG terjangkau via TLS + role REPLICATION khusus, migrasi DDL ke Supabase lebih dulu, sync sequence sebelum failover, monitoring slot dan `max_slot_wal_keep_size`, jangan memakai nama publikasi `supabase_realtime` (§6.3) |
| 1b | Supabase bisa menjadi **publisher** ke Postgres eksternal (direct connection, IPv6 atau add-on IPv4) | Terkonfirmasi | supabase.com/docs/guides/database/postgres/setup-replication-external | Failback butuh IPv6 egress atau **add-on IPv4 berbayar**. Jangan lewat pooler Supavisor. Batas slot/disk per plan perlu diverifikasi (§6.8) |
| 2a | CNPG mendukung publikasi/subscription ke dan dari cluster eksternal | Terkonfirmasi | cloudnative-pg.io/docs/devel/logical_replication | Publication CR di Git. Subscription di Supabase lewat SQL. Failback lewat Subscription CR. DDL/sequence/large object tidak direplikasi |
| 2b | Backup CNPG (base + WAL, PITR) ke S3-compatible seperti IDrive e2 | Terkonfirmasi | cloudnative-pg.io/docs/devel/backup; dokumentasi plugin barman-cloud | Pakai **Barman Cloud Plugin** (in-tree deprecated sejak 1.26). Set `endpointURL` e2 + dua env checksum. Salinan kedua + uji restore rutin, karena e2 tidak divalidasi vendor |
| 3 | IDrive e2 S3-compatible (multipart, presigned, lifecycle, versioning, object lock), punya replikasi, tanpa biaya egress | **Sebagian** | idrive.com/s3-storage-e2 (operations, presigned URL, FAQ replication, pricing) | Operasi utama didukung, tetapi tidak seluruh API S3, jadi **spike matriks per panggilan**. Replikasi hanya e2-ke-e2 (regional saja), sehingga provider kedua tetap dibutuhkan. **Egress gratis hanya sampai 3× volume tersimpan, lalu $0,01/GB**, jadi penyajian dipindah ke R2 |
| 4 | Cloudflare bisa failover origin S3 dan meng-cache segmen HLS | **Sebagian** | developers.cloudflare.com/load-balancing; cache default behavior; service-specific terms | LB adalah add-on berbayar (mulai ±$5/bulan). `.m3u8`/`.m4s`/`.vtt` tidak di-cache default, jadi butuh Cache Rule. **ToS membatasi video lewat CDN biasa di non-Enterprise kecuali via R2/Stream/Images**, jadi R2 dijadikan origin penyajian. Pull SigV4 butuh Worker (§7.1, §7.4) |
| 5a | RR7 framework mode + `@stylexjs/unplugin` (SSR + ekstraksi CSS) | **Sebagian** | stylexjs.com/docs/learn/installation/vite/react-router (RSC); dokumentasi opsi unplugin | Panduan resmi hanya untuk RSC, jadi framework-mode SSR **belum terbukti** dan masuk spike P0. Opsi `devPersistToDisk` dan `devMode` relevan. Versi `@stylexjs/*` dipin |
| 5b | StyleX punya panduan resmi untuk monorepo/paket komponen bersama | **Sebagian** | dokumentasi unplugin (`externalPackages`), Babel `unstable_moduleResolution` | Tidak ada panduan precompiled library, jadi strategi A vs B diputuskan di spike. `rootDir` identik di semua app. Cek CI nama var. Catatan: rencana ini memilih `useCSSLayers: false` karena keterbatasan TV, bukan prefix layer |
| 6 | KEDA punya scaler NATS JetStream berbasis lag consumer | Terkonfirmasi | keda.sh/docs/latest/scalers/nats-jetstream | Scaler community-maintained. Dukungan ScaledJob dan NATS cluster **tidak dinyatakan di halaman itu**, jadi diverifikasi di spike (c). Fallback scaler Prometheus. Endpoint monitoring hanya internal |
| 7 | Moleculer mendukung JetStream untuk event durable at-least-once | **Sebagian** | github.com/moleculerjs/moleculer-channels | Transporter NATS Moleculer = core NATS (tidak durable). Event durable lewat **`@moleculer/channels` adapter JetStream**. Kematangan belum jelas, jadi versi dipin + spike (b). Jangan pakai emit/broadcast untuk pekerjaan yang wajib terjadi |
| 8 | hls.js mendukung WebVTT dan audio alternatif (SUB/DUB), Safari memutar HLS native | Terkonfirmasi | README github.com/video-dev/hls.js | Satu master dengan grup AUDIO + SUBTITLES. hls.js dipakai jika didukung (termasuk iOS 17.1+ via MMS), native untuk Safari lama. Segmen fMP4/CMAF membuka jalan DRM |
| 9a | Kewajiban PDPA Malaysia (amandemen 2024) | Terkonfirmasi (ringkasan firma hukum, bukan teks resmi) | Baker McKenzie, DLA Piper, CMS, Hogan Lovells, Sidley; Breach Notification Guideline 25 Feb 2025 | Commissioner ≤ 72 jam (risiko signifikan atau > 1.000 subjek), pengguna ≤ 7 hari setelahnya, breach register 2 tahun, DPO didaftarkan (1 Jun 2025), portabilitas, whitelist dihapus + TIA, denda hingga RM1 juta. Masuk §9.7 + gerbang launch. **[LAWYER]** |
| 9b | Kewajiban UU PDP Indonesia | **Sebagian** | Sumber sekunder (hukumonline, firma hukum) | Berlaku penuh 17 Okt 2024. Breach ≤ 3×24 jam. Transfer berjenjang. **Lembaga PDP belum terbentuk, PP belum terkonfirmasi.** Detail DPO dan dasar hukum dari Pasal 20/53 belum diverifikasi ulang. Rencana tetap menyiapkan DPO + DPIA + consent per tujuan + age gating. **[LAWYER]** |

**Klaim lain yang belum di-fact-check dan karena itu diperlakukan sebagai [VERIFIKASI]:** status ingress-nginx, ketersediaan purge-by-tag di plan Cloudflare, kuota free tier Cloudflare Access, status GA Keycloak Organizations, FQDN NetworkPolicy GKE tanpa Enterprise, Object Lock/SSE e2 per region, IP egress statis Supabase, flag `synchronizeLogicalDecoding` per versi CNPG, cakupan Copyright Act 2022, waktu berlaku Online Safety Act 2025, SLA takedown PSE, dan semua harga di §7.8 dan §8.10.

---

## Appendix B: Daftar keputusan kanonik (resolusi kontradiksi)

| Topik | Pilihan tunggal |
|---|---|
| Auth | Keycloak + BFF `session`; cookie `__Host-tsk_sid` + `__Host-tsk_csrf`; tanpa `tk_at`/`tk_rt`/`tsk_sess`; `identity.users` dengan key Keycloak `sub`, tanpa password/role; fallback better-auth dengan kontrak sama |
| Cache HTML | Publik anonim di-cache tanpa memandang cookie; bypass hanya `/profile`, `/settings`, `/watchlist`, `/history`, `/auth/*`; cache key + `m\|d\|tv`; `/watch*` dan `/read*` s-maxage 30 |
| Aset | R2 `tsukimi-assets` di `assets.tsukimi.my/<app>/<hash>` + `ui/<hash>.css`; bukan `/_a` atau `/_assets` di pod |
| HTTPRoute | Digenerate dari `nav-manifest.ts` oleh `tooling/gen-routes`; ns `tsk-web`; parent `tsk-edge/public`; locale `/en` saja |
| Admin | `apps/admin` di `admin.tsukimi.my` (Access + Keycloak), API `admin.tsukimi.my/api/admin/v1`; partner `partner.tsukimi.my` (P2, Keycloak saja) |
| Workflow CMS | P1: status + scheduled publish + audit + revisi di service domain; P2: four-eyes/drafts/import di `cms` |
| Notifikasi | In-app P2; push/email P3 |
| Ranking | MVP dari Postgres (CronJob) ke `ranking.*`; ClickHouse P2 |
| Locale | `id` (default) + `en` di P1; `ms` legal sebelum launch; `ja` tidak dipakai |
| StyleX | Spike A vs B; `useCSSLayers: false`; satu `build.target`; `ui-guard` agnostik strategi |
| Repo | `git init` dulu; root `p-project/tsukimi`; `rootDir` = root repo |
| Kontrak | TypeBox di `packages/contracts` (bukan Zod) |
| Migrasi | Kysely Migrator + runner dual-target di `packages/db/migrations`; Job PreSync |
| Schema | Daftar §5.4; `ops_local` (outbox/inbox) tidak dipublikasikan; idempotency 24 jam |
| Halaman komik | `chapters.pages jsonb`; tanpa `chapter_pages` |
| Registry media | `media.assets` (domain) + `media.objects` (fisik) |
| Stream/subject | `TSK_DOMAIN/JOBS/TELEMETRY/DLQ`; `tsk.<ctx>.<agg>.<event>.v1`; consumer `media-transcode` dan sejenisnya |
| Job transcode | Spesifikasi §7.5 (backoffLimit 0, AckWait 120 s + working, 6 jam, per-rv, maks 20, node 16 vCPU) |
| Upload→live | p90 ≤ 45 menit (P1) |
| Ladder | 1080/720/480/360 |
| Token media | max(6 jam, durasi + 2 jam), tanpa IP, path, dual-kid bulanan; R2 → e2 (3 s) + KV revokasi |
| imgproxy | Format eksplisit di URL, cache key = URL |
| Takedown | Cache-Tag HTML + API, purge by tag (fallback URL), tanpa stale-if-error panjang, KV revokasi, ≤ 2 menit |
| Tracing | `@tsukimi/otel` OTLP; tracing broker dimatikan |
| Valkey | `valkey-cache` + `valkey-state` |
| Pool DB | Pooler transaction mode; relay/advisory/LISTEN/migrasi langsung ke `-rw` |
| UUID | v7 dari aplikasi; tanpa default DDL |
| Partisi | Progress hash statis sejak hari pertama; outbox/inbox tanpa partisi; pg_partman P2 (target Supabase berupa tabel biasa) |
| NetworkPolicy DR | Ingress LB → CNPG 5432; egress ke Supabase hanya saat failback |
| Fase DR | P0 spike, P1 HA + PITR + 1 restore, P2 Supabase |
| Retensi backup | PITR 30 hari, dump logis 12 minggu |
| RTO | DB 30 menit, layanan 4 jam |
| Secrets | GCP Secret Manager + ESO; Infisical fallback |
| Node | 24 LTS di semua image |
| Rate limit | `/auth/*` 10/menit, `/api/v1/playback/*` 30/menit, `/api/*` 600/menit per IP |
| Role | Keycloak: user/editor/moderator/admin (MVP), superadmin; rights_manager digabung ke admin; partner P2 |
| Rights | Modul di `v1.catalog` (MVP) + sweep 5 menit |
| Sitemap | Resource route per app ← `v1.seo sitemap-entries` |
| Perf/RUM | P1 Faro + size-limit; P2 LHCI + ClickHouse |
| Semantik pengiriman | At-least-once, diproses efektif sekali (inbox/Msg-Id) |
| Email | SES/Postmark/Resend + SPF/DKIM/DMARC, P0 |
| Keycloak DB | DB `keycloak` di CNPG, di luar replikasi, dump + ekspor realm |
| Dev lokal | docker-compose (k3d/Tilt opsional P2) |
| Kyverno/Velero/RLS/WORM/limit stream | P2 |
| Mimir/preview PR/Rollouts/scrubber | P3 |
| TV device login | P2 |
