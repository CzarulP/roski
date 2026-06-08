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
        <header className="border-b border-border/40 backdrop-blur-md sticky top-0 z-30 bg-background/70 supports-[backdrop-filter]:bg-background/50">
          <div className="mx-auto max-w-7xl px-6 h-14 flex items-center justify-between">
            <Link href="/" className="font-semibold tracking-tight text-lg flex items-center gap-2 group">
              <span className="text-accent group-hover:rotate-12 transition-transform">◭</span>
              <span>Roski</span>
            </Link>
            <nav className="flex items-center gap-1 text-sm">
              <NavLink href="/">Stațiuni</NavLink>
              <NavLink href="/resorts/straja">Straja</NavLink>
              <NavLink href="/resorts/straja/viewer" highlight>Vizualizare 3D</NavLink>
            </nav>
          </div>
        </header>
        <main className="flex-1 flex flex-col">{children}</main>
        <footer className="border-t border-border/40 py-8 mt-12 bg-background/50">
          <div className="mx-auto max-w-7xl px-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <span className="text-accent">◭</span>
              <span>Roski · Proiect academic</span>
            </div>
            <div className="flex items-center gap-4">
              <span>Date OSM</span>
              <span>·</span>
              <span>Vreme Open-Meteo</span>
              <span>·</span>
              <span>Teren Copernicus DEM</span>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}

function NavLink({ href, children, highlight = false }: { href: string; children: React.ReactNode; highlight?: boolean }) {
  return (
    <Link
      href={href}
      className={
        highlight
          ? "px-3 py-1.5 rounded-full bg-accent/15 text-accent hover:bg-accent/25 transition text-xs font-medium"
          : "px-3 py-1.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/40 transition text-xs"
      }
    >
      {children}
    </Link>
  );
}
