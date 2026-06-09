# Roski — Complete Project Context

> This document is the single source of truth for the Roski project. Drop it in as the starting context for any new conversation and the AI will know everything that's been built, why, and what the user prefers.

---

## 1. Project Overview

**Roski** is an interactive 3D ski resort platform focused on **Romanian ski resorts**. Built as a **university final-exam project + portfolio piece** for a solo Romanian developer who knows .NET well and is learning React through this project.

**Scope cut**: only **one resort** is implemented (Straja, in Munții Vâlcan, Hunedoara county). No other resorts. No deploy. No restaurants section. No live cameras.

**Project root**: `C:\Roski` (Windows machine). Two folders: `web/` (Next.js) and `api/` (.NET). Plus `data/` (Python pipelines) and `docs/` (this file).

**GitHub**: `https://github.com/CzarulP/roski` (user: CzarulP).

**Current date in conversations**: Around June 2026 (off-season).

---

## 2. User & Working Style (CRITICAL — read first)

**Working style preferences** (these have been reinforced multiple times):
- **Solo dev. Speed over process.** No PRs, no unit/integration tests, no staging environment, no microservices.
- **Phased delivery.** Work one roadmap phase at a time, **stop at the end of each phase**, propose commit plan, wait for go-ahead before next phase.
- **Granular commits.** Aim for **6–10 commits per phase, not 1–2.** Commit by logical unit (entities; endpoints; seed+wiring; layout+theme; api-client; pages) rather than by directory.
- **User runs the actual `git commit` commands themselves.** Propose copy-paste-ready commands with brief explanations. Do NOT run `git add`/`git commit` unless explicitly asked.
- **When pre-emptively scaffolding, only scaffold for the *current* phase.** Do not write Phase N+1 code while Phase N is being committed.
- **Don't ramble.** Be direct, concrete, and skip narration of obvious actions.

**Patterns observed**:
- Iterates on visuals heavily (colors changed several times: dark blue → light white → soft slate-blue → dark night → soft daylight is the current state).
- Sends screenshots when something looks wrong.
- Prefers concrete commits with named files over "stage everything".
- Patient with complex flows; frustrated with rabbit holes (he killed BlenderGIS work after ~1.5h).
- Loves the 3D viewer (centerpiece feature).

**He has Photoshop skills** — he provided photos at `web/public/slopes/`, `web/public/lifts/`, and `web/public/random/`.

---

## 3. Tech Stack

| Layer | Tech | Notes |
|---|---|---|
| Frontend | Next.js 16.2 (App Router) + TypeScript + React 19.2 | Vercel-targeted but not deployed |
| 3D | React Three Fiber + drei + three.js + three-stdlib | The centerpiece |
| Styling | Tailwind CSS v4 + custom CSS variables | Custom design system in `globals.css` |
| Map (2D) | MapLibre GL + react-map-gl (installed, not actively used) | |
| State | Zustand (viewer store), TanStack Query (installed, not heavily used) | |
| Animations | Framer Motion (installed, sparingly used) + custom CSS keyframes | |
| Icons | lucide-react | |
| Backend | ASP.NET Core 9 minimal APIs + EF Core 9 + Vertical Slice Architecture | |
| ORM | EF Core 9 + Npgsql + NetTopologySuite (installed, mostly use JSONB for geometry) | |
| Database | PostgreSQL 16 + PostGIS (Docker locally) | `docker compose up -d` |
| Cache | `IMemoryCache` (.NET built-in) for weather, hardcoded TTL in StrajaOnlineEndpoint | |
| Auth | **None.** Read-only public site. | |
| Weather | Open-Meteo (free, no key) | |
| Map data | OpenStreetMap via Overpass API | for slope/lift geometry |
| Terrain | SRTM 1-arcsec from AWS Public Datasets + ESRI World Imagery tiles | baked offline by Python script |
| External data | Crawled from `strajaonline.ro` (Next.js SSR site, strip-tag scraping) | |
| Python pipelines | Python 3.14 + numpy + Pillow + requests + trimesh + simplex-noise | venv at `data/.venv/` |
| Languages | Romanian throughout the UI; English code/comments | |

---

## 4. Repository Layout

