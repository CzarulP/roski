import { Store, ExternalLink } from "lucide-react";
import type { RentalShop } from "@/lib/api";

export default function RentalsSection({ items }: { items: RentalShop[] }) {
  if (!items.length) return null;
  return (
    <section className="mx-auto max-w-7xl px-6 py-12">
      <div className="flex items-end justify-between mb-6">
        <div>
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-mono mb-1.5">
            <Store className="w-3.5 h-3.5 inline mr-1.5" />
            Închirieri
          </div>
          <h2 className="text-2xl font-semibold tracking-tight">
            Închirieri echipament
            <span className="ml-3 text-sm font-normal text-muted-foreground tabular-nums">
              ({items.length})
            </span>
          </h2>
        </div>
        <a
          href="https://www.strajaonline.ro/rentals"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-muted-foreground hover:text-accent transition"
        >
          Sursa: strajaonline.ro →
        </a>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((r, i) => (
          <div
            key={i}
            className="fade-up rounded-xl border border-border bg-card p-4 flex items-center gap-3"
            style={{ animationDelay: `${i * 0.04}s` }}
          >
            <div className="w-9 h-9 rounded-full bg-accent/10 ring-1 ring-accent/30 flex items-center justify-center flex-shrink-0">
              <Store className="w-4 h-4 text-accent" />
            </div>
            <div className="text-sm font-medium leading-snug">{r.name}</div>
          </div>
        ))}
      </div>

      <a
        href="https://www.strajaonline.ro/rentals"
        target="_blank"
        rel="noopener noreferrer"
        className="mt-4 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-accent transition"
      >
        Detalii și rezervări pe strajaonline.ro <ExternalLink className="w-3 h-3" />
      </a>
    </section>
  );
}
