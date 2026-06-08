"""
curate-straja.py — hand-curated overrides on top of the OSM import.

The OSM data gives us most slope/lift geometry for free, but it's incomplete,
inconsistently named, and gets some difficulties wrong vs the official map.
This script transforms data/source/straja-slopes-lifts.json into the corrected
final state used by the API:

  - Renames slopes/lifts to the official numbering (I, 1, 1a, 2, ..., 9 / I-XII)
  - Recolors slopes per the official ski-Straja.ro map
  - Removes spurious entries (e.g. the unnamed cable car outside the resort)
  - Adds missing slopes (Sf. Gheorghe, Telegondolă, Pârtia I, Baby Ski, Mutu
    sub-letters) with hand-traced coords and SRTM-sampled elevations
  - Trims Baloo to its actual short green section
  - Densifies new slope paths (~120 m sample spacing) so they hug terrain
    instead of clipping under it on long straight segments

Run after re-running import-slopes-lifts.py:

    data\\.venv\\Scripts\\python.exe data\\curate-straja.py

Re-runs are idempotent; the result is always the same regardless of OSM updates.
"""

from __future__ import annotations

import json
import math
import sys
from pathlib import Path

import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parent))
from bake_terrain_lib import fetch_srtm_tile, sample_elevation


SLOPES_LIFTS_PATH = Path(__file__).resolve().parent / "source" / "straja-slopes-lifts.json"
SRTM_DIR = Path(__file__).resolve().parent / "source" / "srtm"

# Lat-dependent metres-per-degree, calibrated to Straja's latitude.
M_PER_DEG_LAT = 111_320.0
M_PER_DEG_LON_AT_STRAJA = M_PER_DEG_LAT * math.cos(math.radians(45.3146))


# -------- difficulties --------
# easy   = verde / începători (beginner)
# medium = albastru / ușoară (easy)
# hard   = roșu / medie (medium)
# expert = negru / dificilă (difficult)


# -------- slope overrides keyed by OSM id --------
# Maps the original OSM id to (new_name, new_difficulty).
SLOPE_OVERRIDES: dict[int, tuple[str, str]] = {
    # Canal 2 and 2a were SWAPPED: shorter (751 m) is the real "2" (BLACK),
    # longer (1207 m) is "2a Canal II" (RED, not black).
    307502134: ("2 Pârtia Canal",      "expert"),   # 11 pts, ~751 m, BLACK
    307502145: ("2a Pârtia Canal II",  "hard"),     # 19 pts, ~1207 m, RED

    # Lupului 1 (BLACK) and 1a Lupului II (BLACK).
    307502156: ("1 Pârtia Lupului",    "expert"),
    307502139: ("1a Pârtia Lupului II", "expert"),

    # Constantinescu — two real segments. Top (longer, 730 m) is the easier 3a
    # section in BLUE; bottom (shorter, 247 m) is 3b in RED.
    900945329: ("3a Pârtia Constantinescu", "medium"),  # top, longer
    307502152: ("3b Pârtia Constantinescu", "hard"),    # bottom, shorter

    # Pârtia 8 (Vf. Straja) is RED per the official map.
    307502143: ("8 Pârtia vf. Straja", "hard"),

    # Platoul Soarelui — multiple OSM segments of the same physical slope.
    307502144: ("6 Pârtia Platoul Soarelui", "medium"),
    900949069: ("6 Pârtia Platoul Soarelui", "medium"),

    # Snowpark kept as its own thing.
    1034707169: ("Snowpark", "medium"),

    # Baloo — needs geometry trimming (handled in clean_baloo below).
    1034707172: ("9 Pârtia Baloo", "easy"),
}

# OSM ids to drop entirely.
SLOPE_DROP_IDS = {
    1448582998,  # 32 m Platoul Soarelui stub
    1448582999,  # 34 m Platoul Soarelui stub
    1448583001,  # 10 m Constantinescu stub
    1448583003,  # 92 m Constantinescu stub
    307502157,   # the single OSM "Mutu" — replaced below by 5a / 5b / 5c parallel paths
}