```
C:\Roski/
├── .gitignore
├── README.md
├── docker-compose.yml                  # Postgres + PostGIS for dev
├── .github/workflows/                  # (api.yml exists but not used yet)
│
├── api/                                # ASP.NET Core 9 Vertical Slice API
│   ├── Roski.Api.csproj
│   ├── Program.cs                      # DI, CORS, OpenAPI, migrate-on-boot, seed
│   ├── appsettings.json
│   ├── appsettings.Development.json    # has connection string
│   ├── Properties/launchSettings.json  # localhost:5080
│   ├── Features/
│   │   ├── Resorts/
│   │   │   ├── ResortDtos.cs           # ResortSummaryDto, ResortDetailDto
│   │   │   └── ResortEndpoints.cs      # GET /api/v1/resorts/, /resorts/{slug}
│   │   ├── Viewer/
│   │   │   └── ViewerEndpoints.cs      # GET /resorts/{slug}/viewer-data; geo→local conversion
│   │   ├── Weather/
│   │   │   └── WeatherEndpoint.cs      # GET /resorts/{slug}/weather (Open-Meteo, 15-min cache)
│   │   └── StrajaOnline/
│   │       └── StrajaOnlineEndpoint.cs # GET /resorts/{slug}/external (serves crawler JSON)
│   └── Persistence/
│       ├── Entities.cs                 # Resort, Slope, Lift, WebcamLink, GeoLineString
│       ├── AppDbContext.cs             # JSONB columns for Webcams & Geometry
│       ├── Seed.cs                     # Seeds Straja row; auto-runs on startup
│       ├── SlopesLiftsLoader.cs        # Loads data/source/straja-slopes-lifts.json on startup
│       └── Migrations/                 # one initial migration
│
├── data/                               # Python data pipelines (not deployed)
│   ├── .venv/                          # Python 3.14 venv (gitignored)
│   ├── bake_terrain_lib.py             # Shared SRTM helpers
│   ├── bake-terrain.py                 # Build a textured GLB from SRTM + ESRI tiles
│   ├── import-slopes-lifts.py          # Fetch OSM piste/aerialway, sample SRTM elevations
│   ├── curate-straja.py                # Hand-curated overrides + missing slopes
│   ├── crawl-strajaonline.py           # Crawl skipass + accommodations + rentals
│   ├── extract-strajaonline.py         # (helper) Extract rendered text from HTML
│   └── source/                         # Cached HTML, OSM, SRTM, slopes JSON (mostly gitignored)
│       ├── srtm/N45E023.hgt            # SRTM tile (gitignored)
│       ├── sat/*.jpg                   # ESRI satellite tiles (gitignored)
│       ├── osm-straja.json             # Cached Overpass result
│       ├── strajaonline-cache/*.html   # Cached crawler HTML
│       ├── straja-slopes-lifts.json    # CURATED slope/lift data (committed)
│       └── strajaonline.json           # Crawled skipass + cazare + rentals (committed)
│
├── docs/
│   ├── terrain-bake.md                 # Pipeline walkthrough
│   └── CONTEXT.md                      # THIS FILE
│
└── web/                                # Next.js 16 + TypeScript
    ├── package.json
    ├── tsconfig.json
    ├── .env.local                      # NEXT_PUBLIC_API_BASE_URL=http://localhost:5080
    ├── public/
    │   ├── terrain/
    │   │   ├── straja.glb              # Main 6 km × 6 km baked terrain (~6.4 MB)
    │   │   └── straja-distant.glb      # 40 km surrounding ring terrain (~3.4 MB)
    │   ├── slopes/*.jpg                # 16 slope photos (committed) + README.md
    │   ├── lifts/*.png                 # 11 lift photos (committed) + README.md
    │   └── random/ROSKILOGO.png        # Saint Bernard logo (4144×4275)
    ├── app/
    │   ├── layout.tsx                  # Root layout with header + footer
    │   ├── globals.css                 # Design system (CSS variables)
    │   ├── page.tsx                    # Landing
    │   ├── not-found.tsx               # Branded 404
    │   └── resorts/[slug]/
    │       ├── page.tsx                # Resort detail page
    │       └── viewer/page.tsx         # 3D viewer page
    ├── components/
    │   ├── WeatherCard.tsx             # Weather widget with mode-specific animations
    │   ├── SkipassSection.tsx          # 4 skipass pricing cards
    │   ├── AccommodationsSection.tsx   # 45 cazare cards
    │   ├── RentalsSection.tsx          # 7 rental shops
    │   └── viewer/
    │       ├── ViewerCanvas.tsx        # dynamic({ ssr:false }) wrapper for Scene
    │       ├── Scene.tsx               # R3F Canvas + camera + lights + bounds + reset
    │       ├── Mountain.tsx            # Procedural fallback (Phase 2b placeholder)
    │       ├── SkyDome.tsx             # Gradient sky sphere (vertex shader)
    │       ├── Snow.tsx                # Particle snowflakes
    │       ├── Slopes.tsx              # All slopes (draw-in animation, hover/click)
    │       ├── Lifts.tsx               # All lifts (cable + 3-piece pylon stations)
    │       ├── Labels.tsx              # Floating chips for slopes & lifts
    │       ├── InfoPanel.tsx           # Slide-in right panel (slope/lift details + photo)
    │       ├── Legend.tsx              # Bottom-left filter UI
    │       └── ResetButton.tsx         # Bottom-right reset view
    └── lib/
        ├── api.ts                      # Typed API client + types
        ├── utils.ts                    # cn(), DIFFICULTY map, weather codes, toSlug()
        └── viewer-store.ts             # Zustand: selection, hover, filters, resetView()
```

---

## 5. Architecture

```
Browser
  ├── Next.js (SSR) — landing, resort detail, viewer pages
  │     │
  │     ├── 3D Viewer (R3F, client-only, ssr:false)
  │     │     ├── Main terrain GLB (6 km, satellite + snow)
  │     │     ├── Distant terrain GLB (40 km ring, low-res, snow)
  │     │     ├── Sky dome (shader)
  │     │     ├── Slopes (drei <Line> with dashed draw-in animation)
  │     │     ├── Lifts (cables + pylon stations)
  │     │     └── Labels, info panel, legend, reset button
  │     │
  │     └── DOM overlays (light theme)
  │           ├── Weather card (mode-specific gradients + CSS animations)
  │           ├── Skipass / Cazare / Închirieri sections
  │           └── Header / footer with Saint Bernard logo
  │
  ↓ REST/JSON
  │
.NET 9 API (localhost:5080)
  ├── /api/v1/resorts/, /resorts/{slug}     ← Resort entity
  ├── /resorts/{slug}/viewer-data           ← Slopes + lifts in local-meter coords
  ├── /resorts/{slug}/weather               ← Open-Meteo proxy with 15-min cache
  └── /resorts/{slug}/external              ← Serves data/source/strajaonline.json
  │
  ↓ EF Core
  │
PostgreSQL 16 + PostGIS (Docker)
  ├── resorts                               ← Hand-edited single Straja row
  ├── slopes                                ← 18 entries, geometry as JSONB GeoJSON
  ├── lifts                                 ← 11 entries, geometry as JSONB GeoJSON
  └── (PostGIS installed but unused in queries)

Build-time / off-cluster:
  - Python pipelines in data/ produce GLBs and JSON files committed to the repo
  - External sources: Overpass API (OSM), AWS Public Datasets (SRTM), ESRI tile server,
    Open-Meteo, strajaonline.ro
```

---

## 6. Database

### Connection (dev)
```
Host=localhost; Port=5432; Database=roski; Username=roski; Password=roski
```
PostGIS extension is installed but **all geometry is stored as JSONB GeoJSON** (`{"type":"LineString","coordinates":[[lon,lat,elev],...]}`). PostGIS is not actively queried.

### Tables (EF Core conventions; PascalCase column names with quotes in SQL)

**`resorts`**
- `Id` (uuid)
- `Slug` (text, unique) → `"straja"`
- `Name`, `Region`, `Description`
- `ElevationMin`, `ElevationMax` (int)
- `CenterLat`, `CenterLon` (double)
- `TerrainOriginLat`, `TerrainOriginLon` (double) — origin for all local-meter conversions
- `TerrainModelUrl` → `"/terrain/straja.glb"`
- `PreviewImageUrl`
- `WebsiteUrl` → `"https://skistraja.ro/"` (was partiastraja.ro; user requested change)
- `Webcams` (jsonb List<WebcamLink>)
- `CreatedAt`, `UpdatedAt`

