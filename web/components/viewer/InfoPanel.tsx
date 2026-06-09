"use client";

import { useState } from "react";
import { X, Mountain, Ruler, ArrowDownToLine, Clock, Users, CircleCheck, CircleSlash, Ticket } from "lucide-react";
import { useViewerStore } from "@/lib/viewer-store";
import { DIFFICULTY, cn, describeLiftType, toSlug } from "@/lib/utils";
import type { ViewerSlope, ViewerLift, ExternalData } from "@/lib/api";

/**
 * Floating side panel showing details of the currently-selected slope or lift.
 * Subscribes to the viewer store and slides in from the right.
 *
 * When external data (skipass) is provided, lift panels also show point
 * consumption for that lift.
 */
export default function InfoPanel({ external }: { external?: ExternalData | null }) {
  const selection = useViewerStore((s) => s.selection);
  const close = useViewerStore((s) => s.clearSelection);

  if (!selection) return null;

  return (
    <div className="absolute top-20 right-4 z-30 w-80 max-w-[calc(100vw-2rem)] pointer-events-auto">
      <div className="info-panel-in bg-card/95 backdrop-blur border border-border rounded-xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-border/60">
          <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-mono">
            {selection.type === "slope" ? "Pârtie" : "Telecabină / Teleschi"}
          </span>
          <button
            onClick={close}
            aria-label="Închide"
            className="text-muted-foreground hover:text-foreground transition rounded-full p-1 hover:bg-muted/40"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-5 space-y-4">
          {selection.type === "slope" ? (
            <SlopeContent slope={selection.data} />
          ) : (
            <LiftContent lift={selection.data} external={external} />
          )}
          <PanelImage
            name={selection.data.name ?? ""}
            kind={selection.type === "slope" ? "slopes" : "lifts"}
          />
        </div>
      </div>
    </div>
  );
}

function SlopeContent({ slope }: { slope: ViewerSlope }) {
  const diff = DIFFICULTY[slope.difficulty];
  const points = slope.points;
  const topY = Math.max(...points.map((p) => p[1]));
  const bottomY = Math.min(...points.map((p) => p[1]));
  const drop = topY - bottomY;
  const length = slope.lengthM ?? 0;

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <h2 className="text-xl font-semibold tracking-tight">{slope.name}</h2>
        <div className="flex items-center gap-2 text-sm">
          <span
            className="inline-block w-2.5 h-2.5 rounded-full"
            style={{ background: diff?.color ?? "#fff" }}
          />
          <span className="text-muted-foreground">{diff?.label ?? slope.difficulty}</span>
          <span className="ml-auto inline-flex items-center gap-1 text-xs">
            {slope.isOpen ? (
              <>
                <CircleCheck className="w-3.5 h-3.5 text-green-500" />
                <span className="text-green-500">Deschisă</span>
              </>
            ) : (
              <>
                <CircleSlash className="w-3.5 h-3.5 text-red-400" />
                <span className="text-red-400">Închisă</span>
              </>
            )}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Stat icon={<Ruler className="w-4 h-4" />} label="Lungime" value={length >= 1000 ? `${(length / 1000).toFixed(1)} km` : `${length} m`} />
        <Stat icon={<ArrowDownToLine className="w-4 h-4" />} label="Diferență nivel" value={`${Math.round(drop)} m`} />
        <Stat icon={<Mountain className="w-4 h-4" />} label="Vârf" value={`${Math.round(topY)} m`} />
        <Stat icon={<Mountain className="w-4 h-4 rotate-180" />} label="Bază" value={`${Math.round(bottomY)} m`} />
      </div>
    </div>
  );
}

