# Baking resort terrain

One-time workflow per resort. Produces `web/public/terrain/<slug>.glb`, loaded
by the 3D viewer at runtime.

## Pipeline

Pure Python — no Blender or GDAL required.

1. **Elevation**: SRTM 1-arc-second (30 m) HGT tiles from AWS Public Datasets
   (`s3://elevation-tiles-prod/skadi`). Free, no auth.
2. **Imagery**: ESRI World Imagery satellite tiles. Free, no key.
3. **Mesh**: regular-grid heightmap (200 × 200 = 40k verts by default) in
   local ENU meters with Y-up — already in Three.js convention.
4. **Texture**: cropped satellite mosaic baked into the GLB.

Output GLB is centered at the resort origin: vertex `(0, y, 0)` corresponds to
real-world `(origin_lat, origin_lon)` at sea level. Slopes/lifts overlaid in
Phase 2e use the same convention.

## Setup (once per machine)

From the repo root:

```bash
cd data
python -m venv .venv
.venv\Scripts\activate
pip install numpy pillow requests trimesh
```

The venv lives at `data/.venv` and is git-ignored.

## Bake a resort

```bash
data\.venv\Scripts\python.exe data\bake-terrain.py ^
  --slug straja ^
  --lat 45.3415 --lon 23.3035 ^
  --size 5000 ^
  --samples 200 ^
  --zoom 15 ^
  --out web\public\terrain\straja.glb
```

Flags:

- `--slug` — resort identifier, used for cache file names
- `--lat / --lon` — origin in WGS84 degrees (must match the resort's
  `terrainOriginLat`/`terrainOriginLon` in the database)
- `--size` — bbox side length in metres (default 5000 = 5 km × 5 km)
- `--samples` — mesh subdivision per side (200 → 80k tris, mobile-friendly)
- `--zoom` — satellite tile zoom level. 15 is ~3.4 m/pixel at our latitude;
  bump to 16 for sharper texture if file size budget allows.
- `--out` — GLB path under `web/public/terrain/`

Run time: ~30–90 s depending on how many tiles need downloading. Tiles and
the SRTM file are cached under `data/source/` and re-used across runs.

## Refining the model in Blender

The GLB is regular Blender import — File → Import → glTF. After import you
can:

- Add trees (e.g. instanced cylinders, asset libraries, scatter add-ons)
- Add buildings (box modelling)
- Add lift cables (curves with bevel)
- Apply custom materials beyond the satellite drape

Re-export with File → Export → glTF 2.0, **+Y Up checked**, Draco compression
optional. Overwrite `web/public/terrain/<slug>.glb` and refresh the viewer.

No GDAL or BlenderGIS needed for any of this — only for the initial pull,
which the Python script replaces.

## Adding a new resort

1. Pick the resort origin (`lat`, `lon`) — usually the centre of the ski area
   or the main lift base.
2. Update the resort row in the database so `terrainOriginLat` /
   `terrainOriginLon` match.
3. Run the script with `--slug <new-slug>` and the new coords.
4. Commit the resulting `.glb` under `web/public/terrain/`.

The Three.js viewer needs no per-resort code changes — it reads
`terrainModelUrl` from the resort detail endpoint.

## Troubleshooting

- **GLB looks tiny / huge in the viewer**: `samples` too low or `size` wrong.
  Default 5000 m bbox + 200 samples gives a comfortable resort-scale model.
- **Texture looks blurry**: bump `--zoom` to 16 or 17. Tile count grows
  geometrically; final file may be 2–3× larger.
- **HTTP 403 on satellite tiles**: ESRI has occasional rate limits. Retry
  after a minute, or change provider in `bake-terrain.py` to OSM tiles.
- **HGT download fails**: AWS Public Dataset bucket region may be slow.
  Cached tile under `data/source/srtm/<TILE>.hgt` after first success.