**`slopes`**
- `Id`, `ResortId`, `Name`, `Difficulty` (`easy|medium|hard|expert`)
- `LengthM`, `IsOpen` (currently **false** for all — off-season)
- `OsmId` (nullable)
- `Geometry` (jsonb GeoLineString)

**`lifts`**
- `Id`, `ResortId`, `Name`, `LiftType` (`gondola|cable_car|chair|drag`)
- `Capacity`, `Hours`, `IsOpen` (currently **false** for all)
- `OsmId`, `Geometry`

### Straja seed data (key values)
- Origin: **45.3146°N, 23.2501°E** (between top of cable car and base village)
- Elevation: **1100–1870 m**
- Description: "Stațiunea Straja este situată în Munții Vâlcan, deasupra orașului Lupeni, în județul Hunedoara. Cu pârtii între 1.100 și 1.870 m altitudine, oferă una dintre cele mai lungi sezoane de schi din România."
- WebsiteUrl: `https://skistraja.ro/`
- IDs are deterministic: resort `11111111-...`, test lift `22222222-...`, test slope `33333333-...`

---

## 7. Backend — ASP.NET Core API

### Endpoints

| Method + URL | Returns |
|---|---|
| `GET /health` | `{ status, time }` |
| `GET /api/v1/resorts/` | List of resort summaries |
| `GET /api/v1/resorts/{slug}` | Resort detail with totals |
| `GET /api/v1/resorts/{slug}/viewer-data` | `{ slopes: [...], lifts: [...] }` — coords already converted to local meters around resort origin |
| `GET /api/v1/resorts/{slug}/weather` | Open-Meteo current weather, 15-min IMemoryCache |
| `GET /api/v1/resorts/{slug}/external` | Raw `strajaonline.json` contents, 5-min in-memory cache |
| `GET /openapi/v1.json` | OpenAPI schema (Dev only) |

### Geo → Local conversion (in `ViewerEndpoints.cs`)
Critical math — same constants used everywhere:
```csharp
const double EarthRadiusM = 6_378_137.0;
mPerDegLat = Math.PI * EarthRadiusM / 180.0;       // ≈ 111319.49
mPerDegLon = mPerDegLat * Math.Cos(originLat * π/180);

x = (lon - originLon) * mPerDegLon;                // east
z = -(lat - originLat) * mPerDegLat;               // -north (Three.js convention)
y = elevation_m;                                    // up
```
Slopes/lifts are returned with coordinates **already in local meters** so the frontend renders them directly.

### EF Core dynamic JSON
`Program.cs` uses `NpgsqlDataSourceBuilder.EnableDynamicJson()` so POCO types like `List<WebcamLink>` and `GeoLineString` can map to `jsonb` columns.

### Seed flow on startup (`Seed.cs`)
1. If no resorts exist, insert Straja row.
2. Always call `SlopesLiftsLoader.TryImportFromJsonAsync` which **wipes and re-inserts all slopes/lifts from `data/source/straja-slopes-lifts.json`**.
3. Fallback hardcoded test slope/lift only used if JSON missing AND no slopes exist.

### Migration
Single migration `InitialSchema` (`20260509132313_InitialSchema.cs`). Runs automatically via `db.Database.MigrateAsync()` on startup. To reset: delete `.postgres-data/` and restart docker compose + the API.

---

## 8. Data Pipeline (Python in `data/`)

### Setup
```bash
cd data
python -m venv .venv
.venv\Scripts\activate
pip install numpy pillow requests trimesh simplex-noise
```

### `bake-terrain.py` — Build the terrain GLB
```bash
# Main terrain (6 km, high detail, with baked snow)
data/.venv/Scripts/python.exe data/bake-terrain.py \
  --slug straja --lat 45.3146 --lon 23.2501 \
  --size 6000 --samples 300 --zoom 17 \
  --snow --snow-line 900 --snow-full 1450 \
  --out web/public/terrain/straja.glb

# Distant ring (40 km, hole-punched center, low detail)
data/.venv/Scripts/python.exe data/bake-terrain.py \
  --slug straja-distant --lat 45.3146 --lon 23.2501 \
  --size 40000 --samples 250 --zoom 13 \
  --snow --snow-line 900 --snow-full 1450 \
  --exclude-center-m 3000 \
  --max-texture-px 2048 --jpeg-quality 78 \
  --out web/public/terrain/straja-distant.glb
```

**Pipeline steps**:
1. Download SRTM tile from AWS (`s3://elevation-tiles-prod/skadi/N45/N45E023.hgt.gz`)
2. Compute mesh: regular grid sampled bilinearly from HGT; converted to local ENU meters
3. Fetch ESRI satellite tiles (zoom 17 for main = ~0.84 m/px, zoom 13 for distant = ~13 m/px)
4. Stitch + crop to bbox, downscale to max-texture-px
5. **Snow post-process** (when `--snow`): elevation-based mask × luminance-aware openness × spatial noise → mix toward warm-white. Forests stay green, open ground gets snowy. Cool-blue shadow shift in heavily snowed pixels.
6. JPEG-encode (q=88 for main, q=78 for distant)
7. **Hole-punch** (when `--exclude-center-m N`): drop faces whose centroid is within ±N m of origin
8. Export GLB via trimesh

**Snow constants** (in `apply_snow`):
- Forest dampen: 0.40 (lower = forests get more snow)
- Cool-blue shadow shift in heavily snowed pixels

### `import-slopes-lifts.py` — Fetch OSM data
- Queries Overpass for `piste:type` and `aerialway` ways within 3 km of origin
- Filters to `downhill` and `snow_park` types; drops connectors and unnamed stubs
- Maps OSM difficulty to our scale (with Straja-specific calibration in `DIFFICULTY_MAP` and `SLOPE_DIFFICULTY_OVERRIDES`)
- Samples SRTM elevation at every vertex (so coords are 3D)
- Writes `data/source/straja-slopes-lifts.json`
- **Defaults `isOpen` to False** (off-season; user explicitly requested)

