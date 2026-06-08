"""
bake-terrain.py — produce a textured GLB terrain for a ski resort.

Replaces the Blender + BlenderGIS workflow entirely. Pulls free public data,
generates a heightmap-displaced mesh with a satellite texture drape, and writes
a GLB ready to load in the R3F viewer.

Data sources (all free, no auth):
  - SRTM 1-arcsec elevation from AWS Public Datasets (s3://elevation-tiles-prod/skadi)
  - ESRI World Imagery satellite tiles
    (https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer)

Output coordinate system matches the R3F viewer's local frame:
  - origin at (resort_lat, resort_lon)
  - X = east meters, Y = up meters, Z = -north meters (Three.js Y-up convention)

Run from project root:
    python data/bake-terrain.py --slug straja --lat 45.3415 --lon 23.3035 \
        --size 5000 --zoom 15 --out web/public/terrain/straja.glb

Dependencies (pip install):
    numpy pillow requests trimesh
"""

from __future__ import annotations

import argparse
import gzip
import io
import math
import os
import sys
from pathlib import Path
from urllib.parse import urlparse

import numpy as np
import requests
from PIL import Image
import trimesh

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

# 1 deg of latitude on a sphere of Earth's mean radius.
M_PER_DEG_LAT = 111_320.0

# AWS Public Dataset of SRTM 1-arcsec (30m) HGT tiles, gzip-compressed.
SRTM_URL_TEMPLATE = (
    "https://s3.amazonaws.com/elevation-tiles-prod/skadi/{lat_band}/{tile}.hgt.gz"
)

# Each HGT file covers 1 deg x 1 deg at 3601 x 3601 samples (1 arc-second).
HGT_SIDE = 3601

# ESRI World Imagery, free, no key required.
ESRI_TILE_TEMPLATE = (
    "https://services.arcgisonline.com/ArcGIS/rest/services/"
    "World_Imagery/MapServer/tile/{z}/{y}/{x}"
)

TILE_PX = 256


# ---------------------------------------------------------------------------
# SRTM
# ---------------------------------------------------------------------------

def srtm_tile_name(lat: float, lon: float) -> tuple[str, str]:
    """Return (lat_band, tile) for the SRTM tile that contains (lat, lon).

    e.g. (45.34, 23.30) -> ("N45", "N45E023")
    """
    lat_int = int(math.floor(lat))
    lon_int = int(math.floor(lon))
    ns = f"N{lat_int:02d}" if lat_int >= 0 else f"S{-lat_int:02d}"
    ew = f"E{lon_int:03d}" if lon_int >= 0 else f"W{-lon_int:03d}"
    return ns, f"{ns}{ew}"


def fetch_srtm_tile(lat: float, lon: float, cache_dir: Path) -> np.ndarray:
    """Download (or load from cache) the SRTM tile that contains (lat, lon).

    Returns a (3601, 3601) int16 array. Row 0 is the NORTH edge, col 0 the WEST edge.
    """
    lat_band, tile = srtm_tile_name(lat, lon)
    cache_dir.mkdir(parents=True, exist_ok=True)
    cache_path = cache_dir / f"{tile}.hgt"

    if not cache_path.exists():
        url = SRTM_URL_TEMPLATE.format(lat_band=lat_band, tile=tile)
        print(f"[srtm] downloading {url}")
        r = requests.get(url, timeout=60)
        r.raise_for_status()
        with gzip.open(io.BytesIO(r.content), "rb") as gz:
            cache_path.write_bytes(gz.read())
        print(f"[srtm] cached at {cache_path}")
    else:
        print(f"[srtm] cache hit: {cache_path}")

    data = np.fromfile(cache_path, dtype=">i2").reshape(HGT_SIDE, HGT_SIDE)
    return data


