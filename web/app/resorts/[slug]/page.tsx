import Link from "next/link";
import { notFound } from "next/navigation";
import { endpoints } from "@/lib/api";
import { describeWeather } from "@/lib/utils";
import { Snowflake, Wind, Thermometer, Mountain, ExternalLink } from "lucide-react";

export default async function ResortPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  let resort, weather;
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

  return (
    <div className="flex-1">
      <section className="relative border-b border-border/60 overflow-hidden">
        <div className="bg-grain absolute inset-0 opacity-30 pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_20%,rgba(56,189,248,0.18),transparent_60%)] pointer-events-none" />
        <div className="relative mx-auto max-w-7xl px-6 py-16">
          <p className="text-accent uppercase tracking-widest text-xs font-mono mb-3">
            {resort.region}
          </p>
          <h1 className="text-5xl md:text-6xl font-semibold tracking-tight">{resort.name}</h1>
          <p className="mt-6 max-w-2xl text-muted-foreground leading-relaxed">{resort.description}</p>

          <div className="mt-10 flex flex-wrap gap-3">
            <Link
              href={`/resorts/${resort.slug}/viewer`}
              className="inline-flex items-center h-11 px-6 rounded-full bg-accent text-accent-foreground font-medium hover:opacity-90 transition"
            >
              Vizualizare 3D
            </Link>
            {resort.websiteUrl && (
              <a
                href={resort.websiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 h-11 px-6 rounded-full border border-border hover:bg-muted/40 transition"
              >
                Site oficial <ExternalLink className="w-4 h-4" />
              </a>
            )}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-12 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Stat icon={<Mountain className="w-5 h-5" />} label="Altitudine" value={`${resort.elevationMin}–${resort.elevationMax} m`} />
        <Stat icon={<Snowflake className="w-5 h-5" />} label="Pârtii deschise" value={`${resort.openSlopes} / ${resort.totalSlopes}`} />
        <Stat icon={<Wind className="w-5 h-5" />} label="Telecabine deschise" value={`${resort.openLifts} / ${resort.totalLifts}`} />
        {weather ? (
          <Stat
            icon={<Thermometer className="w-5 h-5" />}
            label={describeWeather(weather.weatherCode)}
            value={`${Math.round(weather.tempC)}°C`}
            sub={`Vânt ${Math.round(weather.windKph)} km/h`}
          />
        ) : (
          <Stat icon={<Thermometer className="w-5 h-5" />} label="Vreme" value="—" sub="indisponibil" />
        )}
      </section>

      <section className="mx-auto max-w-7xl px-6 py-12 grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 rounded-xl border border-border bg-card p-6">
          <h2 className="text-xl font-semibold tracking-tight">Vizualizare 3D</h2>
          <p className="mt-2 text-muted-foreground text-sm">
            Modelul interactiv al muntelui Straja, cu pârtii animate și telecabine clickable.
          </p>
          <Link
            href={`/resorts/${resort.slug}/viewer`}
            className="mt-6 inline-flex items-center h-10 px-4 rounded-md bg-accent text-accent-foreground text-sm font-medium hover:opacity-90 transition"
          >
            Deschide
          </Link>
        </div>

        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="text-xl font-semibold tracking-tight">Localizare</h2>
          <p className="mt-2 text-muted-foreground text-sm">
            {resort.centerLat.toFixed(4)}°N, {resort.centerLon.toFixed(4)}°E
          </p>
          <a
            href={`https://www.google.com/maps?q=${resort.centerLat},${resort.centerLon}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex items-center gap-2 text-sm text-accent hover:underline"
          >
            Deschide în Google Maps <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </section>
    </div>
  );
}

function Stat({
  icon,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center gap-2 text-muted-foreground text-xs uppercase tracking-widest font-mono">
        {icon}
        {label}
      </div>
      <div className="mt-3 text-2xl font-semibold tracking-tight">{value}</div>
      {sub && <div className="mt-1 text-xs text-muted-foreground">{sub}</div>}
    </div>
  );
}
