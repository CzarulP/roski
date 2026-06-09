import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Move3d, Mountain, MapPin, Sparkles, Compass, Snowflake } from "lucide-react";
import { endpoints, type ResortSummary } from "@/lib/api";

async function safeFetch(): Promise<ResortSummary[]> {
  try {
    return await endpoints.resorts();
  } catch {
    return [];
  }
}

const HERO_PHOTO = "/slopes/i-partia-straja.jpg";
const FEATURE_PHOTOS = [
  "/slopes/8-partia-vf-straja.jpg",
  "/slopes/6-partia-platoul-soarelui.jpg",
  "/slopes/2-partia-canal.jpg",
];

export default async function Home() {
  const resorts = await safeFetch();
  const totalSlopes = resorts.reduce((s, r) => s + (r.openSlopes ?? 0), 0);
  const totalLifts = resorts.reduce((s, r) => s + (r.openLifts ?? 0), 0);

  return (
    <div className="flex-1">
      {/* ============== HERO ============== */}
      <section className="relative overflow-hidden">
        <div className="bg-aurora absolute inset-0 pointer-events-none" />
        <div className="bg-grain absolute inset-0 opacity-50 pointer-events-none" />

        <div className="relative mx-auto max-w-7xl px-6 pt-16 md:pt-24 pb-24">
          <div className="grid lg:grid-cols-12 gap-10 lg:gap-16 items-center">
            <div className="lg:col-span-7">
              <div className="fade-up inline-flex items-center gap-2 h-7 px-3 rounded-full bg-accent/10 border border-accent/20 text-accent text-[11px] font-medium" style={{ animationDelay: "0.05s" }}>
                <Sparkles className="w-3 h-3" />
                Sezon 2025–2026
              </div>
              <h1
                className="fade-up mt-6 text-5xl md:text-7xl font-semibold tracking-tight leading-[1.02]"
                style={{ animationDelay: "0.12s" }}
              >
                Toți munții cu pârtii din România,
                <br />
                <span className="bg-gradient-to-r from-accent via-accent to-accent-hot bg-clip-text text-transparent">
                  într-un singur loc.
                </span>
              </h1>
              <p
                className="fade-up mt-8 max-w-xl text-lg text-muted-foreground leading-relaxed"
                style={{ animationDelay: "0.2s" }}
              >
                Modele 3D reale, pârtii și telecabine clickabile, preț de skipass și cazare —
                tot ce ai nevoie ca să-ți planifici următoarea zi pe schi.
              </p>

              <div
                className="fade-up mt-10 flex flex-wrap gap-3"
                style={{ animationDelay: "0.28s" }}
              >
                <Link
                  href="/resorts/straja/viewer"
                  className="inline-flex items-center gap-2 h-12 px-7 rounded-full bg-gradient-to-r from-accent to-accent/90 text-white font-semibold hover:shadow-lg hover:shadow-accent/30 transition"
                >
                  <Move3d className="w-4 h-4" />
                  Deschide harta 3D
                </Link>
                <Link
                  href="/resorts/straja"
                  className="inline-flex items-center gap-2 h-12 px-7 rounded-full bg-card text-foreground border border-border hover:border-accent/40 hover:shadow-md transition"
                >
                  Vezi Straja <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            {/* Hero photo — self-contained, no external decorations
                (they were overlapping the labels on narrower screens). */}
            <div className="lg:col-span-5">
              <div className="fade-up relative aspect-[4/5] rounded-3xl overflow-hidden shadow-xl ring-1 ring-border" style={{ animationDelay: "0.18s" }}>
                <Image
                  src={HERO_PHOTO}
                  alt="Pârtia Straja"
                  fill
                  priority
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 40vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-foreground/55 via-foreground/10 to-transparent" />
                {/* In-photo "season" chip, safe inside the rounded corners */}
                <div className="absolute top-4 right-4 inline-flex items-center gap-2 h-8 pl-2 pr-3 rounded-full bg-white/15 backdrop-blur-md border border-white/25 text-white text-xs">
                  <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center">
                    <Snowflake className="w-3 h-3" />
                  </div>
                  <span className="font-medium">Sezon închis</span>
                </div>
                <div className="absolute bottom-5 left-5 right-5 text-white">
                  <div className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-widest opacity-90 font-mono">
                    <MapPin className="w-3 h-3" />
                    Munții Vâlcan · Hunedoara
                  </div>
                  <div className="mt-1 text-2xl font-semibold tracking-tight">Pârtia Straja</div>
                  <div className="text-xs opacity-90 mt-0.5">8,1 km · 1100–1870 m altitudine</div>
                </div>
              </div>
            </div>
          </div>

          {/* Stats strip */}
          <div
            className="fade-up mt-20 grid grid-cols-3 max-w-2xl gap-8 border-t border-border pt-8"
            style={{ animationDelay: "0.4s" }}
          >
            <StatPill label="Stațiuni" value={`${resorts.length}`} />
            <StatPill label="Pârtii deschise" value={`${totalSlopes || "—"}`} />
            <StatPill label="Instalații deschise" value={`${totalLifts || "—"}`} />
          </div>
        </div>
      </section>

      {/* ============== FEATURE STRIP ============== */}
      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid md:grid-cols-3 gap-5">
          <Feature
            icon={<Mountain className="w-5 h-5" />}
            title="Munți reali, modelați în 3D"
            text="Datele de elevație SRTM și imaginile satelitare ESRI, asamblate la dimensiunea reală a muntelui."
          />
          <Feature
            icon={<Compass className="w-5 h-5" />}
            title="Pârtii și telecabine clickabile"
            text="Apasă pe orice pârtie sau instalație ca să vezi dificultatea, altitudinea și consumul de puncte."
          />
          <Feature
            icon={<Snowflake className="w-5 h-5" />}
            title="Vremea și prețurile actuale"
            text="Date live de la Open-Meteo, prețurile skipass-urilor și cazările culese de pe strajaonline.ro."
          />
        </div>
      </section>

      {/* ============== RESORT LIST ============== */}
      <section className="mx-auto max-w-7xl px-6 py-12">
        <div className="flex items-end justify-between mb-10">
          <div>
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-mono mb-2">
              <MapPin className="w-3.5 h-3.5 inline mr-1.5" />
              Stațiuni
            </div>
            <h2 className="text-3xl md:text-4xl font-semibold tracking-tight">Unde mergi astăzi?</h2>
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
      <div className="text-3xl md:text-4xl font-semibold tracking-tight tabular-nums text-foreground">
        {value}
      </div>
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-mono mt-1">
        {label}
      </div>
    </div>
  );
}