def sample_elevation(hgt: np.ndarray, tile_origin: tuple[int, int],
                     lats: np.ndarray, lons: np.ndarray) -> np.ndarray:
    """Bilinear sample the HGT raster at arrays of lat/lon, return elevation in metres."""
    tile_lat_int, tile_lon_int = tile_origin
    # Fractional position within the tile (0..1)
    row_f = (tile_lat_int + 1 - lats) * (HGT_SIDE - 1)
    col_f = (lons - tile_lon_int) * (HGT_SIDE - 1)

    r0 = np.clip(np.floor(row_f).astype(int), 0, HGT_SIDE - 2)
    c0 = np.clip(np.floor(col_f).astype(int), 0, HGT_SIDE - 2)
    rf = row_f - r0
    cf = col_f - c0

    e00 = hgt[r0, c0].astype(np.float32)
    e01 = hgt[r0, c0 + 1].astype(np.float32)
    e10 = hgt[r0 + 1, c0].astype(np.float32)
    e11 = hgt[r0 + 1, c0 + 1].astype(np.float32)

    top = e00 * (1 - cf) + e01 * cf
    bot = e10 * (1 - cf) + e11 * cf
    return top * (1 - rf) + bot * rf


# ---------------------------------------------------------------------------
# Satellite tile stitching (Web Mercator)
# ---------------------------------------------------------------------------

def lonlat_to_tile(lon: float, lat: float, z: int) -> tuple[float, float]:
    """Return fractional tile (x, y) for a (lon, lat) at zoom z (Slippy Map convention)."""
    n = 2 ** z
    x = (lon + 180.0) / 360.0 * n
    lat_rad = math.radians(lat)
    y = (1.0 - math.log(math.tan(lat_rad) + 1 / math.cos(lat_rad)) / math.pi) / 2.0 * n
    return x, y


def fetch_satellite_image(lat_min: float, lat_max: float,
                          lon_min: float, lon_max: float,
                          zoom: int, cache_dir: Path) -> tuple[Image.Image, tuple[float, float, float, float]]:
    """Fetch and stitch ESRI satellite tiles covering the bbox.

    Returns:
        - composite PIL image
        - bbox of that image in tile space: (x_min, x_max, y_min, y_max) (fractional)
    """
    cache_dir.mkdir(parents=True, exist_ok=True)

    x0, y0 = lonlat_to_tile(lon_min, lat_max, zoom)  # NW corner
    x1, y1 = lonlat_to_tile(lon_max, lat_min, zoom)  # SE corner

    tx0, tx1 = int(math.floor(x0)), int(math.floor(x1))
    ty0, ty1 = int(math.floor(y0)), int(math.floor(y1))

    cols = tx1 - tx0 + 1
    rows = ty1 - ty0 + 1
    print(f"[sat] stitching {cols}x{rows} tiles at zoom {zoom} ({cols * rows} total)")

    composite = Image.new("RGB", (cols * TILE_PX, rows * TILE_PX))

    for ty in range(ty0, ty1 + 1):
        for tx in range(tx0, tx1 + 1):
            tile_path = cache_dir / f"esri_z{zoom}_x{tx}_y{ty}.jpg"
            if not tile_path.exists():
                url = ESRI_TILE_TEMPLATE.format(z=zoom, x=tx, y=ty)
                r = requests.get(
                    url,
                    timeout=30,
                    headers={"User-Agent": "Roski-terrain-bake/1.0"},
                )
                r.raise_for_status()
                tile_path.write_bytes(r.content)
                print(f"[sat] downloaded z{zoom}/{tx}/{ty}")
            img = Image.open(tile_path).convert("RGB")
            composite.paste(img, ((tx - tx0) * TILE_PX, (ty - ty0) * TILE_PX))

    bbox = (tx0, tx1 + 1, ty0, ty1 + 1)
    return composite, bbox


def crop_satellite_to_bbox(composite: Image.Image,
                           tile_bbox: tuple[int, int, int, int],
                           lat_min: float, lat_max: float,
                           lon_min: float, lon_max: float,
                           zoom: int) -> Image.Image:
    """Crop the stitched composite to exactly the geographic bbox."""
    x0, y0 = lonlat_to_tile(lon_min, lat_max, zoom)
    x1, y1 = lonlat_to_tile(lon_max, lat_min, zoom)
    tx0, tx1, ty0, ty1 = tile_bbox
    px = ((x0 - tx0) * TILE_PX, (y0 - ty0) * TILE_PX,
          (x1 - tx0) * TILE_PX, (y1 - ty0) * TILE_PX)
    return composite.crop(tuple(int(round(v)) for v in px))


