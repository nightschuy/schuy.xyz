import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const links = [
  { label: "Product", href: "#product" },
  { label: "How it works", href: "#features" },
  { label: "Pricing", href: "#pricing" },
];

export function Logo({ className }: { className?: string }) {
  return (
    <a href="#hero" className={cn("flex items-center gap-2.5 font-semibold tracking-tight", className)}>
      <span className="grid size-7 place-items-center rounded-lg bg-white text-black">
        <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <path d="M3 15c3 0 3-6 6-6s3 6 6 6 3-6 6-6" />
        </svg>
      </span>
      Driftline
    </a>
  );
}

export function SiteNav() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 border-b transition-colors duration-300",
        scrolled ? "border-white/10 bg-black/70 backdrop-blur-xl" : "border-transparent",
      )}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Logo />
        <nav className="hidden items-center gap-8 text-sm text-gray-400 md:flex">
          {links.map((l) => (
            <a key={l.href} href={l.href} className="transition-colors hover:text-white">
              {l.label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="hidden text-gray-300 sm:inline-flex" asChild>
            <a href="#">Sign in</a>
          </Button>
          <Button size="sm" className="rounded-full px-4" asChild>
            <a href="#cta">Start free</a>
          </Button>
        </div>
      </div>
    </header>
  );
}
