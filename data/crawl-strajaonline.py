"""Crawler for strajaonline.ro — pulls structured data for the Roski API.

The site is Next.js SSR, so the rendered HTML already contains the prose. We
just need to strip tags and pattern-match the fields we care about.

Outputs data/source/strajaonline.json — consumed by the .NET seeder.

Run periodically (manually, or via a cron job). Politely paced:
~0.4 s between requests, no parallelism.

Sections covered:
  * skipass    — pricing breakdown per pass type + point consumption
  * cazare     — 45 accommodation pages (name, address, description, features)
  * rentals    — list of rental shops

Not covered (rendered client-side, no public JSON endpoint):
  * restaurante  — page shows only "Loading..."; would need a headless browser
  * cazare quotes — interactive search form

Polite to the source: cache HTML locally so re-runs don't re-fetch.
"""

from __future__ import annotations

import json
import re
import sys
import time
from pathlib import Path
from typing import Optional

import requests


BASE = "https://www.strajaonline.ro"
UA = "Mozilla/5.0 Roski-crawler/0.3 (+https://github.com/CzarulP/roski)"
SOURCE_DIR = Path(__file__).resolve().parent / "source"
CACHE_DIR = SOURCE_DIR / "strajaonline-cache"
DELAY_S = 0.4  # politeness


def get(url: str, cache_key: Optional[str] = None) -> str:
    """GET with HTML caching to disk."""
    if cache_key is None:
        cache_key = re.sub(r"[^a-z0-9-]+", "_", url.lower())
    CACHE_DIR.mkdir(parents=True, exist_ok=True)
    cache_path = CACHE_DIR / f"{cache_key}.html"
    if cache_path.exists():
        return cache_path.read_text(encoding="utf-8")
    print(f"[get] {url}", file=sys.stderr)
    r = requests.get(url, headers={"User-Agent": UA}, timeout=30)
    r.raise_for_status()
    cache_path.write_text(r.text, encoding="utf-8")
    time.sleep(DELAY_S)
    return r.text


def strip_html(html: str) -> list[str]:
    html = re.sub(r"<script.*?</script>", "", html, flags=re.DOTALL | re.IGNORECASE)
    html = re.sub(r"<style.*?</style>", "", html, flags=re.DOTALL | re.IGNORECASE)
    html = re.sub(r"<noscript.*?</noscript>", "", html, flags=re.DOTALL | re.IGNORECASE)
    html = re.sub(r"</(?:p|div|section|article|li|tr|td|h[1-6])>", "\n", html, flags=re.IGNORECASE)
    text = re.sub(r"<[^>]+>", " ", html)
    text = (text
            .replace("&nbsp;", " ")
            .replace("&amp;", "&")
            .replace("&#39;", "'")
            .replace("&apos;", "'")
            .replace("&quot;", '"')
            .replace("&lt;", "<")
            .replace("&gt;", ">"))
    return [re.sub(r"[ \t]+", " ", line).strip()
            for line in text.splitlines()
            if line.strip()]


# ===========================================================================
# SKIPASS
# ===========================================================================

PRICE_LINE_RE = re.compile(r"^(.+?)\s+(\d+)\s+lei$")


def parse_skipass() -> dict:
    """Parse the skipass page. Returns structured pricing data."""
    html = get(f"{BASE}/skipass", "skipass")
    lines = strip_html(html)

    passes = []

    # Table cells render on separate lines: label, then price. Walk with index
    # so we can peek back at the previous line when we see a bare "N lei".
    price_only = re.compile(r"^(\d+)\s*lei$")
    inline_price = re.compile(r"^(.+?)\s*:\s*(\d+)\s*lei$")  # "Preț Skipass 4 ore: 120 lei"

    current_pass: Optional[dict] = None
    for i, line in enumerate(lines):
        # ---- section detection ----
        if line == "Skipass valabil pe zile:":
            current_pass = {"type": "daily", "name": "Skipass pe zile", "valid": "09:00–17:00",
                            "scope": "Toate pârtiile", "prices": []}
            passes.append(current_pass)
            continue
        if line.startswith("Skipass valabil 4 ore") and line.endswith(":"):
            current_pass = {"type": "4hour", "name": "Skipass 4 ore",
                            "valid": "include nocturna 17:00–22:00",
                            "scope": "Toate pârtiile", "prices": []}
            passes.append(current_pass)
            continue
        if line == "Skipass pe puncte Complex Montana:":
            current_pass = {"type": "points_montana", "name": "Skipass pe puncte – Complex Montana",
                            "valid": "zi sau nocturnă",
                            "scope": "Doar instalațiile Complex Montana / Telegondolă",
                            "prices": [], "consumption": {}}
            passes.append(current_pass)
            continue
        if line == "Skipass pe puncte Platoul Soarelui:":
            current_pass = {"type": "points_platoul", "name": "Skipass pe puncte – Platoul Soarelui",
                            "valid": "zi sau nocturnă",
                            "scope": "Doar instalațiile Platoul Soarelui",
                            "prices": [], "consumption": {}}
            passes.append(current_pass)
            continue

        if not current_pass:
            continue

        # ---- bare "N lei" with label on previous line ----
        m = price_only.match(line)
        if m and i > 0:
            label = lines[i - 1].strip()
            price = int(m.group(1))
            if (label
                    and not any(skip in label for skip in ("Preț", "Pret", "Valabilitate", "Puncte ", "Acest"))
                    and len(label) < 50):
                current_pass["prices"].append({"label": label, "amount": price, "currency": "lei"})
            continue

        # ---- inline "Label: N lei" ----
        m = inline_price.match(line)
        if m:
            label, price = m.group(1).strip(), int(m.group(2))
            # Trim "Preț Skipass" prefix — leaves a cleaner label like "4 ore".
            label = re.sub(r"^Pre[țt]?\s+Skipass\s+", "", label, flags=re.IGNORECASE)
            if label and "Acest" not in label and len(label) < 60:
                current_pass["prices"].append({"label": label, "amount": price, "currency": "lei"})
            continue

        # ---- consumption ("Telegondolă: 5 puncte") ----
        cm = re.match(r"^(Telegondol[ăa]|Telescaun|Teleschi):\s*(\d+)\s*puncte", line)
        if cm and current_pass.get("type", "").startswith("points_"):
            current_pass["consumption"][cm.group(1)] = int(cm.group(2))

    return {
        "passes": passes,
        "deposit_lei": 10,
        "source_url": f"{BASE}/skipass",
        "notes": [
            "Cartelele pe zile nu au nocturnă inclusă. Punctele sunt valabile pe nocturnă.",
            "Cartela pentru nocturnă se achiziționează separat.",
            "SkiPass-ul este individual și netransmisibil.",
            "La prețul unui SkiPass se adaugă o garanție de 10 lei pentru cartelă.",
        ],
    }


