import Link from "next/link";
import { Mountain, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex-1 flex items-center justify-center px-6 py-24">
      <div className="text-center max-w-md fade-up">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-card border border-border mb-8">
          <Mountain className="w-8 h-8 text-accent" />
        </div>
        <div className="text-[10px] uppercase tracking-widest text-accent font-mono mb-3">
          404 · Pagină negăsită
        </div>
        <h1 className="text-4xl font-semibold tracking-tight mb-4">
          Te-ai rătăcit pe munte.
        </h1>
        <p className="text-muted-foreground leading-relaxed mb-8">
          Stațiunea sau pagina pe care o cauți nu există (încă). Întoarce-te
          la lista de stațiuni și pornește din nou pe pârtii.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 h-11 px-6 rounded-full bg-accent text-accent-foreground font-medium hover:bg-accent/90 transition shadow-lg shadow-accent/20"
        >
          <ArrowLeft className="w-4 h-4" />
          Înapoi la stațiuni
        </Link>
      </div>
    </div>
  );
}
