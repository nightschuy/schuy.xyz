import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/site-nav";

const logos = ["Northbeam", "Kestrel", "Arcadia", "Loomworks", "Fathom Labs"];

export function LogoStrip() {
  return (
    <div className="mx-auto max-w-6xl px-6 pt-20 text-center">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-gray-600">Trusted by product teams at</p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-x-12 gap-y-4 text-lg font-semibold tracking-tight text-gray-500">
        {logos.map((l) => (
          <span key={l}>{l}</span>
        ))}
      </div>
    </div>
  );
}

export function Quote() {
  return (
    <section className="mx-auto max-w-4xl px-6 pb-28 text-center md:pb-36">
      <blockquote className="text-balance text-2xl font-medium leading-snug tracking-tight text-white md:text-3xl">
        “We killed our feedback spreadsheet the first week. Driftline found a churn-risk theme we'd been missing for a
        quarter — <span className="text-lilac">fixing it saved two enterprise renewals.</span>”
      </blockquote>
      <div className="mt-8 flex items-center justify-center gap-3 text-sm">
        <span className="grid size-9 place-items-center rounded-full bg-white/10 font-medium text-white">MO</span>
        <div className="text-left">
          <div className="text-white">Maya Okafor</div>
          <div className="text-gray-500">Head of Product, Kestrel</div>
        </div>
      </div>
    </section>
  );
}

export function FinalCta() {
  return (
    <section id="cta" className="mx-auto max-w-6xl scroll-mt-24 px-6 pb-24">
      <div className="relative overflow-hidden rounded-3xl border border-white/10 px-6 py-24 text-center">
        <div
          aria-hidden
          className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,#222_1px,transparent_1px),linear-gradient(to_bottom,#222_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_70%_60%_at_50%_100%,#000_40%,transparent_100%)]"
        />
        <div
          aria-hidden
          className="absolute left-1/2 top-[82%] -z-10 h-[500px] w-[140%] -translate-x-1/2 rounded-[100%] opacity-80 bg-[radial-gradient(closest-side,#000_90%,#b48cde)]"
        />
        <h2 className="mx-auto max-w-3xl text-balance bg-gradient-to-br from-white from-30% to-white/50 bg-clip-text text-4xl font-semibold tracking-tighter text-transparent md:text-6xl">
          Your customers are already telling you what to build.
        </h2>
        <p className="mt-5 text-lg tracking-tight text-gray-400">Start listening in minutes — free for teams up to five.</p>
        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <Button size="lg" className="rounded-full text-base" asChild>
            <a href="#">Start free with Driftline</a>
          </Button>
          <Button size="lg" variant="outline" className="rounded-full bg-transparent text-base" asChild>
            <a href="#">Book a demo</a>
          </Button>
        </div>
      </div>
    </section>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-white/10">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-10 text-sm text-gray-500 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <Logo className="text-white" />
          <span>© 2026 · Concept design, not a real product</span>
        </div>
        <a href="../../#design" className="inline-flex items-center gap-2 transition-colors hover:text-white">
          <ArrowLeft className="size-4" /> Designed &amp; built by Schuyler Hample
        </a>
      </div>
    </footer>
  );
}