# -------- lift overrides keyed by OSM id --------
LIFT_OVERRIDES: dict[int, tuple[str, str | None]] = {
    307502148: ("I. Teleschiul 1 - Lupului",            "drag"),
    307502149: ("II. Telescaun 2 - Canal",              "chair"),
    278714066: ("V. Teleschiul 5 - Mutu",               "drag"),
    307502163: ("VIII. Telescaun Vf. Straja",           "chair"),
    307502161: ("IX. Telegondola Straja",               "gondola"),
    761558748: ("XI. Telescaun Constantinescu 1",       "chair"),
    # IV is the chair at Baloo (was previously labelled XII).
    1034707171: ("IV. Telescaun 4",                     "chair"),
    # Telescaun "nr. 4" (OSM-labelled) is somewhere central — best guess is XII
    # (Telescaun 3 - 4 locuri debraiabil), the detachable 4-seater shown on the
    # map with the green annotation.
    761558750: ("XII. Telescaun 3 (4 locuri debraiabil)", "chair"),
    # Question marks removed — user confirmed these labels are correct.
    75839794:  ("VI. Telescaun Platoul Soarelui", "chair"),
    307502146: ("VII. Teleski Platoul Soarelui",  "drag"),
}

LIFT_DROP_IDS = {
    1451314585,  # spurious "Telecabină nenumită" 2 km east of the resort
}


# -------- hand-traced missing slopes --------
#
# Mutu base path (copied from the OSM "5 Pârtia Mutu" before we drop it).
# Used as the centerline for 5a / 5b / 5c parallel offsets.
MUTU_BASE_PATH: list[tuple[float, float]] = [
    (23.2451932, 45.3084047),
    (23.2442622, 45.3092266),
    (23.2422859, 45.3107302),
    (23.2417708, 45.3111222),
    (23.2402760, 45.3124119),
    (23.2382800, 45.3141342),
    (23.2378658, 45.3142092),
]


# Telegondola lift path (copied from OSM — slope 7 runs alongside this).
TELEGONDOLA_LIFT_PATH: list[tuple[float, float]] = [
    (23.2168675, 45.3386268),
    (23.2171607, 45.3383681),
    (23.2180985, 45.3375512),
    (23.2205358, 45.3354285),
    (23.2235048, 45.3328702),
    (23.2248082, 45.3317768),
    (23.2259691, 45.3307342),
    (23.2277846, 45.3291564),
    (23.2298397, 45.3273847),
    (23.2317719, 45.3257111),
    (23.2336212, 45.3240604),
    (23.2355774, 45.3224033),
    (23.2364612, 45.3216880),
    (23.2367342, 45.3214580),
]


# Pârtia I — 8.1 km, the long red. User-specified route:
#   1. Starts at summit, follows Vf. Straja slope down
#   2. At Telescaun II base, switches to follow Mutu's NW direction
#   3. Continues to Telescaun XI top (Constantinescu lift)
#   4. Descends along Pârtia Constantinescu
#   5. From Constantinescu end, follows Pârtia Telegondolă down to base village
PARTIA_I_PATH: list[tuple[float, float]] = [
    (23.2645681, 45.3080557),  # summit (1857 m)
    (23.2600000, 45.3081500),
    (23.2560000, 45.3083000),
    (23.2520000, 45.3088000),
    (23.2491822, 45.3094348),  # bottom of Vf. Straja segment
    (23.2470000, 45.3100000),
    # Switch to Mutu-like NW direction toward Telescaun XI top
    (23.2440000, 45.3115000),
    (23.2420000, 45.3122000),
    (23.2404001, 45.3127591),  # Telescaun XI (Constantinescu) top — Constantinescu start
    # Follow Pârtia Constantinescu path down
    (23.2391431, 45.3147668),
    (23.2384527, 45.3161072),
    (23.2377881, 45.3174589),
    (23.2367342, 45.3214580),  # end of Constantinescu / top of Telegondolă
    # Continue down along Telegondolă path to base village
    (23.2336212, 45.3240604),
    (23.2298397, 45.3273847),
    (23.2259691, 45.3307342),
    (23.2235048, 45.3328702),
    (23.2205358, 45.3354285),
    (23.2180985, 45.3375512),
    (23.2168675, 45.3386268),  # base village (~750 m)
]


# Sf. Gheorghe — same path as 7 (Telegondolă), just trimmed to ~200 m
# (twice the length of Baloo, which is ~100 m).
PARTIA_4_PATH: list[tuple[float, float]] = [
    (23.2367, 45.3215),   # gondola top, same as 7's start
    (23.2361, 45.3220),
    (23.2352, 45.3228),   # ~200 m down along the gondola line
]


