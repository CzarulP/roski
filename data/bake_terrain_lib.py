"""
Shared helpers for terrain baking and OSM imports.
Both bake-terrain.py and import-slopes-lifts.py depend on these.

Kept as a flat module (no package) so the scripts can `from bake_terrain_lib import …`
after sys.path adjustment.
"""

from __future__ import annotations

import gzip
import io
import math
from pathlib import Path

import numpy as np
import requests

# Each HGT file covers 1 deg x 1 deg at 3601 x 3601 samples (1 arc-second / ~30 m).
HGT_SIDE = 3601

SRTM_URL_TEMPLATE = (
    "https://s3.amazonaws.com/elevation-tiles-prod/skadi/{lat_band}/{tile}.hgt.gz"
)


def srtm_tile_name(lat: float, lon: float) -> tuple[str, str]:
    """Return (lat_band, tile) for the SRTM tile that contains (lat, lon)."""
    lat_int = int(math.floor(lat))
    lon_int = int(math.floor(lon))
    ns = f"N{lat_int:02d}" if lat_int >= 0 else f"S{-lat_int:02d}"
    ew = f"E{lon_int:03d}" if lon_int >= 0 else f"W{-lon_int:03d}"
    return ns, f"{ns}{ew}"


def fetch_srtm_tile(lat: float, lon: float, cache_dir: Path) -> np.ndarray:
    """Download (or load from cache) the SRTM tile that contains (lat, lon)."""
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

    return np.fromfile(cache_path, dtype=">i2").reshape(HGT_SIDE, HGT_SIDE)


def sample_elevation(hgt: np.ndarray, tile_origin: tuple[int, int],
                     lats: np.ndarray, lons: np.ndarray) -> np.ndarray:
    """Bilinear-sample the HGT raster at arrays of lat/lon, return metres."""
    tile_lat_int, tile_lon_int = tile_origin
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
