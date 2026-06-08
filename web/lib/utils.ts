import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const WEATHER_CODES: Record<number, string> = {
  0: "Senin",
  1: "Predominant senin",
  2: "Parțial înnorat",
  3: "Înnorat",
  45: "Ceață",
  48: "Ceață cu chiciură",
  51: "Burniță ușoară",
  53: "Burniță",
  55: "Burniță densă",
  61: "Ploaie ușoară",
  63: "Ploaie",
  65: "Ploaie torențială",
  71: "Ninsoare ușoară",
  73: "Ninsoare",
  75: "Ninsoare abundentă",
  77: "Granule de zăpadă",
  80: "Aversă",
  81: "Aversă",
  82: "Aversă violentă",
  85: "Aversă de zăpadă",
  86: "Aversă de zăpadă densă",
  95: "Furtună",
  96: "Furtună cu grindină",
  99: "Furtună violentă",
};

export function describeWeather(code: number): string {
  return WEATHER_CODES[code] ?? "Condiții necunoscute";
}

export const DIFFICULTY = {
  easy: { label: "Ușor", color: "#16a34a", textColor: "text-green-500" },
  medium: { label: "Mediu", color: "#2563eb", textColor: "text-blue-500" },
  hard: { label: "Dificil", color: "#dc2626", textColor: "text-red-500" },
  expert: { label: "Expert", color: "#0a0a0a", textColor: "text-zinc-100" },
} as const;

export const LIFT_TYPE_LABELS: Record<string, string> = {
  gondola: "Gondolă",
  cable_car: "Telecabină",
  chair: "Telescaun",
  drag: "Teleschi",
};

export function describeLiftType(type: string): string {
  return LIFT_TYPE_LABELS[type] ?? type;
}

/**
 * Romanian-aware filename slug.
 *   "2 Pârtia Canal"         → "2-partia-canal"
 *   "IV. Telescaun 4"        → "iv-telescaun-4"
 *   "5a Pârtia Mutu"         → "5a-partia-mutu"
 *   "XII. Telescaun 3 (4 locuri debraiabil)" → "xii-telescaun-3-4-locuri-debraiabil"
 */
export function toSlug(name: string): string {
  return name
    .normalize("NFD")                       // split base + combining diacritics
    .replace(/[̀-ͯ]/g, "")        // strip diacritics
    .toLowerCase()
    .replace(/\./g, "")                     // remove dots
    .replace(/[^a-z0-9]+/g, "-")           // non-alphanumeric runs → dash
    .replace(/^-+|-+$/g, "");               // trim
}