# Baby Ski (X) — slightly more displaced from Baloo than before.
BABY_SKI_PATH: list[tuple[float, float]] = [
    (23.2354, 45.3220),
    (23.2351, 45.3225),
]


# -------- path utilities --------

def densify(waypoints: list[tuple[float, float]], spacing_m: float = 120) -> list[tuple[float, float]]:
    """Add intermediate points so adjacent samples are at most `spacing_m` metres apart."""
    if len(waypoints) < 2:
        return list(waypoints)
    out: list[tuple[float, float]] = [waypoints[0]]
    for a, b in zip(waypoints[:-1], waypoints[1:]):
        dx = (b[0] - a[0]) * M_PER_DEG_LON_AT_STRAJA
        dy = (b[1] - a[1]) * M_PER_DEG_LAT
        seg_m = math.hypot(dx, dy)
        n = max(1, int(math.ceil(seg_m / spacing_m)))
        for i in range(1, n + 1):
            t = i / n
            out.append((a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t))
    return out


def offset_parallel(waypoints: list[tuple[float, float]], offset_m: float) -> list[tuple[float, float]]:
    """Translate every point by `offset_m` metres perpendicular to the overall
    start→end direction. Positive offset is to the LEFT of the direction of travel."""
    if len(waypoints) < 2:
        return list(waypoints)
    a, b = waypoints[0], waypoints[-1]
    dx = (b[0] - a[0]) * M_PER_DEG_LON_AT_STRAJA
    dy = (b[1] - a[1]) * M_PER_DEG_LAT
    length = math.hypot(dx, dy)
    if length == 0:
        return list(waypoints)
    # Perpendicular unit vector (left of travel direction)
    px = -dy / length
    py = dx / length
    lon_off = px * offset_m / M_PER_DEG_LON_AT_STRAJA
    lat_off = py * offset_m / M_PER_DEG_LAT
    return [(p[0] + lon_off, p[1] + lat_off) for p in waypoints]


def jiggle(waypoints: list[tuple[float, float]], amplitude_m: float = 12,
           period_pts: float = 6.0, seed: int = 0) -> list[tuple[float, float]]:
    """Add a sinusoidal perpendicular perturbation to make the path look natural."""
    if len(waypoints) < 3:
        return list(waypoints)
    out: list[tuple[float, float]] = []
    for i, (lon, lat) in enumerate(waypoints):
        if i == 0 or i == len(waypoints) - 1:
            out.append((lon, lat))
            continue
        prev = waypoints[i - 1]
        nxt = waypoints[i + 1]
        dx = (nxt[0] - prev[0]) * M_PER_DEG_LON_AT_STRAJA
        dy = (nxt[1] - prev[1]) * M_PER_DEG_LAT
        length = math.hypot(dx, dy) or 1.0
        px = -dy / length
        py = dx / length
        phase = (i + seed) / period_pts * 2 * math.pi
        amp = amplitude_m * math.sin(phase)
        lon_off = px * amp / M_PER_DEG_LON_AT_STRAJA
        lat_off = py * amp / M_PER_DEG_LAT
        out.append((lon + lon_off, lat + lat_off))
    return out


def sample_z(waypoints: list[tuple[float, float]], hgt, tile_origin) -> list[list[float]]:
    """Attach SRTM-sampled elevations to a list of (lon, lat) points."""
    lats = np.array([w[1] for w in waypoints], dtype=np.float64)
    lons = np.array([w[0] for w in waypoints], dtype=np.float64)
    elevs = sample_elevation(hgt, tile_origin, lats, lons)
    return [[float(lon), float(lat), float(elev)] for lon, lat, elev in zip(lons, lats, elevs)]


def clean_baloo(slope: dict) -> dict:
    """Baloo is only ~100 m of green. The OSM polyline runs nearly 1 km because
    it traces all the way to the chairlift bottom station. Replace with a short,
    clean fall-line segment heading down from the top."""
    # Top of Telescaun Baloo = (23.2357, 45.3221, ~1332 m)
    # Fall line points roughly SW based on the chairlift orientation.
    new_coords = [
        [23.23570, 45.32220, 1332.0],
        [23.23545, 45.32240, 1320.0],
        [23.23520, 45.32260, 1308.0],
    ]
    slope["geometry"]["coordinates"] = new_coords
    slope["lengthM"] = 100
    return slope


