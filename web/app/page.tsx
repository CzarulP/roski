import Link from "next/link";
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

  return (
    <div className="flex-1">
      <section className="relative overflow-hidden border-b border-border/60">
        <div className="bg-grain absolute inset-0 opacity-40 pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(56,189,248,0.18),transparent_60%)] pointer-events-none" />
        <div className="relative mx-auto max-w-7xl px-6 py-24 md:py-32">
          <p className="text-accent uppercase tracking-widest text-xs font-mono mb-4">
            Stațiuni de schi · România
          </p>
          <h1 className="text-4xl md:text-6xl font-semibold tracking-tight max-w-3xl">
            Munții României, în 3D interactiv.
          </h1>
          <p className="mt-6 max-w-xl text-muted-foreground text-lg">
            Vizualizează pârtii, telecabine și condiții actuale pe modele realiste ale munților.
            Începe cu <span className="text-foreground font-medium">Straja</span>.
          </p>
          <div className="mt-10 flex flex-wrap gap-3">
            <Link
              href="/resorts/straja/viewer"
              className="inline-flex items-center h-11 px-6 rounded-full bg-accent text-accent-foreground font-medium hover:opacity-90 transition"
            >
              Deschide vizualizarea 3D
            </Link>
            <Link
              href="/resorts/straja"
              className="inline-flex items-center h-11 px-6 rounded-full border border-border hover:bg-muted/40 transition"
            >
              Detalii stațiune
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="flex items-end justify-between mb-8">
          <h2 className="text-2xl font-semibold tracking-tight">Stațiuni disponibile</h2>
          <span className="text-xs text-muted-foreground">{resorts.length} stațiune(i)</span>
        </div>

        {resorts.length === 0 ? (
          <div className="rounded-xl border border-border bg-card p-8 text-center text-muted-foreground">
            Nu se poate accesa API-ul. Asigură-te că backend-ul rulează pe http://localhost:5080.
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {resorts.map((r) => (
              <Link
                key={r.id}
                href={`/resorts/${r.slug}`}
                className="group rounded-xl border border-border bg-card overflow-hidden hover:border-accent/40 transition"
              >
                <div className="aspect-video bg-muted relative overflow-hidden">
                  <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(56,189,248,0.15),transparent_60%)]" />
                  <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                    <span className="text-xs uppercase tracking-widest font-mono text-muted-foreground">
                      {r.region}
                    </span>
                    <span className="text-xs font-mono text-accent">
                      {r.elevationMin}–{r.elevationMax} m
                    </span>
                  </div>
                </div>
                <div className="p-5">
                  <h3 className="text-lg font-semibold tracking-tight group-hover:text-accent transition">
                    {r.name}
                  </h3>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                    <div>
                      <span className="text-foreground font-medium">{r.openSlopes}</span> pârtii deschise
                    </div>
                    <div>
                      <span className="text-foreground font-medium">{r.openLifts}</span> telecabine
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