function Feature({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <div className="group rounded-2xl bg-card border border-border p-6 hover:shadow-lg hover:border-accent/30 transition-all">
      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent/15 to-accent-hot/10 flex items-center justify-center text-accent group-hover:scale-105 transition-transform">
        {icon}
      </div>
      <h3 className="mt-4 text-base font-semibold tracking-tight">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{text}</p>
    </div>
  );
}

function ResortCard({ resort, delay }: { resort: ResortSummary; delay: number }) {
  const heroSrc =
    resort.previewImageUrl && !resort.previewImageUrl.startsWith("/images/")
      ? resort.previewImageUrl
      : "/slopes/i-partia-straja.jpg";

  return (
    <Link
      href={`/resorts/${resort.slug}`}
      className="fade-up zoom-on-hover group rounded-2xl bg-card border border-border overflow-hidden hover:border-accent/40 transition shadow-sm hover:shadow-xl hover:shadow-accent/5"
      style={{ animationDelay: `${delay}s` }}
    >
      <div className="aspect-[4/3] relative overflow-hidden">
        <Image
          src={heroSrc}
          alt={resort.name}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 33vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/35 to-transparent" />
        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
          <span className="text-[10px] uppercase tracking-widest font-mono text-white bg-foreground/40 backdrop-blur px-2.5 py-1 rounded-full">
            {resort.region}
          </span>
          <span className="text-[10px] font-mono text-white bg-foreground/40 backdrop-blur px-2.5 py-1 rounded-full">
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
            <span className="text-foreground font-semibold tabular-nums">{resort.openSlopes}</span> pârtii ·{" "}
            <span className="text-foreground font-semibold tabular-nums">{resort.openLifts}</span> instalații
          </span>
          <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-accent group-hover:translate-x-1 transition-all" />
        </div>
      </div>
    </Link>
  );
}
