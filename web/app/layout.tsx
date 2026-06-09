import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Image from "next/image";
import Link from "next/link";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: "Roski — Stațiuni de schi din România",
    template: "%s · Roski",
  },
  description:
    "Explorează stațiunile de schi din România cu modele 3D interactive ale munților, vizualizare a pârtiilor, prețuri skipass și informații în timp real.",
  applicationName: "Roski",
  keywords: [
    "schi",
    "România",
    "stațiuni de schi",
    "Straja",
    "skipass",
    "pârtii",
    "telecabină",
    "vizualizare 3D",
    "ski Romania",
  ],
  openGraph: {
    type: "website",
    title: "Roski — Stațiuni de schi din România",
    description:
      "Pârtii, telecabine și skipass-uri în modele 3D interactive ale munților din România.",
    siteName: "Roski",
  },
  twitter: {
    card: "summary_large_image",
    title: "Roski — Stațiuni de schi din România",
    description:
      "Pârtii, telecabine și skipass-uri în modele 3D interactive ale munților din România.",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ro" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <header className="sticky top-0 z-30 border-b border-border/60 bg-background/80 backdrop-blur-lg supports-[backdrop-filter]:bg-background/65">
          <div className="mx-auto max-w-7xl px-6 h-16 flex items-center justify-between gap-6">
            <Link href="/" className="font-semibold tracking-tight text-lg flex items-center gap-2.5 group">
              <span className="relative w-9 h-9 rounded-lg overflow-hidden ring-1 ring-border shadow-sm group-hover:scale-105 transition-transform">
                <Image
                  src="/random/ROSKILOGO.png"
                  alt="Roski"
                  fill
                  sizes="36px"
                  priority
                  className="object-cover"
                />
              </span>
              <span className="text-foreground">roski</span>
            </Link>
            <nav className="flex items-center gap-1 text-sm">
              <NavLink href="/">Stațiuni</NavLink>
              <NavLink href="/resorts/straja">Straja</NavLink>
              <NavLink href="/resorts/straja/viewer" highlight>
                Vizualizare 3D
              </NavLink>
            </nav>
          </div>
        </header>
        <main className="flex-1 flex flex-col">{children}</main>
        <footer className="mt-16 border-t border-border/60 bg-gradient-to-br from-muted/40 to-background">
          <div className="mx-auto max-w-7xl px-6 py-10 flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
            <div className="space-y-2">
              <Link href="/" className="font-semibold tracking-tight text-lg flex items-center gap-2.5">
                <span className="relative w-9 h-9 rounded-lg overflow-hidden ring-1 ring-border">
                  <Image
                    src="/random/ROSKILOGO.png"
                    alt="Roski"
                    fill
                    sizes="36px"
                    className="object-cover"
                  />
                </span>
                <span>roski</span>
              </Link>
              <p className="text-sm text-muted-foreground max-w-xs">
                Munții României, văzuți de aproape. Modele 3D interactive ale pârtiilor, telecabinelor și condițiilor de schi.
              </p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-8 text-sm">
              <div>
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-mono mb-3">
                  Explorează
                </div>
                <ul className="space-y-2">
                  <li><Link href="/" className="text-foreground hover:text-accent transition">Stațiuni</Link></li>
                  <li><Link href="/resorts/straja" className="text-foreground hover:text-accent transition">Straja</Link></li>
                  <li><Link href="/resorts/straja/viewer" className="text-foreground hover:text-accent transition">Vizualizare 3D</Link></li>
                </ul>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-mono mb-3">
                  Date
                </div>
                <ul className="space-y-2 text-muted-foreground">
                  <li>OpenStreetMap</li>
                  <li>Open-Meteo</li>
                  <li>Copernicus DEM</li>
                </ul>
              </div>
            </div>
          </div>
          <div className="border-t border-border/60">
            <div className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between text-xs text-muted-foreground">
              <span>© {new Date().getFullYear()} Roski</span>
              <span>Făcut cu ❤ pentru iubitorii de munte.</span>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}

function NavLink({ href, children, highlight = false }: { href: string; children: React.ReactNode; highlight?: boolean }) {
  if (highlight) {
    return (
      <Link
        href={href}
        className="ml-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-accent to-accent-hot text-white font-medium text-xs hover:shadow-md hover:shadow-accent/20 transition-shadow"
      >
        {children}
      </Link>
    );
  }
  return (
    <Link
      href={href}
      className="px-3 py-1.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/60 transition text-sm"
    >
      {children}
    </Link>
  );
}
