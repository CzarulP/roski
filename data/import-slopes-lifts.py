"""
import-slopes-lifts.py — fetch real slope + lift geometry from OpenStreetMap,
sample elevations from SRTM, and write a JSON file the .NET seeder loads.

The output is a JSON document at data/source/<slug>-slopes-lifts.json.
When the API starts, Seed.cs looks for that file; if present, it replaces any
existing slopes/lifts for the resort with the imported data.

Sampling SRTM (the same data baked into the terrain GLB) means every slope
vertex sits *exactly* on the rendered terrain surface — no floating, no
sinking, no manual elevation guessing.

Usage (Straja for v1; bbox is auto-derived from the script defaults):

    data\\.venv\\Scripts\\python.exe data\\import-slopes-lifts.py

Dependencies (already installed by bake-terrain.py setup):
    numpy requests
"""

from __future__ import annotations

import argparse
import json
import math
import sys
from pathlib import Path

import requests

# Reuse the SRTM logic from the terrain-bake module so behaviour stays in sync.
sys.path.insert(0, str(Path(__file__).resolve().parent))
from bake_terrain_lib import fetch_srtm_tile, sample_elevation  # type: ignore


OVERPASS_URL = "https://overpass-api.de/api/interpreter"

# OSM piste:type values we want as actual ski slopes.
# "connection" is excluded — those are utility connector trails between slopes,
# not slopes themselves, and visually clutter the map.
SLOPE_TYPES = {"downhill", "snow_park"}

# If True, drop slopes without a name. OSM often has un-named stubs that don't
# correspond to any real slope on the resort's official map.
DROP_UNNAMED = True

# OSM piste:difficulty -> our internal difficulty.
# Mapping is calibrated to the Romanian ski-color convention used at Straja:
#   green = începători (beginner)  -> our "easy"
#   blue  = ușoară (easy)           -> our "medium"
#   red   = medie (medium)          -> our "hard"   ← Straja's hardest published
#   black = dificilă (difficult)    -> our "expert"
# OSM contributors at Straja tend to over-classify (intermediate/advanced are
# used liberally) so we down-shift slightly. Tune via SLOPE_NAME_OVERRIDES below.
DIFFICULTY_MAP = {
    "novice": "easy",
    "easy": "easy",
    "intermediate": "medium",
    "advanced": "hard",     # OSM "advanced" at Straja = local "medie" red = our "hard"
    "expert": "hard",
    "freeride": "hard",
    "extreme": "hard",      # Straja has no true expert-only runs per the official map
}

# Default difficulty for slopes whose OSM tag is missing or unrecognised.
# Straja's official map is dominated by red ("hard") so that's the safer default.
DEFAULT_DIFFICULTY = "hard"

# Per-slope difficulty overrides keyed by OSM name (substring match, lower-cased).
# Use when OSM mis-classifies something vs. the official resort map.
SLOPE_DIFFICULTY_OVERRIDES = {
    "baloo": "easy",            # official Straja map shows GREEN (beginner)
    "platoul soarelui": "medium",  # official map: BLUE (easy)
    "constantinescu": "hard",   # official map: RED (medium difficulty)
    "vf. straja": "hard",       # official map: RED
    "canal": "hard",            # official map: RED
    "lupului": "hard",          # official map: RED
    "mutu": "hard",             # official map: RED
}

# OSM aerialway -> our lift_type tag
LIFT_TYPE_MAP = {
    "gondola": "gondola",
    "cable_car": "cable_car",
    "chair_lift": "chair",
    "mixed_lift": "chair",
    "t-bar": "drag",
    "j-bar": "drag",
    "platter": "drag",
    "rope_tow": "drag",
    "magic_carpet": "drag",
    "drag_lift": "drag",
}


def fetch_osm(bbox: tuple[float, float, float, float], cache_path: Path) -> dict:
    """Fetch (or load from cache) OSM piste + aerialway ways inside bbox.

    bbox is (min_lat, min_lon, max_lat, max_lon) per Overpass convention.
    """
    cache_path.parent.mkdir(parents=True, exist_ok=True)
    if cache_path.exists():
        print(f"[osm] cache hit: {cache_path}")
        return json.loads(cache_path.read_text(encoding="utf-8"))

    q = (
        "[out:json][timeout:25];\n"
        "(\n"
        f"  way[\"piste:type\"]({bbox[0]},{bbox[1]},{bbox[2]},{bbox[3]});\n"
        f"  way[\"aerialway\"]({bbox[0]},{bbox[1]},{bbox[2]},{bbox[3]});\n"
        ");\n"
        "out tags geom;\n"
    )
    print(f"[osm] querying Overpass for bbox {bbox}")
    r = requests.post(OVERPASS_URL, data={"data": q}, timeout=60)
    r.raise_for_status()
    cache_path.write_bytes(r.content)
    print(f"[osm] cached at {cache_path}")
    return r.json()


