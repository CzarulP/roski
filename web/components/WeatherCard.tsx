import { Wind, Snowflake, Sun, Cloud, CloudRain, CloudSnow, CloudFog, CloudLightning } from "lucide-react";
import type { Weather } from "@/lib/api";
import { describeWeather } from "@/lib/utils";
import { cn } from "@/lib/utils";

type WeatherKind = "sunny" | "cloudy" | "rain" | "snow" | "fog" | "storm";

function classify(code: number): WeatherKind {
  if ([0, 1].includes(code)) return "sunny";
  if ([2, 3].includes(code)) return "cloudy";
  if ([45, 48].includes(code)) return "fog";
  if ([51, 53, 55, 61, 63, 65, 80, 81, 82].includes(code)) return "rain";
  if ([71, 73, 75, 77, 85, 86].includes(code)) return "snow";
  if ([95, 96, 99].includes(code)) return "storm";
  return "cloudy";
}

const KINDS: Record<WeatherKind, { gradient: string; icon: React.ComponentType<{ className?: string }>; ring: string }> = {
  sunny:  { gradient: "from-amber-400/30 via-amber-500/10 to-orange-700/20",     icon: Sun,           ring: "ring-amber-400/30" },
  cloudy: { gradient: "from-slate-400/30 via-slate-500/15 to-slate-700/20",       icon: Cloud,         ring: "ring-slate-400/30" },
  rain:   { gradient: "from-blue-400/30 via-blue-500/15 to-slate-700/20",         icon: CloudRain,     ring: "ring-blue-400/30" },
  snow:   { gradient: "from-sky-200/30 via-sky-300/15 to-blue-700/20",            icon: CloudSnow,     ring: "ring-sky-200/30" },
  fog:    { gradient: "from-slate-300/30 via-slate-400/15 to-slate-600/20",       icon: CloudFog,      ring: "ring-slate-300/30" },
  storm:  { gradient: "from-purple-500/30 via-purple-700/15 to-slate-800/30",     icon: CloudLightning, ring: "ring-purple-400/30" },
};

export default function WeatherCard({ weather }: { weather: Weather | null }) {
  if (!weather) {
    return (
      <div className="rounded-2xl border border-border bg-card p-6">
        <div className="text-xs uppercase tracking-widest text-muted-foreground font-mono mb-2">Vremea acum</div>
        <div className="text-2xl font-semibold">—</div>
        <div className="text-xs text-muted-foreground mt-1">Date indisponibile</div>
      </div>
    );
  }

  const kind = classify(weather.weatherCode);
  const { gradient, icon: Icon, ring } = KINDS[kind];

  return (
    <div className={cn("relative rounded-2xl border border-border overflow-hidden p-6 ring-1", ring)}>
      {/* Conditions gradient backdrop */}
      <div className={cn("absolute inset-0 bg-gradient-to-br pointer-events-none", gradient)} />
      <div className="absolute inset-0 bg-card/40 backdrop-blur-[2px] pointer-events-none" />

      <div className="relative">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-mono">Vremea acum</div>
            <div className="mt-2 text-5xl font-semibold tracking-tight tabular-nums">
              {Math.round(weather.tempC)}°
            </div>
            <div className="mt-1 text-sm text-foreground/80">{describeWeather(weather.weatherCode)}</div>
          </div>
          <Icon className="w-12 h-12 text-foreground/90 drop-shadow-md" />
        </div>

        <div className="mt-6 grid grid-cols-2 gap-2 text-xs">
          <Stat icon={<Wind className="w-3.5 h-3.5" />} label="Vânt" value={`${Math.round(weather.windKph)} km/h`} />
          <Stat icon={<Snowflake className="w-3.5 h-3.5" />} label="Ninsoare" value={`${weather.snowfallCm.toFixed(1)} cm`} />
        </div>
      </div>
    </div>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-lg bg-card/50 border border-border/60 px-2.5 py-1.5">
      <div className="flex items-center gap-1.5 text-muted-foreground">
        {icon}
        <span>{label}</span>
      </div>
      <span className="font-medium text-foreground">{value}</span>
    </div>
  );
}
