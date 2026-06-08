"use client";

import { useViewerStore, type FilterKey } from "@/lib/viewer-store";
import { cn } from "@/lib/utils";

type Item = {
  key: FilterKey;
  label: string;
  color: string;
};

const ITEMS: Item[] = [
  { key: "easy",   label: "Începători",       color: "#16a34a" },
  { key: "medium", label: "Ușoară",           color: "#2563eb" },
  { key: "hard",   label: "Medie",            color: "#dc2626" },
  { key: "expert", label: "Dificilă",         color: "#0a0a0a" },
  { key: "lifts",  label: "Instalație cablu", color: "#f59e0b" },
];

/**
 * Color key + filter toggles. Click a row to show/hide that category on the map.
 */
export default function Legend() {
  const filters = useViewerStore((s) => s.filters);
  const setFilter = useViewerStore((s) => s.setFilter);

  return (
    <div className="absolute bottom-4 left-4 z-20 pointer-events-auto bg-card/85 backdrop-blur border border-border rounded-lg px-3 py-2.5 shadow-lg">
      <div className="text-[9px] uppercase tracking-widest text-muted-foreground font-mono mb-1.5">
        Filtre
      </div>
      <div className="flex flex-col gap-0.5">
        {ITEMS.map((it) => {
          const on = filters[it.key];
          return (
            <button
              key={it.key}
              type="button"
              onClick={() => setFilter(it.key, !on)}
              className={cn(
                "flex items-center gap-2 text-[11px] rounded px-1.5 py-0.5 transition-all",
                on
                  ? "text-foreground hover:bg-muted/40"
                  : "text-muted-foreground/60 hover:bg-muted/20 line-through decoration-1"
              )}
            >
              <span
                className={cn(
                  "w-2.5 h-2.5 rounded-full ring-1 ring-white/20 transition-opacity",
                  !on && "opacity-30"
                )}
                style={{ background: it.color }}
              />
              <span>{it.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
