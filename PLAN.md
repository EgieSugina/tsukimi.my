# Tsukimi — Master Plan

> **Tsukimi** (tsukimi.my, sebelumnya "Lucy4 Stream") adalah platform streaming web untuk anime, komik (manga/manhwa/manhua), dan video + direktori cast. **Setiap vertikal hidup di subdomain sendiri**, dan **anime dibangun pertama** (`anime.tsukimi.my`).
> Dokumen ini adalah rencana induk untuk pemilik produk dan engineer. Isinya menggabungkan draft Product, Frontend, Backend, Data/Media, Infra dan Security, ditambah semua koreksi dari critic dan hasil fact-check.
> Tanggal: 2026-10-12 · Status: **draft untuk keputusan**. Item yang belum terverifikasi ditandai **[VERIFIKASI]**, dan item yang perlu pengacara ditandai **[LAWYER]**.

**Riwayat revisi**
1. **Supabase dikeluarkan.** DR memakai **replica cluster CNPG** (replikasi fisik) di region kedua (§6).
2. **Setiap vertikal di subdomain sendiri:** `anime.tsukimi.my`, `comics.tsukimi.my`, `video.tsukimi.my`, dengan apex `tsukimi.my` sebagai hub. Routing berbasis path di satu host (`tsukimi.my/anime`, `/comics`, `/videos`) ditolak. Konsekuensinya: cookie session lintas subdomain (`__Secure-tsk_sid`, `Domain=tsukimi.my`), SEO per subdomain, dan HTTPRoute per hostname (§4, §8.4, §9.1).
3. **Fokus anime terlebih dahulu.** MVP (akhir P1) = private beta `anime.tsukimi.my` saja. Komik pindah ke P3, video + cast ke P4. Estimasi dihitung ulang (§10, §11).

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

**Apa yang dibangun.** Satu platform dengan tiga vertikal, **masing-masing di subdomain sendiri**. Ketiganya memakai satu akun Tsukimi, satu sistem progress, satu backend dan satu design system:
- **Anime — `anime.tsukimi.my` (dibangun pertama, MVP):** series → season → episode, SUB/DUB, filler/recap, kalender tayang mingguan yang sadar timezone.
- **Komik — `comics.tsukimi.my` (P3):** manga/manhwa/manhua, daftar chapter, reader vertikal webtoon / paged RTL-LTR / spread 2 halaman.
- **Video + cast — `video.tsukimi.my` (P4):** katalog, halaman tonton, direktori cast dengan ranking "Popular Actress".