# ---------------------------------------------------------------------------
# Snow post-process — turn a summer satellite drape into a winter look
# ---------------------------------------------------------------------------

def apply_snow(texture: Image.Image,
               hgt: np.ndarray,
               tile_origin: tuple[int, int],
               lat_min: float, lat_max: float,
               lon_min: float, lon_max: float,
               snow_line_m: float = 1150.0,
               snow_full_m: float = 1700.0,
               max_amount: float = 0.92,
               forest_dampen: float = 0.70,
               seed: int = 42) -> Image.Image:
    """Convert a summer texture into a plausible winter version.

    The snow probability per pixel combines:
      * elevation (smoothstep from snow_line_m to snow_full_m, sampled from SRTM)
      * "openness" (high luminance, low green-dominance = bare ground/slopes/rock)
      * spatial noise so the snow line isn't a perfect contour
    Forests get less snow tint so the slope corridors remain visually distinct.
    """
    rng = np.random.default_rng(seed)
    w, h = texture.size
    arr = np.asarray(texture, dtype=np.float32)  # (h, w, 3)

    # --- per-pixel elevation via SRTM bilinear ---
    # Row 0 is at lat_max, row h-1 is at lat_min.
    lats = lat_max + (lat_min - lat_max) * (np.arange(h) + 0.5) / h
    lons = lon_min + (lon_max - lon_min) * (np.arange(w) + 0.5) / w
    lon_grid, lat_grid = np.meshgrid(lons, lats)
    elev = sample_elevation(hgt, tile_origin, lat_grid.ravel(), lon_grid.ravel()).reshape(h, w)

    # --- elevation factor (smoothstep) ---
    t = np.clip((elev - snow_line_m) / (snow_full_m - snow_line_m), 0.0, 1.0)
    elevation_factor = t * t * (3.0 - 2.0 * t)  # smoothstep

    # --- openness factor: luminance + non-green-dominance ---
    r, g, b = arr[..., 0], arr[..., 1], arr[..., 2]
    lum = 0.299 * r + 0.587 * g + 0.114 * b
    # Forests are dark, open ground is light.
    bright = np.clip((lum - 55.0) / 75.0, 0.0, 1.0)
    # Green dominance — high in forests, low on roads/rocks/slopes.
    green_dom = np.clip((g - 0.5 * (r + b)) / 40.0, 0.0, 1.0)
    openness = bright * (1.0 - forest_dampen * green_dom)
    openness = np.clip(openness, 0.0, 1.0)

    # --- low-frequency spatial noise for natural snow-line variation ---
    # Sample noise at low res then upscale (Pillow handles smoothing).
    coarse = 96
    noise_lo = rng.random((coarse, coarse), dtype=np.float32)
    noise_img = Image.fromarray((noise_lo * 255).astype(np.uint8)).resize(
        (w, h), Image.Resampling.BILINEAR
    )
    noise = np.asarray(noise_img, dtype=np.float32) / 255.0
    # ±15% wobble around the elevation factor
    elevation_factor = np.clip(elevation_factor + (noise - 0.5) * 0.30, 0.0, 1.0)

    # --- combined snow mask ---
    # Open ground gets ~max_amount; even forests pick up ~60% so the whole
    # mountain reads as winter, not a snowless dark canopy.
    snow = elevation_factor * (0.60 + 0.40 * openness) * max_amount

    # Tiny sparkle high frequency noise for texture variation in heavily-snowed areas
    sparkle = (rng.random((h, w), dtype=np.float32) - 0.5) * 0.05
    snow = np.clip(snow + sparkle * (snow > 0.3), 0.0, 1.0)

    # --- snow colour with a slight cool tint ---
    snow_color = np.array([248.0, 251.0, 255.0], dtype=np.float32)

    # Mix
    mask = snow[..., None]
    out = arr * (1.0 - mask) + snow_color * mask

    # --- in heavily snowed pixels, slight blue shadow shift to look colder ---
    shade = np.clip(snow - 0.55, 0.0, 1.0) * 0.25
    out[..., 2] = np.minimum(255.0, out[..., 2] + shade * 8.0)
    out[..., 0] = np.maximum(0.0, out[..., 0] - shade * 4.0)

    return Image.fromarray(np.clip(out, 0.0, 255.0).astype(np.uint8))