### `curate-straja.py` — Apply hand-curated overrides
- Reads `straja-slopes-lifts.json`, applies overrides, writes back
- `SLOPE_OVERRIDES` (dict by OSM ID): rename to official numbering + recolor
  - `307502134` → `"2 Pârtia Canal"` expert (BLACK)
  - `307502145` → `"2a Pârtia Canal II"` hard (RED)
  - `307502156` → `"1 Pârtia Lupului"` expert
  - `307502139` → `"1a Pârtia Lupului II"` expert
  - `900945329` → `"3a Pârtia Constantinescu"` medium (top, longer, BLUE)
  - `307502152` → `"3b Pârtia Constantinescu"` hard (bottom, shorter, RED)
  - `307502143` → `"8 Pârtia vf. Straja"` hard (RED, not BLACK)
  - `307502144` & `900949069` → `"6 Pârtia Platoul Soarelui"` medium
  - `1034707169` → `"Snowpark"` medium
  - `1034707172` → `"9 Pârtia Baloo"` easy (with `clean_baloo` geometry trim to 100 m)
- `SLOPE_DROP_IDS`: 4 stubs + the OSM Mutu (replaced by 5a/5b/5c parallel offsets)
- `LIFT_OVERRIDES`: rename to Roman numerals matching official map
  - I = Teleschiul 1 Lupului, II = Telescaun 2 Canal, IV = Telescaun Baloo, V = Teleschiul 5 Mutu, VI = Telescaun Platoul Soarelui, VII = Teleski Platoul Soarelui, VIII = Telescaun Vf. Straja, IX = Telegondola Straja, XI = Telescaun Constantinescu 1, XII = Telescaun 3 (4 locuri debraiabil)
- `LIFT_DROP_IDS`: the spurious "Telecabină nenumită" 2 km east
- **Hand-traced additions** (with `add_slope()`):
  - **I Pârtia Straja** (8.1 km, hard): summit → Vf. Straja face → at TC II base switches to Mutu-like NW direction → TC XI top → down Constantinescu → continues along Telegondolă to base village. 20 waypoints, jiggle amplitude 20.
  - **4 Pârtia Sf. Gheorghe** (medium, 200 m): overlays first 200 m of Telegondolă path (twice the length of Baloo).
  - **7 Pârtia Telegondolă** (hard, 3.2 km): along the gondola path.
  - **5a/5b/5c Pârtia Mutu**: 3 parallel offsets (±28 m perpendicular). 5a = medium (SW side, BLUE), 5b = hard (center, RED), 5c = expert (NE side, BLACK).
  - **Pârtie intermediară** (medium, 836 m): connector from end of Pârtia Canal to top of Telescaun Platoul Soarelui.
- **Hand-added lift**: X Baby Ski (60 m drag, next to Baloo)
- Functions: `densify()` (resample to ~80 m spacing), `offset_parallel()` (perpendicular offset), `jiggle()` (sinusoidal perpendicular wobble for natural look), `sample_z()` (SRTM elevation)
- **All `isOpen` default to False** (off-season)

### `crawl-strajaonline.py` — Crawl strajaonline.ro
- Caches HTML to `data/source/strajaonline-cache/*.html`
- Strips tags to get rendered text (the site is Next.js SSR — full content is in initial HTML)
- Parses `/skipass` for 4 pass types with prices and consumption
- Parses `/sitemap-0.xml` to get 45 individual cazare URLs; fetches each and extracts name, address, description, features (WiFi/Pet Friendly/etc.), stars
- Parses `/rentals` for 7 rental shop names
- **Skipped**: `/restaurante` (client-rendered, just shows "Loading..."), `/camere_live` (user explicitly said no embedding)
- Outputs `data/source/strajaonline.json`

### Snow shader values (currently baked, not runtime)
The runtime shader in Scene.tsx was removed. Snow is baked into the GLB texture by `apply_snow()` in bake-terrain.py.
- Default snow line: 900 m
- Default snow full: 1450 m
- These were chosen because Straja base is ~750 m and resort village is ~1100 m

---

## 9. Frontend (Next.js)

### Pages

#### `/` (Landing — `app/page.tsx`)
- Hero with: pill "Sezon 2025–2026", gradient text headline "Toți munții cu pârtii din România, într-un singur loc.", description, two CTAs
- Hero photo on the right (4:5 portrait, `/slopes/i-partia-straja.jpg`), with **in-photo "Sezon închis" chip** at top-right and label strip at bottom (region · resort name · length · altitude)
- **REMOVED**: external decorative offset photo and floating Sezon badge (they overlapped text on narrower screens — user flagged twice)
- Stats strip: resorts count, open slopes, open lifts
- 3-feature row ("Munți reali", "Pârtii clickabile", "Vremea și prețurile actuale")
- Resort grid (currently just Straja card)

#### `/resorts/[slug]` (Resort detail)
- Hero with full-bleed photo + dark gradient overlay, big title, two CTAs (Vizualizare 3D + Site oficial → `https://skistraja.ro/`)
- Quick-stats card (Altitudine, Diferență, Pârtii, Instalații) — floats up over the hero edge by `-mt-20`
- Weather card (mode-specific gradients + animations)
- Featured 3D viewer card + Location card (side by side, 2:1 ratio)
- Photo gallery (8 slope photos in a 4-column grid)
- **Skipass section** (4 cards: daily / 4hour / points Montana / points Platoul, each with prices and consumption)
- **Cazare section** (45 accommodations, shows first 12 with name + stars + address + features pills + description)
- **Închirieri section** (7 rental shops)
- About / fact dashboard at the bottom

#### `/resorts/[slug]/viewer` (3D Viewer — see section 10)

#### `/not-found.tsx`
- Branded 404 with Saint Bernard mountain icon, "Te-ai rătăcit pe munte", CTA back

### `app/layout.tsx`
- Sticky header (h-16) with **Saint Bernard logo** (`/random/ROSKILOGO.png`, 36×36 rounded square, ring-1 ring-border)
- Logo text "roski" lowercase
- Nav: Stațiuni / Straja / Vizualizare 3D (highlight gradient pill blue→amber)
- Footer with logo, tagline, 2 column links (Explorează / Date), bottom strip © {year} Roski + "Făcut cu ❤ pentru iubitorii de munte"
- **REMOVED**: "Roski · Proiect academic" (user said it sounded AI-generated)
- OG metadata configured

### Design system (`globals.css`)
**Current palette** (soft daylight — see section 11 for full history):
```
--background: #dee3ec        soft warm slate-blue
--foreground: #1d2738        deep navy (not pure black)
--card: #e8edf4              slightly lighter than bg
--muted: #ced5e0
--muted-foreground: #5b6b85
--border: #b9c2cf
--accent: #2563eb            confident mountain blue
--accent-hot: #d97706        warm ember amber
--accent-pine: #2a7a5e
--ring: rgba(37,99,235, 0.30)
```

