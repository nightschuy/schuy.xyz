import { Hero } from "@/components/ui/hero-1";
import { SiteNav } from "@/components/site-nav";
import { ProductShot } from "@/components/product-shot";
import { Features } from "@/components/features";
import { Pricing } from "@/components/pricing";
import { FinalCta, LogoStrip, Quote, SiteFooter } from "@/components/closing";

export default function App() {
  return (
    <>
      <SiteNav />
      <main>
        <Hero
          eyebrow="New: Slack & Zendesk sync"
          title="Ship customer insights, not spreadsheets."
          subtitle="Driftline collects feedback from every channel, clusters it into themes with AI, and ranks what to build next — so your roadmap writes itself."
          ctaLabel="Start free"
          ctaHref="#cta"
        />
        <ProductShot />
        <LogoStrip />
        <Features />
        <Quote />
        <Pricing />
        <FinalCta />
      </main>
      <SiteFooter />
    </>
  );
}