def parse_slopes_and_lifts(osm: dict, srtm, tile_origin: tuple[int, int]
                           ) -> tuple[list[dict], list[dict]]:
    slopes: list[dict] = []
    lifts: list[dict] = []
    import numpy as np

    for el in osm.get("elements", []):
        tags = el.get("tags", {})
        geom = el.get("geometry") or []
        if len(geom) < 2:
            continue  # not a polyline

        # Sample elevations at every vertex.
        lats = np.array([g["lat"] for g in geom], dtype=np.float64)
        lons = np.array([g["lon"] for g in geom], dtype=np.float64)
        elevs = sample_elevation(srtm, tile_origin, lats, lons)
        coords = [[float(lon), float(lat), float(elev)]
                  for lon, lat, elev in zip(lons, lats, elevs)]

        if "piste:type" in tags:
            ptype = tags["piste:type"]
            if ptype not in SLOPE_TYPES:
                continue
            raw_name = tags.get("name") or tags.get("ref")
            if DROP_UNNAMED and not raw_name:
                continue
            name = raw_name or "Pârtie nenumită"
            difficulty = DIFFICULTY_MAP.get(tags.get("piste:difficulty", ""), DEFAULT_DIFFICULTY)
            # Name-based override beats the OSM tag — official resort map wins.
            for key, override in SLOPE_DIFFICULTY_OVERRIDES.items():
                if key in name.lower():
                    difficulty = override
                    break
            slopes.append({
                "osmId": el["id"],
                "name": name.strip(),
                "difficulty": difficulty,
                "lengthM": _try_int(tags.get("piste:length")) or _polyline_length_m(coords),
                "isOpen": False,
                "geometry": {"type": "LineString", "coordinates": coords},
            })
        elif "aerialway" in tags:
            atype = tags["aerialway"]
            if atype == "station":
                continue
            mapped = LIFT_TYPE_MAP.get(atype, "drag")
            name = tags.get("name") or tags.get("ref") or "Telecabină nenumită"
            lifts.append({
                "osmId": el["id"],
                "name": name.strip(),
                "liftType": mapped,
                "capacity": _try_int(tags.get("aerialway:capacity")),
                "hours": None,
                "isOpen": False,
                "geometry": {"type": "LineString", "coordinates": coords},
            })

    return slopes, lifts


def _try_int(v):
    try:
        return int(v) if v is not None else None
    except (ValueError, TypeError):
        return None


def _polyline_length_m(coords: list[list[float]]) -> int:
    """Approximate length of a polyline in metres using flat-earth at the centroid."""
    if len(coords) < 2:
        return 0
    lat0 = sum(c[1] for c in coords) / len(coords)
    m_per_deg_lat = 111320.0
    m_per_deg_lon = m_per_deg_lat * math.cos(math.radians(lat0))
    total = 0.0
    for a, b in zip(coords, coords[1:]):
        dx = (b[0] - a[0]) * m_per_deg_lon
        dy = (b[1] - a[1]) * m_per_deg_lat
        dz = (b[2] - a[2]) if len(a) > 2 and len(b) > 2 else 0.0
        total += math.sqrt(dx * dx + dy * dy + dz * dz)
    return int(round(total))


def main() -> int:
    p = argparse.ArgumentParser(description="Import slopes + lifts from OSM into a JSON seed file.")
    p.add_argument("--slug", default="straja")
    p.add_argument("--lat", type=float, default=45.3146)
    p.add_argument("--lon", type=float, default=23.2501)
    p.add_argument("--bbox-half", type=float, default=0.03,
                   help="bbox half-side in degrees (~3 km at our latitude)")
    args = p.parse_args()

    repo_root = Path(__file__).resolve().parents[1]
    cache_dir = repo_root / "data" / "source"
    osm_cache = cache_dir / f"osm-{args.slug}.json"
    out_path = cache_dir / f"{args.slug}-slopes-lifts.json"

    bbox = (args.lat - args.bbox_half, args.lon - args.bbox_half,
            args.lat + args.bbox_half, args.lon + args.bbox_half)
    osm = fetch_osm(bbox, osm_cache)

    hgt = fetch_srtm_tile(args.lat, args.lon, cache_dir / "srtm")
    tile_origin = (int(math.floor(args.lat)), int(math.floor(args.lon)))
    slopes, lifts = parse_slopes_and_lifts(osm, hgt, tile_origin)

    out = {
        "resortSlug": args.slug,
        "slopes": slopes,
        "lifts": lifts,
    }
    out_path.write_text(json.dumps(out, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"[import] wrote {out_path}")
    print(f"[import]   slopes: {len(slopes)}")
    print(f"[import]   lifts:  {len(lifts)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