Custom utilities: `.glass` (frosted dark slate over cards), `.bg-aurora` (radial glow), `.bg-snow-fade`, `.bg-grain`, `.zoom-on-hover`, `.fade-up`, `.float-soft`, `.weather-sun-rays` (90s rotation), `.weather-snowflake`, `.weather-raindrop`, `.counter-pop`, `.label-bubble-in`, `.info-panel-in`, `.marker-pill`.

### Key components

**`WeatherCard.tsx`** — mode-aware weather widget
- 6 modes: sunny (amber+yellow gradient, rotating sun rays), cloudy (slate, floating cloud), rain (blue, 22 falling raindrops), snow (sky-blue, 18 drifting snowflakes), fog (slate + bottom haze), storm (violet, lightning icon)
- Big temperature, weather icon (lucide), 3 micro stats (Vânt / Ninsoare / Simțit)
- Icon uses `float-soft` animation; mode decorations are CSS-only

**`SkipassSection.tsx`** — 4 cards in 2-col grid, each with color-coded ring matching pass type, prices table, consumption pills (Telegondolă: 5p, Telescaun: 3p, Teleschi: 2p, etc.)

**`AccommodationsSection.tsx`** — Cards (first 12 of 45) with name, star ratings, address (stripped of "Romania,"), description line-clamp-3, feature pills with lucide icons (WiFi, Dog, Tv, Bath, Utensils, Trees). Link out to strajaonline detail pages.

**`RentalsSection.tsx`** — 3-col grid of compact cards (icon + name).

### `lib/api.ts`
Typed fetch client. Types: `ResortSummary`, `ResortDetail`, `Weather`, `ViewerSlope`, `ViewerLift`, `ViewerData`, `Skipass`, `Accommodation`, `RentalShop`, `ExternalData`. Endpoints object exposes `resorts()`, `resort(slug)`, `weather(slug)`, `viewerData(slug)`, `external(slug)`.

### `lib/utils.ts`
- `cn()` (clsx + tailwind-merge)
- `WEATHER_CODES` (Romanian weather descriptions)
- `DIFFICULTY` map (easy=Ușor green, medium=Mediu blue, hard=Dificil red, expert=Expert black)
- `LIFT_TYPE_LABELS` (gondola=Gondolă, cable_car=Telecabină, chair=Telescaun, drag=Teleschi)
- `describeWeather()`, `describeLiftType()`
- `toSlug()` — Romanian-aware filename slug (strips diacritics, lowercases, dashes)

### `lib/viewer-store.ts`
Zustand store for the viewer. State:
- `hoveredId: string | null`
- `selection: { type:"slope"|"lift", data } | null`
- `resetView: () => void` (registered by ResetHandler)
- `filters: { easy, medium, hard, expert, lifts }` (all true by default)

Actions: `setHovered`, `selectSlope`, `selectLift`, `clearSelection`, `setFilter`.

---

## 10. 3D Viewer (The Centerpiece)

Lives at `/resorts/straja/viewer`. **Server-rendered page** fetches resort + viewerData + external data, passes to **`<ViewerCanvas>`** which is `dynamic(() => import("./Scene"), { ssr: false })`.

### Scene composition (`Scene.tsx`)

**Canvas config**:
- dpr `[1, 1.5]` (caps at 1.5x for Retina perf)
- camera default position `[-772, 3024, -2065]`, fov 45, near 1, far 50000
- ACES filmic tone mapping, exposure 1.18
- `performance.min = 0.5` (R3F adaptive DPR if FPS drops)
- `powerPreference: "high-performance"`
- `onPointerMissed` → clears selection

**Lights**:
- `<SkyDome zenith="#3a82d3" horizon="#fadeb6" ground="#2a3a52" />` — gradient sphere, BackSide, custom vertex+fragment shader
- `<fog>` `["#f3dcb8", 19000, 24000]` — only kicks in at terrain edge to mask the cut
- hemisphereLight `["#cfe2f6", "#262a30", 1.05]`
- directionalLight `[6000, 12000, 4000]` intensity 1.85, color `#fff4cf` (warm sun)
- directionalLight `[-4000, 5000, -3000]` intensity 0.35, color `#dbe7fb` (cool fill)

**Terrain**:
- Main: `<Terrain url={resort.terrainModelUrl}>` loads `/terrain/straja.glb` (6 km, snow baked)
- Distant: `<DistantTerrain url="/terrain/straja-distant.glb">` (40 km, hole-punched center, anisotropy 4)
- Procedural `<Mountain>` (simplex-noise displaced plane) is the Suspense fallback only

**Snow particles**: `<Snow count={1500} area={3500} ceiling={3000} floor={600} fallSpeed={80} />`. Mutates positions in `useFrame`; respawns flakes that fall below `floor`. (Reduced from 3000 for perf.)

**Slopes**: `<Slopes slopes={viewerData.slopes}>` renders each as drei `<Line>` with dashed mode. **Draw-in animation** via `material.dashSize` lerping 0 → totalLength (staggered: index × 70 ms, duration 1.8 s, cubic ease-out). Per-slope `useFrame` reads store state for hover (cursor + width 3→5.5), selection (lerp opacity to 1, dim others to 0.22), and **filter** (`opacity = 0` when filtered out). Click sets `selectSlope`. PointerOver/Out set hovered.

**Lifts**: `<Lifts lifts={viewerData.lifts}>` renders cable line + 3-piece station group at each endpoint:
- Pylon: small dark cylinder (`<cylinderGeometry args={[1.6, 1.6, 16, 12]}>`)
- Glowing orb: amber emissive sphere
- Halo ring: torus around the orb, transparent

Stations grow from scale 0 (0.35 s ease-out at lift mount), then lerp with hover (×1.5). Cable same draw-in pattern.

**Labels** (`Labels.tsx`):
- Subscribes to store (single Zustand subscription, all label children re-render with computed props)
- Slopes: 1 chip at polyline midpoint (deduplicated by name — picks longest polyline per unique name)
- Lifts: **2 chips per lift** (entry + exit stations, both raised +35m above terrain)
- Bubble-in animation with **shuffled random delays** (Fisher-Yates) so chips pop in randomly
- Hover/click on chip → triggers same store actions as the line
- Filter → opacity 0 + scale 50 + pointer-events-none
- Dim non-active labels to 25% when something is hovered or selected

