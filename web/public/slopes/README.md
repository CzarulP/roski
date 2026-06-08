# Slope photos

Drop `.jpg` photos in this folder, named after the slope's slug.

The InfoPanel computes the slug by:
1. stripping Romanian diacritics (`ă → a`, `î → i`, `ș → s`, `ț → t`)
2. lowercasing
3. removing dots
4. replacing non-alphanumeric runs with `-`

Expected filenames (one per visible slope on the map):

```
i-partia-straja.jpg
1-partia-lupului.jpg
1a-partia-lupului-ii.jpg
2-partia-canal.jpg
2a-partia-canal-ii.jpg
3a-partia-constantinescu.jpg
3b-partia-constantinescu.jpg
4-partia-sf-gheorghe.jpg
5a-partia-mutu.jpg
5b-partia-mutu.jpg
5c-partia-mutu.jpg
6-partia-platoul-soarelui.jpg
7-partia-telegondola.jpg
8-partia-vf-straja.jpg
9-partia-baloo.jpg
snowpark.jpg
```

Recommended aspect ratio: 16:9 (e.g. 800×450 px). The panel will scale it.
Missing photos are silently hidden — no broken-image icon.
