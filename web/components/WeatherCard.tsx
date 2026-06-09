import { Wind, Snowflake, Sun, Cloud, CloudRain, CloudSnow, CloudFog, CloudLightning, Thermometer, type LucideIcon } from "lucide-react";
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

const KIND_THEME: Record<WeatherKind, {
  gradient: string;
  textColor: string;
  iconColor: string;
  icon: LucideIcon;
  ring: string;
}> = {
  sunny:  {
    gradient: "from-amber-200 via-yellow-100 to-orange-100",
    textColor: "text-amber-900",
    iconColor: "text-amber-500",
    icon: Sun,
    ring: "ring-amber-300/50",
  },
  cloudy: {
    gradient: "from-slate-200 via-slate-100 to-blue-100",
    textColor: "text-slate-800",
    iconColor: "text-slate-500",
    icon: Cloud,
    ring: "ring-slate-300/50",
  },
  rain:   {
    gradient: "from-sky-200 via-blue-100 to-slate-200",
    textColor: "text-blue-900",
    iconColor: "text-blue-500",
    icon: CloudRain,
    ring: "ring-blue-300/50",
  },
  snow:   {
    gradient: "from-blue-50 via-sky-100 to-cyan-50",
    textColor: "text-sky-900",
    iconColor: "text-sky-500",
    icon: CloudSnow,
    ring: "ring-sky-200/60",
  },
  fog:    {
    gradient: "from-slate-100 via-slate-50 to-stone-100",
    textColor: "text-slate-800",
    iconColor: "text-slate-400",
    icon: CloudFog,
    ring: "ring-slate-200/60",
  },
  storm:  {
    gradient: "from-violet-200 via-purple-100 to-slate-200",
    textColor: "text-violet-900",
    iconColor: "text-violet-600",
    icon: CloudLightning,
    ring: "ring-violet-300/50",
  },
};

export default function WeatherCard({ weather }: { weather: Weather | null }) {
  if (!weather) {
    return (
      <div className="rounded-3xl border border-border bg-card p-6">
        <div className="text-xs uppercase tracking-widest text-muted-foreground font-mono mb-2">Vremea acum</div>
        <div className="text-3xl font-semibold">—</div>
        <div className="text-xs text-muted-foreground mt-2">Date indisponibile</div>
      </div>
    );
  }

  const kind = classify(weather.weatherCode);
  const theme = KIND_THEME[kind];
  const Icon = theme.icon;
  const temp = Math.round(weather.tempC);

  return (
    <div className={cn("relative rounded-3xl border border-border overflow-hidden shadow-lg ring-1", theme.ring)}>
      {/* Gradient backdrop */}
      <div className={cn("absolute inset-0 bg-gradient-to-br", theme.gradient)} />
      {/* Subtle white wash for content legibility */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/30 via-white/10 to-white/30" />
      {/* Weather-specific decoration */}
      <WeatherDecor kind={kind} />

      <div className={cn("relative p-6", theme.textColor)}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-[10px] uppercase tracking-widest opacity-70 font-mono">Vremea acum</div>
            <div className="mt-2 flex items-baseline">
              <span className="text-6xl font-semibold tracking-tight tabular-nums">
                {temp}
              </span>
              <span className="text-2xl ml-0.5 opacity-80">°C</span>
            </div>
            <div className="mt-1 text-sm font-medium opacity-90">{describeWeather(weather.weatherCode)}</div>
          </div>
          <div className={cn("relative", theme.iconColor)}>
            <div className="float-soft">
              <Icon className="w-16 h-16 drop-shadow-sm" strokeWidth={1.4} />
            </div>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-3 gap-2 text-xs">
          <MicroStat icon={<Wind className="w-3.5 h-3.5" />} label="Vânt" value={`${Math.round(weather.windKph)} km/h`} />
          <MicroStat icon={<Snowflake className="w-3.5 h-3.5" />} label="Ninsoare" value={`${weather.snowfallCm.toFixed(1)} cm`} />
          <MicroStat icon={<Thermometer className="w-3.5 h-3.5" />} label="Simțit" value={`${temp}°`} />
        </div>
      </div>
    </div>
  );
}

function MicroStat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex flex-col items-start gap-0.5 rounded-xl bg-white/40 backdrop-blur px-2.5 py-2 border border-white/50">
      <div className="flex items-center gap-1 opacity-70">
        {icon}
        <span>{label}</span>
      </div>
      <span className="font-semibold tabular-nums">{value}</span>
    </div>
  );
}

/** Per-mode decorations — sun rays, falling snow/rain, etc. */
function WeatherDecor({ kind }: { kind: WeatherKind }) {
  if (kind === "sunny") {
    return (
      <div className="absolute -top-12 -right-12 w-48 h-48 pointer-events-none opacity-50">
        <div className="weather-sun-rays w-full h-full">
          <SunRays />
        </div>
      </div>
    );
  }
  if (kind === "snow") {
    return (
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {Array.from({ length: 18 }).map((_, i) => {
          const left = (i * 5.5 + ((i * 31) % 13)) % 100;
          const delay = (i * 0.7) % 8;
          const duration = 6 + (i % 4);
          const size = 6 + (i % 3);
          return (
            <div
              key={i}
              className="weather-snowflake absolute top-0 text-white/80 drop-shadow"
              style={{
                left: `${left}%`,
                animationDelay: `${delay}s`,
                animationDuration: `${duration}s`,
                fontSize: `${size}px`,
              }}
            >
              ❄
            </div>
          );
        })}
      </div>
    );
  }
  if (kind === "rain") {
    return (
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {Array.from({ length: 22 }).map((_, i) => {
          const left = (i * 4.7 + ((i * 19) % 11)) % 100;
          const delay = (i * 0.4) % 4;
          const duration = 1.2 + ((i % 3) * 0.3);
          return (
            <div
              key={i}
              className="weather-raindrop absolute top-0 w-0.5 h-3 bg-blue-400/50 rounded-full"
              style={{
                left: `${left}%`,
                animationDelay: `${delay}s`,
                animationDuration: `${duration}s`,
              }}
            />
          );
        })}
      </div>
    );
  }
  if (kind === "cloudy") {
    return (
      <div className="absolute -bottom-4 -right-4 w-32 h-32 pointer-events-none opacity-30 float-soft">
        <Cloud className="w-full h-full text-slate-400" strokeWidth={1.2} />
      </div>
    );
  }
  if (kind === "fog") {
    return (
      <div className="absolute inset-x-0 bottom-0 h-2/3 pointer-events-none bg-gradient-to-t from-white/40 to-transparent" />
    );
  }
  return null;
}

function SunRays() {
  return (
    <svg viewBox="0 0 200 200" className="w-full h-full text-amber-400">
      <g fill="currentColor">
        {Array.from({ length: 12 }).map((_, i) => {
          const angle = (i * 30 * Math.PI) / 180;
          const x1 = 100 + Math.cos(angle) * 50;
          const y1 = 100 + Math.sin(angle) * 50;
          const x2 = 100 + Math.cos(angle) * 95;
          const y2 = 100 + Math.sin(angle) * 95;
          return (
            <line
              key={i}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke="currentColor"
              strokeWidth={4}
              strokeLinecap="round"
              opacity={0.5}
            />
          );
        })}
      </g>
    </svg>
  );
}
