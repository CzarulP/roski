// Server-side base URL (used in Server Components / route handlers).
const SERVER_BASE = process.env.API_BASE_URL ?? "http://localhost:5080";
// Client-side base URL.
export const CLIENT_API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:5080";

function baseUrl() {
  return typeof window === "undefined" ? SERVER_BASE : CLIENT_API_BASE;
}

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${baseUrl()}${path}`, {
    ...init,
    headers: { "content-type": "application/json", ...(init?.headers ?? {}) },
    cache: init?.cache ?? "no-store",
  });
  if (!res.ok) throw new Error(`API ${res.status} ${res.statusText} on ${path}`);
  return res.json() as Promise<T>;
}

export type ResortSummary = {
  id: string;
  slug: string;
  name: string;
  region: string;
  elevationMin: number | null;
  elevationMax: number | null;
  centerLat: number;
  centerLon: number;
  previewImageUrl: string | null;
  openSlopes: number;
  openLifts: number;
};

export type ResortDetail = ResortSummary & {
  description: string | null;
  terrainOriginLat: number;
  terrainOriginLon: number;
  terrainModelUrl: string | null;
  websiteUrl: string | null;
  webcams: { name: string; url: string; type: string }[];
  totalSlopes: number;
  totalLifts: number;
};

export type Weather = {
  tempC: number;
  windKph: number;
  windDir: number;
  snowfallCm: number;
  weatherCode: number;
  observedAt: string;
};

export type ViewerSlope = {
  id: string;
  name: string | null;
  difficulty: "easy" | "medium" | "hard" | "expert";
  lengthM: number | null;
  points: [number, number, number][];
  isOpen: boolean;
};

export type ViewerLift = {
  id: string;
  name: string | null;
  liftType: string;
  capacity: number | null;
  hours: string | null;
  points: [number, number, number][];
  isOpen: boolean;
};

export type ViewerData = {
  resortSlug: string;
  originLat: number;
  originLon: number;
  terrainModelUrl: string | null;
  slopes: ViewerSlope[];
  lifts: ViewerLift[];
};

export const endpoints = {
  resorts: () => api<ResortSummary[]>("/api/v1/resorts/"),
  resort: (slug: string) => api<ResortDetail>(`/api/v1/resorts/${slug}`),
  weather: (slug: string) => api<Weather>(`/api/v1/resorts/${slug}/weather`),
  viewerData: (slug: string) => api<ViewerData>(`/api/v1/resorts/${slug}/viewer-data`),
};
