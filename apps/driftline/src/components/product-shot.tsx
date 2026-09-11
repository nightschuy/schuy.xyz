import { Activity, Inbox, Map, Search, Sparkles, Users } from "lucide-react";
import { cn } from "@/lib/utils";

const nav = [
  { icon: Activity, label: "Insights", active: true },
  { icon: Inbox, label: "Feedback" },
  { icon: Map, label: "Roadmap" },
  { icon: Users, label: "Customers" },
];

const stats = [
  { k: "Feedback captured", v: "1,284", d: "+18% vs last week", up: true },
  { k: "Top theme velocity", v: "+42%", d: "Dark mode requests", up: true },
  { k: "Churn-risk mentions", v: "37", d: "−9% vs last week", up: false },
];

const themes = [
  { t: "Dark mode for mobile app", m: "312 mentions · 41 enterprise accounts", score: 88, tag: "Trending" },
  { t: "CSV export on reports", m: "201 mentions · 18 enterprise accounts", score: 61 },
  { t: "Slower load times after v2.4", m: "148 mentions · churn risk", score: 44, tag: "Risk" },
];

export function ProductShot() {
  return (
    <section id="product" className="relative z-10 mx-auto -mt-20 max-w-6xl scroll-mt-24 px-4 md:px-6 lg:-mt-28">
      <div
        role="img"
        aria-label="Driftline dashboard preview"
        className="overflow-hidden rounded-2xl border border-white/10 bg-[#0a0a0c]/95 text-left shadow-[0_-20px_120px_-20px_rgba(180,140,222,0.35)] backdrop-blur"
      >
        {/* Window chrome */}
        <div className="flex items-center gap-3 border-b border-white/10 px-4 py-3">
          <div className="flex gap-1.5">
            <i className="size-2.5 rounded-full bg-white/15" />
            <i className="size-2.5 rounded-full bg-white/15" />
            <i className="size-2.5 rounded-full bg-white/15" />
          </div>
          <div className="mx-auto flex items-center gap-2 rounded-md border border-white/5 bg-white/[0.03] px-3 py-1 font-mono text-[11px] text-gray-500">
            <Search className="size-3" /> app.driftline.io/insights
          </div>
        </div>

        <div className="grid md:grid-cols-[200px_1fr]">
          <aside className="flex gap-1 overflow-x-auto border-b border-white/10 p-3 md:flex-col md:border-r md:border-b-0">
            {nav.map(({ icon: Icon, label, active }) => (
              <div
                key={label}
                className={cn(
                  "flex items-center gap-2.5 whitespace-nowrap rounded-md px-3 py-2 text-[13px]",
                  active ? "bg-white/[0.07] text-white" : "text-gray-500",
                )}
              >
                <Icon className="size-4" />
                {label}
              </div>
            ))}
          </aside>

          <div className="p-5 md:p-7">
            <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
              <div>
                <h3 className="text-base font-medium text-white">This week's themes</h3>
                <p className="text-[13px] text-gray-500">1,284 pieces of feedback clustered into 6 themes</p>
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-lilac/30 bg-lilac/10 px-2.5 py-1 text-[11px] text-lilac">
                <Sparkles className="size-3" /> Auto-clustered 2m ago
              </span>
            </div>

            <div className="mb-6 grid gap-3 sm:grid-cols-3">
              {stats.map((s) => (
                <div key={s.k} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                  <div className="text-[11px] text-gray-500">{s.k}</div>
                  <div className="mt-1 text-2xl font-semibold tracking-tight text-white">{s.v}</div>
                  <div className={cn("mt-0.5 text-[11px]", s.up ? "text-emerald-400/90" : "text-rose-400/90")}>{s.d}</div>
                </div>
              ))}
            </div>

            <div className="divide-y divide-white/[0.06] rounded-xl border border-white/[0.06]">
              {themes.map((th) => (
                <div key={th.t} className="grid grid-cols-[1fr_auto] items-center gap-4 px-4 py-3.5">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 text-sm text-white">
                      <span className="truncate">{th.t}</span>
                      {th.tag && (
                        <span
                          className={cn(
                            "rounded px-1.5 py-px text-[10px]",
                            th.tag === "Risk" ? "bg-rose-500/10 text-rose-300" : "bg-lilac/10 text-lilac",
                          )}
                        >
                          {th.tag}
                        </span>
                      )}
                    </div>
                    <div className="truncate text-[12px] text-gray-500">{th.m}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="hidden h-1.5 w-28 overflow-hidden rounded-full bg-white/[0.06] sm:block">
                      <div className="h-full rounded-full bg-gradient-to-r from-lilac/40 to-lilac" style={{ width: `${th.score}%` }} />
                    </div>
                    <span className="w-6 text-right font-mono text-xs text-gray-400">{th.score}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
