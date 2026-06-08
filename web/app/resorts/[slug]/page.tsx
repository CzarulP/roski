import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink, MapPin, Mountain, Move3d, Snowflake, TramFront, Compass, Camera } from "lucide-react";
import { endpoints, type ExternalData } from "@/lib/api";
import WeatherCard from "@/components/WeatherCard";
import SkipassSection from "@/components/SkipassSection";
import AccommodationsSection from "@/components/AccommodationsSection";
import RentalsSection from "@/components/RentalsSection";

const SLOPE_PHOTO_FILES = [
  "i-partia-straja.jpg",
  "8-partia-vf-straja.jpg",
  "2-partia-canal.jpg",
  "1-partia-lupului.jpg",
  "3a-partia-constantinescu.jpg",
  "6-partia-platoul-soarelui.jpg",
  "9-partia-baloo.jpg",
  "4-partia-sf-gheorghe.jpg",
];

export default async function ResortPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  let resort, weather;
  let external: ExternalData | null = null;
  try {
    resort = await endpoints.resort(slug);
  } catch {
    notFound();
  }
  try {
    weather = await endpoints.weather(slug);
  } catch {
    weather = null;
  }
  try {
    external = await endpoints.external(slug);
  } catch {
    external = null;
  }

  const heroPhoto = `/slopes/${SLOPE_PHOTO_FILES[0]}`;
  const verticalDrop = (resort.elevationMax ?? 0) - (resort.elevationMin ?? 0);

  return (
    <div className="flex-1">
      {/* ================= HERO ================= */}
      <section className="relative h-[60vh] min-h-[480px] max-h-[640px] overflow-hidden">
        <Image
          src={heroPhoto}
          alt={resort.name}
          fill
          priority
          className="object-cover scale-105 brightness-[0.55]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-background/10" />
        <div className="absolute inset-0 bg-aurora pointer-events-none opacity-60" />

        <div className="relative h-full mx-auto max-w-7xl px-6 flex flex-col justify-end pb-32">
          <div className="fade-up" style={{ animationDelay: "0.05s" }}>
            <div className="flex items-center gap-2 text-[11px] uppercase tracking-widest text-accent font-mono mb-3">
              <MapPin className="w-3.5 h-3.5" />
              {resort.region}, România
            </div>
          </div>
          <h1
            className="fade-up text-5xl md:text-7xl font-semibold tracking-tight leading-[1.05] mb-4 drop-shadow-2xl"
            style={{ animationDelay: "0.15s" }}
          >
            {resort.name}
          </h1>
          <p
            className="fade-up max-w-2xl text-base md:text-lg text-foreground/80 leading-relaxed"
            style={{ animationDelay: "0.25s" }}
          >
            {resort.description}
          </p>

          <div className="fade-up mt-8 flex flex-wrap gap-3" style={{ animationDelay: "0.35s" }}>
            <Link
              href={`/resorts/${resort.slug}/viewer`}
              className="inline-flex items-center gap-2 h-12 px-6 rounded-full bg-accent text-accent-foreground font-semibold hover:bg-accent/90 transition shadow-lg shadow-accent/20"
            >
              <Move3d className="w-4 h-4" />
              Vizualizare 3D
            </Link>
            {resort.websiteUrl && (
              <a
                href={resort.websiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 h-12 px-6 rounded-full glass border border-border hover:border-accent/40 transition"
              >
                Site oficial <ExternalLink className="w-4 h-4" />
              </a>
            )}
          </div>
        </div>
      </section>

      {/* ================= QUICK STATS + WEATHER ================= */}
      <section className="mx-auto max-w-7xl px-6 -mt-20 relative z-10">
        <div className="grid gap-6 lg:grid-cols-3 fade-up" style={{ animationDelay: "0.45s" }}>
          {/* Quick stats card */}
          <div className="lg:col-span-2 glass border border-border rounded-2xl p-6 grid grid-cols-2 md:grid-cols-4 gap-4">
            <Stat
              icon={<Mountain className="w-4 h-4" />}
              label="Altitudine"
              value={`${resort.elevationMin}–${resort.elevationMax}`}
              unit="m"
            />
            <Stat
              icon={<Compass className="w-4 h-4" />}
              label="Diferență"
              value={`${verticalDrop}`}
              unit="m"
            />
            <Stat
              icon={<Snowflake className="w-4 h-4" />}
              label="Pârtii"
              value={`${resort.totalSlopes}`}
              accent="text-foreground"
              sub={`${resort.openSlopes} deschise`}
            />
            <Stat
              icon={<TramFront className="w-4 h-4" />}
              label="Instalații"
              value={`${resort.totalLifts}`}
              accent="text-foreground"
              sub={`${resort.openLifts} deschise`}
            />
          </div>

          <WeatherCard weather={weather} />
        </div>
      </section>

      {/* ================= CTAs ================= */}
      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid gap-6 md:grid-cols-3">
          {/* Featured 3D viewer card */}
          <Link
            href={`/resorts/${resort.slug}/viewer`}
            className="zoom-on-hover relative md:col-span-2 group rounded-2xl border border-border overflow-hidden bg-card hover:border-accent/40 transition shadow-lg"
          >
            <div className="aspect-[2/1] relative overflow-hidden">
              <Image
                src={`/slopes/${SLOPE_PHOTO_FILES[1]}`}
                alt="Vizualizare 3D"
                fill
                className="object-cover brightness-[0.7]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-card via-card/40 to-transparent" />
            </div>
            <div className="absolute bottom-0 left-0 right-0 p-6">
              <div className="text-[10px] uppercase tracking-widest text-accent font-mono mb-1">Atracție principală</div>
              <h2 className="text-2xl font-semibold tracking-tight mb-2">Vizualizare 3D interactivă</h2>
              <p className="text-sm text-muted-foreground max-w-md">
                Modelul real al muntelui Straja, cu pârtii animate, telecabine clickabile, snow și legendă completă.
              </p>
              <div className="mt-4 inline-flex items-center gap-2 text-accent text-sm font-medium group-hover:gap-3 transition-all">
                <Move3d className="w-4 h-4" />
                Deschide vizualizarea
              </div>
            </div>
          </Link>

          {/* Location */}
          <div className="rounded-2xl border border-border bg-card p-6 flex flex-col">
            <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-muted-foreground font-mono mb-3">
              <MapPin className="w-3.5 h-3.5" />
              Localizare
            </div>
            <div className="text-lg font-semibold tracking-tight">
              {resort.region}
            </div>
            <div className="text-sm text-muted-foreground mt-1 font-mono">
              {resort.centerLat.toFixed(4)}°N · {resort.centerLon.toFixed(4)}°E
            </div>
            <div className="mt-auto pt-6">
              <a
                href={`https://www.google.com/maps?q=${resort.centerLat},${resort.centerLon}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-accent hover:underline"
              >
                Deschide în Google Maps <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ================= PHOTO GALLERY ================= */}
      <section className="mx-auto max-w-7xl px-6 py-8">
        <div className="flex items-end justify-between mb-6">
          <div>
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-mono mb-1.5">
              <Camera className="w-3.5 h-3.5 inline mr-1.5" />
              Galerie
            </div>
            <h2 className="text-2xl font-semibold tracking-tight">Pârtiile din Straja</h2>
          </div>
          <Link
            href={`/resorts/${resort.slug}/viewer`}
            className="text-sm text-accent hover:underline whitespace-nowrap"
          >
            Vezi toate în 3D →
          </Link>
        </div>

        <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
          {SLOPE_PHOTO_FILES.slice(0, 8).map((file, i) => (
            <div
              key={file}
              className="zoom-on-hover relative aspect-square rounded-xl overflow-hidden border border-border bg-muted/40 fade-up"
              style={{ animationDelay: `${0.05 * i}s` }}
            >
              <Image
                src={`/slopes/${file}`}
                alt={file}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 50vw, 25vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/70 to-transparent opacity-0 hover:opacity-100 transition-opacity" />
            </div>
          ))}
        </div>
      </section>

      {/* ================= SKIPASS / CAZARE / ÎNCHIRIERI ================= */}
      {external && (
        <>
          <SkipassSection skipass={external.skipass} />
          <AccommodationsSection items={external.accommodations} />
          <RentalsSection items={external.rentals} />
        </>
      )}

      {/* ================= ABOUT ================= */}
      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="rounded-2xl border border-border bg-card/60 p-8 md:p-12 relative overflow-hidden">
          <div className="absolute inset-0 bg-snow-fade pointer-events-none" />
          <div className="relative max-w-3xl">
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-mono mb-3">
              Despre stațiune
            </div>
            <h2 className="text-3xl font-semibold tracking-tight mb-5">
              Una dintre cele mai lungi sezoane de schi din România
            </h2>
            <p className="text-foreground/80 leading-relaxed">
              {resort.description}
            </p>
            <dl className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4 pt-6 border-t border-border/60">
              <FactRow label="Bază" value={`${resort.elevationMin} m`} />
              <FactRow label="Vârf" value={`${resort.elevationMax} m`} />
              <FactRow label="Diferență" value={`${verticalDrop} m`} />
              <FactRow label="Pârtii" value={`${resort.totalSlopes}`} />
            </dl>
          </div>
        </div>
      </section>
    </div>
  );
}

function Stat({
  icon,
  label,
  value,
  unit,
  sub,
  accent = "text-foreground",
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  unit?: string;
  sub?: string;
  accent?: string;
}) {
  return (
    <div>
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-muted-foreground font-mono">
        {icon}
        {label}
      </div>
      <div className={`mt-2 text-2xl font-semibold tracking-tight tabular-nums ${accent}`}>
        {value}
        {unit && <span className="text-base text-muted-foreground ml-1 font-normal">{unit}</span>}
      </div>
      {sub && <div className="text-xs text-muted-foreground mt-0.5">{sub}</div>}
    </div>
  );
}

function FactRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[10px] uppercase tracking-widest text-muted-foreground font-mono">{label}</dt>
      <dd className="text-lg font-semibold tracking-tight tabular-nums mt-1">{value}</dd>
    </div>
  );
}