# ---------------------------------------------------------------------------
# Mesh
# ---------------------------------------------------------------------------

def build_mesh(lat: float, lon: float, size_m: float, samples: int,
               hgt: np.ndarray, tile_origin: tuple[int, int]
               ) -> tuple[np.ndarray, np.ndarray, np.ndarray, tuple[float, float, float, float]]:
    """Build a regular-grid mesh in the local ENU frame.

    Returns:
        vertices: (N, 3) float32 — [x_east, y_up, z_south] meters, origin at (lat, lon)
        faces:    (M, 3) int32   — triangle indices
        uvs:      (N, 2) float32 — UV coords (0..1) for satellite texture
        bbox:     (lat_min, lat_max, lon_min, lon_max)
    """
    m_per_deg_lon = M_PER_DEG_LAT * math.cos(math.radians(lat))
    half = size_m / 2.0
    half_lat = half / M_PER_DEG_LAT
    half_lon = half / m_per_deg_lon

    lat_min, lat_max = lat - half_lat, lat + half_lat
    lon_min, lon_max = lon - half_lon, lon + half_lon

    # Grid of sample points (lat decreases with row index, lon increases with col)
    grid_lat = np.linspace(lat_max, lat_min, samples)
    grid_lon = np.linspace(lon_min, lon_max, samples)
    lon_grid, lat_grid = np.meshgrid(grid_lon, grid_lat)

    elev = sample_elevation(hgt, tile_origin, lat_grid.ravel(), lon_grid.ravel())
    elev = elev.reshape(samples, samples)

    # Local ENU meters, Y-up (Three.js)
    x_east = (lon_grid - lon) * m_per_deg_lon
    z_south = -(lat_grid - lat) * M_PER_DEG_LAT

    vertices = np.stack([x_east, elev, z_south], axis=-1).reshape(-1, 3).astype(np.float32)

    # UVs — top of texture is north (row 0), bottom is south (row n-1).
    # Image UV: U increases right, V increases UP. PIL/glTF convention -> we flip V.
    u = (np.arange(samples) / (samples - 1)).reshape(1, samples)
    v = 1.0 - (np.arange(samples) / (samples - 1)).reshape(samples, 1)
    uvs = np.stack(
        [np.broadcast_to(u, (samples, samples)),
         np.broadcast_to(v, (samples, samples))],
        axis=-1,
    ).reshape(-1, 2).astype(np.float32)

    # Triangles: two per quad, CCW when viewed from above (+Y)
    rows, cols = samples - 1, samples - 1
    i = np.arange(rows * cols)
    r = i // cols
    c = i % cols
    v00 = r * samples + c
    v01 = r * samples + (c + 1)
    v10 = (r + 1) * samples + c
    v11 = (r + 1) * samples + (c + 1)
    # Triangle 1: v00 -> v10 -> v11 (CCW from +Y)
    # Triangle 2: v00 -> v11 -> v01
    tri1 = np.stack([v00, v10, v11], axis=-1)
    tri2 = np.stack([v00, v11, v01], axis=-1)
    faces = np.concatenate([tri1, tri2], axis=0).astype(np.int32)

    return vertices, faces, uvs, (lat_min, lat_max, lon_min, lon_max)


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main() -> int:
    p = argparse.ArgumentParser(description="Bake a ski resort terrain to GLB.")
    p.add_argument("--slug", required=True, help="resort slug, used for cache file names")
    p.add_argument("--lat", type=float, required=True, help="resort origin latitude")
    p.add_argument("--lon", type=float, required=True, help="resort origin longitude")
    p.add_argument("--size", type=float, default=5000.0, help="bbox side length in metres (default 5000)")
    p.add_argument("--samples", type=int, default=200, help="mesh samples per side (default 200 -> ~80k tris)")
    p.add_argument("--zoom", type=int, default=15, help="satellite tile zoom level (default 15)")
    p.add_argument("--max-texture-px", type=int, default=4096,
                   help="cap final texture longest side (default 4096; higher = bigger file)")
    p.add_argument("--jpeg-quality", type=int, default=88,
                   help="JPEG quality for embedded texture, 0..100 (default 88)")
    p.add_argument("--snow", action="store_true",
                   help="apply winter snow post-process to the satellite texture before baking")
    p.add_argument("--snow-line", type=float, default=1150.0,
                   help="elevation (m) where snow starts (default 1150)")
    p.add_argument("--snow-full", type=float, default=1700.0,
                   help="elevation (m) at which snow is fully laid down (default 1700)")
    p.add_argument("--out", required=True, help="output .glb path")
    args = p.parse_args()

    print(f"[bake] resort={args.slug} origin=({args.lat}, {args.lon}) size={args.size}m samples={args.samples}")

    repo_root = Path(__file__).resolve().parents[1]
    cache_dir = repo_root / "data" / "source"

    # 1. SRTM
    hgt = fetch_srtm_tile(args.lat, args.lon, cache_dir / "srtm")
    tile_lat_int = int(math.floor(args.lat))
    tile_lon_int = int(math.floor(args.lon))

    # 2. Mesh
    vertices, faces, uvs, bbox = build_mesh(
        args.lat, args.lon, args.size, args.samples,
        hgt, (tile_lat_int, tile_lon_int),
    )
    lat_min, lat_max, lon_min, lon_max = bbox
    elev_range = (float(vertices[:, 1].min()), float(vertices[:, 1].max()))
    print(f"[mesh] {len(vertices)} verts, {len(faces)} tris, elev {elev_range[0]:.0f}..{elev_range[1]:.0f}m")

    # 3. Satellite drape
    composite, tile_bbox = fetch_satellite_image(
        lat_min, lat_max, lon_min, lon_max,
        zoom=args.zoom, cache_dir=cache_dir / "sat",
    )
    texture = crop_satellite_to_bbox(composite, tile_bbox, lat_min, lat_max, lon_min, lon_max, args.zoom)
    print(f"[sat] cropped texture {texture.size[0]}x{texture.size[1]} px")

    # 3.5 Optional snow post-process — turn summer into winter.
    if args.snow:
        print(f"[snow] applying winter snow ({args.snow_line:.0f}..{args.snow_full:.0f} m)…")
        texture = apply_snow(
            texture,
            hgt,
            (tile_lat_int, tile_lon_int),
            lat_min, lat_max, lon_min, lon_max,
            snow_line_m=args.snow_line,
            snow_full_m=args.snow_full,
        )

    # Downscale texture if it exceeds the max-texture-px cap (4K typical).
    long_side = max(texture.size)
    if long_side > args.max_texture_px:
        scale = args.max_texture_px / long_side
        new_size = (int(texture.size[0] * scale), int(texture.size[1] * scale))
        texture = texture.resize(new_size, Image.Resampling.LANCZOS)
        print(f"[sat] downscaled to {texture.size[0]}x{texture.size[1]} px")

    # Re-encode as JPEG so trimesh embeds JPEG (not PNG) in the GLB.
    # PNG bloats aerial imagery by ~10x — JPEG at quality 88 is visually identical.
    buf = io.BytesIO()
    texture.save(buf, format="JPEG", quality=args.jpeg_quality, optimize=True)
    buf.seek(0)
    texture_jpeg = Image.open(buf)
    print(f"[sat] JPEG-encoded at quality {args.jpeg_quality} ({len(buf.getvalue()) / 1024 / 1024:.2f} MB)")

    # 4. Build trimesh with texture
    material = trimesh.visual.material.PBRMaterial(
        name=f"{args.slug}_terrain",
        baseColorTexture=texture_jpeg,
        roughnessFactor=1.0,
        metallicFactor=0.0,
    )
    visual = trimesh.visual.TextureVisuals(uv=uvs, material=material)
    mesh = trimesh.Trimesh(vertices=vertices, faces=faces, visual=visual, process=False)

    out_path = Path(args.out).resolve()
    out_path.parent.mkdir(parents=True, exist_ok=True)
    mesh.export(out_path)
    size_mb = out_path.stat().st_size / (1024 * 1024)
    print(f"[bake] wrote {out_path} ({size_mb:.2f} MB)")

    return 0


if __name__ == "__main__":
    sys.exit(main())
