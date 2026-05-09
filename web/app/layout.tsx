import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Roski — Stațiuni de schi din România",
  description:
    "Explorează stațiunile de schi din România cu modele 3D interactive ale munților, vizualizare a pârtiilor și informații în timp real.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ro" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <header className="border-b border-border/60 backdrop-blur sticky top-0 z-30 bg-background/70">
          <div className="mx-auto max-w-7xl px-6 h-14 flex items-center justify-between">
            <Link href="/" className="font-semibold tracking-tight text-lg flex items-center gap-2">
              <span className="text-accent">◭</span> Roski
            </Link>
            <nav className="flex items-center gap-6 text-sm text-muted-foreground">
              <Link href="/" className="hover:text-foreground">Stațiuni</Link>
              <Link href="/resorts/straja" className="hover:text-foreground">Straja</Link>
              <Link href="/resorts/straja/viewer" className="hover:text-foreground">Vizualizare 3D</Link>
            </nav>
          </div>
        </header>
        <main className="flex-1 flex flex-col">{children}</main>
        <footer className="border-t border-border/60 py-6 text-center text-xs text-muted-foreground">
          Roski · Proiect academic · Date OSM, Open-Meteo, Copernicus DEM
        </footer>
      </body>
    </html>
  );
}