**Info Panel** (`InfoPanel.tsx`):
- Floating top-right, slides in (`info-panel-in` animation)
- Slope content: name, difficulty (colored dot + label), open/closed status, length, vertical drop, top altitude, bottom altitude
- Lift content: name, type, open/closed status, top station altitude, bottom station altitude, capacity, hours
- **Skipass card** (when external data available): point cost per ride for that lift (Telegondolă=5p Montana, etc.). Amber gradient card with brighter contrast (`text-amber-200`, `text-foreground/70`)
- **Photo loader** (`PanelImage`): tries `/slopes/{slug}.jpg` → `.png` → `.jpeg` → `.webp`, hides silently on all-fail. Uses `toSlug()` from utils for filename matching.

**Legend / Filter** (`Legend.tsx`):
- Bottom-left, 5 categories: Începători (green), Ușoară (blue), Medie (red), Dificilă (black), Instalație cablu (amber)
- Click row to toggle visibility. Rows show line-through + dimmed when off.

**Reset View** (`ResetButton.tsx` + `ResetHandler` in Scene):
- Bottom-right pill
- `ResetHandler` (inside Canvas) registers a `resetView` function on the store that lerps camera back to `[-772, 3024, -2065]` and target back to `[-426, 1400, 207]` over ~0.5 s using useFrame
- Also clears any active selection

**Camera bounds** (`CameraBounds` in Scene):
- Per-frame clamps OrbitControls target XZ to ±2400 m, Y to 900–1900 m
- Hard Y floor: if `camera.position.y < 1700`, push it up
- OrbitControls config: `minPolarAngle=π*0.08` (14° from up), `maxPolarAngle=π*0.41` (74°), `minDistance=400`, `maxDistance=12000`, dampingFactor 0.08

### OrbitControls behavior
- `makeDefault` so `useThree().controls` returns it
- Damped, both pan and zoom
- User can't escape resort area; can't clip the summit; can't go upside down or fully horizontal

### Phase progression of the viewer (history)
1. 2a: Cube + plane scaffold
2. 2b: Procedural mountain (kept as Mountain.tsx fallback)
3. 2c: Switch to Blender attempted but failed (BlenderGIS + GDAL DLL hell). Pivoted to Python pipeline.
4. 2d: Real Straja GLB loaded with anisotropy 16
5. 2e: Hardcoded test slope + lift to validate coordinate system
6. Phase 3: OSM importer + JSON-driven seed
7. Phase 3 polish: difficulty map calibration, Constantinescu split, Mutu sub-letters, hand-traced missing slopes, jiggle/densification, sphere reduction
8. 4a: Slope draw-in animation
9. 4b: Hover highlight + click info panel + label dimming + filter
10. 4c: Reset view + difficulty legend
11. Atmospheric: tone mapping, fog tweaks, sky dome
12. B3 failed (procedural mountain ring rejected by user)
13. Distant terrain: bake separate 40 km × 40 km low-res GLB, hole-punched center, fog tuned to "edge fade" so map looks like it tapers off

---

## 11. Design System History (palette evolution)

The user iterated heavily on colors. Current snapshot is in section 9, but here's the history so the AI knows what NOT to suggest next time:

1. **Original dark blue** (first draft): `#07090d` bg, `#38bdf8` accent — user said "too dark"
2. **Mid dark night** (after first redesign): deep navy `#060a14`, sky-blue `#7fb7ff` accent — fine for a while
3. **Light alpine** (first attempt): `#f8fafd` bg — user said "too white, killing my eyes"
4. **Slightly softer**: `#eaeef5` — still too punchy
5. **Dark night again** (Saint Bernard logo intro): `#1a2438` — user said "too dark"
6. **Soft daylight** (current): `#dee3ec` bg, `#1d2738` fg, mountain blue accent, warm ember amber

Lessons:
- Don't go pure white (#fff or #f8...)
- Don't go pure black or very dark navy
- Warm tints work better than cold-only palettes
- Reduced contrast is preferred (no pure-black on pure-white)

---

## 12. External Data Integration (strajaonline.ro crawler)

### What gets crawled
- `/skipass` → 4 pass types with prices + consumption (Telegondolă=5, Telescaun=3, Teleschi=2 for Montana; Telescaun=5, Teleschi=4 for Platoul)
- `/sitemap-0.xml` → list of 45 individual `/cazare/{slug}` URLs
- Each `/cazare/{slug}` → name, address, description, features, star rating
- `/rentals` → 7 rental shop names
- Sitemap also contains `/skipass-data`, blog posts (ignored)

### What's NOT crawled
- `/restaurante` — only shows "Loading..." (client-side fetched, would need Playwright)
- `/camere_live` — has 4 iframe webcam URLs from `player.webcamromania.ro`; user explicitly said no embedding
- `/cazare/<slug>/quotes` — interactive search form, dynamic

### Caching
- Crawler caches every HTTP response to `data/source/strajaonline-cache/*.html`
- Polite: 0.4 s delay between requests, custom User-Agent

### API serves it (StrajaOnlineEndpoint.cs)
- `GET /api/v1/resorts/straja/external` returns the raw JSON
- 5-minute in-memory cache; re-reads file on cache miss
- File lookup tries 3 paths to find `data/source/strajaonline.json`

### Skipass mapping (lift point cost lookup)
In `InfoPanel.tsx`:
```ts
isPlatoul = lift.name.toLowerCase().includes("platoul soarelui")
passType = isPlatoul ? "points_platoul" : "points_montana"
liftType → consumption key:
  gondola, cable_car → "Telegondolă" / "Telegondola"
  chair → "Telescaun"
  drag → "Teleschi"
```

---

## 13. Slope & Lift Inventory (current state)