**`tsukimi.my` (apex)** adalah hub: landing yang menautkan vertikal, akun/pengaturan global, dan halaman legal. Selama fase anime saja, apex dibuat minimal (default: landing sederhana dengan tautan besar ke anime, lihat pertanyaan #3). Login ada di `accounts.tsukimi.my` (Keycloak, satu akun untuk semua vertikal) dan admin CMS di `admin.tsukimi.my`. Tema gelap sebagai default, responsif dari ponsel sampai TV (D-pad).

**Pilihan arsitektur kunci**

| Area | Keputusan |
|---|---|
| Domain | **Satu subdomain per vertikal**: `anime.` (P1), `comics.` (P3), `video.tsukimi.my` (P4), apex `tsukimi.my` sebagai hub, ditambah `accounts.`, `admin.`, `media.`, `img.`, `assets.tsukimi.my`. Routing path di satu host ditolak. |
| Repo | pnpm + Turborepo monorepo di **`/home/errorgeist/LABs/p-project/tsukimi`**. Isi `tsukimi.my` saat ini menjadi `packages/ui`. |
| Frontend | React Router v7 framework mode (SSR), **microfrontend per subdomain**: `apps/anime` (MVP), `apps/hub` (apex, minimal), `apps/admin` (CSR), lalu `apps/comics` (P3) dan `apps/video` (P4). Shell bersama (`packages/shell`, termasuk vertical switcher di TopBar) dikomposisi saat build, tanpa Module Federation. HTTPRoute Gateway API mencocokkan **hostname**. |
| Styling | StyleX. Strategi kompilasi `packages/ui` diputuskan lewat **spike P0** (A: precompiled `ui.css`, B: source-transformed per app). Default `useCSSLayers: false` sampai batas bawah TV diketahui. |
| Backend | **Satu backend** untuk semua vertikal: Node.js 24 + TypeScript, Moleculer. **Core NATS** sebagai transporter (RPC), **`@moleculer/channels` di atas NATS JetStream** untuk event durable. Transactional outbox + idempotency. **Service MVP hanya yang dibutuhkan anime**; service komik/video/cast sudah didesain tetapi dijadwalkan di P3/P4. |
| Kontrak API | REST `/api/v1/*` yang dipanggil **same-origin di setiap subdomain** (tanpa CORS) dan dirutekan gateway ke backend yang sama. Skema **TypeBox** di `packages/contracts` → OpenAPI 3.1 → `openapi-typescript` + `openapi-fetch` di `packages/sdk`. |
| Auth | **Keycloak** (`accounts.tsukimi.my`) sebagai IdP di belakang **BFF session**. Cookie opaque **`__Secure-tsk_sid` dengan `Domain=tsukimi.my`** (satu login untuk semua subdomain, session di Valkey) + CSRF host-only `__Host-tsk_csrf` per subdomain. Login MVP: email + Google. |
| Database | PostgreSQL 17 di CloudNativePG (3 instance, quorum sync) sebagai **satu-satunya write primary**. **Replica cluster CNPG** (replikasi fisik) di region kedua untuk DR, **mulai P2**. Backup Barman Cloud Plugin ke IDrive e2 (PITR 30 hari). |
| Storage | **IDrive e2 = system of record** (upload, master, backup). **Cloudflare R2 = salinan sekunder sekaligus origin penyajian** media publik, lewat Worker `media-edge` dengan fallback ke e2. |
| CDN | Cloudflare (minimal Pro), Universal SSL untuk `tsukimi.my` + `*.tsukimi.my`, Cache Rules per host. HTML publik di-cache anonim, media lewat Worker + token di path, imgproxy dengan format eksplisit di URL. |
| Platform | GKE Standard di `asia-southeast1`. Argo CD + Helm (GitOps), Envoy Gateway (Gateway API), KEDA, ESO + GCP Secret Manager, cert-manager, LGTM stack + Faro RUM. |

**Target MVP (akhir P1).** Private beta **`anime.tsukimi.my`** untuk ≤ 5.000 pengguna undangan. Mereka login dengan satu akun Tsukimi, menjelajah katalog anime per musim dan genre, membuka detail series dengan daftar season/episode (filler/recap, SUB/DUB), menonton via HLS (1080/720/480/360) dengan audio SUB/DUB, subtitle WebVTT, skip intro/outro dan episode berikutnya, mengikuti kalender tayang mingguan di timezone sendiri, mencari, menyimpan watchlist/follow, dan melanjutkan progress lintas perangkat. Editor menjalankan katalog anime dari CMS (series, season, episode, upload/transcode, jadwal tayang, rights, audit log). **Komik, video dan cast tidak ada di MVP.** Trending dihitung dari Postgres (ClickHouse baru di P2). DR replica cluster di region kedua di P2.

**Timeline (asumsi 3 dev).** P0 Foundation **6 minggu (78 pd)** → P1 Anime MVP **12 minggu (138 pd, termasuk 1 minggu buffer)** → **private beta `anime.tsukimi.my` ±minggu 19** → P2 Anime scale & public launch ±9 minggu (±90 pd) → **public launch anime ±minggu 28**, dengan syarat keputusan lisensi konten sudah ada → P3 `comics.tsukimi.my` ±4 minggu (±minggu 32) → P4 `video.tsukimi.my` + cast ±4 minggu (±minggu 36). P3 dan P4 masing-masing butuh keputusan go. Total P0+P1 ≈ **216 person-day** (sebelumnya 248 pd untuk tiga vertikal sekaligus). Dengan 2 dev, tambahkan ±40%. Dengan 4 dev, kurangi ±20%.

**Tiga hal yang memblokir public launch (bukan engineering):** (1) sumber dan lisensi konten anime, (2) konfirmasi tertulis dari Cloudflare soal penyajian HLS dari R2 via Worker, (3) kewajiban PDPA/UU PDP (DPO, TIA, notice).

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

**Rename ke Tsukimi sudah selesai:** brand `Tsukimi`, `SITE.url = https://tsukimi.my` (akan diganti `configureSeo()` dengan base URL per vertikal, mis. `https://anime.tsukimi.my`, §4.10), storage key `tsukimi-theme`, paket `@tsukimi/ui`, docs, stories, video demo, dan 20 screenshot README.

**Temuan yang harus ditangani di P0**

| # | Temuan | Lokasi | Aksi |
|---|---|---|---|
| F1 | `headTagsToHtml()` menulis JSON-LD **tanpa escape `<`**. Ini membuka stored XSS kalau judul dari CMS berisi `</script>`. | `src/seo/seo.ts` (±baris 332) | Escape `<`, U+2028, U+2029 seperti `Seo.tsx`, plus unit test. |
| F2 | Nama atribut meta/link diinterpolasi tanpa escape. | `src/seo/seo.ts` (±328–330) | Allow-list nama property/rel. |
| F3 | `VideoPlayer` memakai `<source>` MP4 per kualitas dan SUB/DUB dengan swap `sources`. | `VideoPlayer.tsx` | Adapter hls.js dengan audio group (§4.9). |
| F4 | Mock berisi **nama orang sungguhan** bercampur nama fiktif. | `src/mocks/data.ts` (±54) | Ganti dengan nama fiktif **sebelum** fixtures/seed dibuat, plus cek grep allowlist di CI. |
| F5 | `ThemeProvider` membaca `localStorage` saat init, dan `DeviceProvider` default lebar 1440 di server. | `ThemeProvider.tsx`, `device.tsx` | Hydration-safe (§4.6). |
| F6 | Nav (`TopBar`/`Sidebar`/`BottomNav`) memakai `onNavigate(id)` tanpa `href`. | komponen nav | Tambah `href` + `LinkProvider` (URL absolut untuk link lintas subdomain). |

**Gotcha StyleX yang sudah terbukti.** Hash var/class bergantung pada nama paket + path file + opsi plugin. Rename sebelumnya merusak CSS dev sampai cache dibersihkan. Konsekuensinya, `packages/ui` harus dikompilasi **konsisten** di semua app (§4.4).

### 1.2 Referensi Figma

File "Web Stream — UI Reference" memakai token desain yang sama. Akunnya Starter plan, dan MCP-nya rate-limited, jadi Figma berfungsi sebagai **referensi visual**. Sumber kebenaran token tetap `packages/ui/src/tokens`. Figma Code Connect baru dipertimbangkan di P5.

### 1.3 Lokasi aplikasi (permintaan "aplikasi pindah ke sini")

Rekomendasi: **root monorepo baru di `/home/errorgeist/LABs/p-project/tsukimi`**. Isi `tsukimi.my` dipindahkan ke `packages/ui`. Langkahnya:
1. `git init` + commit awal tree `tsukimi.my` apa adanya (snapshot).
2. Buat root `tsukimi/`, lalu `git mv` isi ke `packages/ui`. Alternatifnya, inisialisasi git di root baru lalu salin, dengan commit pertama berisi snapshot.
3. Ubah `rootDir` StyleX dari `process.cwd()` ke **root repo** lewat `tooling/stylex-config`.

Dokumen `PLAN.md` ini ikut pindah ke `tsukimi/docs/PLAN.md`. Alternatif yang juga sah: jadikan `tsukimi.my` sendiri sebagai root monorepo. Pilihan final ada di pertanyaan terbuka #9.

---

## 2. Lingkup produk, persona & MVP

### 2.1 Definisi produk

| Vertikal | Subdomain | Fase | Hierarki | Aksi utama | UI yang sudah ada |
|---|---|---|---|---|---|
| **Anime** | `anime.tsukimi.my` | **P1 (MVP)** | Series → Season → Episode (SUB/DUB, filler/recap) + slot tayang | Tonton, ikuti jadwal | AnimeCard, EpisodeList, AiringCalendar, VideoPlayer; AnimePage, AnimeDetailPage, WatchPage |
| Komik | `comics.tsukimi.my` | P3 | Series → Chapter → Page | Baca | ComicCard, ChapterList, ComicReader; ComicsPage, ComicDetailPage, ComicReaderPage |
| Video + cast | `video.tsukimi.my` | P4 | Title → (Series → Episode) → Asset | Tonton | VideoPoster, VideoCard, CastPolaroid, CastRosterCard, CategoryTile; HomePage, VideoLibraryPage, CastDirectoryPage, CategoriesPage |
| Hub | `tsukimi.my` (apex) | P1 minimal | Landing → vertikal; legal; akun global (P3) | Pilih vertikal | Belum ada (dikomposisi dari komponen yang ada) |
| Lintas vertikal | semua host | P1 | Satu akun Tsukimi, progress, watchlist, genre, preferensi | Temukan, lanjutkan | AppShell, TopBar (+ vertical switcher, gap), Sidebar, BottomNav, SearchField, FilterDropdown, Chip, NavTab, ProgressBar, StatPill, ThemeProvider, DeviceProvider, `src/seo/*` |

**Asumsi**
- **A1 Positioning:** cepat dan bebas iklan di MVP, dengan standar "resume satu tap" dan "playback mulai < 2 s". Model bisnis belum ditentukan, tetapi field `access`/entitlement disiapkan karena ChapterList sudah menampilkan badge VIP.
- **A2 Konten:** hanya konten yang haknya dimiliki (milik sendiri, partner, atau berlisensi). Tidak ada scraper atau embed pihak ketiga. Setiap title wajib punya rights record. Ini **gerbang public launch**, bukan gerbang engineering.
- **A3:** target metrik pasca-launch adalah placeholder dan dikalibrasi ulang setelah 4 minggu beta.
- **A4:** 3 dev + 0,5 desainer + 0,5 SRE (bisa salah satu dari 3 dev).
- **A5:** pasar utama **Indonesia + Malaysia** (domain .my). Locale UI `id` (default) + `en`, timezone default `Asia/Jakarta`.
- **A6:** katalog beta **±50 seri anime**. Angka komik (±200 seri) dan video (±300) baru relevan di P3/P4. Angka di mock (12.480 video, dan seterusnya) hanya placeholder.
- **A7:** **tidak ada konten dewasa.** Vertikal "actress" (P4) diperlakukan sebagai konten umum/mature ≤ 18 (§9.6).
- **A8:** urutan peluncuran vertikal: anime → komik → video + cast. Setiap vertikal baru adalah situs SEO baru dan app baru, tetapi memakai backend, akun, dan shell yang sama.

### 2.2 Persona

| Persona | Siapa | Pekerjaan utama | Perangkat | Fase |
|---|---|---|---|---|
| **Viewer** ("Raka", 24, Jakarta) | Penonton anime malam hari | Lihat yang baru malam ini, lanjutkan tontonan, ganti SUB/DUB, skip intro, ikuti seri dalam WIB | Ponsel 60%, laptop 30%, TV 10% | P1 |
| **Editor/Admin** (internal 1–5 orang) | Kurator katalog | Upload episode 1,5 GB, set jam tayang JST, featured Home anime, takedown. (P3: bulk-upload 60 halaman chapter) | Desktop | P1 |
| **Moderator** (sekunder) | Laporan, takedown, akun | Takedown < 15 menit, suspend akun | Desktop | P1 (takedown), P2 (antrean) |
| **Partner** | Studio/penerbit berkontrak | Upload ke title miliknya saja, lihat status proses dan statistik | Desktop | P2 |
| **Reader** ("Sari", 21) | Pembaca manhwa harian | Notifikasi chapter baru, lanjut di halaman yang tepat, scroll vertikal mulus | Ponsel 80%, tablet 20% | P3 |

### 2.3 Inventaris fitur viewer

Legenda: **Ada** = komponen/halaman sudah ada dengan mock. **Gap** = UI belum ada. **P5** = backlog growth (§10.6).

| # | Fitur | UI | Fase |
|---|---|---|---|
| F1 | App shell, tema dark/light/system, **vertical switcher di TopBar** (vertikal yang belum live = "segera hadir") | Ada (switcher: Gap) | P1 |
| F2 | Home anime: hero, "Tayang musim ini", Continue Watching, Trending | Ada (komposisi dari HomePage/AnimePage) | P1 (trending dari Postgres) |
| F3 | Browse anime per **musim** (tahun + season) dan **genre**, filter/sort | Ada (AnimePage, FilterDropdown) | P1 |
| F4 | Detail series: tab season, daftar episode (filler/recap, SUB/DUB) | Ada | P1 |
| F5 | Watch: player HLS (kualitas, speed, WebVTT, SUB/DUB, skip intro/outro, marker, autoplay-next, PiP, keyboard) | Ada (MP4) | P1 (hls.js) |
| F6 | Kalender tayang mingguan timezone-aware + auto-publish | Ada | P1 |
| F7 | **Search** (indeks anime saja di `anime.tsukimi.my`) | Sebagian | P1; indeks komik P3, video/cast P4; pencarian lintas vertikal di hub P5 |
| F8 | **Auth** (email + Google), satu akun untuk semua subdomain | Gap | P1 |
| F9 | **Continue Watching** | Gap | P1 (Continue Reading P3) |
| F10 | **Watchlist/Follow** anime | Gap | P1 |
| F11 | **Settings** (tema, default SUB/DUB, bahasa subtitle, timezone; mode reader di P3) | Gap | P1 |
| F12 | **Hub apex**: landing dengan tautan besar ke anime + halaman legal | Gap | P1 minimal; akun/pengaturan global di apex P3 |
| F13 | Komik: browse, detail + chapter list, reader | Ada | **P3** (VIP gating P5) |
| F14 | Video: library dengan filter/sort, kategori, detail + watch | Ada/Sebagian | **P4** |
| F15 | Direktori cast + ranking mingguan, **profil cast** (bio, filmografi, Person JSON-LD) | Ada/Gap | **P4** |
| F16 | Riwayat | Gap | P2 |
| F17 | Notifikasi | Gap (ikon saja) | **P2 in-app**, P5 web push/email |
| F18 | Input rating | Sebagian | P2 |
| F19 | Komentar | Gap | P5 |
| F20 | Rekomendasi | Statis | P1 statis → P5 personal |
| F21 | TV 10-foot UI | Ada (device layer) | P1 "berfungsi", P2 polish |
| F22 | i18n UI | Gap | **P1 infra + id/en**, P2 translation pass penuh + `ms` untuk halaman legal |
| F23 | VIP/premium/payments | Gap | P5 (perlu keputusan) |
| F24 | PWA/offline | Gap | P5 |
| F25 | Stat pill TopBar dengan data nyata | Statis | P2 |

### 2.4 Admin CMS (`apps/admin`)

**Keputusan:** satu app, **`apps/admin`**, disajikan di **`admin.tsukimi.my`** untuk semua vertikal (modul per vertikal diaktifkan sesuai fase). Client-rendered, `noindex`. Staf masuk lewat **Cloudflare Access + Keycloak client `tsukimi-admin`**, dengan cookie session staf host-only yang terpisah (§9.1). API-nya `admin.tsukimi.my/api/admin/v1` (deployment `api-admin`). Partner (P2) memakai app yang sama di `partner.tsukimi.my` (first-party) dengan **Keycloak saja**, tanpa Cloudflare Access. Alasannya, Access ditujukan untuk staf (free tier ±50 user [VERIFIKASI]).

| # | Modul | Fase |
|---|---|---|
| A1 | Titles: CRUD, slug, sinopsis id/en, genre/tag, **status** (draft → scheduled → published → unlisted → taken_down), cover dengan focal point, studio/penerbit, rating usia, **blok hak/lisensi** (licensor, teritori, window) | **P1: anime series**; P3: comic series; P4: video |
| A2 | Season/episode anime: flag filler/recap/premiere/finale, asset per varian audio, intro/outro, marker, subtitle per bahasa | P1 |
| A3 | Upload video: presigned multipart resumable, status job transcode, picker thumbnail, ganti asset tanpa ganti ID. Setelah upload master selesai (`uploads.complete`), sistem **juga** mengantre relay salinan master ke **Gofile (guest account)** dan menyimpan `downloadPage` sebagai link download sementara (§7.1b); status relay (`pending/ok/failed/skipped`) dan link tampil di kartu episode CMS, dengan tombol *retry* manual | P1 |
| A4 | Chapter komik: bulk upload folder/ZIP/CBZ, natural sort, reorder, deteksi strip panjang, mode baca default per seri | P3 |
| A5 | Jadwal tayang: aturan berulang (mis. "Sab 23:30 JST, 12 ep"), override slot, simpan UTC + TZ sumber, auto-publish | P1 |
| A6 | Profil cast: CRUD, alias, foto berlisensi, link ke title, merge duplikat | P4 |
| A7 | Kurasi Home anime | P1 minimal (hero + 1 row) → P2 penuh |
| A8 | Taksonomi (genre, tag, studio, musim) | P1 |
| A15 | **Matching metadata MyAnimeList** (§7.1c): editor mencari judul di MAL dari form seri, lihat preview field (judul alt, sinopsis, genre, studio, musim, poster), pilih field mana yang diimpor sebagai draft (tidak auto-publish), simpan `mal_id` untuk re-sync manual | P1 minimal (judul/genre/sinopsis draft) |
| A9 | Tools SEO (override meta, audit SeoOptimizer) | P2 |
| A10 | User & role (Keycloak) + **audit log** | P1 audit log + 4 role, P2 UI moderasi |
| A11 | Laporan & takedown | P1 tombol takedown (§9.5), P2 antrean laporan |
| A12 | Portal partner | P2 |
| A13 | Dashboard analitik | P2 (Grafana/ClickHouse) |
| A14 | Bulk import CSV/JSON | P2 |

**Workflow konten (keputusan resolusi fase):**
- **P1:** field status per entity (`draft → scheduled → published → unlisted → taken_down`), CronJob publish terjadwal, **audit-log mixin** (dalam transaksi yang sama, role insert-only) dan histori `content_revision`. Semuanya hidup di service catalog/anime (komik di P3, video di P4), **tanpa service `v1.cms` terpisah**.
- **P2:** state `in_review`/`approved` dengan aturan **four-eyes**, yang baru diperlukan setelah ada partner atau lebih dari 2 editor. Ditambah tabel drafts dan bulk import, lewat service `cms` yang ruang lingkupnya sempit.

### 2.5 Definisi MVP (akhir P1)

**Tujuan:** private beta **`anime.tsukimi.my`** untuk ≤ 5.000 pengguna undangan.

**MASUK MVP (anime saja)**
- Katalog anime: Home anime, browse per musim dan genre, detail series, daftar season/episode (filler/recap, badge SUB/DUB), semua tersambung ke API nyata (F1–F12).
- Halaman tonton: HLS 1080/720/480/360 via hls.js, audio SUB/DUB sebagai audio group, subtitle WebVTT id/en, skip intro/outro, episode berikutnya (autoplay-next), progress server-side (resume di perangkat lain ≤ 10 s).
- Kalender tayang mingguan dari jadwal nyata (timezone-aware), dengan auto-publish.
- Search dengan indeks anime saja.
- Auth satu akun Tsukimi (email + Google) lewat `accounts.tsukimi.my`, cookie session yang sudah berlaku lintas subdomain.
- Continue Watching, watchlist/follow, settings tersimpan di server.
- SSR + `<Seo>` + JSON-LD (TVSeries/TVEpisode) di setiap halaman publik, sitemap + robots + canonical milik `anime.tsukimi.my`, domain property Search Console.
- Hub apex minimal: landing dengan tautan besar ke anime + halaman legal (privacy, ToS, hak cipta).
- CMS khusus anime: A1 (anime series + blok hak/lisensi), A2, A3, A5, A8, A10 (audit log + role), A7 minimal, takedown dengan purge.
- **Trending dari Postgres** (CronJob malam hari + pinning editorial).
- Locale `id` (default) + `en`.
- Rating usia + gate dasar.
- Dark default, responsif ponsel/tablet/laptop. TV "berfungsi" (D-pad menjangkau semua elemen).

**KELUAR dari MVP:** **`comics.tsukimi.my` (P3), `video.tsukimi.my` + direktori/profil cast (P4)** beserta service, schema, modul CMS dan reader-nya; akun global di apex (P3); pembayaran/VIP, iklan, komentar, input rating, rekomendasi personal, notifikasi, portal partner, DRM, app native, PWA offline, multi-profil, download, replica cluster DR, ClickHouse, TV polish, login TV device-code, locale `ms`/`ja`.

**Exit criteria MVP (gerbang menuju P2/launch)**
1. Walkthrough setiap journey P1 (§2.6: J1, J2, J5, J6) lulus di Chrome Android, Safari iOS, Chrome/Firefox desktop, dan 1 browser Android TV/Tizen.
2. p75 LCP < 2,5 s, INP < 200 ms, CLS < 0,1 pada Home anime, detail series, Watch, dan jadwal (RUM Faro, perangkat kelas Moto G di 4G).
3. Video start time p75 < 2,0 s, rebuffer < 1%.
4. **Upload-complete → playable p90 ≤ 45 menit** untuk episode 1080p 24 menit. Target di-relax dari 30 menit karena transcode masih satu job. Paralelisme per-rung ditinjau di P2.
5. Restore PITR manual berhasil satu kali dan terdokumentasi.
6. Takedown: playback gagal ≤ 2 menit setelah eksekusi (§9.5).
7. Login di `anime.tsukimi.my` terbaca di `tsukimi.my` (dan sebaliknya), logout menghapus session di semua subdomain.
8. Keputusan lisensi konten anime tercatat. Ini gerbang public launch saja.

### 2.6 Journey inti

- **J1 Discover → Watch (anime, P1):** Home `anime.tsukimi.my` → "Tayang musim ini" → detail series (tab season, sembunyikan filler) → Watch (auto-resume, Skip Intro, SUB/DUB) → countdown autoplay-next. *Event:* `impression`, `title_open`, `play_request`, `first_frame_ms`, `progress` (buffered), `complete` (≥ 90%), `next_auto`.
- **J2 Kembali (P1):** Continue Watching di Home anime, kalender "Followed only" di timezone pengguna. Badge episode baru muncul di P2.
- **J3 Discover → Read (P3, `comics.tsukimi.my`):** "Chapter baru hari ini" → detail ("Lanjut Ch. 37 · hlm 14") → reader vertikal → progress (debounce 3 s + saat keluar) → End-of-Chapter → prefetch 3 halaman pertama chapter berikutnya pada 80% scroll.
- **J4 Cast (P4, `video.tsukimi.my`):** Popular actress → profil cast → filmografi → tonton.
- **J5 Search (P1):** typeahead ≤ 100 ms p95 di indeks anime. Pengelompokan per vertikal baru relevan setelah P3/P4.
- **J6 Editor publish episode (P1):** CMS → seri → season → episode baru → drag master → job card transcode → set intro/outro → lampirkan .vtt id/en → *Scheduled* pada slot Sab 23:30 JST → CronJob publish.
- **J7 Editor upload chapter (P3):** drop ZIP/CBZ → urut, preview, reorder → publish/jadwalkan.
- **J8 Partner (P2):** upload ke draft → review → live → statistik.

### 2.7 Metrik sukses

| Area | Metrik | Target beta (anime) | 6 bulan pasca-launch (placeholder) |
|---|---|---|---|
| Reach | DAU/MAU | ≥ 20% | ≥ 25% |
| Anime (tonton) | Watch time/DAU; completion episode | ≥ 35 min; ≥ 55% | ≥ 45 min; ≥ 60% |
| Komik (P3) | Halaman/reader-DAU; completion chapter | — | ≥ 80; ≥ 75% |
| Retensi | D1/D7/D30 | 35/18/8% | 40/22/12% |
| Loop | CTR Continue row; follow rate | ≥ 30%; ≥ 25% | ≥ 35%; ≥ 35% |
| Search | Sesi search → buka title ≤ 60 s | ≥ 60% | ≥ 70% |
| CWV (RUM p75) | LCP/INP/CLS | < 2,5 s / < 200 ms / < 0,1 | ≥ 90% URL "Good" |
| QoE | Start time p75, rebuffer, gagal playback | < 2,0 s, < 1%, < 0,5% | < 1,5 s, < 0,5%, < 0,3% |
| Reliabilitas | Availability API tonton | 99,5% | 99,9% |
| Ops | Upload→live p90; takedown | **≤ 45 min**; ≤ 15 min | ≤ 20 min (setelah transcode paralel); ≤ 10 min |
| SEO | Sitemap `anime.tsukimi.my` tersubmit; share organik | 100% | ≥ 30% |

### 2.8 Analitik & event (subbagian lintas-seksi)

- **Taksonomi event** mengikuti instrumentasi journey: `impression`, `title_open`, `play_request`, `first_frame`, `progress`, `complete`, `search`, `search_result_click` (P1); `read_page`, `chapter_complete` (P3). Setiap event membawa atribut `vertical` dan `host`.
- **P1:** Grafana Faro (web-vitals + QoE hls.js) di `packages/shell` → Alloy → Loki/Tempo. Event produk minimal dicatat sebagai log terstruktur.
- **P2:** `analytics-ingest` (beacon → stream `TSK_TELEMETRY` → ClickHouse), ekspor RUM ke ClickHouse, trending/ranking hourly.
- **Consent gating:** event non-esensial hanya dikirim jika cookie consent analytics = ya (§9.7). Cookie consent memakai `Domain=tsukimi.my` agar pilihan berlaku di semua subdomain.

---

## 3. Arsitektur sistem

### 3.1 Diagram keseluruhan

```
                                   Pengguna (ponsel / tablet / laptop / TV)
                                                   │ HTTPS
┌──────────────────────────────────── Cloudflare (Pro+) ──────────────────────────────────────────┐
│ WAF + Super Bot Fight Mode + rate limit · Cache Rules per host · LB (prod-gke → "degraded")      │
│ Universal SSL: tsukimi.my + *.tsukimi.my · cookie session Domain=tsukimi.my                      │
│                                                                                                  │
│  anime.tsukimi.my ─────────► HTML + /api/v1 (origin)   assets.tsukimi.my ──► R2 tsukimi-assets   │
│  comics.tsukimi.my [P3] ───► HTML + /api/v1 (origin)   media.tsukimi.my  ──► Worker media-edge   │
│  video.tsukimi.my  [P4] ───► HTML + /api/v1 (origin)                          │  KV revocation   │
│  tsukimi.my (hub, apex) ───► HTML (origin)                                    ├─► R2 tsukimi-media│
│  accounts.tsukimi.my ──────► Keycloak (origin)                                └─► IDrive e2 (fallback)
│  admin.tsukimi.my (Access) ► web-admin + /api/admin/v1   img.tsukimi.my ──► imgproxy (origin)    │
└───────────────────────────────┬─────────────────────────────────────────────────────────────────┘
                                │ Authenticated Origin Pulls, Full (strict)
┌───────────────────────────────▼──────────── GKE asia-southeast1 ────────────────────────────────┐
│ ns tsk-edge:  Envoy Gateway "public" ── HTTPRoute per hostname (digenerate dari nav-manifest)     │
│               · imgproxy                                                                         │
│ ns tsk-web (SSR RR7, Node 24):  web-anime  web-hub  web-admin(static)   [P3] web-comics          │
│                                                                         [P4] web-video           │
│      │  SSR loader → API internal (JWT servis 5 menit dari session)                               │
│ ns tsk-svc (Moleculer, moleculer-runner):                                                         │
│   api-public (/api/v1 di setiap host vertikal)  api-admin (/api/admin/v1)  session               │
│   catalog[catalog+anime+rights · P3 +comics · P4 +video/cast]  media  progress  search-seo       │
│   outbox-relay(+DLQ)  storage-replicator                                                          │
│   CronJobs (publish, airing, ranking, rights-sweep, reconcile)                                    │
│      ▲ RPC: core NATS          ▲ event durable: @moleculer/channels ⇄ JetStream                   │
│ ns tsk-media: KEDA ScaledJob media-validate · media-transcode · image-process · [P3] comic-process│
│ ns tsk-data:  CNPG tsukimi-pg (3 inst, quorum sync) + Pooler rw/ro · NATS JetStream R3 ·          │
│               valkey-cache · valkey-state (Sentinel) · Meilisearch · Keycloak (+ DB "keycloak")   │
│               [P2] ClickHouse                                                                     │
└──────┬────────────────────────────┬──────────────────────────────────────┬──────────────────────┘
       │ WAL + base (Barman plugin) │ WAL archive / streaming [P2]         │ S3 API
       ▼                            ▼                                      ▼
  IDrive e2 tsukimi-backups    CNPG tsukimi-pg-dr (asia-southeast2) IDrive e2 (uploads-staging,
  (+ salinan rclone crypt di R2) replica fisik, read-only            originals, media) ──event──► R2
```

Semua host vertikal memanggil `/api/v1/*` di origin-nya sendiri. Gateway memetakan path itu ke satu deployment `api-public`, jadi hanya ada **satu backend** dan tidak ada CORS. Host berlabel [P3]/[P4] belum ada di MVP; record DNS dan HTTPRoute-nya dibuat saat vertikal itu diluncurkan.

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
       consumer media-gofile-relay (upload.completed, hanya title tanpa batas teritori) ─► ScaledJob/Service
            stream GET master dari e2 ─► POST upload.gofile.io/uploadfile (guest token tersimpan)
            ok   ─► media.gofile_links{status=ok, download_page} + outbox "tsk.media.gofile.link.ready.v1"
            gagal ─► retry backoff standar, maks 8x ─► status=failed (tampil di CMS untuk retry manual)
Penonton:
  POST /api/v1/playback/{type}/{id} ─► rights.isAvailable + token HMAC (path) ─► URL master
  hls.js ─► media.tsukimi.my/t/{token}/v/{id}/{rv}/master.m3u8
           Worker: verifikasi token → cek KV revocation → cache (key tanpa token) → R2 → (miss/5xx/3 s) e2
```

### 3.3 Alur data: penulisan progress

```
Player: onProgress (throttle 15 s + pause/seek/ended/visibilitychange via sendBeacon)
Reader [P3]: onPageChange (debounce 3 s + keluar chapter)
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
2. **Satu app per subdomain.** `apps/anime` memiliki seluruh `anime.tsukimi.my` (dari root `/`), `apps/hub` memiliki apex `tsukimi.my`, dan nanti `apps/comics`/`apps/video` memiliki subdomain masing-masing. Navigasi di dalam satu vertikal memakai soft nav React Router. Pindah vertikal berarti pindah origin (full document load biasa).
3. **Satu identitas StyleX:** satu versi, satu config, nama paket `@tsukimi/ui` dan path token yang dibekukan.
4. **HTML publik sama untuk semua orang**, sehingga bisa di-cache. Data personal dimuat di sisi klien dari `/api/v1/me/*` (same-origin di setiap host).
5. **`@tsukimi/ui` tetap agnostik router dan data.** Link disuntikkan lewat context.
6. **Anime dulu.** Hanya `apps/anime`, `apps/hub` (minimal) dan `apps/admin` yang dibangun sampai P2. `apps/comics` (P3) dan `apps/video` (P4) memakai shell, SDK, auth dan pola yang sama, sehingga peluncurannya terutama pekerjaan fitur.

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
│  ├─ shell/       @tsukimi/shell     AppFrame, TopBar + vertical switcher, nav-manifest.ts (host + status per
│  │                                  vertikal), AppLink, route module bersama (/auth/*, /profile, /settings),
│  │                                  theme script, Faro RUM, 404/error
│  ├─ sdk/         @tsukimi/sdk       client openapi-fetch, queryOptions, getSession/requireSession, imgproxy helper
│  ├─ i18n/        @tsukimi/i18n      Lingui config + katalog bersama
│  ├─ fixtures/    @tsukimi/fixtures  mock (nama fiktif) + MSW handlers
│  ├─ contracts/   @tsukimi/contracts TypeBox → OpenAPI 3.1 + skema payload event
│  ├─ db/          @tsukimi/db        Kysely, kysely-codegen, migrations/, runner Migrator
│  ├─ broker-kit/  @tsukimi/broker-kit moleculer.config, mixins (db, outbox, channels, idempotent, audit, authz), errors
│  └─ otel/        @tsukimi/otel      middleware Moleculer OTLP, instrumentasi SSR
├─ apps/
│  ├─ anime/    anime.tsukimi.my (MVP): /  /browse  /season/:year/:season  /genre/:slug  /series/:slug
│  │            /watch/:slug/:season/:episode  /schedule  /search  /watchlist  /settings  /profile
│  │            /auth/*  /sitemap.xml  /sitemap-*.xml  /robots.txt   (semuanya juga di bawah /en)
│  ├─ hub/      tsukimi.my (apex, minimal di P1): /  /legal/*  /robots.txt  /sitemap.xml   [P3] /account/*
│  ├─ admin/    admin.tsukimi.my (CSR, noindex)
│  ├─ comics/   [P3] comics.tsukimi.my: /  /browse  /series/:slug  /read/:slug/:chapter  /search  …
│  └─ video/    [P4] video.tsukimi.my: /  /videos  /watch/:slug  /cast  /cast/:slug  /categories  …
├─ services/   api  session  catalog  media  progress  search-seo  outbox-relay  storage-replicator
│              [P2+] ranking analytics-ingest notifications cms   [P5] entitlements
├─ workers/    media-edge (Cloudflare Worker)
├─ jobs/       media-validate  media-transcode  image-process   [P3] comic-process
├─ charts/     tsukimi-lib  web-app  moleculer-service  media-job
├─ infra/terraform/  gcp-project  gke-staging  gke-prod  artifact-registry  cloudflare  dns
└─ loadtest/   skenario k6
```

**Skema URL anime.** Skema lama `/anime`, `/anime/schedule`, `/anime/:slug`, `/anime/:slug/:ep` di-re-root ke root subdomain: `/`, `/schedule`, `/series/:slug`, dan `/watch/:slug/:season/:episode` (nomor season eksplisit karena nomor episode bisa reset per season). Belum ada yang diluncurkan, jadi tidak perlu redirect.

**Route akun.** `/auth/*`, `/profile`, `/settings`, dan `/watchlist` adalah route module bersama dari `packages/shell` yang dipasang di setiap app vertikal (di MVP hanya `apps/anime`). Preferensi sudah global sejak P1 karena disimpan di server (`identity.user_prefs`). Halaman akun global di apex (`tsukimi.my/account`) baru dibuat di P3, saat vertikal kedua hidup. Rencana lama `apps/account` dihapus.

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
- **Navigasi:** di dalam `anime.tsukimi.my` semua route milik satu app, jadi navigasi memakai RR `<Link prefetch="intent">` + soft nav, ditambah Speculation Rules (`prefetch` moderate) untuk destinasi utama di host yang sama. Mini-player di dalam satu vertikal tetap mungkin tanpa Module Federation.
- **Navigasi lintas vertikal:** `AppLink` membaca `nav-manifest.ts` (`{ id, host, status: 'live' | 'soon' }`) dan menghasilkan URL absolut (`https://tsukimi.my/`, nanti `https://comics.tsukimi.my/…`) dengan full document load biasa. Cross-document View Transitions hanya berlaku same-origin, jadi tidak dipakai lintas subdomain. Konsekuensi yang diterima: player/mini-player tidak bertahan saat pindah vertikal.
- **Vertical switcher di TopBar** (Anime · Komik · Video): vertikal berstatus `soon` tampil dengan label **"segera hadir"**, tanpa link dan dengan `aria-disabled`. Saat P3/P4 diluncurkan, cukup mengubah status di manifest lalu redeploy (deploy train shell).

### 4.6 Data layer, tema, perangkat

- **SDK:** `packages/sdk` digenerate dari `/api/v1/openapi.json` (`openapi-typescript` + `openapi-fetch`). Spec di-commit dan CI gagal jika ada drift (`git diff --exit-code`).
- **TanStack Query:** `QueryClient` **per request** di middleware. Loader memanggil `ensureQueryData` → `dehydrate` → `HydrationBoundary`. Data di bawah fold di-stream lewat `<Suspense>`.
- **Base URL:** di server `http://api-public.tsk-svc.svc:3000/api/v1`, di browser `/api/v1` (same origin di setiap host vertikal, jadi tanpa CORS).
- **Zustand** hanya untuk preferensi player/reader dan toggle UI (`persist` ke localStorage).
- **Tema:** HTML dikirim dengan `data-theme="system"`. Skrip inline (nonce) membaca cookie `tk_theme` sebelum paint, dengan default **dark**. Cookie memakai `Domain=tsukimi.my; Path=/; Secure; SameSite=Lax` (bukan HttpOnly karena dibaca skrip), sehingga tema yang dipilih di satu subdomain berlaku di semua subdomain. localStorage bersifat per-origin, jadi hanya dipakai sebagai cache. Key `tsukimi-theme` dimigrasi sekali ke `tk_theme`. Untuk pengguna login, tema juga disimpan di `identity.user_prefs`.
- **Perangkat:** hint dari Client Hints (`Sec-CH-UA-Mobile`, `Sec-CH-Viewport-Width`), regex UA TV, atau cookie `tk_dev` → `DeviceProvider initial`. **Kelas perangkat kasar `m|d|tv` masuk cache key Cloudflare** (Transform Rule).

### 4.7 Auth di frontend (kanonik, lihat §9.1)

- Route `/auth/login`, `/auth/callback`, dan `/auth/logout` disediakan `packages/shell` dan dipasang di **setiap host vertikal** (MVP: `anime.tsukimi.my/auth/*`). Ketiganya memanggil service `session` (OIDC code + PKCE ke Keycloak di `accounts.tsukimi.my`). `redirect_uri` di-allowlist persis per host di client `tsukimi-web`.
- Cookie session: **`__Secure-tsk_sid`** (opaque, `Domain=tsukimi.my; Path=/; Secure; HttpOnly; SameSite=Lax`, 30 hari sliding). Karena `Domain=tsukimi.my`, satu login berlaku di `anime.`, apex, dan nanti `comics.`/`video.tsukimi.my`. Prefix `__Host-` tidak bisa dipakai untuk session karena `__Host-` melarang atribut `Domain`.
- Cookie CSRF: **`__Host-tsk_csrf`** (host-only per subdomain, dibaca JS, double-submit). Setiap subdomain menerbitkan token CSRF-nya sendiri.
- Logout menghapus session di server (Valkey + `identity.sessions`) dan cookie dengan `Domain=tsukimi.my`, sehingga semua subdomain ikut keluar.
- Middleware SSR **hanya di route personal** (`/profile`, `/settings`, `/watchlist`, `/history`, `/auth/*`) memanggil `getSession()` dari `@tsukimi/sdk`, lalu memanggil API dengan **JWT internal 5 menit**. **Tidak ada `tk_at`/`tk_rt`**, dan token tidak pernah sampai ke JavaScript.

### 4.8 Caching HTML (kanonik)

| Respons | Cache-Control | Cache key Cloudflare |
|---|---|---|
| Halaman publik (Home anime, browse musim/genre, detail series, jadwal, landing hub, legal) | `public, s-maxage=60, stale-while-revalidate=300` + `Cache-Tag: work:<id>,list:<kind>` | **Host** + URL + locale (dari path) + kelas perangkat `m\|d\|tv`. **Cookie diabaikan**. |
| `/watch*` (anime; video di P4) | `public, s-maxage=30` (URL media bertanda tangan diambil di klien) | sama |
| `/read*` (P3, `comics.tsukimi.my`) | `public, s-maxage=30` | sama |
| `/profile`, `/settings`, `/watchlist`, `/history`, `/auth/*` | `private, no-store` | bypass |

Host masuk ke cache key secara default, jadi setiap subdomain punya cache sendiri. Purge memakai Cache-Tag yang berlaku lintas host (§9.5).

**Aturan keras:** loader route publik **tidak boleh membaca session**. Test CI memastikan route publik tidak mengeluarkan `Set-Cookie` maupun identifier pengguna di HTML.

### 4.9 Video player & reader

- **hls.js** dipakai jika `Hls.isSupported()` (termasuk iOS 17.1+ via ManagedMediaSource). Selain itu fallback ke `<video>` native (Safari lama). Pergantian audio (SUB/DUB) memakai `hls.audioTrack`, subtitle memakai `hls.subtitleTrack`/track native. Sidecar `.vtt` tetap tersedia.
- hls.js di-lazy-load setelah first paint (≈ +60 KB gz). Shaka Player hanya untuk title `drm_required` (P5).
- Reader (P3, `apps/comics`): placeholder dari `{w,h}` per halaman (tanpa CLS), virtualizer di-lazy-load, prefetch chapter berikutnya.

### 4.10 SEO

- **Setiap subdomain adalah situs tersendiri bagi mesin pencari.** `anime.tsukimi.my` (P1), apex `tsukimi.my` (P1), `comics.tsukimi.my` (P3) dan `video.tsukimi.my` (P4) masing-masing punya canonical, sitemap, dan `robots.txt` sendiri.
- Setiap route merender `<Seo>`. Meta dibangun di loader dengan `@tsukimi/ui/seo`. **JSON-LD tidak berubah:** TVSeries/TVEpisode untuk anime (P1), ComicSeries/ComicIssue (P3), VideoObject/Person (P4), plus BreadcrumbList dan WebSite + SearchAction per host. Apex memuat Organization.
- **Base URL per vertikal:** `SITE.url` lama (`https://tsukimi.my`) di `@tsukimi/ui` diganti `configureSeo()` per app, mis. `apps/anime` → `configureSeo({ name: 'Tsukimi Anime', url: 'https://anime.tsukimi.my', titleTemplate: '%s | Tsukimi Anime' })`, dan `apps/hub` → `url: 'https://tsukimi.my'`. Canonical selalu URL absolut di host vertikal itu sendiri, tidak pernah lintas host.
- **hreflang** (per host): `id` (unprefixed), `en` (`/en/...`), `x-default` → `id`. **`ja` tidak dipakai** sampai ada konten berbahasa Jepang.
- **Sitemap (satu generator, per host):** setiap host punya `/sitemap.xml` (index) + `/sitemap-{kind}-{n}.xml` sebagai resource route di app-nya. Data diambil dari endpoint `v1.seo` `sitemap-entries?vertical=anime&kind=…` (sudah difilter teritori dan status), dengan `s-maxage=3600`. Maksimal 45.000 URL per file. Sitemap hanya memuat URL host-nya sendiri. Apex hanya memuat landing dan halaman legal.
- **`robots.txt` per host:** men-disallow `/api`, `/auth`, `/search`, dan route personal, dengan baris `Sitemap:` yang menunjuk sitemap host itu (P3: juga `/read/*/page`). Halaman thin, search, dan filter multi-facet diberi `noindex`.
- **Search Console:** satu **domain property** `tsukimi.my` (verifikasi TXT DNS) yang mencakup semua subdomain. Sitemap setiap host disubmit terpisah dan laporan dipantau per host.
- **Cross-linking:** apex menautkan setiap vertikal yang live, dan TopBar/footer setiap vertikal menautkan apex serta vertikal lain. Nanti, relasi lintas vertikal (mis. anime ↔ manga sumber, P3) memakai URL absolut. Subdomain baru mulai dengan otoritas rendah, jadi cross-linking dan sitemap harus siap di hari peluncuran setiap vertikal.
- Audit `SeoOptimizer` di CI (crawl Playwright 50 URL per host, skor ≥ 80).

### 4.11 i18n

Lingui v5 dengan katalog per paket. Locale P1 adalah **`id` (default, tanpa prefix) + `en` (`/en`)**. `ms` minimal untuk halaman legal sebelum public launch. Tanggal memakai `Intl.DateTimeFormat` dengan IANA timezone (cookie `tk_tz` dengan `Domain=tsukimi.my`, fallback `Asia/Jakarta`). Konten (judul, sinopsis) dilokalisasi lewat API.

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
| E2E | Playwright per app di staging (P1). Preview env per PR baru di P5 | merge ke main + nightly |
| Perf | size-limit (P1), LHCI (P2) | PR / nightly |

### 4.14 Rilis, aset & ingress

- **Aset klien:** CI mengunggah `build/client/*` ke **R2 `tsukimi-assets`**, disajikan di `assets.tsukimi.my/<app>/<hash>` dan `assets.tsukimi.my/ui/<hash>.css`. Aset disimpan **minimal 14 hari** untuk skew protection, lalu job lifecycle menghapus hash yang tidak dirujuk lagi setelah 30 hari. **Pod tidak pernah menyajikan aset di prod.** Karena aset dimuat lintas origin oleh setiap subdomain, `assets.tsukimi.my` mengirim `Access-Control-Allow-Origin` (font woff2 wajib CORS) dan `<link>` font memakai `crossorigin`.
- **Deploy train:** perubahan di `packages/{ui,shell,sdk,i18n}` atau `tooling/stylex` me-redeploy semua app dengan SHA yang sama. Perubahan yang hanya menyentuh app hanya me-redeploy app itu. Chunk-load error memicu satu kali hard reload.
- **Image:** `turbo prune` + `pnpm deploy`, base `gcr.io/distroless/nodejs24-debian12:nonroot`, < 150 MB.
- **HTTPRoute digenerate** dari `packages/shell/src/nav-manifest.ts` oleh `tooling/gen-routes` ke repo `tsukimi-gitops`: **satu HTTPRoute per app, dicocokkan per hostname**, namespace `tsk-web`, `parentRef: tsk-edge/public`. Rule `/api` setiap host vertikal ada di HTTPRoute yang sama dan diarahkan ke `api-public` (ns `tsk-svc`, butuh ReferenceGrant). Contoh hasil:

```yaml
apiVersion: gateway.networking.k8s.io/v1
kind: HTTPRoute
metadata: { name: web-anime, namespace: tsk-web }
spec:
  parentRefs: [{ name: public, namespace: tsk-edge }]
  hostnames: ["anime.tsukimi.my"]
  rules:
    - matches: [{ path: { type: PathPrefix, value: /api } }]
      backendRefs: [{ name: api-public, namespace: tsk-svc, port: 3000 }]
    - matches: [{ path: { type: PathPrefix, value: / } }]          # termasuk /en/...
      backendRefs: [{ name: web-anime, port: 3000 }]
```

| Hostname | Path | Service | Fase |
|---|---|---|---|
| `anime.tsukimi.my` | `/api` | `api-public` | P1 |
| `anime.tsukimi.my` | `/` (semua route, juga `/en`) | `web-anime` | P1 |
| `tsukimi.my` (apex) | `/` (landing, legal, robots, sitemap) | `web-hub` | P1 |
| `www.tsukimi.my` | redirect 301 ke apex (Cloudflare Redirect Rule, tidak sampai origin) | — | P1 |
| `accounts.tsukimi.my` | hanya `/realms/tsukimi/*` dan `/resources/*` (konsol `/admin` Keycloak tidak dirutekan) | `keycloak` (ns `tsk-data`) | P0 |
| `admin.tsukimi.my` | `/` → web-admin, `/api/admin` → api-admin | `web-admin`, `api-admin` | P1 |
| `comics.tsukimi.my` | `/api`, `/` | `api-public`, `web-comics` | P3 |
| `video.tsukimi.my` | `/api`, `/` | `api-public`, `web-video` | P4 |

Di dalam satu hostname, Gateway API memilih prefix terpanjang, sehingga `/` tidak menimpa `/api`. Hostname yang tidak terdaftar dijawab 404 oleh Gateway. Listener Gateway memakai sertifikat wildcard `*.tsukimi.my` + apex dari cert-manager (§8.4).

---

## 5. Backend & model data

### 5.1 Prinsip

- **Satu cluster Postgres, satu schema per bounded context.** Hanya pemilik schema yang boleh menulis ke sana (dipaksa lewat role Postgres per service + lint).
- **Actions untuk request/reply** lewat core NATS. **Fakta lintas sistem lewat outbox → JetStream → `@moleculer/channels`**. `broker.emit`/`broadcast` hanya untuk hint best-effort (mis. cache clean). **Jangan pernah** untuk pekerjaan yang wajib terjadi.
- **Pengiriman at-least-once**, diproses **efektif sekali** lewat dedupe `ops_local.inbox` atau dedupe `Nats-Msg-Id`.
- **Kerja terjadwal = K8s CronJob** yang memanggil action. Tidak ada timer di dalam service.
- **UUIDv7 dibuat di aplikasi** (paket npm `uuid` v7). **Tidak ada `DEFAULT uuidv7()`** di DDL, karena PG17 belum punya fungsi itu.

### 5.2 Service (deployable MVP vs nanti)

**Service MVP (P0/P1) hanya yang dibutuhkan anime:** gateway (`api-public`, `api-admin`), identity/session, catalog anime (termasuk airing dan rights), media pipeline, progress/watchlist, search-indexer (indeks anime), seo/sitemap, dan CMS/admin (lewat `api-admin` + workflow di service domain). Desain service komik, video, dan cast dipertahankan di bawah, tetapi diberi label fasenya dan **tidak dibangun sebelum P3/P4**. Satu backend melayani semua subdomain.

| Deployable | Isi | Fase |
|---|---|---|
| `api-public`, `api-admin` | moleculer-web: routing, validasi Ajv/TypeBox, rate limit GCRA (Redis), Idempotency-Key, ETag/Cache-Control/Cache-Tag, OpenAPI. Satu deployment `api-public` melayani `/api/v1` untuk **semua host vertikal** | P0/P1 |
| `session` (`v1.session`) | Pertukaran kode OIDC, session store (Valkey + `identity.sessions`), cookie `__Secure-tsk_sid` (`Domain=tsukimi.my`), allowlist `redirect_uri`/`returnTo` per host, minting JWT internal, profil (`identity.users` dengan key Keycloak `sub`), preferensi global. [P2] proxy device grant TV | P0 |
| `catalog` (satu image) | **P1: `SERVICES=catalog,anime,rights`.** `v1.catalog` (taksonomi bersama: genre, tag, studio), `v1.anime` (series, season, episode, versi SUB/DUB, airing rules/slots, jadwal, auto-publish), **`v1.rights`** (license_agreement, license_window, work_age_rating, `rights.isAvailable`), status workflow + audit + revisi. **P3:** menambah `v1.comics` (series, chapter, manifest halaman). **P4:** menambah modul video, cast, kategori, marker di `v1.catalog` | P1 (anime) / P3 / P4 |
| `media` | Upload multipart, registry asset/objek, orkestrasi job, `playback.authorize`, subtitle, sprite | P1 |
| `progress` | Save buffered, flusher, continue, overlay, watchlist, follow, sync seq. P1: item episode; P3: halaman komik | P1 |
| `search-seo` | Indexer Meilisearch (dokumen membawa `territories`; P1 indeks `anime` saja), proxy query, reconcile, slug/redirect, override SEO, endpoint `sitemap-entries` per vertikal, simpan audit SEO, **ranking Postgres** (trending anime, action untuk CronJob) | P1 |
| `outbox-relay` | Relay outbox → JetStream + konsumen advisory DLQ (digabung) | P0 |
| `storage-replicator` | e2 → R2 (Deployment tetap 2 replika di P1, autoscale di P2) | P1 |
| `ranking`, `analytics-ingest` | ClickHouse rollup → `ranking.snapshots/entries` (API tidak berubah) | P2 |
| `notifications` | Inbox in-app (P2), web push + email digest (P5) | P2/P5 |
| `cms` | Review/four-eyes, drafts, bulk import | P2 |
| `dlq` (terpisah), `entitlements` | | P2 / P5 |

Worker FFmpeg, `image-process`, dan pemroses komik (P3) **bukan** service Moleculer. Mereka berupa Job (KEDA) yang menarik pesan dari JetStream.

### 5.3 Gaya API

- **REST + OpenAPI 3.1**, tanpa GraphQL di P1. Alasannya, GET publik bisa di-cache di CDN dan loader SSR sudah menjadi lapisan komposisi.
- **Path kanonik:** gateway dipasang di `/api` **di setiap host vertikal**: `anime.tsukimi.my/api/v1/*` (P1), `comics.tsukimi.my/api/v1/*` (P3), `video.tsukimi.my/api/v1/*` (P4). Semuanya dirutekan ke deployment `api-public` yang sama. Browser selalu memanggil same-origin, jadi **tidak ada CORS**. Header `Host` hanya dipakai sebagai default vertikal (mis. sitemap/SEO), **tidak pernah untuk otorisasi**. Admin = `admin.tsukimi.my/api/admin/v1/*`. Spec ada di `/api/v1/openapi.json`.
- **Konvensi:**
  - Versi mayor di URL (perubahan aditif saja di dalam satu mayor).
  - Pagination keyset (`?limit=24&cursor=`, maks 100, cursor ditandatangani HMAC, tanpa total di list publik).
  - Sort/filter dari whitelist dengan indeks komposit yang sesuai.
  - Error RFC 9457, `If-Match` untuk PATCH admin, ETag untuk GET publik.
  - **Endpoint publik tidak pernah personal.** Overlay personal datang dari `/api/v1/me/*` (`private, no-store`).
- **Idempotency-Key** wajib pada `uploads.init/complete`, publish admin, report, dan pembelian di masa depan. Disimpan di `valkey-state` `idem:{principal}:{key}` **24 jam** (replay → respons tersimpan, hash beda → 422, konkuren → 409). Operasi bersifat uang juga ditulis ke `ops.idempotency_keys`.

Rute utama (ringkas):
```
# P1 — anime.tsukimi.my
GET  /api/v1/anime/home   /anime?year=&season=&genre=&status=   /anime/{slug}   /anime/{slug}/seasons/{id}/episodes
GET  /api/v1/anime/schedule?from=&days=7          (instan UTC; klien merender di tz pengguna)
GET  /api/v1/genres?vertical=anime   /rankings/{board}?period=week   /search?q=&type=anime
GET  /api/v1/seo/resolve?path=                      GET /api/v1/seo/sitemap-entries?vertical=anime&kind=&page=
POST /api/v1/playback/{itemType}/{itemId}           (private; token media + subtitle + intro/outro)
GET  /api/v1/me   PATCH /api/v1/me/prefs   PUT /api/v1/me/progress/{type}/{id}   GET /api/v1/me/continue
GET  /api/v1/me/progress?items=   GET /api/v1/me/progress/sync?cursor=
PUT|DELETE /api/v1/me/watchlist/{type}/{id}   PUT|DELETE /api/v1/me/follows/{type}/{id}
# P3 — comics.tsukimi.my
GET  /api/v1/comics?format=   /comics/{slug}   /comics/{slug}/chapters   /comics/{slug}/chapters/{n}
# P4 — video.tsukimi.my
GET  /api/v1/videos   /videos/{slug}   /cast   /cast/{slug}   /categories
```

### 5.4 Outline schema (kanonik)

Konvensi: PK `uuid` (v7 dari aplikasi), `created_at/updated_at timestamptz`, `version int` (optimistic lock). Semua schema ikut replikasi fisik ke cluster DR (§6). Kolom **Fase** menunjukkan kapan tabel dimigrasi: schema komik dan video/cast **didesain sekarang, tetapi baru dibuat di P3/P4**.

| Schema | Fase | Tabel utama |
|---|---|---|
| `identity` | P0 | `users` (id, **keycloak_sub UNIQUE**, display_name, avatar_asset_id, locale, timezone, status, birthdate placeholder; **tanpa password/role**), `user_prefs` (theme, playback jsonb, reader jsonb), `sessions` (mirror untuk daftar perangkat dan "logout semua") |
| `catalog` | P1 (inti) / P4 (video, cast) | **P1:** `genres` (dengan `verticals text[]`), `tags`, `studios`, **`license_agreement`, `license_window`** (territories text[], starts_at, ends_at, bahasa), **`work_age_rating`**, `ratings` (P2). **P4:** `categories`, `people`, `cast_members`, `videos` (status, publish_at, access, maturity, denorm view_count/rating), `video_cast`, `video_genres`, `video_categories`, `video_markers` |
| `anime` | P1 | `series` (broadcast_tz/weekday/time, next_airs_at, season_year, season, **`mal_id` unique nullable**, **`mal_imported_fields` jsonb** untuk audit field yang berasal dari import §7.1c), `series_genres`, `seasons`, `episodes` (number numeric(5,1), is_filler, is_recap), `episode_versions` (SUB/DUB, PK(episode_id, version)), `airing_rules`, `airing_slots` (airs_at UTC, index airs_at) |
| `comics` | **P3** | `series` (format, default_mode/direction, latest_chapter_*), `series_credits`, `series_genres`, `chapters` (number numeric(7,2), access, **`pages jsonb [{key,w,h,slice?,sha256?}]`**, page_count) |
| `media` | P1 | `assets` (aset domain: kind, owner, status, duration, rv aktif), `objects` (registry fisik, **banyak per asset**, FK asset_id: bucket, key, size, sha256, primary_ok, secondary_ok, replicated_at, verified_at, deleted_at), `uploads`, `transcode_jobs`, `renditions`, `subtitle_tracks`, `asset_segments`, `sprites`, **`gofile_links`** (FK asset_id, `download_page`, `gofile_file_id`, `status` `pending\|ok\|failed\|skipped`, `attempts`, `uploaded_at`, `removed_at`; §7.1b) |
| `progress` | P1 | `item_progress` (**HASH(user_id) 32 partisi, DDL statis sejak hari pertama**), `series_progress` (HASH 16), `watchlist`, `follows` (index (subject_type, subject_id) untuk fan-out). Kolom `item_type` sudah mendukung `comic_chapter` (P3) dan `video` (P4) |
| `ranking` | P1 | `snapshots` (board, period_key, computed_at, source `pg`/`clickhouse`), `entries` |
| `seo` | P1 | `redirects` (dengan kolom `host`), `overrides`, `audits` |
| `cms` | P1 / P2 | `content_revision` (P1), `audit_log` (P1, insert-only, plain table di P1 → partisi bulanan pg_partman di P2), `drafts` (P2) |
| `notify` | P2 | `notifications`, `push_subscriptions` |
| `ops` | P0 | `dead_letters`, `idempotency_keys` (TTL 24 jam), `sync_watermarks`, `heartbeat` |
| **`ops_local`** | P0 | `outbox`, `inbox`: high-churn, tidak dipartisi, retensi lewat `DELETE` batch (CronJob tiap jam, outbox terpublikasi > 3 hari, inbox > 7 hari) |
| `entitlements` | P5 | dicadangkan |

Database **`keycloak`** terpisah di cluster CNPG yang sama: tercakup PITR Barman dan replikasi fisik ke `tsukimi-pg-dr`, plus `pg_dump` malam hari dan ekspor realm (§6.6).

**Keputusan model data**
- (P3) Manifest halaman komik disimpan sebagai `jsonb` di chapter. Tidak ada tabel `chapter_pages`. `comic-process` menulis `pages.json` ke storage, lalu memperbarui `chapters.pages` + `page_count` dalam satu transaksi.
- Riwayat heartbeat penuh tidak masuk Postgres. Di P2 ia masuk ClickHouse.
- Ranking MVP: CronJob malam hari menghitung trending anime dari `progress.series_progress/item_progress` (jumlah penonton 7 hari) + pinning editorial, lalu menulis ke `ranking.snapshots/entries`. Board komik (most-read) di P3 dan "Popular Actress" di P4 memakai mekanisme yang sama. Di P2 sumbernya diganti ClickHouse tanpa mengubah API.

### 5.5 Outbox, stream & consumer

**Sisi tulis:** `outbox.mixin` menulis ke `ops_local.outbox` di transaksi yang sama dengan perubahan domain.

**Relay (`outbox-relay`, 2 replika):**
- **Terhubung langsung ke `tsukimi-pg-rw`, bukan Pooler**, dengan pool khusus berukuran 2. Alasannya, `LISTEN/NOTIFY` dan advisory lock tidak berjalan lewat PgBouncer transaction mode.
- Bangun saat `LISTEN outbox` atau setiap 250 ms.
- `SELECT … FOR UPDATE SKIP LOCKED LIMIT 500` → publish dengan `Nats-Msg-Id = outbox.id` (dedupe window 10 menit) → tunggu PubAck → set `published_at`.

**Stream & subject kanonik**

| Stream | Subject | Retensi | Replika |
|---|---|---|---|
| `TSK_DOMAIN` | `tsk.<context>.<aggregate>.<event>.v1` (mis. `tsk.anime.episode.published.v1`, `tsk.media.asset.ready.v1`, `tsk.storage.object.written.v1`, `tsk.media.upload.completed.v1`, `tsk.media.gofile.link.ready.v1`) | limits 14 hari, 50 GB, dedupe 10 menit | 3 |
| `TSK_JOBS` | `tsk.media.validate.requested.v1`, `tsk.media.transcode.requested.v1`, `tsk.image.process.requested.v1`, [P3] `tsk.comic.process.requested.v1` | **WorkQueue** (filter subject tidak tumpang tindih) | 3 |
| `TSK_TELEMETRY` | `tsk.telemetry.>` | 24 jam, discard old | 3 (P2) |
| `TSK_DLQ` | `tsk.dlq.<consumer>` | 30 hari | 3 |

Consumer durable: `media-validate`, `media-transcode`, `image-process`, [P3] `comic-process` (di `TSK_JOBS`); `storage-replicator`, `search-indexer`, `catalog-asset-ready`, `cdn-purge`, **`media-gofile-relay`** (§7.1b) (di `TSK_DOMAIN`).

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
  - Satu tool (**Kysely Migrator**), satu path **`packages/db/migrations`**, dijalankan sebagai Job Argo **PreSync**.
  - Migrasi hanya dijalankan ke primary `tsukimi-pg`; replica cluster DR mengikuti otomatis lewat replikasi fisik. Rename/drop lewat expand/contract.

### 5.8 Search (subbagian)

- Meilisearch **single node** + snapshot ke object storage. Bisa dibangun ulang penuh dari Postgres (`search.reindex`).
- Index: **`anime` (P1)**, `comics` (P3), `videos` dan `cast` (P4). Atribut filterable: `territories`, `status`, `genre`, `season`, `format`, `maturity`.
- Setiap host vertikal mencari di indeksnya sendiri lewat `/api/v1/search?type=`. Pencarian lintas vertikal di hub apex baru di P5.
- Upsert berversi dari event, plus reconcile malam hari.
- Target: typeahead p95 < 100 ms. Title yang dipublikasikan sudah bisa dicari ≤ 10 s.

---

## 6. Redundansi database

> **Keputusan (revisi):** Supabase **dikeluarkan** dari rencana. Redundansi database memakai dua cluster
> PostgreSQL yang sama-sama dikelola **CloudNativePG (CNPG)**: cluster primary di region utama dan
> **replica cluster** (replikasi **fisik**) di region kedua. Satu jenis teknologi, satu operator, satu cara backup.

### 6.1 Topologi

| Cluster | Lokasi | Peran |
|---|---|---|
| **`tsukimi-pg`** | GKE prod `asia-southeast1` (Singapura), namespace `tsk-data` | **Satu-satunya write primary.** PostgreSQL 17, 3 instance di 3 zona, `synchronous: { method: any, number: 1, dataDurability: required }` → RPO 0 di dalam cluster |
| **`tsukimi-pg-dr`** | Cluster K8s kedua di `asia-southeast2` (Jakarta) — atau server sendiri/provider lain | **Replica cluster** (standby fisik, read-only). 1 instance di P2, 2 instance kalau anggaran memungkinkan |

- `archive_timeout=60s`, volume WAL terpisah, Pooler `tsukimi-pg-pooler-rw` dan `-ro` (PgBouncer transaction mode, 3 replika).
- CNPG ≥ 1.27 dengan **Barman Cloud Plugin** (in-tree `barmanObjectStore` deprecated sejak 1.26).
- Replikasi **fisik** artinya **semua** ikut: DDL, sequence, large object, DB `keycloak`, outbox/inbox. Tidak perlu runner migrasi dua target, sinkronisasi sequence, atau aturan urutan migrasi.

### 6.2 Phasing (keputusan)

| Fase | Pekerjaan |
|---|---|
| **P0** | Spike: Barman Cloud Plugin ke IDrive e2 (checksum env), restore dari e2, replica cluster dari object store di staging |
| **P1** | CNPG HA (3 instance) + Barman PITR ke e2 + salinan backup ke R2 + **satu restore manual yang terdokumentasi**. Inilah perlindungan nyata untuk beta. |
| **P2** | Replica cluster `tsukimi-pg-dr` di region kedua, monitoring lag, runbook failover/switchover, game day, drill restore otomatis |

### 6.3 Replica cluster CNPG (P2)

Replica cluster mengikuti primary lewat dua jalur:

1. **WAL archive di object storage (default, wajib).** Primary mengarsip WAL ke `s3://tsukimi-backups/pg/tsukimi-pg` (IDrive e2). Cluster DR membaca arsip yang sama. Tidak perlu membuka port database ke internet.
2. **Streaming replication (opsional, untuk RPO lebih kecil).** Lewat koneksi privat (VPN/WireGuard atau interkoneksi antar-region), TLS + user `streaming_replica`, `pg_hba` khusus. Kalau streaming putus, cluster DR otomatis kembali membaca arsip WAL.

```yaml
# tsukimi-pg-dr (region kedua) — sketsa
apiVersion: postgresql.cnpg.io/v1
kind: Cluster
metadata: { name: tsukimi-pg-dr, namespace: tsk-data }
spec:
  instances: 1
  imageName: ghcr.io/cloudnative-pg/postgresql:17
  bootstrap:
    recovery: { source: tsukimi-pg }          # bootstrap dari base backup + WAL di e2
  replica:
    enabled: true
    source: tsukimi-pg
  externalClusters:
    - name: tsukimi-pg
      plugin:
        name: barman-cloud.cloudnative-pg.io
        parameters: { barmanObjectName: tsukimi-e2-store, serverName: tsukimi-pg }
      # opsional: connectionParameters + sslKey/sslCert untuk streaming
```

- **Distributed topology (CNPG ≥ 1.24):** kedua cluster mendeklarasikan `replica.primary` yang sama. Switchover terencana dilakukan dengan mengganti `replica.primary` dan memakai **demotion token**, tanpa kehilangan data dan tanpa membangun ulang cluster lama [VERIFIKASI detail di versi CNPG yang dipakai].
- **Ketergantungan pada e2:** kalau e2 bermasalah, jalur arsip berhenti. Mitigasi: streaming (jalur 2) dan salinan arsip WAL di R2 (§6.6) yang bisa dijadikan `externalClusters` cadangan.
- Cluster DR **tidak** melayani trafik aplikasi dalam kondisi normal. Opsional: query laporan read-only tanpa mengganggu primary.

### 6.4 Monitoring lag (P2)

| Sinyal | Warn | Page |
|---|---|---|
| Umur WAL terakhir yang diarsip (`cnpg_pg_stat_archiver_seconds_since_last_archival`) | > 5 menit | > 15 menit |
| Lag replay di `tsukimi-pg-dr` (heartbeat `ops.heartbeat` tiap 10 s) | > 2 menit | > 10 menit |
| Lag streaming (`pg_stat_replication`, jika streaming aktif) | > 30 s | > 300 s |
| Cluster DR tidak `Ready` / WAL receiver mati | 5 menit | 15 menit |
| Sync standby in-cluster primary | lag > 1 s | sync replica < 1 |

### 6.5 RPO / RTO

| Skenario | Mekanisme | RPO | RTO |
|---|---|---|---|
| Pod/node/disk/zona | Failover otomatis CNPG di dalam cluster | 0 | ≤ 60 s |
| Region utama hilang (P2+) | **Promote `tsukimi-pg-dr`** | ≤ 60–120 s via arsip WAL; ≤ 5 s jika streaming aktif | **DB 15–30 menit**; **layanan 4 jam** (rebuild workload di region kedua lewat Terraform + Argo CD). Selama jeda itu Cloudflare menyajikan pool statis "degraded". |
| Korupsi logis (migrasi buruk, DELETE tanpa WHERE) | PITR Barman. **Replica bukan backup**, karena korupsi ikut tereplikasi. | ≤ 5 menit | 1–4 jam |
| Backup e2 hilang | Salinan terenkripsi di R2 | ≤ 24 jam (base), ≤ 15 menit (WAL) | +1 jam |

Region kedua di Jakarta berada di metro berbeda dari Singapura, jadi insiden se-metro tidak menjatuhkan keduanya.

### 6.6 Backup & PITR

- **ObjectStore** (Barman Cloud Plugin):
  - `endpointURL: https://s3.<region>.idrivee2.com`, `destinationPath: s3://tsukimi-backups/pg/tsukimi-pg`.
  - **`retentionPolicy: 30d`**, kompresi WAL snappy.
  - env sidecar `AWS_REQUEST_CHECKSUM_CALCULATION=when_required` dan `AWS_RESPONSE_CHECKSUM_VALIDATION=when_required`.
- `ScheduledBackup` harian 19:00 UTC (02:00 WIB), `target: prefer-standby`.
- **Dump logis mingguan** `pg_dump -Fc`, disimpan **12 minggu**.
- **Keycloak:** ikut di backup fisik; tambahan `pg_dump` DB `keycloak` setiap malam + `kc.sh export` realm ke `tsukimi-backups/keycloak/`.
- **Salinan sekunder:** rclone `crypt` ke R2 (P1: CronJob malam hari untuk prefix backup; P2: reconcile penuh).
- Object Lock pada `tsukimi-backups` jika region e2 mendukungnya [VERIFIKASI]. Kalau tidak, salinan R2 dipegang kredensial tanpa hak delete.
- **Drill:**
  - P1: satu restore manual ke namespace scratch.
  - P2: CronJob restore bulanan otomatis (validasi jumlah baris ±0,5%, metrik `restore_duration_seconds`) + game day switchover/failover per kuartal.
  - Tahunan: restore hanya dari salinan R2.

### 6.7 Runbook FAILOVER ke `tsukimi-pg-dr` (P2, manual — region utama hilang)

1. Deklarasikan insiden dan bekukan deploy (sync window Argo: deny).
2. Pastikan primary lama benar-benar tidak bisa menulis: **fence** (`kubectl cnpg fencing on tsukimi-pg "*"`) jika masih terjangkau, atau putus akses jaringannya.
3. Catat `ops.heartbeat.ts` terakhir di cluster DR. Jendela kehilangan data = waktu insiden − heartbeat.
4. Biarkan cluster DR menghabiskan WAL yang tersisa di arsip (≤ 2 menit).
5. **Promote:** set `spec.replica.enabled: false` (atau ubah `replica.primary` ke `tsukimi-pg-dr` pada distributed topology) lewat Git → Argo CD.
6. Aktifkan Pooler di region kedua, arahkan ulang secret `DATABASE_URL` (ESO), lalu roll deployment yang sudah dibangun di region kedua.
7. Konfigurasikan backup baru dari `tsukimi-pg-dr` ke path object store **baru** (timeline baru), jalankan base backup on-demand.
8. Jalankan reconciler: relay outbox lanjut (consumer idempotent menangani duplikat), reindex search, scan backlog `media.objects.secondary_ok=false`, flush buffer progress.
9. Verifikasi sintetik (login, play, baca, tulis progress), lalu umumkan pemulihan.

### 6.8 Runbook FAILBACK / switchover terencana

1. Bangun ulang `tsukimi-pg` di region utama sebagai **replica cluster** dari `tsukimi-pg-dr` (dari backup timeline baru + streaming). Data dir lama **jangan pernah dipakai ulang**.
2. Tunggu lag ≈ 0, lalu jadwalkan jendela switchover (write freeze ≤ 5 menit: flag gateway `READ_ONLY_MODE=true`).
3. **Switchover terkontrol** dengan distributed topology: demote `tsukimi-pg-dr`, ambil demotion token, promote `tsukimi-pg` dengan token itu [VERIFIKASI versi CNPG]. Tanpa distributed topology: fence DR, tunggu replay habis, promote primary, lalu bangun ulang DR sebagai replica.
4. Arahkan ulang `DATABASE_URL` ke Pooler region utama, `READ_ONLY_MODE=false`.
5. Jalankan base backup on-demand dan pastikan cluster DR kembali mengikuti.

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

### 7.1b Download sementara via Gofile (best-effort, bukan system of record)

**Tujuan:** memberi penonton opsi **download file master episode** (bukan HLS) tanpa membangun fitur download/DRM sendiri di P1. **Hanya untuk master video**, tidak untuk subtitle, cover, atau chapter komik.

- **Provider:** [Gofile](https://gofile.io/api), **guest account** (tanpa API key berbayar). Upload lewat `POST https://upload.gofile.io/uploadfile` (multipart, tanpa header `token`/`Authorization`) → respons berisi `downloadPage` (URL publik `https://gofile.io/d/{code}`) dan `guestToken`. **Satu guest account dibuat sekali** (`POST https://api.gofile.io/accounts` dengan body kosong) dan tokennya disimpan di Secret Manager (`tsk-prod-media-gofile-guest-token`); upload berikutnya mengirim token itu supaya semua file masuk ke akun yang sama, bukan membuat akun baru tiap upload. Guest account **tidak punya recovery email** — kalau token hilang, akun dan seluruh isinya tidak bisa diakses lagi; token disalin sekali secara manual saat setup dan tidak pernah di-reset (`resettoken` pada guest = kehilangan akun permanen).
- **Trigger:** consumer baru `media-gofile-relay` di `TSK_DOMAIN`, berjalan setelah `tsk.media.upload.completed.v1` (sumber: file master di `tsukimi-originals`, **bukan** menunggu transcode selesai, supaya link download tersedia lebih cepat daripada HLS).
- **Alur:** stream GET master dari e2 → `PUT`/`POST` multipart ke Gofile → simpan `media.gofile_links` (lihat §5.4) dengan `download_page`, `gofile_file_id`, `uploaded_at`, `status`. Gagal (rate limit, file > batas Gofile, timeout) → `status=failed`, nak dengan backoff standar (§5.5), maks 8 kali lalu `status=failed` permanen + muncul di CMS untuk retry manual.
- **Sifat "sementara" (disepakati, bukan bug):** Gofile **guest** tidak punya SLA retensi yang didokumentasikan secara formal — kontennya bisa dihapus sepihak oleh Gofile (kebijakan inactivity/limit layanan gratis mereka). Rencana ini **menerima risiko itu apa adanya**: link ditandai di UI sebagai "Download (sementara)", tidak ada job refresh/re-upload otomatis, dan tidak ada SLA ketersediaan yang dijanjikan ke pengguna. Jika link mati, pengguna tetap bisa streaming normal lewat HLS (jalur utama, §7.4) — Gofile murni tambahan opsional.
- **Keamanan:** URL Gofile **publik dan tidak melewati rights/token HMAC** (§7.4) begitu diunggah — Gofile tidak mendukung token path kustom di tingkat guest. Konsekuensinya: **takedown (§9.5) harus juga menghapus entri di Gofile** (`DELETE /contents/{id}` dengan guest token) sebagai langkah tambahan di `takedown.execute`, walau linknya sudah di luar kendali CDN/edge kita. Title yang tunduk pada `license_window` wilayah terbatas **tidak** mendapat link Gofile sampai ada cara memberlakukan gating wilayah di sana — default P1: **hanya title tanpa batasan teritori** yang direlay ke Gofile; `rights.isAvailable` dicek sebelum enqueue.
- **Biaya/kuota:** akun gratis dibatasi 10.000 item tersimpan; pada katalog ±50 seri beta ini jauh di bawah limit, tetapi jadi pengingat P2 untuk memantau kuota kalau katalog membesar.
- **Fase:** P1 (menyertai A3), minimal effort — satu consumer + satu tabel kecil, tanpa UI pengguna baru selain tautan "Download" di halaman detail/watch yang menunjuk `download_page` (null-safe: disembunyikan kalau `status != ok`).

### 7.1c Matching metadata via MyAnimeList API (bantu input editor, bukan sumber langsung penonton)

**Tujuan:** mempercepat pengisian seri anime baru di CMS (A15) — editor cari judul, lihat preview field dari MAL, pilih yang mau diimpor, dan hasilnya **disalin permanen** ke `anime.series`/`catalog` milik kita sendiri (bukan live-fetch tiap request, bukan hotlink). Setelah disalin, data itu jadi konten kita: bisa diedit, dan tidak lagi bergantung pada MAL untuk disajikan ke penonton.

- **[LAWYER] Risiko legal yang harus ditinjau sebelum A15 masuk produksi:** [API License and Developer Agreement MAL](https://myanimelist.net/static/apiagreement.html) ps. 3 melarang antara lain mengganggu mekanisme API dan "develop or modify an application, website or other service to appear as though it is a Company Offering or which could reasonably cause consumer confusion" (3-iv, 3-xi). Tsukimi adalah situs **streaming** anime, bukan tracker list seperti kebanyakan pengguna API MAL — menyalin sinopsis dan poster MAL ke dalam katalog streaming berbayar/beriklan punya risiko hak cipta/ToS yang lebih tinggi daripada sekadar menampilkan data MAL di aplikasi tracking. **Default sampai ada opini pengacara:** sinopsis disalin sebagai **draft starting point yang wajib ditulis ulang/diedit editor sebelum publish** (bukan disalin verbatim ke produksi), poster MAL **tidak** dipakai sebagai cover final published (editor upload cover sendiri atau berlisensi; preview MAL hanya referensi visual di form CMS), dan atribusi "Data sebagian dari MyAnimeList" dicantumkan di halaman legal. Ini gerbang yang sama levelnya dengan §9.6 (rights per title) — **tidak ada title live yang kontennya 100% hasil scrape/copy MAL tanpa sentuhan editorial dan rights record sendiri.**
- **Registrasi:** `client_id`/`client_secret` didaftarkan manual lewat form MAL (bukan self-service instan), satu akun developer dipegang tim produk. OAuth2 Authorization Code + PKCE, access token 1 jam, refresh token 1 bulan — **job CronJob `mal.token.refresh`** (harian) memperbarui refresh token sebelum kedaluwarsa, token disimpan di Secret Manager (`tsk-prod-media-mal-oauth`). Client ID bisa dicabut sepihak oleh MAL (ps. 2 Agreement) — matching MAL diberi label "best-effort", UI CMS tidak boleh berhenti berfungsi (A1 anime series tetap bisa diisi manual) kalau integrasi ini mati.
- **Alur (`catalog.mal.search` / `catalog.mal.import`, action baru di service `catalog`):**
  1. Editor mengetik judul di form seri → `GET https://api.myanimelist.net/v2/anime?q=&limit=10&fields=title,alternative_titles,main_picture,synopsis,genres,studios,start_season,broadcast,mean,rating,nsfw` (server-side, token OAuth kita, bukan dipanggil dari browser).
  2. Editor pilih satu hasil → preview field di modal (tanpa menulis DB).
  3. Editor pilih field mana yang mau diimpor (checkbox per field, default semua tercentang kecuali sinopsis yang ditandai "perlu ditulis ulang") → `catalog.mal.import` menyalin ke `anime.series` dalam status **`draft`** (tidak pernah `published` langsung) + `anime.series.mal_id` (unique, nullable) buat jejak asal data dan re-sync manual nanti.
  4. **Gambar:** kalau poster MAL diimpor, server men-download `main_picture.large` lalu masuk pipeline `image-process` (§7.6: normalisasi WebP, strip EXIF, bucket lebar) seperti upload cover biasa — **tidak pernah hotlink langsung ke CDN MAL** dari frontend kita. Hasilnya tersimpan sebagai `media.assets` kind `cover`, berstatus draft juga, dan dilabeli `source=mal` di `media.objects` metadata untuk audit.
  5. Semua import (field dan gambar) tercatat di `cms.audit_log` dan `cms.content_revision` (mixin yang sama dengan §9.9), dengan actor editor + `source: mal_import` + `mal_id` di payload — supaya kelihatan mana konten yang asalnya dari MAL vs ditulis sendiri.
- **Rate limit & keandalan:** API MAL tidak mendokumentasikan rate limit resmi (laporan forum pengguna tidak konsisten); default **throttle sisi kita** ke 1 request/detik dan cache hasil pencarian 10 menit di `valkey-cache` (`mal:search:{q}`) supaya tidak memukul API saat editor mengetik. Tidak ada bulk-import/crawl seluruh database MAL — hanya pencarian per judul yang diinisiasi editor secara manual. Error/limit MAL → form tetap bisa diisi manual, badge "MAL tidak tersedia" di CMS.
- **Field yang TIDAK disalin:** `my_list_status`, `recommendations`, `statistics`, `related_anime/manga` (data personalisasi/komunitas MAL, tidak relevan dan berisiko salah atribusi). `rating`/`nsfw` dari MAL dipakai hanya sebagai **sinyal referensi** untuk editor mengisi `work_age_rating` kita sendiri (§9.6) — bukan ditulis otomatis, karena rating usia tetap keputusan editor sesuai kebijakan A7/A7 rights, bukan diwarisi dari sumber eksternal.
- **Fase:** P1 minimal (judul, judul alternatif, genre, studio, musim tayang, link `mal_id`, poster via pipeline gambar) menyertai P1.6 (A1 anime series). Sinopsis-assist dan re-sync berkala masuk P2 setelah ada keputusan pengacara.

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
  pg/  logical/  keycloak/  rclone-reports/
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
- Scrubber integritas mingguan (sampel 1% + objek 7 hari terakhir) ada di **P5**. Sampai saat itu, `rclone check` malam hari sudah cukup.

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
- ASS asli disimpan di originals. Rendering JASSUB di P5.

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
- ScaledJob lain: `media-validate` (2 vCPU, maks 20), `image-process` (1 vCPU, maks 20), dan `comic-process` (4 vCPU, maks 30) mulai P3.
- **Wall-clock:** episode 24 menit butuh ±25–30 menit di satu node 16 vCPU. Dengan antrean, validasi dan replikasi, target realistis **p90 ≤ 45 menit**. Di P2, transcode dipecah per rung (job per rendition + finalizer mux/manifest).

### 7.6 Pipeline komik (P3) & gambar (P1)

Langkah 1–5 berlaku untuk chapter komik dan baru dibangun di P3. Di P1, `image-process` hanya menormalisasi cover, poster, dan thumbnail anime (langkah 2), dan imgproxy dipakai untuk semua gambar.

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

### 7.7 DRM (opsional, P5)

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
| `dev` | **docker-compose** di laptop: Postgres 17, Valkey ×2, NATS JetStream, MinIO, Meilisearch, Keycloak, Mailpit. Service/app berjalan lewat `pnpm dev`. k3d + Tilt opsional di P2 untuk menguji chart. | P0 |
| `staging` | GKE **zonal** `asia-southeast1-b`, cluster `tsk-stg`. Pool system + pool general **Spot**, data di on-demand. Host memakai **domain staging terpisah** (default `tsukimi-stg.my`: `anime.`, `accounts.`, `admin.`, apex), bukan di bawah `tsukimi.my` (§8.4, §9.1). | P0 |
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

- **Ingress: Envoy Gateway** (implementasi Gateway API). ingress-nginx tidak dipakai karena status pengembangannya dihentikan [VERIFIKASI status]. HTTPRoute digenerate **per hostname** (§4.14) dan ReferenceGrant dipakai untuk backend lintas namespace. Listener Gateway memakai sertifikat wildcard `*.tsukimi.my` + apex dari cert-manager.
- **Cloudflare:**
  - **Plan minimal Pro**: Full (strict), Authenticated Origin Pulls diverifikasi Envoy `ClientTrafficPolicy`, `loadBalancerSourceRanges` = rentang IP Cloudflare.
  - **Sertifikat edge:** Universal SSL mencakup `tsukimi.my` + `*.tsukimi.my` (satu level), jadi `anime.`, `comics.`, `video.`, `accounts.`, `admin.`, `img.`, `media.`, dan `assets.` tercakup tanpa biaya tambahan. Hostname dua level (mis. `x.anime.tsukimi.my`) butuh Advanced Certificate Manager, karena itu tidak dipakai.
  - **Aturan per host:** Cache Rules, WAF custom rule, dan rate limit ditulis dengan `http.host` eksplisit. Host vertikal + apex: HTML/API sesuai §4.8 dan §5.6. `media.`/`img.`/`assets.`: §7.4. `accounts.` dan `admin.`: bypass cache. Transform Rule kelas perangkat hanya untuk host vertikal + apex.
  - WAF managed + OWASP, rate limit §5.6 (berlaku di semua host vertikal karena path `/api/*` dan `/auth/*` sama).
  - **Super Bot Fight Mode** dengan skip rule WAF untuk `media.tsukimi.my` dan bot terverifikasi. Bot Fight Mode versi Free tidak bisa di-scope.
  - Load Balancing (add-on mulai ±$5/bulan) dengan pool `prod-gke` (health `/healthz/edge`) → fallback `degraded` (situs statis Pages/Workers). Setiap hostname publik yang di-proxy ke GKE (apex, `anime.`, `accounts.`, `admin.`, `img.`, nanti `comics.`/`video.`) memakai pool yang sama, lewat LB per hostname atau CNAME ke hostname LB [VERIFIKASI biaya per hostname].
  - **Workers Paid** (±$5/bulan) untuk `media-edge`.
- **DNS & host** (semua record dikelola Terraform; **record eksplisit per host, bukan wildcard DNS**, supaya host yang tidak dikenal tidak sampai ke origin):

| Record | Target | Catatan |
|---|---|---|
| `tsukimi.my` (apex) | LB `web-lb` → Gateway prod | Hub: landing, legal (P1), akun global (P3) |
| `www` | redirect 301 ke apex | |
| `anime.tsukimi.my` | LB → Gateway prod | `web-anime` + `/api` → `api-public` (P1) |
| `comics.tsukimi.my` | LB → Gateway prod | P3; record baru dibuat saat peluncuran |
| `video.tsukimi.my` | LB → Gateway prod | P4; record baru dibuat saat peluncuran |
| `accounts.tsukimi.my` | LB → Gateway → Keycloak | Hanya endpoint realm publik; konsol `/admin` tidak dirutekan |
| `admin.tsukimi.my` | Gateway (Cloudflare Access + Keycloak) | `web-admin` + `api-admin` |
| `partner.tsukimi.my` | Gateway (Keycloak saja) | P2, first-party |
| `img.tsukimi.my` | imgproxy | |
| `media.tsukimi.my` | Worker `media-edge` | |
| `assets.tsukimi.my` | domain kustom R2 `tsukimi-assets` | CORS untuk font |
| Staging | **domain terpisah** (default `tsukimi-stg.my`, pertanyaan #15) dengan host yang sama (`anime.`, `accounts.`, `admin.`, apex), di belakang Cloudflare Access | Tidak di bawah `tsukimi.my`, karena cookie `Domain=tsukimi.my` akan terkirim ke staging dan staging bisa menimpanya |
| `argocd.ops…`, `grafana.ops…` | Cloudflare Access | Di domain ops/staging, bukan `tsukimi.my` |
| Status page | vendor eksternal di **domain terpisah** (mis. `tsukimi-status.com`) | Bukan `status.tsukimi.my`: cookie session akan terkirim ke vendor. Tidak bergantung pada cluster |

Replikasi database ke cluster DR **tidak** memakai record DNS publik; jalurnya arsip WAL di object storage atau jaringan privat (§6.3).

- **TLS:** cert-manager Let's Encrypt DNS-01 (token Cloudflare dengan scope zona), wildcard `*.tsukimi.my` + apex. Tanpa service mesh. P2: NATS TLS + nkeys, CNPG `verify-full`.
- **Email transaksional:** provider dipilih di P0 (**Amazon SES ap-southeast-1**, Postmark, atau Resend). SPF/DKIM/DMARC untuk `tsukimi.my` lewat Terraform Cloudflare DNS. Dipakai Keycloak (verifikasi, reset), pengakuan takedown, ekspor privasi. **Click/open tracking dimatikan**, atau memakai domain tracking terpisah, karena CNAME tracking di `*.tsukimi.my` akan menerima cookie session (§9.1).

### 8.5 Secrets

**GCP Secret Manager + External Secrets Operator** (Workload Identity, tanpa key statis). Nama `tsk-<env>-<scope>-<name>`, `refreshInterval: 1h`, Reloader untuk rollout. Fallback di luar GCP: **Infisical** (provider ESO). Tidak ada SOPS atau secret di Git.

### 8.6 GitOps

- Satu Argo CD per cluster, app-of-apps + ApplicationSets.
- Sync wave: CRD → operator → konfigurasi platform → data → services → web.
- Dua repo: `tsukimi` (monorepo + `charts/`) dan `tsukimi-gitops` (state env: tag digest, values, HTTPRoute hasil generate).
- Chart OCI di Artifact Registry: `tsukimi-lib` + `web-app`, `moleculer-service`, `media-job`.
- Promosi: bot commit digest ke staging → smoke test → PR "promote to prod" → disetujui manusia.
- RollingUpdate `maxUnavailable 0`. Argo Rollouts canary di **P5**.

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
- Preview env per PR dengan branch DB ada di **P5**. Sampai saat itu yang dipakai preview Storybook (Cloudflare Pages) + staging.

### 8.8 Autoscaling

| Workload | Mekanisme | Min/maks (prod 100k DAU) |
|---|---|---|
| SSR per app | KEDA ScaledObject (CPU 60% + RPS/pod > 40) | 2–3 / 20 |
| api-public | KEDA (CPU 60% + RPS/pod > 300) | 3 / 30 |
| Service Moleculer | HPA CPU 65% | 2 / 15 |
| Consumer event | KEDA `nats-jetstream` (lag > 1.000/replika) | 1 / 20 (P2; P1 tetap) |
| Transcode | ScaledJob §7.5 | 0 / 20 |
| imgproxy | HPA CPU 70% | 2–3 / 30 |

Tidak ada CPU limit untuk pod Node.js (menghindari throttling CFS). Pod data memakai Guaranteed QoS. `NODE_OPTIONS=--max-old-space-size` diset 75% dari limit. PDB `maxUnavailable: 1`. Topology spread per zona. **NetworkPolicy default-deny** + allowlist (Envoy → web/api, web → api, svc/media → data, egress object storage 443, monitoring, OTLP; replikasi CNPG → cluster DR lewat jaringan privat sesuai §6.3).

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
| Cluster DR region kedua (P2+) | — | $80–200 | $250–600 | $1k–3k |
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
- kube-prometheus-stack (Mimir/Grafana Cloud di P5).
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
| Halaman komik pertama (P3) | p95 < 1,5 s |
| Progress tersimpan ≤ 60 s | 99,99% |
| **Upload-complete → playable** | **p90 ≤ 45 menit** |

**Alerting:**
- Burn rate SLO lewat Sloth.
- Alertmanager: page → PagerDuty (free) atau Grafana IRM, tiket → Telegram/Slack, dead-man's switch → Healthchecks.io.
- Alert page: SLO burn, primary CNPG, lag sync, umur arsip WAL, storage NATS > 80%, lag consumer naik 15 menit, sertifikat < 14 hari, backup > 26 jam, health origin Cloudflare, `pb:dirty` > 30 s, outbox tertua > 60 s.
- Setiap alert punya `runbook_url`.

**Load test:** k6 Operator di staging (`browse_anon`, `watch` tanpa segmen, `search`, `auth`; `read_comic` di P3). P1: 1k stream konkuren. P2: 20k penonton konkuren, soak 2× 2 jam, spike 3×.

### 8.12 Backup state cluster

Desired state ada di Git + Terraform state (GCS berversi). Postgres: §6.6. Meilisearch dan ClickHouse bisa dibangun ulang (plus snapshot). Velero + CSI snapshot di **P2**. Secret ada di Secret Manager (berversi).

---

## 9. Keamanan, privasi & legal

> Ini panduan engineering, **bukan nasihat hukum**. Item **[LAWYER]** wajib ditinjau pengacara Malaysia dan/atau Indonesia sebelum launch.

### 9.1 Autentikasi & session (kanonik)

- **Keycloak** (Operator, 2 replika) di **`accounts.tsukimi.my`** sebagai IdP untuk viewer, staf, dan (P2) partner. Satu akun Tsukimi untuk semua vertikal. Hanya endpoint realm publik yang dirutekan; konsol `/admin` tidak. **DB `keycloak` di cluster CNPG** (§5.4, §6.6). Tema Keycloakify memakai token `packages/ui`. SMTP lewat provider email §8.4 dengan template id/en.
- Realm `tsukimi`:
  - Client `tsukimi-web` (confidential, code + PKCE, hanya dipakai service `session`), dengan `redirect_uri` allowlist persis per host vertikal (`https://anime.tsukimi.my/auth/callback`, apex, dan nanti `comics.`/`video.`).
  - `tsukimi-admin` (MFA wajib).
  - [P2] `tsukimi-partner` (Organizations [VERIFIKASI status GA]).
  - [P2] `tsukimi-tv` (device grant).
- IdP: **Google** di MVP. Apple/LINE menyusul (pertanyaan #20). Brute-force detection, Turnstile pada register dan login setelah 3 kali gagal.
- **BFF:** service `session` menyimpan `{userId, keycloakSub, roles, kc tokens, exp, ua_hash}` di valkey-state `sess:<sha256(sid)>`, di-mirror ke `identity.sessions`.
- **Cookie (kanonik):**

| Cookie | Atribut | Catatan |
|---|---|---|
| **`__Secure-tsk_sid`** | opaque 256-bit; `Domain=tsukimi.my; Path=/; Secure; HttpOnly; SameSite=Lax`; 30 hari sliding | Session viewer, **dipakai bersama semua subdomain** (satu login untuk anime, apex, dan nanti komik/video). Prefix `__Host-` tidak bisa dipakai karena melarang `Domain`. |
| **`__Host-tsk_csrf`** | host-only; `Path=/; Secure; SameSite=Lax`; dibaca JS | Per subdomain. Double-submit + cek `Origin`/`Sec-Fetch-Site` pada non-GET. Tidak bisa ditimpa dari subdomain lain. |
| **`__Host-tsk_asid`** | host-only di `admin.tsukimi.my`; `HttpOnly; Secure; SameSite=Strict`; **12 jam idle / 7 hari absolut** | Session staf **terpisah**, tidak pernah dikirim ke host lain. Login staf tidak berbagi cookie dengan session viewer. |
| `tk_theme`, `tk_tz`, consent | `Domain=tsukimi.my; Path=/; Secure; SameSite=Lax`; bukan HttpOnly | Preferensi yang dipakai bersama semua subdomain; strictly necessary (kecuali consent itu sendiri yang mencatat pilihan). |

SID dirotasi saat login, perubahan hak, atau step-up. Logout menghapus session di server dan cookie `Domain=tsukimi.my`, sehingga semua subdomain ikut keluar.
- SSR personal → `getSession()` → JWT internal 5 menit (aud `api`). Browser → `/api/v1` same-origin di host vertikal dengan cookie, dan gateway yang me-resolve session.
- **Fallback:** better-auth di dalam service `session` dengan **kontrak cookie yang sama**, sehingga app tidak perlu berubah.

**Batas kepercayaan `*.tsukimi.my` (cookie tossing).** Cookie dengan `Domain=tsukimi.my` dikirim ke **setiap** host di bawah `tsukimi.my`, dan setiap host itu juga bisa **menyetel atau menimpa** cookie untuk parent domain (session fixation, menyisipkan cookie yang mengganggu CSRF/preferensi). Aturan wajib:
1. **Jangan pernah menyajikan konten tidak tepercaya atau dikendalikan pengguna di subdomain `tsukimi.my` mana pun.** Tidak ada HTML/SVG/JS unggahan pengguna atau partner, tidak ada halaman profil bebas-HTML, dan tidak ada layanan pihak ketiga lewat CNAME (status page, help desk, tracking link email, landing builder). Portal partner (`partner.tsukimi.my`) dan semua host lain harus **first-party only**: kode kita sendiri, di infrastruktur kita sendiri.
2. Unggahan (termasuk partner) hanya disajikan sebagai objek media/gambar ter-normalisasi lewat Worker/imgproxy dengan `Content-Type` tetap, `X-Content-Type-Options: nosniff`, dan `Content-Disposition` untuk subtitle. Tidak pernah sebagai dokumen aktif.
3. Session terikat `ua_hash`, SID **selalu dirotasi saat login** (cookie yang disisipkan tidak bertahan), CSRF memakai `__Host-` (tidak bisa ditimpa), dan session staf host-only.
4. Staging, ops, dan status page berada di domain terpisah (§8.4). Subdomain dangling dicegah: semua record DNS dikelola Terraform dan diaudit di CI/mingguan (P1.29).
5. `media.`, `img.`, dan `assets.` ikut menerima cookie session. Worker, imgproxy, dan log edge **tidak boleh mencatat header `Cookie`**, dan cache key tidak pernah memakai cookie.

### 9.2 Otorisasi

- **Role kanonik di Keycloak.** MVP mengaktifkan `user`, `editor`, `moderator`, `admin`. `rights_manager` digabung ke `admin` sampai ada staf legal. `superadmin` untuk `role.assign`. Role org partner (`partner_owner`, `partner_uploader`, `partner_viewer`) di P2. **Tidak ada kolom role di Postgres.**
- Middleware `authz` Moleculer **default deny**. Action tanpa blok `auth` membuat CI gagal.
- Filter pemilik/org di lapisan repository (BOLA). RLS untuk schema partner di P2.
- Four-eyes di P2 (§2.4).

### 9.3 Risiko OWASP spesifik Tsukimi

| Risiko | Kontrol |
|---|---|
| XSS (JSON-LD F1, sinopsis, subtitle) | Escape JSON-LD, Markdown + `rehype-sanitize`, sanitizer VTT, **CSP nonce** per host: `default-src 'self'; script-src 'self' 'nonce-…' https://assets.tsukimi.my; img-src 'self' https://img.tsukimi.my https://assets.tsukimi.my data:; font-src https://assets.tsukimi.my; media-src https://media.tsukimi.my blob:; connect-src 'self' https://media.tsukimi.my; style-src 'self' https://assets.tsukimi.my; form-action 'self' https://accounts.tsukimi.my; frame-ancestors 'none'` |
| BOLA | Filter repository, UUIDv7, test lintas user |
| SSRF (imgproxy, fetcher SEO, import URL) | imgproxy bertanda tangan + allowed sources. Fetcher di namespace dengan egress terbatas (blok RFC1918 dan metadata) |
| Upload berbahaya | Presigned PUT dengan prefix tetap, ffprobe sandbox, `-protocol_whitelist file,pipe`, tolak input playlist/concat, pod non-root + rootfs read-only + **tanpa egress kecuali object storage**, ClamAV + batas arsip |
| Mass assignment | **Skema TypeBox per role** (partner tidak bisa set `status`, `license_*`, `age_rating_final`) |
| Konsumsi sumber daya | Rate limit §5.6, Meilisearch `limit ≤ 50` |
| Misconfig | Host admin/ops di belakang Cloudflare Access. `/admin` Keycloak tidak dirutekan publik di `accounts.tsukimi.my`. Hostname tak terdaftar → 404 di Gateway |
| Cookie tossing / subdomain takeover | Hanya host first-party di `*.tsukimi.my`, record DNS dikelola Terraform + audit dangling, staging/status/tracking di domain terpisah, rotasi SID saat login, CSRF `__Host-` (§9.1) |
| Open redirect | `returnTo` hanya path relatif, atau URL absolut yang host-nya ada di allowlist persis (`tsukimi.my`, `anime.tsukimi.my`, dan host vertikal lain yang sudah live). Wildcard `*.tsukimi.my` tidak diterima |
| Webhook | HMAC + timestamp 5 menit + idempotency key |

### 9.4 Perlindungan konten

| Level | Kapan | Mekanisme | Fase |
|---|---|---|---|
| L0 | Trailer/promo | URL publik | P1 |
| **L1 (default)** | Semua konten berlisensi tanpa klausul DRM | Token path HMAC di Worker (§7.4), imgproxy bertanda tangan 24 jam, KV revokasi | P1 |
| L2 | Lisensor meminta pelacakan bocoran | Watermark forensik A/B atau vendor. Overlay di komik | P5 |
| L3 | Kontrak mewajibkan DRM | Multi-DRM + Shaka | P5 |

Batas 3 stream konkuren per akun ada di **P2**.

### 9.5 Takedown (alur yang menutup celah cache)

`takedown.execute` (moderator/admin) melakukan, **dalam satu alur**:
1. Status → `taken_down` + audit log.
2. Tulis prefix `videoId/rv` (atau chapter `pv`) ke **Workers KV revokasi**. Worker langsung menolak walaupun token masih berlaku.
3. **Purge by tag** `work:<id>` untuk HTML dan API (Cache-Tag ada di keduanya). Kalau purge-by-tag tidak tersedia di plan yang dipilih [VERIFIKASI], purge per daftar URL dari `sitemap-entries`, untuk **setiap host** yang menyajikan karya itu (host vertikal + `/api/v1` di host tersebut).
4. Hapus dari index search dan sitemap. Invalidasi cache `rights:*`.
5. Jika ada `media.gofile_links.status=ok` untuk asset itu: panggil `DELETE /contents/{gofile_file_id}` di Gofile (guest token) dan set `removed_at`. Link Gofile berada di luar KV revokasi/CDN kita (§7.1b), jadi langkah ini **wajib**, bukan opsional, supaya takedown benar-benar menutup semua jalur akses yang kita buka sendiri.

Tanpa `stale-if-error` panjang di GET katalog (§5.6). **Acceptance:** playback gagal ≤ 2 menit setelah takedown. Target end-to-end ≤ 15 menit sejak laporan valid (SLA operasional).

**Proses notice-and-action:** form `tsukimi.my/legal/copyright` + `copyright@tsukimi.my`, akui dalam 24 jam, nonaktifkan dalam 48 jam (target < 24 jam), counter-notice 10 hari kerja, repeat-infringer 3 strike/12 bulan. Kewajiban safe-harbour MY/ID: **[LAWYER]**.

### 9.6 Lisensi konten & rights (risiko hukum utama)

- **Aturan keras: tidak ada title, episode, chapter, gambar, atau profil cast yang live tanpa rights record.** Menayangkan anime, komik, atau video dengan cast nyata tanpa lisensi adalah pelanggaran hak cipta (Malaysia: Copyright Act 1987; Indonesia: UU 28/2014). Situs bajakan diblokir aktif oleh regulator Indonesia. Klaim spesifik tentang cakupan streaming di amandemen Copyright Act 2022 dan kewajiban PSE (termasuk SLA takedown) **[LAWYER — belum terverifikasi]**.
- **Modul `v1.rights` di image `catalog` (MVP):** `license_agreement`, `license_window` (territories, excluded_territories, starts/ends, bahasa, allows_dub/sub), `work_age_rating`. Satu fungsi `rights.isAvailable({workId, unitId, country, at, viewerAge})` dipakai oleh listing, index search (atribut `territories`), sitemap, dan `playback.authorize`. Negara diambil dari `CF-IPCountry`. Cache Valkey 5 menit, diinvalidasi event.
- **CronJob `rights.sweep` tiap 5 menit** (P1): window berakhir → unpublish, hapus dari search dan sitemap.
- Portal lisensor + penyimpanan PDF kontrak: P2.
- **Profil cast (personality rights, P4):** sumber untuk setiap fakta, foto berlisensi, tanpa bio karangan, link "minta koreksi/penghapusan", dan ranking berdasarkan views/follows (bukan penampilan) yang diberi label demikian. **Tidak ada konten dewasa.** Penamaan vertikal "actress" perlu ditinjau karena persepsi regulator, app store, dan payment provider (UU 44/2008, ITE, CMA 1998) **[LAWYER]**.
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
- **Consent:** default hanya cookie strictly necessary (session, CSRF, tema, timezone). Pilihan consent disimpan di cookie `Domain=tsukimi.my`, sehingga berlaku di semua subdomain, dan daftar cookie di kebijakan cookie mencantumkan domain cakupannya. Analitik opt-in, dan flag server menahan event non-esensial. Ada toggle "Personalisasi dari riwayat saya".
- **Hak subjek data:**
  - Ekspor ZIP (signed URL 72 jam, 1×/7 hari).
  - Hapus dengan grace 14 hari, lalu event `identity.user.deleted` disebar ke semua service lewat checklist `erasure_tasks`.
  - Beta (P1) mendapat ekspor/hapus dasar. Versi lengkap menjadi gerbang launch P2.
- **Sub-processor & DPA:** Cloudflare, IDrive, Google Cloud, provider email, (P5) vendor DRM **[LAWYER]**.
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
8. **Risiko penggunaan API MyAnimeList** (§7.1c/R30): apakah menyalin sinopsis/poster MAL ke katalog streaming kami aman di bawah API Agreement MAL, dan kata-kata atribusi yang dibutuhkan di halaman legal.

---

## 10. Roadmap per fase

Estimasi dalam **person-day (pd)**. Setiap tugas punya satu pemilik seksi (sudah dideduplikasi). Kapasitas efektif diasumsikan ±80–85% dari 3 dev (±12,5–13 pd per minggu).

| Fase | Isi | pd | Minggu (3 dev) |
|---|---|---|---|
| **P0** Foundation (berorientasi anime) | Monorepo, platform, auth lintas subdomain, kerangka `apps/anime` + `apps/hub` + `apps/admin` | **78** | 1–6 |
| **P1** Anime MVP | Private beta `anime.tsukimi.my` | **138** | 7–18 (minggu 18 = buffer) |
| **P2** Anime scale & public launch | DR replica cluster, ClickHouse, partner, TV, gerbang legal | ±90 | ±19–27, launch ±minggu 28 |
| **P3** `comics.tsukimi.my` | Vertikal komik + reader | ±30 | ±29–32 |
| **P4** `video.tsukimi.my` + cast | Vertikal video + direktori cast | ±30 | ±33–36 |
| **P5** Growth | Backlog lintas vertikal (§10.6) | per item | setelah P4 |

### 10.1 P0 Foundation (minggu 1–6) — total **78 pd**

| # | Tugas | Acceptance | pd |
|---|---|---|---|
| P0.1 | **Konversi monorepo:** `git init` + commit snapshot `tsukimi.my`; root `p-project/tsukimi`; pindahkan ke `packages/ui`; `rootDir` = root repo; **ganti nama orang sungguhan di mock (F4) sebelum fixtures dibuat**; cek grep allowlist di CI | `pnpm install && turbo build` + Storybook dari root lulus; screenshot sama dengan baseline sebelum pindah; grep "Lucy4" = 0; grep nama-nyata = 0 | 3 |
| P0.2 | **Dev lokal docker-compose:** Postgres 17, Valkey cache + state, NATS JetStream, MinIO (bucket sesuai layout), Meilisearch, Keycloak + Mailpit; host lokal `anime.tsukimi.localhost`/`tsukimi.localhost` untuk menguji cookie lintas subdomain; `pnpm dev:infra` | Dev baru punya stack jalan < 10 menit; healthcheck semua hijau | 2 |
| P0.3 | **CI dasar:** GitHub Actions lint/typecheck/vitest/Storybook build, Turbo cache, gitleaks, frozen lockfile, guard nama-nyata | PR gagal pada lint/type/secret; durasi CI < 10 menit | 2 |
| P0.4 | **Spike week** (masing-masing menghasilkan ADR): (a) StyleX + RR7 framework SSR, strategi A vs B, termasuk render di Chromium 76/87 (3); (b) `@moleculer/channels` JetStream: backoff, DLQ, pod kill (2); (c) KEDA `nats-jetstream` ScaledJob di JetStream R3 3-node + fallback Prometheus (2); (d) matriks panggilan S3 IDrive e2 yang dipakai SDK/rclone/Barman: presigned multipart, CORS, lifecycle di bucket berversi, checksum (1,5); (e) restore Barman dari e2 + replica cluster CNPG dari arsip WAL di staging (1,5); (f) konfirmasi tertulis Cloudflare soal HLS dari R2 via Worker + cek purge-by-tag di plan (0,5) | 6 ADR dengan ya/tidak + fallback terpilih | 10,5 |
| P0.5 | `packages/ui` SSR-safe: ThemeProvider berbasis cookie `tk_theme` (`Domain=tsukimi.my`) + migrasi key, DeviceProvider `initial`, LinkProvider + `href` nav, `configureSeo` (base URL per vertikal menggantikan `SITE.url`), fix F1/F2 (escape JSON-LD, allow-list atribut), global.css bertoken, font self-hosted | renderToString + hydrate setiap story halaman tanpa warning; test payload `</script>` ter-escape; canonical memakai base URL app | 4,5 |
| P0.6 | `packages/fixtures` + MSW; Vitest + addon-vitest + baseline visual Playwright (Docker dipin) | CI menjalankan unit/interaksi/a11y/visual; perubahan token menghasilkan diff yang bisa direview | 3 |
| P0.7 | `tooling/*`: tsconfig, eslint (plugin StyleX), `stylex-config`, `vite-preset` (satu `build.target`), job `ui-guard` | ui-guard gagal jika satu app memakai opsi StyleX berbeda | 1,5 |
| P0.8 | `packages/contracts` (TypeBox → OpenAPI 3.1) + `packages/db` (Kysely, codegen, runner Kysely Migrator satu target; replikasi fisik membuat runner dua target tidak diperlukan) | Migrasi contoh aditif + destruktif (expand/contract) lolos di PG17 ephemeral | 3 |
| P0.9 | `packages/broker-kit` (moleculer.config, errors, mixin db/outbox/channels/idempotent/audit/authz) + `packages/otel` + service hello | Service hello terhubung ke NATS; `/metrics` aktif; span muncul di Tempo (staging) | 3 |
| P0.10 | Schema `ops`/`ops_local` + outbox mixin + `outbox-relay` (koneksi langsung, pool 2) + idempotent consumer + DLQ (digabung) + stream TSK_* | Test integrasi: 10k baris outbox direlay; **injeksi duplikat menghasilkan satu efek samping**; event bertahan saat broker restart; re-drive DLQ berfungsi | 5 |
| P0.11 | Gateway `api-public`: Ajv/TypeBox, `/api/v1/openapi.json`, problem+json, GCRA Valkey, Idempotency-Key 24 jam, ETag/Cache-Control/Cache-Tag | 429 + header RateLimit; replay mengembalikan respons tersimpan; **route publik tanpa Set-Cookie** | 4 |
| P0.12 | Keycloak (Operator di staging, kontainer lokal) di host `accounts.*`: realm, client web/admin, `redirect_uri` allowlist per host, Google IdP, brute force; **provider email + SPF/DKIM/DMARC + SMTP Keycloak + template id/en**; DB `keycloak` | Register/login/reset/verifikasi email jalan di staging; email lolos DMARC; konsol `/admin` Keycloak tidak terjangkau dari publik | 3,5 |
| P0.13 | Service `session` (BFF) + `getSession`/`requireSession` di sdk, cookie **`__Secure-tsk_sid` (`Domain=` domain env)** + `__Host-tsk_csrf` per host, cookie staf host-only, JWT internal 5 menit, `identity.users` dengan key `sub`, allowlist `returnTo` per host | Login di host anime terbaca di apex dan sebaliknya; logout menghapus session di semua host; tidak ada token di storage browser; test CSRF lulus; cookie yang disisipkan dari subdomain lain tidak bertahan melewati login (rotasi SID) | 5,5 |
| P0.14 | Domain model v1 + migrasi **untuk anime** (identity, catalog inti + rights, anime, media, progress dengan partisi hash statis, ranking, seo, cms, ops, ops_local) + seed anime dari fixtures yang sudah bersih. Schema `comics` dan tabel video/cast hanya didesain di ERD | ERD direview (termasuk desain P3/P4); migrasi lolos di DB kosong; seed memuat fixtures anime | 4 |
| P0.15 | `packages/shell` minimal (AppFrame, nav-manifest dengan host + status per vertikal, AppLink) + `packages/sdk` (client tergenerate + QueryClient per request) + app RR7 kosong **`apps/anime` + `apps/hub`** + admin (CSR) + `tooling/gen-routes` (HTTPRoute per hostname) | Setiap app me-render placeholder SSR di host-nya sendiri lewat HTTPRoute hasil generate di staging, dengan shell bersama; `/api` di host anime sampai ke `api-public` | 4 |
| P0.16 | Terraform: project GCP, VPC, **GKE staging zonal**, Artifact Registry, Secret Manager, WIF GitHub, state GCS, **budget alert** | `terraform plan` bersih; Actions bisa push tanpa key statis | 3 |
| P0.17 | `tsukimi-gitops` + Argo CD + add-on platform (cert-manager, ESO, Envoy Gateway, KEDA, Reloader, CNPG operator) | `root-staging.yaml` menghidupkan platform dari cluster kosong; sertifikat wildcard (`*` + apex) terbit | 5 |
| P0.18 | Chart Helm `tsukimi-lib`, `web-app`, `moleculer-service`, `media-job` (OCI) | kubeconform + helm unittest lulus; satu service + satu app ter-deploy hanya dari values | 3 |
| P0.19 | Cloudflare via Terraform: zona prod (Pro) + zona staging terpisah, **record DNS per subdomain** (apex, `www`, `anime`, `accounts`, `admin`, `img`, `media`, `assets`), cakupan sertifikat `*.tsukimi.my` + apex, Full strict, AOP, WAF, rate limit kanonik, **cache rule per host** (§4.8, §7.4), Access untuk staging/admin/ops, Transform Rule kelas perangkat | Origin menolak non-Cloudflare; test `cf-cache-status` per host sesuai tabel; hostname tak terdaftar → 404 | 3,5 |
| P0.20 | Pipeline image: buildx, Trivy, Syft, **cosign sign**, push, bot bump staging, upload aset ke R2, Renovate | Merge ke main men-deploy image yang berubah (sudah ditandatangani dan dipindai) ke staging ≤ 15 menit | 3 |
| P0.21 | Bucket e2 + R2 (termasuk `tsukimi-assets` + CORS font): layout, CORS, kredensial per peran, lifecycle | Setiap kredensial ditolak di luar scope (test otomatis) | 2 |

Dibanding rencana tiga vertikal (80 pd): P0.8 −1 (runner satu target), P0.14 −1 (anime saja), P0.15 −1 (dua app publik, bukan empat), P0.13 +0,5 dan P0.19 +0,5 (cookie dan host per subdomain).

**Exit P0:** login bersama lintas subdomain (host anime + apex) di staging, satu event outbox mengalir end-to-end, 6 ADR spike tersedia, dan keputusan terbuka #1–#6 sudah dijawab atau punya default yang disetujui.

### 10.2 P1 Anime MVP (minggu 7–18, termasuk buffer 1 minggu) — total **138 pd**

| # | Tugas | Acceptance | pd |
|---|---|---|---|
| P1.1 | CNPG 3 instance + Pooler rw/ro + Barman Cloud Plugin PITR ke e2 (env checksum) + `pg_dump` mingguan + DB `keycloak` dump malam hari + rclone crypt backup ke R2 + **satu restore PITR manual** | Kill primary → failover < 60 s tanpa kehilangan transaksi; PITR ke timestamp berhasil di namespace scratch; runbook ditulis | 5 |
| P1.2 | Data tier: NATS JetStream R3 + stream, `valkey-cache`, `valkey-state` (Sentinel), Meilisearch + snapshot (tanpa ClickHouse) | Kill 1 node NATS tanpa kehilangan pesan; failover Sentinel < 30 s | 3 |
| P1.3 | `catalog` inti: genre/tag/studio + **modul rights** + CronJob `rights.sweep` 5 menit + status workflow | Title anime di luar teritori/window hilang dari listing/search/sitemap/playback ≤ 5 menit; list p95 < 50 ms di origin | 5 |
| P1.4 | `anime`: series/season/episode/versi SUB-DUB, browse per musim + genre, airing rules/slots, endpoint jadwal, CronJob auto-publish + markAired | EpisodeList/AiringCalendar benar di semua IANA tz; episode pada slot Sab 23:30 JST terbit ≤ 1 menit | 8 |
| P1.5 | Status workflow + CronJob publish terjadwal + **audit-log mixin** (transaksi sama, insert-only) + `content_revision` + revert | Setiap tulisan admin punya baris audit dengan diff; role app tidak bisa UPDATE/DELETE audit | 4 |
| P1.6 | `apps/admin`: A1 anime series (termasuk blok hak/lisensi, rating usia), A8 Taxonomy, A7 minimal, **A15 matching MAL** (search/preview/import ke draft + poster lewat image-process); guard role | Editor membuat seri anime lengkap dengan cover, genre, studio, dan hak; import MAL mengisi draft tanpa auto-publish; integrasi mati tidak menghalangi input manual | 7 |
| P1.7 | `apps/admin`: A2 season/episode (SUB/DUB, subtitle, intro/outro, marker) + A5 UI jadwal | Episode tampil di EpisodeList + player dengan skip intro dan dua audio | 6 |
| P1.8 | `apps/admin`: A3 upload (Uppy multipart, status job, retry) | Upload 20 GB bisa dilanjutkan setelah jaringan putus | 4 |
| P1.9 | `media`: uploads init/complete (Idempotency-Key), registry assets/objects, `playback.authorize` + token dual-kid, **consumer `media-gofile-relay`** (guest account, `media.gofile_links`, retry 8x, hook di `takedown.execute`) | Completion hanya menghasilkan satu event; token kedaluwarsa atau dimanipulasi → 403; upload master ≤ 2 GB menghasilkan `download_page` ≤ 10 menit; takedown menghapus link Gofile | 5,5 |
| P1.10 | Job `media-validate` (ffprobe, decode, ClamAV untuk gambar, sanitizer subtitle) | Fixture rusak (mp4 terpotong, SRT dengan encoding salah, gambar dengan magic byte palsu) ditolak dengan alasan | 2,5 |
| P1.11 | ScaledJob `media-transcode` (spesifikasi §7.5) | Master lolos validator; main di hls.js + Safari dengan SUB/DUB + sprite; job yang dibunuh lalu di-retry menghasilkan output identik; **p90 upload→playable ≤ 45 menit** | 6 |
| P1.12 | `image-process` (cover, poster, thumbnail episode) | Cover dinormalisasi + EXIF dibuang; turunan tersedia di bucket lebar | 1,5 |
| P1.13 | imgproxy (signed, bucket lebar, format eksplisit, pre-warm) | Hit ratio CDN > 90% pada tes jelajah sintetik | 2 |
| P1.14 | Worker `media-edge` (token path, cache key tanpa token, **KV revokasi**, R2 → e2, tidak mencatat header `Cookie`) + `storage-replicator` (2 replika, sha256, tombstone 7 hari) | Binding R2 dimatikan → playback lanjut dari e2; 1.000 objek ada di R2 dengan sha256 cocok ≤ 5 menit | 5 |
| P1.15 | `progress`: save Lua LWW, flusher, continue, overlay, watchlist, follow, sync seq (item episode) | 7k tulis/s → umur `pb:dirty` < 10 s; kill Postgres → tidak ada progress hilang; resume lintas perangkat ≤ 10 s | 6 |
| P1.16 | `search-seo`: index Meili `anime` (+territories), upsert berversi, reconcile, slug/redirect, override, `sitemap-entries` per vertikal | Title publish bisa dicari ≤ 10 s; rename slug → 301 | 5 |
| P1.17 | Ranking Postgres: CronJob malam hari (trending anime) ke `ranking.snapshots/entries` + pinning editorial | Row Trending dan "Populer musim ini" tampil dari snapshot | 1,5 |
| P1.18 | `packages/shell`: TopBar + **vertical switcher** (Komik/Video "segera hadir"), skrip tema inline (cookie `Domain=tsukimi.my`), UI auth, route module akun (profile/settings/watchlist), Speculation Rules di dalam host | Switcher menautkan host yang live dan menampilkan "segera hadir" untuk yang belum; tema yang dipilih di anime berlaku di apex | 5 |
| P1.19 | `apps/hub` minimal: landing dengan tautan besar ke anime, halaman legal (privacy, ToS, hak cipta), robots + sitemap apex | Landing SSR ter-cache; tautan ke `anime.tsukimi.my` di atas fold; halaman legal id/en | 1,5 |
| P1.20 | `apps/anime`: Home, browse musim/genre, detail series, jadwal, search, watch + **adapter VideoPlayer hls.js** (audio group, subtitle, skip intro/outro, next episode, fallback native) | Halaman SSR data nyata; playback di Chrome/Firefox/Safari/Android; start p75 < 2 s di staging; Rich Results lulus untuk TVSeries/TVEpisode/Breadcrumb | 10 |
| P1.21 | Baris Continue Watching, watchlist/follow, settings tersimpan di server, filter "Followed only" di jadwal | Settings sama di semua perangkat dan subdomain | 3,5 |
| P1.22 | SEO per route + sitemap/robots per host (anime + apex) + **domain property Search Console** + crawl SeoOptimizer di CI | Sitemap index anime memuat semua series/episode yang publish; canonical selalu di host sendiri; skor audit ≥ 80 di 50 URL | 3,5 |
| P1.23 | i18n Lingui `id` + `en` (infra + string UI) + Intl dengan cookie `tk_tz` | Ganti locale mempertahankan path; hreflang benar | 3 |
| P1.24 | Dockerfile per app, Cache-Control per jenis route, test CI `public-cache-guard` | Image < 150 MB non-root; HTML publik HIT di Cloudflare pada request kedua, juga untuk user login | 3 |
| P1.25 | Takedown: tombol + Cache-Tag purge + KV revocation + hapus dari search/sitemap | **Playback gagal ≤ 2 menit setelah takedown**; HTML/API diperbarui ≤ 2 menit di semua host | 3 |
| P1.26 | Rating usia + AgeBadge/AgeGate + DOB | Pengunjung tanpa login tidak bisa membuka konten 16+/18; tanpa rich data untuk 18 | 2 |
| P1.27 | Observability: kube-prometheus-stack, Loki, Tempo, Alloy, **Faro di packages/shell** (web-vitals + QoE hls.js), size-limit CI, SLO dasar + alert + runbook | Satu trace mengalir browser → SSR → api → action → consumer; panel VST p75/p95 terisi | 6 |
| P1.28 | Autoscaling (KEDA/HPA), PDB, resource requests, **NetworkPolicy default deny** | Ramp k6 men-scale out lalu kembali; egress internet dari `tsk-svc` diblok | 3,5 |
| P1.29 | Hardening keamanan: authz default deny + lint, suite test BOLA, CSP nonce, hardening upload (no-egress, whitelist protokol), Turnstile, **test cakupan cookie** (atribut `__Secure-tsk_sid`, `__Host-tsk_csrf`, cookie staf host-only) + audit DNS untuk subdomain dangling | Action tanpa `auth` → CI gagal; akses progress lintas user → 403/404; tidak ada record DNS yang menunjuk ke layanan pihak ketiga di `tsukimi.my` | 6 |
| P1.30 | **Cluster prod regional** (2 minggu terakhir) + data tier prod + switch LB Cloudflare + alert biaya | Smoke test prod hijau di `anime.tsukimi.my` dan apex; restore PITR diuji di prod-scratch | 4 |
| P1.31 | k6 (1k stream konkuren) + QA lintas perangkat + hardening beta | **Semua exit criteria MVP §2.5 terpenuhi** | 5 |
| P1.32 | Privacy notice beta (id/en) + banner consent minimal + ekspor/hapus dasar | Event analitik berhenti tanpa consent; ekspor ZIP berisi profil + progress | 2 |

Dibanding rencana tiga vertikal (168 pd), yang **dikeluarkan dari P1**: service `comics` (5), app komik + reader (5), video/cast di `catalog` (bagian dari 10 → 5), `apps/video` + home video (8), A4 bulk chapter dan A6 cast di admin (±4), `comic-process` (2,5). Yang **ditambahkan**: `apps/hub` minimal (1,5), Home/browse/search ikut `apps/anime` (+3), vertical switcher dan test cookie lintas subdomain.

Minggu 18 adalah **buffer** dan tidak diisi tugas baru. Private beta `anime.tsukimi.my` dimulai ±minggu 19.

### 10.3 P2 Anime scale & public launch (±minggu 19–27) — ±90 pd

| # | Tugas | Acceptance | pd |
|---|---|---|---|
| P2.1 | **DR replica cluster:** `tsukimi-pg-dr` di region kedua dari arsip WAL e2 (+ streaming via jaringan privat), monitoring lag (§6.4), runbook failover/switchover dalam bentuk skrip, game day staging | Lag replay p95 < 2 menit (arsip) / < 5 s (streaming); failover ≤ 30 menit; switchover write freeze ≤ 5 menit | 7 |
| P2.2 | ClickHouse + `analytics-ingest` + service `ranking` (sumber diganti, API tetap) + ekspor RUM + dashboard A13 | Ranking hourly; dashboard cocok dengan event mentah ±1% | 10 |
| P2.3 | Notifikasi **in-app** (consumer `anime.episode.aired`) + riwayat + input rating + stat TopBar | Badge episode baru muncul ≤ 2 menit setelah publish | 6 |
| P2.4 | Portal partner (`partner.tsukimi.my`, first-party): Keycloak Organizations, RBAC partner + RLS, `in_review`/four-eyes, drafts, onboarding | Partner hanya melihat/mengunggah title miliknya; approval wajib editor lain; tidak ada konten partner yang disajikan sebagai HTML di `*.tsukimi.my` | 12 |
| P2.5 | Moderasi/laporan (A11), tools SEO (A9), bulk import (A14), kurasi Home anime penuh (A7) | Antrean laporan bisa ditindaklanjuti; import idempoten | 10 |
| P2.6 | TV polish (Android TV/Tizen/webOS) + **login device-code** + manajemen perangkat | D-pad key → fokus p75 ≤ 250 ms; TV login tanpa mengetik password | 8 |
| P2.7 | rclone reconcile semua bucket + drill restore bulanan otomatis + Velero + Kyverno verifyImages | Objek yang sengaja dihapus terdeteksi dan diperbaiki; image tanpa tanda tangan ditolak | 6 |
| P2.8 | i18n translation pass penuh + `ms` untuk halaman legal + WCAG 2.2 AA + Lighthouse CI | axe 0 critical; semua string ter-externalisasi | 6 |
| P2.9 | **Gerbang legal launch:** DPO terdaftar, breach register, TIA, notice EN/BM/ID, ToS, kebijakan cookie & hak cipta, ekspor/hapus lengkap, form takedown publik | Checklist §9.10 ditandatangani | 8 |
| P2.10 | Load test 20k penonton konkuren, tuning cache (segmen ≥ 95% hit), transcode paralel per rung | SLO 99,9% pada 20k; upload→playable p90 ≤ 20 menit | 8 |
| P2.11 | Drill DR regional (`asia-southeast2`), batas 3 stream konkuren, CUD | Drill ≤ 4 jam; stream ke-4 ditolak | 5 |
| P2.12 | pg_partman untuk `notify.notifications`/`cms.audit_log`, ekspor WORM audit, `storage-replicator` KEDA | Pemeliharaan partisi otomatis; replikasi tidak rusak | 4 |

**Public launch `anime.tsukimi.my` ±minggu 28**, dengan syarat P2.9 lulus dan keputusan lisensi anime ada.

### 10.4 P3 `comics.tsukimi.my` (±minggu 29–32) — ±30 pd, butuh keputusan go

| # | Tugas | Acceptance | pd |
|---|---|---|---|
| P3.1 | Migrasi schema `comics` + `v1.comics` di image `catalog`: series, credits, chapter `pages jsonb`, cek akses terkunci | Reader memuat chapter dalam satu panggilan dengan w/h | 5 |
| P3.2 | `apps/admin`: A1 comic series + A4 bulk chapter (ZIP/CBZ, natural sort, reorder) | Chapter 60 halaman terbaca < 5 menit setelah upload | 4 |
| P3.3 | `comic-process` (slicing gutter, guard zip bomb) sebagai ScaledJob | Strip 30.000 px dipotong 1.200–2.800 px tanpa memotong balon kata (fixture); zip bomb dan path traversal ditolak | 3 |
| P3.4 | `apps/comics`: Home, browse, detail, reader (vertikal/paged RTL-LTR/spread) + progress halaman + Continue Reading | Next page p75 < 300 ms dengan throttle 4G; halaman komik pertama p95 < 1,5 s | 7 |
| P3.5 | Indeks search `comics`, board most-read, SEO ComicSeries/ComicIssue, sitemap/robots `comics.tsukimi.my`, submit sitemap ke domain property | Rich Results lulus; sitemap komik tersubmit; skor audit ≥ 80 | 2,5 |
| P3.6 | Peluncuran host: DNS, HTTPRoute, cache rule `/read*`, switcher "live", apex menautkan komik, **akun global `tsukimi.my/account`** | `cf-cache-status` sesuai tabel; login yang sama berlaku di `comics.`; switcher menampilkan Komik aktif | 3 |
| P3.7 | Notifikasi in-app `comics.chapter.published` | Badge chapter baru ≤ 2 menit setelah publish | 1,5 |
| P3.8 | Rights/lisensi komik + QA lintas perangkat + k6 `read_comic` | Exit criteria reader terpenuhi; tidak ada chapter live tanpa rights record | 4 |

### 10.5 P4 `video.tsukimi.my` + cast (±minggu 33–36) — ±30 pd, butuh keputusan go

| # | Tugas | Acceptance | pd |
|---|---|---|---|
| P4.1 | Modul video, cast, kategori, marker di `v1.catalog` + migrasi tabel P4 | Semua field VideoCard/CastRosterCard dari API; list p95 < 50 ms di origin | 6 |
| P4.2 | `apps/admin`: A1 video + A6 cast (alias, foto berlisensi, merge duplikat) | Editor membuat video lengkap dengan cast dan hak | 4 |
| P4.3 | `apps/video`: Home (Popular Actress, kategori), library, kategori, detail/watch video, direktori cast, **profil cast** | Halaman SSR data nyata; Rich Results lulus untuk Person/VideoObject/Breadcrumb | 9 |
| P4.4 | Indeks search `videos` + `cast`, ranking "Popular Actress", sitemap/robots `video.tsukimi.my` | Ranking tampil dari snapshot; sitemap tersubmit | 3 |
| P4.5 | Peluncuran host: DNS, HTTPRoute, cache rule, switcher "live", apex menautkan video | `cf-cache-status` sesuai tabel; login yang sama berlaku | 1,5 |
| P4.6 | Legal: personality rights profil cast, review penamaan vertikal "actress" **[LAWYER]** | Review pengacara tercatat sebelum host dibuka | 2,5 |
| P4.7 | QA lintas perangkat + k6 + hardening | Exit criteria video setara anime | 4 |

### 10.6 P5 Growth (setelah P4, masing-masing butuh keputusan go)

1. Rekomendasi personal (co-watch/co-read dari ClickHouse), dengan uplift ≥ 5% di A/B (12 pd).
2. Web push + email digest (7 pd).
3. Monetisasi: VIP/langganan, entitlement, pembayaran, DRM jika diwajibkan (20 pd + DRM 8 pd).
4. Komentar/reaksi + moderasi, PWA + prefetch chapter offline, multi-profil (12 pd).
5. AV1/HEVC untuk title teratas (5 pd), JASSUB (3 pd), watermark forensik (12 pd).
6. Pencarian lintas vertikal di hub apex.
7. Platform: Mimir/Grafana Cloud, preview env per PR dengan branch DB, Argo Rollouts canary, scrubber integritas mingguan, region kedua yang hangat, Go hot path (berdasarkan hasil k6).
8. Wrapper native (Android TV dulu) jika share TV > 15%.

---

## 11. Tim & estimasi

### 11.1 Bentuk tim (3 dev, direkomendasikan)

| Peran | Fokus |
|---|---|
| **FE lead** | Monorepo, `packages/ui`/shell/sdk, `apps/anime` + `apps/hub`, player, SEO per host, i18n, perf. (P3: reader komik) |
| **BE lead** | Moleculer, model data, outbox, session lintas subdomain, progress, search, media pipeline |
| **Full-stack/Platform** | `apps/admin`, Terraform/GKE/Argo, Cloudflare (DNS/sertifikat/cache per host), observability, CNPG/backup |
| + 0,5 desainer | Figma, landing hub, vertical switcher, AgeGate, UI admin, tema Keycloakify |
| + pengacara (eksternal) | §9.10, mulai P0 |

### 11.2 Timeline

| Skenario | P0 | P1 Anime MVP | Private beta anime | P2 | Public launch anime | P3 komik | P4 video + cast |
|---|---|---|---|---|---|---|---|
| **3 dev (dasar)** — 216 pd P0+P1 (78 + 138) | 6 minggu | 12 minggu (termasuk buffer) | **±minggu 19** | ±9 minggu (±90 pd) | **±minggu 28** | ±4 minggu → ±minggu 32 | ±4 minggu → ±minggu 36 |
| 2 dev (+40%) | ±8–9 minggu | ±17 minggu | ±minggu 27 | ±13 minggu | ±minggu 40 | ±6 minggu → ±minggu 46 | ±6 minggu → ±minggu 52 |
| 4 dev (−20%) | ±5 minggu | ±10 minggu | ±minggu 16 | ±7 minggu | ±minggu 23 | ±3 minggu → ±minggu 26 | ±3 minggu → ±minggu 29 |

Dibanding rencana tiga vertikal sekaligus (248 pd, beta ±minggu 21), fokus anime memajukan private beta ±2 minggu dan memangkas P0+P1 sebesar 33,5 pd. Biaya totalnya tidak hilang: ±60 pd pekerjaan komik/video pindah ke P3/P4, ditambah sedikit overhead peluncuran per subdomain (DNS, SEO, QA).

Pekerjaan ini berat di integrasi, jadi penambahan orang tidak mempercepat secara linear. Skenario 4 dev hanya realistis jika dev ke-4 mengambil alih admin CMS atau platform. P3 dan P4 bisa dikerjakan paralel jika tim bertambah, karena keduanya memakai backend dan shell yang sama.

**Jika tertinggal di sprint ke-4 P1:** row Trending diganti pinning editorial saja, filter "Followed only" dan sprite thumbnail seek preview digeser ke minggu pertama P2, dan TV cukup "D-pad menjangkau semua elemen" tanpa tes perangkat kedua. Player SUB/DUB, skip intro/outro, jadwal, dan progress lintas perangkat tetap wajib.

---

## 12. Risiko & mitigasi

| # | Risiko | Dampak | Mitigasi |
|---|---|---|---|
| R1 | Sumber/lisensi konten anime belum jelas | Infringement, pemblokiran ISP, kehilangan Cloudflare/payment | Rights record wajib, takedown di MVP, gerbang launch P2, keputusan dengan pengacara di P0 |
| R2 | ToS Cloudflare soal video | Akun di-throttle atau disuspend | R2 sebagai origin penyajian lewat Worker, konfirmasi tertulis (spike f), kontinjensi Enterprise/Stream/CDN video |
| R3 | StyleX + RR7 SSR belum terbukti; hash drift | UI tanpa style | Spike P0 A vs B, `ui-guard`, satu versi, `rootDir` = root repo |
| R4 | `useCSSLayers` di TV lama | TV tampil tanpa style | Default `false`, uji Chromium 76/87, pertanyaan #4 |
| R5 | Kematangan `@moleculer/channels` | Event hilang atau macet | Spike P0, versi dipin, fallback `jetstream.mixin` dengan nats.js langsung |
| R6 | KEDA ScaledJob di JetStream cluster | Transcode tidak ter-scale | Spike P0, fallback scaler Prometheus nats-exporter |
| R7 | Kompatibilitas S3 IDrive e2 tidak penuh | Upload, lifecycle, atau Barman gagal | Matriks per panggilan (spike d), env checksum, salinan R2 |
| R8 | Replica cluster tertinggal karena arsip WAL di e2 lambat/terputus | RPO membesar | Streaming lewat jaringan privat, salinan arsip WAL di R2 sebagai sumber cadangan, alert umur arsip |
| R9 | Slot replikasi streaming (P2) menahan WAL dan memenuhi disk CNPG | Primary down | `max_slot_wal_keep_size 50GB`, volume WAL terpisah, alert 2/20 GB |
| R10 | Versi CNPG/PostgreSQL berbeda antara primary dan DR | Replikasi fisik gagal | Versi image dipin sama di Git, upgrade DR lebih dulu sesuai panduan CNPG |
| R11 | Overengineering platform untuk tim 3 orang | Fitur terlambat | Deployable dipangkas ke kebutuhan anime (§5.2), item platform ditunda ke P2/P5, P0 di-time-box 6 minggu |
| R12 | Estimasi meleset | Beta mundur | Daftar tugas tunggal, buffer 1 minggu, aturan fallback P1 (§11.2) |
| R13 | Data personal bocor ke cache edge | Insiden privasi | Loader publik tidak membaca session, test CI tanpa Set-Cookie, bypass hanya route personal |
| R14 | Konten yang di-takedown tetap tersaji | Pelanggaran hukum | Cache-Tag di HTML + API (lintas host), tanpa stale-if-error panjang, KV revokasi, acceptance 2 menit |
| R15 | Upload→live terlalu lambat | Rilis simulcast terlambat | Target p90 45 menit di P1, transcode per rung di P2, maks 20 job |
| R16 | Biaya sebelum ada pendapatan | Kehabisan dana | Hanya staging di P0–P1 (±$400–700/bulan), prod dibuat di akhir P1, budget alert, plafon dari pemilik produk |
| R17 | Kewajiban privasi (PDPA/UU PDP) | Denda, kehilangan kepercayaan | DPO/TIA/breach register sebagai gerbang launch, runbook 72 jam/7 hari/3×24 jam |
| R18 | Persepsi vertikal "actress" (P4) sebagai konten dewasa | Pidana, penolakan app store/payment | Kebijakan tanpa konten dewasa, rating oleh editor, review pengacara sebagai gerbang P4 |
| R19 | Nama orang sungguhan di mock/fixtures | Personality rights/defamation | Diganti di P0.1 sebelum seed, guard CI |
| R20 | Operasi Keycloak (JVM, upgrade) | Beban ops | Operator + DB di CNPG, fallback better-auth dengan kontrak cookie yang sama |
| R21 | Valkey state hilang | Progress beberapa detik hilang | AOF + Sentinel, overlay klien LWW, alert `pb:dirty` |
| R22 | Regional/metro outage (GKE di SG) | Downtime ≤ 4 jam | Pool fallback degraded, rebuild di Jakarta, risiko diterima dan tercatat |
| R23 | Biaya CPU imgproxy | Biaya naik | Bucket lebar, Tiered Cache, turunan statis sebagai jalan keluar |
| R24 | Malicious upload (FFmpeg/zip bomb) | RCE atau DoS | Sandbox, whitelist protokol, no-egress, ClamAV, upload hanya oleh staf |
| R25 | **Cookie `Domain=tsukimi.my` dibaca/ditimpa host lain (cookie tossing)** | Session fixation, CSRF bypass, cookie session terkirim ke pihak ketiga | Hanya host first-party di `*.tsukimi.my`, tanpa konten pengguna/HTML pihak ketiga, staging/status/ops di domain terpisah, rotasi SID saat login, CSRF `__Host-`, session staf host-only, audit DNS (§9.1) |
| R26 | SEO terpecah antar subdomain; vertikal baru mulai dengan otoritas rendah | Trafik organik lambat untuk komik/video | Sitemap/robots/canonical per host sejak hari peluncuran, satu domain property, cross-linking hub + switcher + relasi lintas vertikal |
| R27 | Konfigurasi per host (DNS, sertifikat, cache rule, HTTPRoute, redirect allowlist) tertinggal saat vertikal baru diluncurkan | 404, error TLS, cache salah, login gagal | Semua digenerate dari `nav-manifest.ts` + Terraform, checklist peluncuran vertikal (P3.6/P4.5), test `cf-cache-status` dan login per host |
| R28 | Fokus anime membuat asumsi bersama (progress, rights, admin) tidak teruji untuk komik/video | Rework di P3/P4 | `item_type` generik di progress/watchlist sejak P0, ERD komik/video direview di P0.14, desain service P3/P4 dipertahankan di dokumen ini |
| R29 | **Gofile guest account** (§7.1b) tanpa SLA: link download bisa hilang sepihak, token guest hilang = akun hilang permanen (tanpa recovery email), dan URL publik tidak melewati rights/token kita sehingga takedown harus menyentuhnya secara eksplisit | Link download mati tanpa peringatan; konten yang di-takedown tetap bisa diunduh dari Gofile kalau langkah hapus terlewat | Diberi label "sementara" di UI, tanpa SLA dijanjikan ke pengguna, HLS tetap jalur utama; token guest disalin manual sekali ke Secret Manager dan tidak pernah di-reset; `takedown.execute` wajib memanggil `DELETE /contents/{id}` Gofile (§9.5 langkah 5); hanya title tanpa batas teritori yang direlay |
| R30 | **API Agreement MyAnimeList** (§7.1c) melarang hal yang berpotensi membuat Tsukimi "appear as though it is a Company Offering" atau menimbulkan kebingungan konsumen; Tsukimi menyalin sinopsis/poster MAL ke situs streaming berbayar/beriklan, berbeda dari use case tracker list yang jadi target asli API | Client ID dicabut sepihak; klaim hak cipta dari MAL/lisensor sinopsis; reputasi | **[LAWYER]** opini sebelum A15 publik; default sinopsis = draft wajib ditulis ulang (tidak verbatim), poster MAL bukan cover final published, atribusi di halaman legal, audit `source=mal_import` di setiap field/record yang diimpor, integrasi mati tidak menghalangi input manual |

---

## 13. Keputusan terbuka — pertanyaan untuk pemilik produk

Diurutkan dari yang paling memblokir. Default ditulis supaya pekerjaan bisa jalan sambil menunggu.

1. **Sumber dan lisensi konten anime:** lisensi dari distributor, upload partner/studio, atau campuran? Title dan teritori mana yang pertama untuk beta? *(Default: engineering lanjut dengan rights record wajib. Public launch diblokir sampai ada jawaban.)*
2. **Pasar dan bahasa:** Indonesia + Malaysia saat launch? Locale default `id` + `en`, dan `ms` hanya untuk halaman legal, atau `ms` UI penuh? Entitas hukum operator (Sdn Bhd atau PT)? Pengguna EU di luar scope? *(Default: ID+MY, `id` default, `en`, `ms` legal, `ja` tidak dipakai.)*
3. **Perilaku apex `tsukimi.my` selama fase anime saja:** landing sederhana dengan tautan besar ke anime, redirect 302 ke `anime.tsukimi.my`, atau landing "segera hadir" untuk vertikal lain? *(Default: landing sederhana dengan tautan besar ke anime + halaman legal. Redirect ditolak karena apex nanti menjadi hub dan halaman legal harus tetap di apex.)*
4. **Batas bawah TV:** apakah Samsung Tizen/LG webOS 2019+ (Chromium ±76) wajib didukung, atau ≥ Chromium 99? Apakah TV kritikal untuk launch? *(Default: 2019+, `useCSSLayers: false`, TV "berfungsi" di P1 dan dipoles di P2.)*
5. **Plan Cloudflare dan media:** setuju HLS disajikan dari salinan R2 (e2 tetap system of record)? Siap meminta konfirmasi tertulis ke Cloudflare? Kalau ditolak, pilih Enterprise, Stream, atau CDN video lain? *(Default: Pro + LB + Workers Paid, R2 via Worker.)*
6. **Plafon anggaran bulanan:** pra-launch (default ±$700) dan pasca-launch? Apakah GKE oke, atau pilih DOKS/LKE yang lebih murah?
7. **Model bisnis:** gratis/AVOD/langganan/early access? (ChapterList sudah punya badge VIP untuk P3.)
8. **Tim dan tanggal:** konfirmasi 3 dev. Ada tanggal pasti untuk beta anime atau launch? Siapa yang on-call?
9. **Lokasi monorepo:** `p-project/tsukimi` (rekomendasi) atau `tsukimi.my` sendiri sebagai root? Backend di monorepo yang sama (default ya)? Org/plan GitHub mana?
10. **Residensi data:** apakah data pengguna wajib tetap di Indonesia/Malaysia, atau region Singapura (GKE, e2, R2) + DR di Jakarta bisa diterima dengan TIA?
11. **DRM:** apakah ada lisensor anime yang mewajibkan DRM atau watermark forensik? Berapa anggaran vendor?
12. **Partner self-upload** (portal P2), atau hanya editor internal?
13. **Lokasi cluster DR:** GKE `asia-southeast2` (Jakarta, rekomendasi), server sendiri, atau provider lain? Butuh streaming (RPO detik, perlu jaringan privat) atau cukup arsip WAL (RPO ±1–2 menit)?
14. **Toleransi kehilangan data saat failover regional:** apakah ≤ 60 s bisa diterima? Apakah RTO layanan 4 jam (cluster dingin) cukup, atau butuh region kedua yang hangat?
15. **Domain staging dan layanan pihak ketiga:** setuju staging memakai domain terpisah (default `tsukimi-stg.my` [VERIFIKASI ketersediaan]) dan status page/tracking email di luar `tsukimi.my`, supaya cookie `Domain=tsukimi.my` tidak pernah terkirim ke sana?
16. **Usia minimum** (13 atau 18) dan **profil anak/multi-profil** per akun?
17. **Konten buatan pengguna** (komentar, review, upload): kapan, kalau ada? Kalau ada, harus disajikan dari domain terpisah, bukan `*.tsukimi.my` (§9.1).
18. **Live streaming:** pernah masuk scope, atau VOD saja?
19. **Subtitle ASS** (typesetting/karaoke anime): wajib dipertahankan (JASSUB), atau WebVTT cukup? Rung 360p dan AV1 di masa depan: setuju?
20. **Social login** selain Google (Apple, LINE, Discord, X) saat launch?
21. **Urutan dan isi vertikal berikutnya:** komik (P3) sebelum video + cast (P4)? Apakah vertikal "actress" memuat konten dewasa/gravure? *(Default: komik dulu; tanpa konten dewasa, maksimal rating 18 umum; review pengacara sebagai gerbang P4.)*
22. **Personalisasi HTML:** apakah personalisasi sisi klien diterima di semua tempat (default), atau ada halaman (mis. home personal) yang harus di-render personal di server tanpa cache?
23. **Tooling SaaS:** apakah Chromatic, Grafana Cloud, atau PagerDuty berbayar boleh dipakai nanti, atau semuanya harus self-hosted?

Pertanyaan lama yang **dihapus** karena sudah terjawab oleh keputusan subdomain: mini-player lintas vertikal (tidak mungkin lintas origin; di dalam satu vertikal tetap bisa karena satu app) dan `/categories` lintas vertikal vs genre per vertikal (genre per vertikal, di subdomain masing-masing).

---

## Appendix A: Hasil fact-check

| # | Klaim | Verdict | Sumber | Implikasi untuk rencana |
|---|---|---|---|---|
| 1a | Supabase bisa menjadi **subscriber** logical replication dari Postgres eksternal (CNPG) | Terkonfirmasi | supabase.com/docs/guides/platform/migrating-to-supabase/postgres | Didokumentasikan untuk migrasi, bukan DR, jadi disebut "supported-but-not-productised". Butuh: CNPG terjangkau via TLS + role REPLICATION khusus, migrasi DDL ke Supabase lebih dulu, sync sequence sebelum failover, monitoring slot dan `max_slot_wal_keep_size`, jangan memakai nama publikasi `supabase_realtime` (§6.3) — **Tidak lagi relevan: Supabase dikeluarkan dari rencana (lihat §6).** |
| 1b | Supabase bisa menjadi **publisher** ke Postgres eksternal (direct connection, IPv6 atau add-on IPv4) | Terkonfirmasi | supabase.com/docs/guides/database/postgres/setup-replication-external | Failback butuh IPv6 egress atau **add-on IPv4 berbayar**. Jangan lewat pooler Supavisor. Batas slot/disk per plan perlu diverifikasi (§6.8) — **Tidak lagi relevan: Supabase dikeluarkan dari rencana (lihat §6).** |
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

**Klaim lain yang belum di-fact-check dan karena itu diperlakukan sebagai [VERIFIKASI]:** status ingress-nginx, ketersediaan purge-by-tag di plan Cloudflare, kuota free tier Cloudflare Access, status GA Keycloak Organizations, FQDN NetworkPolicy GKE tanpa Enterprise, Object Lock/SSE e2 per region, cakupan Universal SSL/biaya Load Balancing per hostname Cloudflare, ketersediaan domain staging, cakupan Copyright Act 2022, waktu berlaku Online Safety Act 2025, SLA takedown PSE, dan semua harga di §7.8 dan §8.10.

---

## Appendix B: Daftar keputusan kanonik (resolusi kontradiksi)

| Topik | Pilihan tunggal |
|---|---|
| Domain | Satu subdomain per vertikal: `anime.tsukimi.my` (P1), `comics.tsukimi.my` (P3), `video.tsukimi.my` (P4); apex `tsukimi.my` = hub (landing, legal, akun global P3), minimal di P1; `accounts.` (Keycloak), `admin.`, `partner.` (P2), `media.`, `img.`, `assets.tsukimi.my`. Routing path di satu host (`tsukimi.my/anime`) ditolak |
| Fokus fase | Anime dulu: P0 Foundation (78 pd) → P1 Anime MVP (138 pd, private beta `anime.tsukimi.my`) → P2 Anime scale & public launch → P3 komik → P4 video + cast → P5 growth |
| Microfrontend | Satu app per subdomain (`apps/anime`, `apps/hub`, `apps/admin`; `apps/comics` P3, `apps/video` P4); shell bersama `packages/shell` dengan vertical switcher ("segera hadir" untuk yang belum live); tanpa Module Federation; tanpa `apps/shell`/`apps/account` |
| API origin | Setiap host vertikal memanggil `/api/v1/*` same-origin (tanpa CORS) → satu `api-public`, satu backend |
| Auth | Keycloak (`accounts.tsukimi.my`) + BFF `session`; cookie **`__Secure-tsk_sid` (`Domain=tsukimi.my; Path=/; Secure; HttpOnly; SameSite=Lax`)** + `__Host-tsk_csrf` per host + session staf host-only `__Host-tsk_asid` di `admin.`; tanpa `tk_at`/`tk_rt`/`tsk_sess`; `identity.users` dengan key Keycloak `sub`, tanpa password/role; fallback better-auth dengan kontrak sama |
| Cookie bersama | `tk_theme`, `tk_tz`, consent dengan `Domain=tsukimi.my`; tidak ada konten tidak tepercaya/pihak ketiga di `*.tsukimi.my` (cookie tossing); staging (`tsukimi-stg.my`), status page, dan tracking email di domain terpisah |
| Cache HTML | Publik anonim di-cache tanpa memandang cookie; cache key = host + URL + locale + `m\|d\|tv`; bypass hanya `/profile`, `/settings`, `/watchlist`, `/history`, `/auth/*`; `/watch*` (dan `/read*` di P3) s-maxage 30 |
| Aset | R2 `tsukimi-assets` di `assets.tsukimi.my/<app>/<hash>` + `ui/<hash>.css`; bukan `/_a` atau `/_assets` di pod |
| HTTPRoute | Digenerate dari `nav-manifest.ts` oleh `tooling/gen-routes`; **satu HTTPRoute per app, match per hostname** (+ rule `/api` → `api-public`); ns `tsk-web`; parent `tsk-edge/public`; locale `/en` saja |
| Cloudflare per host | Record DNS eksplisit per subdomain (bukan wildcard); Universal SSL `tsukimi.my` + `*.tsukimi.my`; cache/WAF rule dengan `http.host`; origin cert wildcard + apex |
| Admin | `apps/admin` di `admin.tsukimi.my` (Access + Keycloak), API `admin.tsukimi.my/api/admin/v1`; partner `partner.tsukimi.my` (P2, Keycloak saja) |
| Workflow CMS | P1: status + scheduled publish + audit + revisi di service domain; P2: four-eyes/drafts/import di `cms` |
| Notifikasi | In-app P2; push/email P5 |
| Ranking | MVP: trending anime dari Postgres (CronJob) ke `ranking.*`; ClickHouse P2; board komik P3, Popular Actress P4 |
| Locale | `id` (default) + `en` di P1; `ms` legal sebelum launch; `ja` tidak dipakai |
| StyleX | Spike A vs B; `useCSSLayers: false`; satu `build.target`; `ui-guard` agnostik strategi |
| Repo | `git init` dulu; root `p-project/tsukimi`; `rootDir` = root repo |
| Kontrak | TypeBox di `packages/contracts` (bukan Zod) |
| Migrasi | Kysely Migrator satu target (primary `tsukimi-pg`; DR ikut lewat replikasi fisik) di `packages/db/migrations`; Job PreSync |
| Schema | Daftar §5.4 dengan kolom Fase: anime + inti di P0/P1, `comics` P3, video/cast P4; idempotency 24 jam |
| Halaman komik (P3) | `chapters.pages jsonb`; tanpa `chapter_pages` |
| Registry media | `media.assets` (domain) + `media.objects` (fisik) |
| Stream/subject | `TSK_DOMAIN/JOBS/TELEMETRY/DLQ`; `tsk.<ctx>.<agg>.<event>.v1`; consumer `media-transcode` dan sejenisnya |
| Job transcode | Spesifikasi §7.5 (backoffLimit 0, AckWait 120 s + working, 6 jam, per-rv, maks 20, node 16 vCPU) |
| Upload→live | p90 ≤ 45 menit (P1) |
| Ladder | 1080/720/480/360 |
| Token media | max(6 jam, durasi + 2 jam), tanpa IP, path, dual-kid bulanan; R2 → e2 (3 s) + KV revokasi |
| imgproxy | Format eksplisit di URL, cache key = URL |
| Takedown | Cache-Tag HTML + API, purge by tag (fallback URL), tanpa stale-if-error panjang, KV revokasi, ≤ 2 menit, **plus hapus link Gofile** |
| Download sementara | Master video saja → relay ke Gofile guest account (§7.1b), best-effort/tanpa SLA, label "sementara" di UI, hanya title tanpa batas teritori, dihapus saat takedown |
| Matching metadata MAL | A15: editor search/preview/import manual per judul ke `anime.series` status draft + `mal_id`; sinopsis wajib ditulis ulang sebelum publish; poster lewat `image-process`, bukan hotlink; bukan cover final; **[LAWYER]** gerbang sebelum publik (§7.1c, R30) |
| Tracing | `@tsukimi/otel` OTLP; tracing broker dimatikan |
| Valkey | `valkey-cache` + `valkey-state` |
| Pool DB | Pooler transaction mode; relay/advisory/LISTEN/migrasi langsung ke `-rw` |
| UUID | v7 dari aplikasi; tanpa default DDL |
| Partisi | Progress hash statis sejak hari pertama; outbox/inbox tanpa partisi; pg_partman P2 |
| NetworkPolicy DR | Tanpa port DB publik; DR membaca arsip WAL dari e2, streaming hanya lewat jaringan privat |
| Fase DR | P0 spike, P1 HA + PITR + 1 restore, P2 replica cluster CNPG di region kedua (Supabase dikeluarkan) |
| Retensi backup | PITR 30 hari, dump logis 12 minggu |
| RTO | DB 30 menit, layanan 4 jam |
| Secrets | GCP Secret Manager + ESO; Infisical fallback |
| Node | 24 LTS di semua image |
| Rate limit | `/auth/*` 10/menit, `/api/v1/playback/*` 30/menit, `/api/*` 600/menit per IP |
| Role | Keycloak: user/editor/moderator/admin (MVP), superadmin; rights_manager digabung ke admin; partner P2 |
| Rights | Modul `v1.rights` di image `catalog` (MVP) + sweep 5 menit |
| SEO / sitemap | Setiap subdomain = situs sendiri: canonical di host sendiri, `/sitemap.xml` + `robots.txt` per host (resource route per app ← `v1.seo sitemap-entries?vertical=`), satu domain property Search Console `tsukimi.my`, cross-linking hub ↔ vertikal; `configureSeo` base URL per vertikal (mis. `https://anime.tsukimi.my`); JSON-LD tidak berubah |
| Perf/RUM | P1 Faro + size-limit; P2 LHCI + ClickHouse |
| Semantik pengiriman | At-least-once, diproses efektif sekali (inbox/Msg-Id) |
| Email | SES/Postmark/Resend + SPF/DKIM/DMARC, P0 |
| Keycloak DB | DB `keycloak` di CNPG, ikut PITR dan replikasi fisik ke DR, ditambah dump + ekspor realm |
| Dev lokal | docker-compose (k3d/Tilt opsional P2) |
| Kyverno/Velero/RLS/WORM/limit stream | P2 |
| Mimir/preview PR/Rollouts/scrubber | P5 |
| TV device login | P2 |
