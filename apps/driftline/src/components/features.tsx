import { ArrowDownToLine, DollarSign, Network, ShieldCheck, TrendingUp } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function SectionHead({ eyebrow, title, children }: { eyebrow: string; title: string; children?: ReactNode }) {
  return (
    <div className="mx-auto mb-14 max-w-2xl text-center">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-lilac">{eyebrow}</p>
      <h2 className="mt-4 text-balance bg-gradient-to-br from-white from-30% to-white/50 bg-clip-text text-4xl font-semibold tracking-tighter text-transparent md:text-5xl">
        {title}
      </h2>
      {children && <p className="mt-4 text-balance text-lg tracking-tight text-gray-400">{children}</p>}
    </div>
  );
}

function Card({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.04] to-transparent p-7 transition-colors hover:border-white/20",
        className,
      )}
    >
      {children}
    </div>
  );
}

function CardTitle({ step, icon, title, body }: { step?: string; icon: ReactNode; title: string; body: string }) {
  return (
    <>
      <div className="mb-5 flex items-center justify-between">
        <span className="grid size-9 place-items-center rounded-lg border border-white/10 bg-white/[0.03] text-lilac">{icon}</span>
        {step && <span className="font-mono text-xs text-gray-600">{step}</span>}
      </div>
      <h3 className="text-lg font-medium tracking-tight text-white">{title}</h3>
      <p className="mt-2 text-[15px] leading-relaxed text-gray-400">{body}</p>
    </>
  );
}

const sources = ["Slack", "Intercom", "Zendesk", "Gong", "App Store", "HubSpot"];
const clusters = [
  { label: "Dark mode", n: 312 },
  { label: "CSV export", n: 201 },
  { label: "Load time", n: 148 },
  { label: "SSO", n: 96 },
];
const bars = [38, 52, 44, 67, 58, 81, 92];

export function Features() {
  return (
    <section id="features" className="mx-auto max-w-6xl scroll-mt-24 px-6 py-28 md:py-36">
      <SectionHead eyebrow="How it works" title="From noise to roadmap in three steps">
        Stop pasting screenshots into docs. Driftline does the collecting, clustering, and prioritizing for you.
      </SectionHead>

      <div className="grid gap-4 md:grid-cols-6">
        <Card className="md:col-span-2">
          <CardTitle
            step="01"
            icon={<ArrowDownToLine className="size-4" />}
            title="Capture everything"
            body="One-click integrations pull feedback from support, sales calls, app reviews, and Slack — in real time."
          />
          <div className="mt-6 flex flex-wrap gap-2">
            {sources.map((s) => (
              <span key={s} className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs text-gray-300">
                {s}
              </span>
            ))}
          </div>
        </Card>

        <Card className="md:col-span-2">
          <CardTitle
            step="02"
            icon={<Network className="size-4" />}
            title="Cluster with AI"
            body="Thousands of raw comments become clean themes, tagged with sentiment and linked to accounts."
          />
          <div className="mt-6 space-y-2">
            {clusters.map((c, i) => (
              <div key={c.label} className="flex items-center gap-3 text-xs">
                <span className="w-20 text-gray-400">{c.label}</span>
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/[0.06]">
                  <div className="h-full rounded-full bg-lilac" style={{ width: `${(c.n / 312) * 100}%`, opacity: 1 - i * 0.2 }} />
                </div>
                <span className="w-8 text-right font-mono text-gray-500">{c.n}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="md:col-span-2">
          <CardTitle
            step="03"
            icon={<TrendingUp className="size-4" />}
            title="Rank by impact"
            body="Every theme is scored by reach, revenue, and effort — so the next sprint plans itself."
          />
          <div className="mt-6 flex h-[88px] items-end gap-2">
            {bars.map((h, i) => (
              <div
                key={i}
                className={cn("flex-1 rounded-t-sm", i === bars.length - 1 ? "bg-lilac" : "bg-white/10")}
                style={{ height: `${h}%` }}
              />
            ))}
          </div>
        </Card>

        <Card className="md:col-span-3">
          <CardTitle
            icon={<DollarSign className="size-4" />}
            title="Revenue-linked themes"
            body="Connect your CRM and see the ARR behind every request. Prioritize the fix that protects your biggest renewals, not the loudest thread."
          />
          <div className="mt-6 flex items-baseline gap-3">
            <span className="text-4xl font-semibold tracking-tighter text-white">$1.2M</span>
            <span className="text-sm text-gray-500">ARR attached to “Dark mode for mobile app”</span>
          </div>
        </Card>

        <Card className="md:col-span-3">
          <CardTitle
            icon={<ShieldCheck className="size-4" />}
            title="Enterprise-ready from day one"
            body="SOC 2 Type II, SSO/SAML, SCIM provisioning, and granular data retention. Customer data never trains shared models."
          />
          <div className="mt-6 flex flex-wrap gap-2 font-mono text-[11px] uppercase tracking-wider text-gray-400">
            {["SOC 2", "SAML", "SCIM", "GDPR"].map((b) => (
              <span key={b} className="rounded border border-white/10 px-2 py-1">
                {b}
              </span>
            ))}
          </div>
        </Card>
      </div>
    </section>
  );
}