### 18 slopes (all `isOpen: false` off-season)
| # | Name | Difficulty | Source |
|---|---|---|---|
| I | I Pârtia Straja (8.1 km) | hard | Hand-traced (20 waypoints) |
| 1 | 1 Pârtia Lupului | expert | OSM 307502156 |
| 1a | 1a Pârtia Lupului II | expert | OSM 307502139 |
| 2 | 2 Pârtia Canal | expert | OSM 307502134 (shorter, 751 m) |
| 2a | 2a Pârtia Canal II | hard | OSM 307502145 (longer, 1207 m) |
| 3a | 3a Pârtia Constantinescu | medium (blue) | OSM 900945329 (top, longer, 730 m) |
| 3b | 3b Pârtia Constantinescu | hard | OSM 307502152 (bottom, shorter, 247 m) |
| 4 | 4 Pârtia Sf. Gheorghe | medium | Hand-traced (along upper Telegondolă) |
| 5a | 5a Pârtia Mutu | medium | Hand-traced (parallel offset -28 m SW) |
| 5b | 5b Pârtia Mutu | hard | Hand-traced (original Mutu path) |
| 5c | 5c Pârtia Mutu | expert | Hand-traced (parallel offset +28 m NE) |
| 6 | 6 Pârtia Platoul Soarelui | medium | OSM (multiple segments, both labelled same) |
| 7 | 7 Pârtia Telegondolă | hard | Hand-traced (along gondola path) |
| 8 | 8 Pârtia vf. Straja | hard | OSM 307502143 |
| 9 | 9 Pârtia Baloo | easy | OSM 1034707172 (geometry trimmed to 100 m) |
| — | Snowpark | medium | OSM 1034707169 |
| — | Pârtie intermediară | medium | Hand-traced connector |

### 11 lifts (all `isOpen: false` off-season)
| Roman | Name | Type |
|---|---|---|
| I | I. Teleschiul 1 - Lupului | drag |
| II | II. Telescaun 2 - Canal | chair |
| IV | IV. Telescaun 4 | chair (was OSM "Telescaun Baloo") |
| V | V. Teleschiul 5 - Mutu | drag |
| VI | VI. Telescaun Platoul Soarelui | chair |
| VII | VII. Teleski Platoul Soarelui | drag |
| VIII | VIII. Telescaun Vf. Straja | chair |
| IX | IX. Telegondola Straja | gondola |
| X | X. Baby Ski | drag (hand-added, 60 m, next to Baloo) |
| XI | XI. Telescaun Constantinescu 1 | chair |
| XII | XII. Telescaun 3 (4 locuri debraiabil) | chair (was OSM "Telescaun nr. 4") |

### Photos available
- **Slopes** (in `web/public/slopes/`): 16 .jpg files matching `toSlug(name)` like `i-partia-straja.jpg`, `1-partia-lupului.jpg`, `2-partia-canal.jpg`, etc. Constantinescu and Mutu duplicated for 3a/3b and 5a/5b/5c.
- **Lifts** (in `web/public/lifts/`): 11 .png files. The mapping was guessed (TELESCAUN-NR-4.png → IV, TELESCHIUL-NR-4.png → XII).
- **Logo**: `web/public/random/ROSKILOGO.png` (Saint Bernard, 4144×4275, blue background, mountains, "ROSKI" text)
- **READMEs** in slopes/ and lifts/ folders explain naming convention

---

## 14. Skipass Data (from crawler)

```json
{
  "passes": [
    { "type": "daily", "name": "Skipass pe zile",
      "valid": "09:00–17:00", "scope": "Toate pârtiile",
      "prices": [
        {"label":"1 zi", "amount":160, "currency":"lei"},
        {"label":"2 zile (145 lei/zi)", "amount":290, "currency":"lei"},
        {"label":"3 zile (140 lei/zi)", "amount":420, "currency":"lei"},
        {"label":"4 zile (130 lei/zi)", "amount":520, "currency":"lei"},
        {"label":"5 zile (120 lei/zi)", "amount":600, "currency":"lei"},
        {"label":"4 ore (inclusiv nocturnă)", "amount":120, "currency":"lei"}
      ]},
    { "type": "4hour", "name": "Skipass 4 ore",
      "valid": "include nocturna 17:00–22:00", "scope": "Toate pârtiile",
      "prices": [{"label":"4 ore", "amount":120, "currency":"lei"}] },
    { "type": "points_montana", "name": "Skipass pe puncte – Complex Montana",
      "consumption": {"Telegondolă":5, "Telescaun":3, "Teleschi":2},
      "prices": [
        {"label":"5 puncte", "amount":25}, {"label":"10 puncte", "amount":50}, {"label":"100 puncte", "amount":450}
      ]},
    { "type": "points_platoul", "name": "Skipass pe puncte – Platoul Soarelui",
      "consumption": {"Telescaun":5, "Teleschi":4},
      "prices": [
        {"label":"5 puncte", "amount":8}, {"label":"15 puncte", "amount":24},
        {"label":"30 puncte", "amount":48}, {"label":"60 puncte", "amount":90}, {"label":"100 puncte", "amount":150}
      ]}
  ],
  "deposit_lei": 10
}
```

---

## 15. Known Issues & Decisions

### Things we tried and rolled back
- **BlenderGIS pipeline** (Phase 2c original plan): GDAL DLL hell on Windows, finally hit a `StructRNA of type VIEW3D_OT_map_viewer has been removed` bug in BlenderGIS itself with Blender 4.2. Spent ~2 hours, pivoted to Python script.
- **Procedural distant mountain silhouettes** (B3 first attempt): User rejected as "rendered model feel". Replaced with real baked surrounding terrain.
- **Runtime shader-based snow tint**: too generic, washed out detail. Replaced with baked snow texture from Python pipeline.
- **80 km × 80 km distant terrain** (8.5 MB): looked buggy, user asked to revert to 40 km × 40 km hole-punched.

### Limitations accepted
- **No real winter satellite imagery available for free for Straja.** ESRI Wayback has no winter captures of this area at usable resolution. Sentinel-2 is 10 m/px (too coarse). Mapbox would require API key. Solution: synthetic snow post-process on summer imagery via Python (`apply_snow`).
- **Off-season status hardcoded**. All slopes/lifts have `isOpen: false`. When season opens, need to either run SQL UPDATE or hand-edit the JSON and re-seed.
- **Restaurants not crawled** (page is client-rendered, needs Playwright; user said skip).
- **Live cameras not embedded** (user explicitly said skip).
- **Lift status sync** is not real-time; uses the manual `IsOpen` field.

### Performance notes
- ~302k tris total (178k main + 124k distant) — runs smooth on desktop/laptop
- Mobile likely OK but not tested rigorously
- Snow particles reduced from 3000 → 1500 for perf
- Labels: no `occlude` (would raycast vs 178k mesh every frame per label); accept that labels show through mountain
- DPR capped at 1.5 (not 2) for Retina perf
- adaptive DPR via R3F `performance.min`

