import { Ticket, Clock, MapPin, Info } from "lucide-react";
import type { Skipass } from "@/lib/api";

const TYPE_COLOR: Record<string, string> = {
  daily: "from-sky-400/20 to-sky-700/15 ring-sky-400/30",
  "4hour": "from-amber-400/20 to-amber-700/15 ring-amber-400/30",
  points_montana: "from-violet-400/20 to-violet-700/15 ring-violet-400/30",
  points_platoul: "from-emerald-400/20 to-emerald-700/15 ring-emerald-400/30",
};

export default function SkipassSection({ skipass }: { skipass: { passes: Skipass[]; deposit_lei: number; source_url: string; notes: string[] } }) {
  if (!skipass.passes.length) return null;

  return (
    <section className="mx-auto max-w-7xl px-6 py-12">
      <div className="flex items-end justify-between mb-6">
        <div>
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-mono mb-1.5">
            <Ticket className="w-3.5 h-3.5 inline mr-1.5" />
            Skipass & prețuri
          </div>
          <h2 className="text-2xl font-semibold tracking-tight">Tarife & abonamente</h2>
        </div>
        <a
          href={skipass.source_url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-muted-foreground hover:text-accent transition"
        >
          Sursa: strajaonline.ro →
        </a>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {skipass.passes.map((pass) => (
          <PassCard key={pass.type} pass={pass} />
        ))}
      </div>

      {skipass.notes && skipass.notes.length > 0 && (
        <div className="mt-6 rounded-xl border border-border bg-card/50 p-4 flex gap-3">
          <Info className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
          <ul className="text-xs text-muted-foreground space-y-1.5">
            {skipass.notes.map((note, i) => (
              <li key={i}>{note}</li>
            ))}
            <li>Garanție cartelă: {skipass.deposit_lei} lei.</li>
          </ul>
        </div>
      )}
    </section>
  );
}

function PassCard({ pass }: { pass: Skipass }) {
  const ringClass = TYPE_COLOR[pass.type] ?? "from-slate-400/20 to-slate-700/15 ring-slate-400/30";

  return (
    <div className={`relative rounded-2xl border border-border overflow-hidden p-5 ring-1 bg-gradient-to-br ${ringClass}`}>
      <div className="absolute inset-0 bg-card/65 backdrop-blur-[2px]" />
      <div className="relative">
        <h3 className="text-lg font-semibold tracking-tight">{pass.name}</h3>
        <div className="mt-2 flex flex-wrap gap-3 text-[11px] text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {pass.valid}
          </span>
          <span className="inline-flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            {pass.scope}
          </span>
        </div>

        <ul className="mt-5 space-y-1.5 text-sm">
          {pass.prices.map((p, i) => (
            <li
              key={i}
              className="flex items-baseline justify-between py-1 border-b border-border/40 last:border-b-0"
            >
              <span className="text-foreground/85">{p.label}</span>
              <span className="font-semibold tabular-nums">
                {p.amount} <span className="text-xs font-normal text-muted-foreground">{p.currency}</span>
              </span>
            </li>
          ))}
        </ul>

        {pass.consumption && Object.keys(pass.consumption).length > 0 && (
          <div className="mt-4 pt-3 border-t border-border/40">
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-mono mb-2">
              Consum per urcare
            </div>
            <div className="flex flex-wrap gap-1.5">
              {Object.entries(pass.consumption).map(([k, v]) => (
                <span
                  key={k}
                  className="inline-flex items-center gap-1 text-[11px] bg-card/80 border border-border/60 px-2 py-0.5 rounded-full"
                >
                  {k}: <span className="font-medium tabular-nums">{v}p</span>
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
