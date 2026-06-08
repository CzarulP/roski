"use client";

const ITEMS = [
  { color: "#16a34a", label: "Începători" },
  { color: "#2563eb", label: "Ușoară" },
  { color: "#dc2626", label: "Medie" },
  { color: "#0a0a0a", label: "Dificilă" },
  { color: "#f59e0b", label: "Instalație cablu" },
];

/**
 * Color key for the slope difficulty + lift colors. Bottom-left of the viewer.
 */
export default function Legend() {
  return (
    <div className="absolute bottom-4 left-4 z-20 pointer-events-auto bg-card/85 backdrop-blur border border-border rounded-lg px-3 py-2.5 shadow-lg">
      <div className="text-[9px] uppercase tracking-widest text-muted-foreground font-mono mb-1.5">
        Legendă
      </div>
      <div className="flex flex-col gap-1">
        {ITEMS.map((it) => (
          <div key={it.label} className="flex items-center gap-2 text-[11px]">
            <span
              className="w-2.5 h-2.5 rounded-full ring-1 ring-white/20"
              style={{ background: it.color }}
            />
            <span className="text-foreground">{it.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