# ===========================================================================
# CAZARE
# ===========================================================================

KNOWN_FEATURES = {
    "WiFi", "Smart TV", "Pet Friendly", "Baie Privata", "Optiuni pentru masa",
    "Parcare", "Sauna", "Hot Tub", "Loc de joaca", "Aer Conditionat",
    "Restaurant", "Mic dejun", "Foisor", "Gratar",
}


def parse_cazare_index() -> list[str]:
    """Pull individual cazare URLs from the sitemap."""
    xml = get(f"{BASE}/sitemap-0.xml", "sitemap-0")
    locs = re.findall(r"<loc>([^<]+)</loc>", xml)
    return [u for u in locs if u.startswith(f"{BASE}/cazare/")]


def parse_cazare_detail(url: str) -> Optional[dict]:
    slug = url.rsplit("/", 1)[-1]
    html = get(url, f"cazare-{slug}")
    lines = strip_html(html)

    if not lines:
        return None

    # The first non-trivial line after the nav is the property name (also matches the H1).
    name = None
    for line in lines:
        if line in {"StrajaOnline", "open navigation menu"} or "navigation menu" in line:
            continue
        if len(line) > 80:
            continue
        name = line
        break
    if not name:
        return None

    # Description: first long paragraph after the name.
    description_parts: list[str] = []
    for line in lines:
        if len(line) > 60 and line != name and "©" not in line and "navigation" not in line:
            description_parts.append(line)
        if len(description_parts) >= 3:
            break
    description = " ".join(description_parts)[:600]

    # Features: lines that exactly match one of the known feature names.
    features = [f for f in KNOWN_FEATURES if any(line == f for line in lines)]

    # Address: line beginning with "Romania" (their property location format).
    address = next((line for line in lines if line.startswith("Romania")), None)

    # Stars from the description if mentioned.
    stars_match = re.search(r"confort de (\d) stele", " ".join(lines))
    stars = int(stars_match.group(1)) if stars_match else None

    return {
        "slug": slug,
        "name": name,
        "url": url,
        "address": address,
        "description": description,
        "features": sorted(features),
        "stars": stars,
    }


# ===========================================================================
# RENTALS
# ===========================================================================

def parse_rentals() -> list[dict]:
    html = get(f"{BASE}/rentals", "rentals")
    lines = strip_html(html)
    rentals = []
    seen = set()
    for line in lines:
        # The page lists shop names followed by "Detalii..." links.
        # We pick lines that look like shop names (not nav, not generic).
        if line in {"StrajaOnline", "open navigation menu", "Inchirieri Straja",
                     "Rezerva-ti echipamentul pentru o zi perfecta!", "Detalii...",
                     "Acasa", "Blog", "Despre Noi", "Contact", "Pagina de Facebook"}:
            continue
        if "©" in line or "navigation" in line:
            continue
        if len(line) < 6 or len(line) > 80:
            continue
        # Heuristic: includes "ski", "rental", "extreme", "inchirieri", or "centrul"
        if not re.search(r"(?i)(rental|ski|inchirieri|extreme|centrul|teacher)", line):
            continue
        if line in seen:
            continue
        seen.add(line)
        rentals.append({"name": line})
    return rentals


# ===========================================================================
# MAIN
# ===========================================================================

def main() -> int:
    print("[crawl] skipass…", file=sys.stderr)
    skipass = parse_skipass()
    print(f"[crawl] skipass: {len(skipass['passes'])} pass types", file=sys.stderr)

    print("[crawl] cazare index…", file=sys.stderr)
    urls = parse_cazare_index()
    print(f"[crawl] {len(urls)} accommodations to fetch", file=sys.stderr)

    accommodations = []
    for i, url in enumerate(urls, 1):
        try:
            detail = parse_cazare_detail(url)
            if detail:
                accommodations.append(detail)
            if i % 10 == 0:
                print(f"  ... {i}/{len(urls)}", file=sys.stderr)
        except Exception as e:
            print(f"  !! {url}: {e}", file=sys.stderr)
    print(f"[crawl] cazare: {len(accommodations)} parsed", file=sys.stderr)

    print("[crawl] rentals…", file=sys.stderr)
    rentals = parse_rentals()
    print(f"[crawl] rentals: {len(rentals)} shops", file=sys.stderr)

    result = {
        "source": BASE,
        "resort_slug": "straja",
        "skipass": skipass,
        "accommodations": accommodations,
        "rentals": rentals,
    }
    out = SOURCE_DIR / "strajaonline.json"
    out.write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"[crawl] wrote {out}", file=sys.stderr)
    return 0


if __name__ == "__main__":
    sys.exit(main())
