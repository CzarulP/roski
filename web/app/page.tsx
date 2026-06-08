import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Move3d, Mountain, MapPin } from "lucide-react";
import { endpoints, type ResortSummary } from "@/lib/api";

async function safeFetch(): Promise<ResortSummary[]> {
  try {
    return await endpoints.resorts();
  } catch {
    return [];
  }
}

export default async function Home() {
  const resorts = await safeFetch();
  const totalSlopes = resorts.reduce((s, r) => s + (r.openSlopes ?? 0), 0);
  const totalLifts = resorts.reduce((s, r) => s + (r.openLifts ?? 0), 0);

  return (
    <div className="flex-1">
      {/* ================= HERO ================= */}
      <section className="relative overflow-hidden border-b border-border/40">
        <Image
          src="/slopes/i-partia-straja.jpg"
          alt=""
          fill
          priority
          aria-hidden
          className="object-cover opacity-[0.35] scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/70 via-background/85 to-background" />
        <div className="absolute inset-0 bg-aurora pointer-events-none" />
        <div className="bg-grain absolute inset-0 opacity-30 pointer-events-none" />

        <div className="relative mx-auto max-w-7xl px-6 py-28 md:py-40">
          <div className="fade-up flex items-center gap-2 text-[11px] uppercase tracking-widest text-accent font-mono mb-6" style={{ animationDelay: "0.05s" }}>
            <Mountain className="w-3.5 h-3.5" />
            Stațiuni de schi · România
          </div>
          <h1
            className="fade-up text-5xl md:text-7xl font-semibold tracking-tight leading-[1.02] max-w-3xl"
            style={{ animationDelay: "0.15s" }}
          >
            Munții României,
            <br />
            <span className="bg-gradient-to-r from-accent to-accent-hot bg-clip-text text-transparent">
              în 3D interactiv.
            </span>
          </h1>
          <p
            className="fade-up mt-8 max-w-xl text-lg text-foreground/75 leading-relaxed"
            style={{ animationDelay: "0.25s" }}
          >
            Vizualizează pârtii, telecabine și condiții actuale pe modele realiste ale munților.
            Începe cu <span className="text-foreground font-medium">Straja</span>.
          </p>

          <div
            className="fade-up mt-10 flex flex-wrap gap-3"
            style={{ animationDelay: "0.35s" }}
          >
            <Link
              href="/resorts/straja/viewer"
              className="inline-flex items-center gap-2 h-12 px-6 rounded-full bg-accent text-accent-foreground font-semibold hover:bg-accent/90 transition shadow-lg shadow-accent/20"
            >
              <Move3d className="w-4 h-4" />
              Deschide vizualizarea 3D
            </Link>
            <Link
              href="/resorts/straja"
              className="inline-flex items-center gap-2 h-12 px-6 rounded-full glass border border-border hover:border-accent/40 transition"
            >
              Detalii Straja <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Stats strip */}
          <div
            className="fade-up mt-16 grid grid-cols-3 max-w-xl gap-8 border-t border-border/60 pt-8"
            style={{ animationDelay: "0.45s" }}
          >
            <StatPill label="Stațiuni" value={`${resorts.length}`} />
            <StatPill label="Pârtii deschise" value={`${totalSlopes}`} />
            <StatPill label="Instalații deschise" value={`${totalLifts}`} />
          </div>
        </div>
      </section>

      {/* ================= RESORT LIST ================= */}
      <section className="mx-auto max-w-7xl px-6 py-20">
        <div className="flex items-end justify-between mb-10">
          <div>
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-mono mb-2">
              <MapPin className="w-3.5 h-3.5 inline mr-1.5" />
              Stațiuni
            </div>
            <h2 className="text-3xl font-semibold tracking-tight">Stațiuni disponibile</h2>
          </div>
          <span className="text-xs text-muted-foreground tabular-nums">
            {resorts.length} {resorts.length === 1 ? "stațiune" : "stațiuni"}
          </span>
        </div>

        {resorts.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card p-8 text-center text-muted-foreground">
            Nu se poate accesa API-ul. Asigură-te că backend-ul rulează pe http://localhost:5080.
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {resorts.map((r, i) => (
              <ResortCard key={r.id} resort={r} delay={i * 0.07} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function StatPill({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-3xl font-semibold tracking-tight tabular-nums text-foreground">
        {value}
      </div>
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-mono mt-1">
        {label}
      </div>
    </div>
  );
}

function ResortCard({ resort, delay }: { resort: ResortSummary; delay: number }) {
  // Pick a hero image for the card. Fall back to a slope photo if the resort doesn't have one.
  const heroSrc =
    resort.previewImageUrl && !resort.previewImageUrl.startsWith("/images/")
      ? resort.previewImageUrl
      : "/slopes/i-partia-straja.jpg";

  return (
    <Link
      href={`/resorts/${resort.slug}`}
      className="fade-up zoom-on-hover group rounded-2xl border border-border bg-card overflow-hidden hover:border-accent/40 transition shadow-md hover:shadow-xl hover:shadow-accent/5"
      style={{ animationDelay: `${delay}s` }}
    >
      <div className="aspect-video relative overflow-hidden">
        <Image
          src={heroSrc}
          alt={resort.name}
          fill
          className="object-cover brightness-[0.85] group-hover:brightness-100 transition"
          sizes="(max-width: 768px) 100vw, 33vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-card via-card/30 to-transparent" />
        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
          <span className="text-[10px] uppercase tracking-widest font-mono text-foreground/80 bg-card/40 backdrop-blur px-2 py-0.5 rounded-full">
            {resort.region}
          </span>
          <span className="text-[10px] font-mono text-accent bg-card/40 backdrop-blur px-2 py-0.5 rounded-full">
            {resort.elevationMin}–{resort.elevationMax} m
          </span>
        </div>
      </div>
      <div className="p-5">
        <h3 className="text-xl font-semibold tracking-tight group-hover:text-accent transition">
          {resort.name}
        </h3>
        <div className="mt-3 flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            <span className="text-foreground font-medium tabular-nums">{resort.openSlopes}</span> pârtii ·{" "}
            <span className="text-foreground font-medium tabular-nums">{resort.openLifts}</span> instalații
          </span>
          <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-accent group-hover:translate-x-1 transition-all" />
        </div>
      </div>
    </Link>
  );
}
