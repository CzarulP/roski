# Roski

Interactive 3D ski resort platform for Romania. v1 ships a single resort: **Straja** (Hunedoara).

## Stack

- **web/** — Next.js 15 (App Router) + TypeScript + Tailwind + shadcn/ui + React Three Fiber
- **api/** — ASP.NET Core 9 minimal APIs + EF Core + Vertical Slice Architecture
- **db** — PostgreSQL 16 + PostGIS (Docker locally, Supabase in prod)
- **3D** — Blender-baked `.glb` terrain + runtime OSM-derived slope/lift overlays

## Local dev

Prereqs: Node 20+, .NET 9 SDK, Docker, Git.

```bash
# 1. start postgres
docker compose up -d

# 2. api
cd api
dotnet ef database update
dotnet run

# 3. web (new terminal)
cd web
npm install
npm run dev
```

Web on http://localhost:3000, API on http://localhost:5080.

## Project layout

```
web/      Next.js frontend
api/      .NET backend
data/     terrain + OSM scripts (run locally, output committed under data/output/)
docs/     architecture notes
```