### Camera bounds
- Polar: 14°–74° from up
- Distance: 400–12000 m
- Target clamps: ±2400 m XZ, 900–1900 m Y
- Hard Y floor: 1700 m (camera position can't go below)

### File-system gotchas
- `data/source/strajaonline-cache/` is gitignored
- `data/source/srtm/` and `data/source/sat/` are gitignored
- `data/.venv/` is gitignored
- `.postgres-data/` is gitignored
- Slope/lift photos in `web/public/slopes/` and `web/public/lifts/` ARE committed
- `web/public/terrain/straja.glb` (6.4 MB) and `straja-distant.glb` (3.4 MB) ARE committed (may be near GitHub's 100 MB hard limit but well under)

---

## 16. How to Run Locally

### One-time setup
```bash
# 1. Install Docker Desktop, .NET 9 SDK, Node 20+, Python 3.12+

# 2. Start Postgres
cd C:\Roski
docker compose up -d

# 3. Apply DB migration (will also seed Straja on first API run)
# (no explicit step — happens on API startup)

# 4. Install web deps
cd web
npm install

# 5. Python venv for pipelines
cd ..\data
python -m venv .venv
.venv\Scripts\activate
pip install numpy pillow requests trimesh simplex-noise
```

### Daily dev (3 terminals)
```bash
# Postgres
docker compose up -d                 # one-time per session, persists

# API
cd C:\Roski\api
$env:ASPNETCORE_ENVIRONMENT="Development"
dotnet run --no-launch-profile --urls http://localhost:5080

# Web
cd C:\Roski\web
npm run dev
# Open http://localhost:3000
```

### Re-running pipelines (rare)
```bash
# Re-bake main terrain (after editing bake-terrain.py or wanting different snow)
data\.venv\Scripts\python.exe data\bake-terrain.py \
  --slug straja --lat 45.3146 --lon 23.2501 \
  --size 6000 --samples 300 --zoom 17 \
  --snow --snow-line 900 --snow-full 1450 \
  --out web\public\terrain\straja.glb

# Re-bake distant ring
data\.venv\Scripts\python.exe data\bake-terrain.py \
  --slug straja-distant --lat 45.3146 --lon 23.2501 \
  --size 40000 --samples 250 --zoom 13 \
  --snow --snow-line 900 --snow-full 1450 \
  --exclude-center-m 3000 --max-texture-px 2048 --jpeg-quality 78 \
  --out web\public\terrain\straja-distant.glb

# Re-import OSM (then re-curate)
data\.venv\Scripts\python.exe data\import-slopes-lifts.py
data\.venv\Scripts\python.exe data\curate-straja.py
# Then restart API to re-seed slopes/lifts from the JSON

# Re-crawl strajaonline.ro
# (clear cache first if you want fresh content)
rm -rf data\source\strajaonline-cache
data\.venv\Scripts\python.exe data\crawl-strajaonline.py
# API picks it up automatically (5-min cache)
```

### Opening lifts for the new season
```bash
docker exec roski-db psql -U roski -d roski -c 'UPDATE slopes SET "IsOpen"=true; UPDATE lifts SET "IsOpen"=true;'
```
Or edit `data/source/straja-slopes-lifts.json` and restart API.

---

## 17. Things Not Done (deliberate or future)

- **Deploy** — Vercel + Azure App Service + Supabase was planned, user said skip for now
- **More resorts** — explicitly cut from scope
- **Restaurants** — page is JS-rendered, user said skip
- **Live cameras** — user said skip
- **Mobile responsive pass** — light testing only
- **SEO sitemap.xml** — not added
- **Auth / favorites** — not needed (read-only public site)
- **Background job to refresh crawler** — manual re-run only
- **Sun position slider** — was proposed, not built
- **Compare resorts** — not relevant for single resort
- **Avalanche bulletin / snow report history** — not built
- **Print-friendly version** — not built
- **OG image generation** — meta tags exist but no dynamic OG image
- **Live status sync** — `IsOpen` is manual

---

## 18. Recent Commit History (high level)

Phase 0 → repo + Postgres + API skeleton + Next.js scaffold
Phase 1 → resort listing + Straja detail + weather
Phase 2 → 3D viewer with terrain GLB, slopes, lifts, panel, filter, reset
Phase 3 → OSM importer + curate script + slope/lift accuracy iterations
Phase 4a → slope draw-in animation
Phase 4b → hover + click info panel + label dimming
Phase 4c → reset view + difficulty legend filter
Atmospheric → tone mapping, snow shader, sky dome, distant terrain ring
External data → strajaonline.ro crawler + skipass / cazare / rentals sections
Design polish → dark night → soft daylight palette evolutions; Saint Bernard logo

---

## 19. Quick Reference Card

| Need | Where |
|---|---|
| Add a slope override | `data/curate-straja.py` → `SLOPE_OVERRIDES` dict |
| Change snow appearance | `data/bake-terrain.py` → `apply_snow()` |
| Update palette | `web/app/globals.css` → `:root` |
| Change weather widget mode | `web/components/WeatherCard.tsx` → `KIND_THEME` |
| Tighten camera bounds | `web/components/viewer/Scene.tsx` → `OrbitControls` props + `CameraBounds` |
| Change snow particle count | `web/components/viewer/Snow.tsx` |
| Add lift skipass info | already wired — see `getLiftSkipassInfo()` in `InfoPanel.tsx` |
| Re-color a slope | `data/curate-straja.py` `SLOPE_OVERRIDES` (or `SLOPE_DIFFICULTY_OVERRIDES` in `import-slopes-lifts.py`) |

---

## 20. Constants Cheatsheet (Straja-specific)

| | Value |
|---|---|
| Resort origin lat/lon | **45.3146°N, 23.2501°E** |
| Resort elevation range | 1100–1870 m |
| SRTM tile | N45E023.hgt |
| Camera default position | `[-772, 3024, -2065]` |
| OrbitControls target default | `[-426, 1400, 207]` |
| Main terrain extent | 6 km × 6 km |
| Distant terrain extent | 40 km × 40 km, center hole 6 km × 6 km |
| Snow line / full | 900 / 1450 m (baked) |
| Camera Y floor | 1700 m |
| API port | 5080 |
| Web port | 3000 |
| Postgres port | 5432 |
| DB credentials | roski / roski / roski |
| GitHub user / repo | CzarulP / roski |

---

*End of context file. Drop this in at the start of a new conversation and the AI should have everything it needs.*
