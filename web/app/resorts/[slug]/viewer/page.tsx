import Link from "next/link";
import { notFound } from "next/navigation";
import { endpoints, type ExternalData } from "@/lib/api";
import ViewerCanvas from "@/components/viewer/ViewerCanvas";
import { ArrowLeft } from "lucide-react";

export default async function ViewerPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  let resort, viewerData;
  let external: ExternalData | null = null;
  try {
    resort = await endpoints.resort(slug);
  } catch {
    notFound();
  }
  try {
    viewerData = await endpoints.viewerData(slug);
  } catch {
    viewerData = null;
  }
  try {
    external = await endpoints.external(slug);
  } catch {
    external = null;
  }

  return (
    <div className="relative h-[calc(100dvh-3.5rem)] w-full bg-background overflow-hidden">
      {/* Floating top bar */}
      <div className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between pointer-events-none">
        <Link
          href={`/resorts/${resort.slug}`}
          className="pointer-events-auto inline-flex items-center gap-2 h-10 px-4 rounded-full bg-card/80 backdrop-blur border border-border text-sm hover:bg-card transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Înapoi la {resort.name}
        </Link>
        <div className="pointer-events-auto rounded-full bg-card/80 backdrop-blur border border-border px-4 h-10 flex items-center gap-3 text-sm">
          <span className="text-muted-foreground">Vizualizare 3D</span>
          <span className="font-medium">{resort.name}</span>
          <span className="text-muted-foreground font-mono text-xs">
            {resort.elevationMin}–{resort.elevationMax} m
          </span>
        </div>
      </div>

      {/* Full-bleed canvas */}
      <ViewerCanvas
        terrainModelUrl={resort.terrainModelUrl}
        viewerData={viewerData}
        external={external}
      />

      {/* Phase note (will be removed when we ship) */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 text-xs text-muted-foreground bg-card/80 backdrop-blur border border-border rounded-full px-4 py-2">
        Faza 3 — pârtii și telecabine reale din OpenStreetMap, drapate pe SRTM.
      </div>
    </div>
  );
}