def main():
    data = json.loads(SLOPES_LIFTS_PATH.read_text(encoding="utf-8"))

    hgt = fetch_srtm_tile(45.3146, 23.2501, SRTM_DIR)
    tile_origin = (int(math.floor(45.3146)), int(math.floor(23.2501)))

    # ---- existing slopes — rename / recolor / drop / clean ----
    new_slopes = []
    for s in data["slopes"]:
        osm_id = s.get("osmId")
        # Drop hand-added entries from previous curate runs (osmId == null);
        # they'll be re-added below from the canonical NEW_SLOPES specs.
        if osm_id is None:
            continue
        if osm_id in SLOPE_DROP_IDS:
            continue
        if osm_id in SLOPE_OVERRIDES:
            name, diff = SLOPE_OVERRIDES[osm_id]
            s["name"] = name
            s["difficulty"] = diff
        if s.get("name") == "9 Pârtia Baloo":
            s = clean_baloo(s)
        new_slopes.append(s)

    # ---- hand-traced additions ----

    def add_slope(name: str, difficulty: str, waypoints: list[tuple[float, float]],
                  *, length_m: int, spacing_m: float = 120,
                  jiggle_seed: int = 0, jiggle_amp: float = 12) -> None:
        dense = densify(waypoints, spacing_m=spacing_m)
        if jiggle_amp > 0:
            dense = jiggle(dense, amplitude_m=jiggle_amp, seed=jiggle_seed)
        coords = sample_z(dense, hgt, tile_origin)
        new_slopes.append({
            "osmId": None,
            "name": name,
            "difficulty": difficulty,
            "lengthM": length_m,
            "isOpen": True,
            "geometry": {"type": "LineString", "coordinates": coords},
        })

    # Slopes get modest jiggle — enough to look natural, not enough to look like zigzags.
    add_slope("I Pârtia Straja",      "hard",   PARTIA_I_PATH,         length_m=8100, spacing_m=90,  jiggle_seed=1, jiggle_amp=20)
    add_slope("4 Pârtia Sf. Gheorghe", "medium", PARTIA_4_PATH,        length_m=200,  spacing_m=70,  jiggle_seed=2, jiggle_amp=6)
    add_slope("7 Pârtia Telegondolă",  "hard",   TELEGONDOLA_LIFT_PATH, length_m=3200, spacing_m=90, jiggle_seed=3, jiggle_amp=15)
    # 5 Mutu → three parallel paths. 5a is on the SW side (blue), 5c is on the NE side (black).
    add_slope("5a Pârtia Mutu", "medium", offset_parallel(MUTU_BASE_PATH, -28), length_m=1269, spacing_m=80, jiggle_seed=4, jiggle_amp=8)
    add_slope("5b Pârtia Mutu", "hard",   MUTU_BASE_PATH,                       length_m=1269, spacing_m=80, jiggle_seed=5, jiggle_amp=8)
    add_slope("5c Pârtia Mutu", "expert", offset_parallel(MUTU_BASE_PATH, +28), length_m=1269, spacing_m=80, jiggle_seed=6, jiggle_amp=8)

    # ---- lifts ----
    new_lifts = []
    for l in data["lifts"]:
        osm_id = l.get("osmId")
        # Drop hand-added lifts from previous runs — re-added below.
        if osm_id is None:
            continue
        if osm_id in LIFT_DROP_IDS:
            continue
        if osm_id in LIFT_OVERRIDES:
            name, ltype = LIFT_OVERRIDES[osm_id]
            l["name"] = name
            if ltype:
                l["liftType"] = ltype
        new_lifts.append(l)

    # Baby Ski (X) — not in OSM, add a short surface tow next to Baloo.
    baby_ski_coords = sample_z(BABY_SKI_PATH, hgt, tile_origin)
    new_lifts.append({
        "osmId": None,
        "name": "X. Baby Ski",
        "liftType": "drag",
        "capacity": None,
        "hours": None,
        "isOpen": True,
        "geometry": {"type": "LineString", "coordinates": baby_ski_coords},
    })

    data["slopes"] = new_slopes
    data["lifts"] = new_lifts

    SLOPES_LIFTS_PATH.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"[curate] wrote {SLOPES_LIFTS_PATH}")
    print(f"[curate]   slopes: {len(new_slopes)}")
    print(f"[curate]   lifts:  {len(new_lifts)}")


if __name__ == "__main__":
    main()
