# Lift photos

Drop `.jpg` photos in this folder, named after the lift's slug.

The InfoPanel computes the slug by:
1. stripping Romanian diacritics (`ă → a`, `î → i`, `ș → s`, `ț → t`)
2. lowercasing
3. removing dots
4. replacing non-alphanumeric runs with `-`

Expected filenames (one per visible lift on the map):

```
i-teleschiul-1-lupului.jpg
ii-telescaun-2-canal.jpg
iv-telescaun-4.jpg
v-teleschiul-5-mutu.jpg
vi-telescaun-platoul-soarelui.jpg
vii-teleski-platoul-soarelui.jpg
viii-telescaun-vf-straja.jpg
ix-telegondola-straja.jpg
x-baby-ski.jpg
xi-telescaun-constantinescu-1.jpg
xii-telescaun-3-4-locuri-debraiabil.jpg
```

Recommended aspect ratio: 16:9 (e.g. 800×450 px). The panel will scale it.
Missing photos are silently hidden — no broken-image icon.
