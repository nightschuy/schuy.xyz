import { useState } from "react";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SectionHead } from "@/components/features";
import { cn } from "@/lib/utils";

type Plan = {
  name: string;
  monthly: number | null;
  unit?: string;
  blurb: string;
  features: string[];
  cta: string;
  featured?: boolean;
};

const plans: Plan[] = [
  {
    name: "Starter",
    monthly: 0,
    unit: "/mo",
    blurb: "For small teams getting organized.",
    features: ["Up to 5 teammates", "2 integrations", "500 feedback items / month", "Weekly theme digest"],
    cta: "Get started",
  },
  {
    name: "Growth",
    monthly: 49,
    unit: "/seat/mo",
    blurb: "For product teams shipping weekly.",
    features: ["Unlimited teammates", "All integrations", "Unlimited feedback", "AI clustering & impact scores", "Revenue-linked themes"],
    cta: "Start free trial",
    featured: true,
  },
  {
    name: "Enterprise",
    monthly: null,
    blurb: "For orgs with security needs.",
    features: ["SSO / SAML & SCIM", "Custom data retention", "Dedicated success manager", "SLA & priority support"],
    cta: "Talk to sales",
  },
];

export function Pricing() {
  const [annual, setAnnual] = useState(true);

  return (
    <section id="pricing" className="mx-auto max-w-6xl scroll-mt-24 px-6 pb-28 md:pb-36">
      <SectionHead eyebrow="Pricing" title="Simple plans that scale with you" />

      <div className="-mt-6 mb-12 flex justify-center">
        <div role="group" aria-label="Billing period" className="inline-flex rounded-full border border-white/10 bg-white/[0.03] p-1 text-sm">
          {[
            { label: "Monthly", value: false },
            { label: "Annual −20%", value: true },
          ].map((o) => (
            <button
              key={o.label}
              type="button"
              aria-pressed={annual === o.value}
              onClick={() => setAnnual(o.value)}
              className={cn(
                "rounded-full px-4 py-1.5 transition-colors",
                annual === o.value ? "bg-white text-black" : "text-gray-400 hover:text-white",
              )}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {plans.map((p) => {
          const price = p.monthly === null ? null : annual ? Math.round(p.monthly * 0.8) : p.monthly;
          return (
            <div
              key={p.name}
              className={cn(
                "relative flex flex-col rounded-2xl border p-8",
                p.featured
                  ? "border-lilac/40 bg-[radial-gradient(120%_60%_at_50%_0%,rgba(180,140,222,0.16),transparent_70%)] shadow-[0_0_80px_-30px_rgba(180,140,222,0.5)]"
                  : "border-white/10 bg-white/[0.015]",
              )}
            >
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-gray-300">{p.name}</h3>
                {p.featured && (
                  <span className="rounded-full bg-lilac px-2.5 py-0.5 text-[11px] font-medium text-black">Most popular</span>
                )}
              </div>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-5xl font-semibold tracking-tighter text-white">{price === null ? "Custom" : `$${price}`}</span>
                {price !== null && <span className="text-sm text-gray-500">{p.unit}</span>}
              </div>
              <p className="mt-2 text-sm text-gray-500">{p.blurb}</p>

              <ul className="my-8 flex-1 space-y-3">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-3 text-sm text-gray-300">
                    <Check className="mt-0.5 size-4 shrink-0 text-lilac" />
                    {f}
                  </li>
                ))}
              </ul>

              <Button variant={p.featured ? "default" : "outline"} className={cn(!p.featured && "bg-transparent")} asChild>
                <a href="#cta">{p.cta}</a>
              </Button>
            </div>
          );
        })}
      </div>
    </section>
  );
}
