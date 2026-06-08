import { Bed, MapPin, Star, ExternalLink, Wifi, Dog, Tv, Bath, Utensils, Trees } from "lucide-react";
import type { Accommodation } from "@/lib/api";

const FEATURE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  WiFi: Wifi,
  "Pet Friendly": Dog,
  "Smart TV": Tv,
  "Baie Privata": Bath,
  "Optiuni pentru masa": Utensils,
  Foisor: Trees,
};

export default function AccommodationsSection({ items }: { items: Accommodation[] }) {
  if (!items.length) return null;

  const displayed = items.slice(0, 12);
  const remaining = items.length - displayed.length;

  return (
    <section className="mx-auto max-w-7xl px-6 py-12">
      <div className="flex items-end justify-between mb-6">
        <div>
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-mono mb-1.5">
            <Bed className="w-3.5 h-3.5 inline mr-1.5" />
            Cazare
          </div>
          <h2 className="text-2xl font-semibold tracking-tight">
            Locuri de cazare
            <span className="ml-3 text-sm font-normal text-muted-foreground tabular-nums">
              ({items.length})
            </span>
          </h2>
        </div>
        <a
          href="https://www.strajaonline.ro/cazare"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-muted-foreground hover:text-accent transition"
        >
          Toate pe strajaonline.ro →
        </a>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {displayed.map((a, i) => (
          <Card key={a.slug} a={a} delay={i * 0.04} />
        ))}
      </div>

      {remaining > 0 && (
        <a
          href="https://www.strajaonline.ro/cazare"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-6 block text-center text-sm text-accent hover:underline"
        >
          + încă {remaining} locuri de cazare pe strajaonline.ro
        </a>
      )}
    </section>
  );
}

function Card({ a, delay }: { a: Accommodation; delay: number }) {
  return (
    <a
      href={a.url}
      target="_blank"
      rel="noopener noreferrer"
      className="fade-up group rounded-2xl border border-border bg-card overflow-hidden hover:border-accent/40 transition flex flex-col"
      style={{ animationDelay: `${delay}s` }}
    >
      <div className="p-5 flex-1 flex flex-col">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-base font-semibold tracking-tight group-hover:text-accent transition">
            {a.name}
          </h3>
          {a.stars && (
            <div className="flex items-center gap-0.5 text-amber-400 text-xs tabular-nums">
              {Array.from({ length: a.stars }).map((_, i) => (
                <Star key={i} className="w-3 h-3 fill-current" />
              ))}
            </div>
          )}
        </div>
        {a.address && (
          <div className="mt-2 text-[11px] text-muted-foreground flex items-start gap-1.5">
            <MapPin className="w-3 h-3 flex-shrink-0 mt-0.5" />
            <span className="line-clamp-1">{a.address.replace(/^Romania,\s*/, "")}</span>
          </div>
        )}
        {a.description && (
          <p className="mt-3 text-xs text-muted-foreground/90 line-clamp-3 leading-relaxed">
            {a.description}
          </p>
        )}
        {a.features.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-1.5">
            {a.features.slice(0, 5).map((f) => {
              const Icon = FEATURE_ICONS[f];
              return (
                <span
                  key={f}
                  className="inline-flex items-center gap-1 text-[10px] bg-muted/40 border border-border/60 px-2 py-0.5 rounded-full text-muted-foreground"
                  title={f}
                >
                  {Icon && <Icon className="w-2.5 h-2.5" />}
                  {f}
                </span>
              );
            })}
          </div>
        )}
        <div className="mt-auto pt-4 inline-flex items-center gap-1 text-xs text-muted-foreground group-hover:text-accent transition">
          Detalii pe strajaonline.ro <ExternalLink className="w-3 h-3" />
        </div>
      </div>
    </a>
  );
}
