import Link from "next/link";
import { notFound } from "next/navigation";
import { endpoints, type ExternalData } from "@/lib/api";
import ViewerCanvas from "@/components/viewer/ViewerCanvas";
import { ArrowLeft, Move3d } from "lucide-react";

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
    <div className="relative h-[calc(100dvh-4rem)] w-full bg-background overflow-hidden">
      {/* Floating top bar */}
      <div className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between pointer-events-none gap-3">
        <Link
          href={`/resorts/${resort.slug}`}
          className="pointer-events-auto inline-flex items-center gap-2 h-10 px-4 rounded-full glass border border-border text-sm hover:border-accent/40 transition shadow-lg"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Înapoi la</span> {resort.name}
        </Link>
        <div className="pointer-events-auto rounded-full glass border border-border h-10 flex items-center gap-2 sm:gap-3 pl-4 pr-4 sm:pr-5 text-sm shadow-lg">
          <Move3d className="w-4 h-4 text-accent" />
          <span className="hidden sm:inline text-muted-foreground">Vizualizare 3D</span>
          <span className="font-medium">{resort.name}</span>
          <span className="hidden md:inline text-muted-foreground font-mono text-xs ml-1">
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
    </div>
  );
}