function LiftContent({ lift, external }: { lift: ViewerLift; external?: ExternalData | null }) {
  const points = lift.points;
  const entryY = points[0]?.[1] ?? 0;
  const exitY = points[points.length - 1]?.[1] ?? 0;
  const top = Math.max(entryY, exitY);
  const bottom = Math.min(entryY, exitY);

  const skipassInfo = external ? getLiftSkipassInfo(lift, external) : null;

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <h2 className="text-xl font-semibold tracking-tight">{lift.name}</h2>
        <div className="flex items-center gap-2 text-sm">
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-amber-400" />
          <span className="text-muted-foreground">{describeLiftType(lift.liftType)}</span>
          <span className="ml-auto inline-flex items-center gap-1 text-xs">
            {lift.isOpen ? (
              <>
                <CircleCheck className="w-3.5 h-3.5 text-green-500" />
                <span className="text-green-500">Deschis</span>
              </>
            ) : (
              <>
                <CircleSlash className="w-3.5 h-3.5 text-red-400" />
                <span className="text-red-400">Închis</span>
              </>
            )}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Stat icon={<Mountain className="w-4 h-4" />} label="Stație sus" value={`${Math.round(top)} m`} />
        <Stat icon={<Mountain className="w-4 h-4 rotate-180" />} label="Stație jos" value={`${Math.round(bottom)} m`} />
        {lift.capacity != null && (
          <Stat icon={<Users className="w-4 h-4" />} label="Capacitate" value={`${lift.capacity}/h`} />
        )}
        {lift.hours && (
          <Stat icon={<Clock className="w-4 h-4" />} label="Program" value={lift.hours} />
        )}
      </div>

      {skipassInfo && (
        <div className="rounded-lg border border-amber-700/40 bg-gradient-to-br from-amber-500/15 to-amber-700/10 p-3">
          <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-amber-700 font-mono">
            <Ticket className="w-3.5 h-3.5" />
            Skipass pe puncte
          </div>
          <div className="mt-1.5 flex items-baseline justify-between">
            <span className="text-2xl font-semibold tabular-nums text-foreground">
              {skipassInfo.points}
              <span className="text-sm text-foreground/70 ml-1 font-normal">puncte / urcare</span>
            </span>
          </div>
          <div className="mt-1 text-[11px] text-foreground/65">{skipassInfo.passName}</div>
        </div>
      )}
    </div>
  );
}

/** Determine which skipass zone (Montana vs Platoul Soarelui) this lift falls in
 *  and look up the point cost for its lift type. */
function getLiftSkipassInfo(lift: ViewerLift, external: ExternalData):
  { passName: string; points: number } | null
{
  const isPlatoul = (lift.name ?? "").toLowerCase().includes("platoul soarelui");
  const passType = isPlatoul ? "points_platoul" : "points_montana";
  const pass = external.skipass.passes.find((p) => p.type === passType);
  if (!pass?.consumption) return null;

  // Match the lift's category to a consumption key.
  const lookup: Record<string, string[]> = {
    gondola:    ["Telegondolă", "Telegondola"],
    cable_car:  ["Telegondolă", "Telegondola"],
    chair:      ["Telescaun"],
    drag:       ["Teleschi"],
  };
  const candidates = lookup[lift.liftType] ?? [];
  for (const key of candidates) {
    const points = pass.consumption[key];
    if (typeof points === "number") {
      return { passName: pass.name, points };
    }
  }
  return null;
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border/60 bg-muted/30 p-3">
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-muted-foreground font-mono">
        {icon}
        {label}
      </div>
      <div className="mt-1 text-base font-medium">{value}</div>
    </div>
  );
}

/**
 * Tries to load /<kind>/<slug>.jpg, falling back to .png, .jpeg, .webp.
 * If none of those exist, the panel renders nothing — no broken icon, no console error.
 */
const IMAGE_EXTS = ["jpg", "png", "jpeg", "webp"] as const;

function PanelImage({ name, kind }: { name: string; kind: "slopes" | "lifts" }) {
  const slug = toSlug(name);
  // Keying by slug forces remount + fresh state when the user selects a different element.
  return <PanelImageInner key={`${kind}-${slug}`} name={name} kind={kind} slug={slug} />;
}

function PanelImageInner({ name, kind, slug }: { name: string; kind: "slopes" | "lifts"; slug: string }) {
  const [extIdx, setExtIdx] = useState(0);
  const [loaded, setLoaded] = useState(false);

  if (!name || extIdx >= IMAGE_EXTS.length) return null;
  const src = `/${kind}/${slug}.${IMAGE_EXTS[extIdx]}`;

  return (
    <div className="relative rounded-lg overflow-hidden border border-border/60 aspect-video bg-muted/40">
      {!loaded && <div className="absolute inset-0 bg-muted/40 animate-pulse" />}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={name}
        onLoad={() => setLoaded(true)}
        onError={() => setExtIdx((i) => i + 1)}
        className={cn(
          "w-full h-full object-cover transition-opacity duration-300",
          loaded ? "opacity-100" : "opacity-0"
        )}
      />
    </div>
  );
}
