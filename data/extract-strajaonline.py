"""Extract rendered content from strajaonline.ro pages.

The site is Next.js SSR — content is in the initial HTML. We strip scripts/styles
and tags, leaving the prose. The downstream parser identifies prices, items, etc.

Run after fetching the four HTML files into data/source/strajaonline-*.html.
"""

from __future__ import annotations

import json
import re
import subprocess
from pathlib import Path

ROUTES = ["skipass", "cazare", "restaurante", "rentals"]
SOURCE_DIR = Path(__file__).resolve().parent / "source"


def fetch_html_if_missing() -> None:
    for slug in ROUTES:
        path = SOURCE_DIR / f"strajaonline-{slug}.html"
        if path.exists() and path.stat().st_size > 1000:
            continue
        url = f"https://www.strajaonline.ro/{slug}"
        print(f"[fetch] {url}")
        subprocess.run(
            ["curl", "-s", "-A", "Mozilla/5.0 Roski-crawler/0.2", url, "-o", str(path)],
            check=True,
        )


def strip_html(html: str) -> str:
    html = re.sub(r"<script.*?</script>", "", html, flags=re.DOTALL | re.IGNORECASE)
    html = re.sub(r"<style.*?</style>", "", html, flags=re.DOTALL | re.IGNORECASE)
    html = re.sub(r"<noscript.*?</noscript>", "", html, flags=re.DOTALL | re.IGNORECASE)
    # Convert block-ish closing tags into newlines for better segmentation
    html = re.sub(r"</(?:p|div|section|article|li|tr|td|h[1-6]|header|footer|nav)>", "\n", html, flags=re.IGNORECASE)
    text = re.sub(r"<[^>]+>", " ", html)
    text = re.sub(r"&nbsp;", " ", text)
    text = re.sub(r"&amp;", "&", text)
    text = re.sub(r"&#39;|&apos;", "'", text)
    text = re.sub(r"&quot;", '"', text)
    text = re.sub(r"&lt;", "<", text)
    text = re.sub(r"&gt;", ">", text)
    text = re.sub(r"&hellip;", "…", text)
    # Collapse whitespace within lines, then normalize line breaks
    lines = [re.sub(r"[ \t]+", " ", line).strip() for line in text.splitlines()]
    return "\n".join(line for line in lines if line)


def main() -> int:
    fetch_html_if_missing()
    out = {}
    for slug in ROUTES:
        path = SOURCE_DIR / f"strajaonline-{slug}.html"
        html = path.read_text(encoding="utf-8")
        out[slug] = strip_html(html)
    target = SOURCE_DIR / "strajaonline-text.json"
    target.write_text(json.dumps(out, ensure_ascii=False, indent=2), encoding="utf-8")
    for slug, text in out.items():
        print(f"  {slug}: {len(text.splitlines())} lines, {len(text)} chars")
    print(f"[extract] wrote {target}")
    return 0


if __name__ == "__main__":
    main()
