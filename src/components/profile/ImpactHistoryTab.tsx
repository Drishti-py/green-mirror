import { memo, useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { getImpactHistory, type HistoryPoint } from "@/lib/profile-stats.functions";

type Range = "week" | "month" | "all";

function ImpactHistoryTabImpl({ baselineKg }: { baselineKg: number | null }) {
  const fetchHistory = useServerFn(getImpactHistory);
  const [points, setPoints] = useState<HistoryPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState<Range>("month");

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const list = await fetchHistory();
        if (active) setPoints(list);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [fetchHistory]);

  const filtered = useMemo(() => {
    if (range === "all") return points;
    const now = Date.now();
    const cutoff = range === "week" ? now - 7 * 86400000 : now - 30 * 86400000;
    return points.filter((p) => new Date(p.date).getTime() >= cutoff);
  }, [points, range]);

  const summary = useMemo(() => {
    const totalDelta = filtered.reduce((s, p) => s + p.delta, 0);
    const avgKg =
      filtered.length === 0
        ? 0
        : filtered.reduce((s, p) => s + p.kg, 0) / filtered.length;
    const avgHealth =
      filtered.length === 0
        ? 0
        : filtered.reduce((s, p) => s + p.health, 0) / filtered.length;
    return { totalDelta, avgKg, avgHealth, days: filtered.length };
  }, [filtered]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold tracking-tight">How your ecosystem evolved</h2>
          <p className="text-sm text-muted-foreground">
            Each bar is a day. Green rises when you save carbon; amber when you exceed baseline.
          </p>
        </div>
        <div className="flex gap-2">
          {(["week", "month", "all"] as Range[]).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`px-3 py-1.5 rounded-full text-xs font-mono uppercase tracking-widest border transition-colors ${
                range === r
                  ? "bg-primary/15 border-primary/60 text-primary"
                  : "bg-background/40 border-border/60 text-muted-foreground"
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Summary tiles */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat label="Days logged" value={`${summary.days}`} />
        <Stat
          label="Avg daily CO₂"
          value={`${summary.avgKg.toFixed(1)} kg`}
        />
        <Stat
          label="Net vs baseline"
          value={`${summary.totalDelta >= 0 ? "+" : ""}${summary.totalDelta.toFixed(1)} kg`}
          accent={summary.totalDelta >= 0 ? "good" : "bad"}
        />
        <Stat label="Avg health" value={`${Math.round(summary.avgHealth * 100)}%`} />
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading history…</p>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border/60 p-10 text-center text-muted-foreground">
          No reflections logged in this range yet.
        </div>
      ) : (
        <Chart points={filtered} baselineKg={baselineKg} />
      )}

      {filtered.length > 0 && (
        <div className="space-y-2">
          <h3 className="font-bold tracking-tight">Daily log</h3>
          <ul className="space-y-1 text-sm">
            {[...filtered]
              .reverse()
              .slice(0, 30)
              .map((p) => (
                <li
                  key={p.date}
                  className="flex justify-between border-b border-border/30 py-2"
                >
                  <span className="font-mono text-xs text-muted-foreground">{p.date}</span>
                  <span>
                    {p.kg.toFixed(1)} kg ·{" "}
                    <span
                      className={p.delta >= 0 ? "text-primary" : "text-amber-400"}
                    >
                      {p.delta >= 0 ? "+" : ""}
                      {p.delta.toFixed(1)} kg
                    </span>
                  </span>
                </li>
              ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: "good" | "bad";
}) {
  return (
    <div className="rounded-2xl border border-border/60 bg-card/40 backdrop-blur p-4">
      <div className="font-mono text-[10px] tracking-[0.25em] uppercase text-muted-foreground">
        {label}
      </div>
      <div
        className={`mt-2 text-2xl font-extrabold ${
          accent === "good" ? "text-primary" : accent === "bad" ? "text-amber-400" : ""
        }`}
      >
        {value}
      </div>
    </div>
  );
}

const Chart = memo(function Chart({
  points,
  baselineKg,
}: {
  points: HistoryPoint[];
  baselineKg: number | null;
}) {
  const max = Math.max(0.1, ...points.map((p) => p.kg));
  const baseline = baselineKg ? baselineKg / 30 : null;
  const baseY = baseline ? 100 - Math.min(100, (baseline / max) * 100) : null;
  const barW = 100 / Math.max(points.length, 1);
  return (
    <div className="rounded-2xl border border-border/60 bg-card/40 backdrop-blur p-5">
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-48">
        {baseY != null && (
          <line
            x1="0"
            y1={baseY}
            x2="100"
            y2={baseY}
            stroke="oklch(0.7 0.05 80 / 0.5)"
            strokeWidth="0.3"
            strokeDasharray="1 1"
          />
        )}
        {points.map((p, i) => {
          const h = Math.min(100, (p.kg / max) * 100);
          const y = 100 - h;
          const color =
            p.delta >= 0 ? "oklch(0.65 0.18 152)" : "oklch(0.7 0.16 65)";
          return (
            <rect
              key={p.date}
              x={i * barW + barW * 0.15}
              y={y}
              width={barW * 0.7}
              height={h}
              fill={color}
              opacity="0.9"
            >
              <title>
                {p.date}: {p.kg.toFixed(1)} kg ({p.delta >= 0 ? "+" : ""}
                {p.delta.toFixed(1)} vs baseline)
              </title>
            </rect>
          );
        })}
      </svg>
      <div className="mt-2 flex justify-between font-mono text-[9px] tracking-widest uppercase text-muted-foreground">
        <span>{points[0]?.date}</span>
        {baseline != null && <span>Baseline · {baseline.toFixed(1)} kg/day</span>}
        <span>{points[points.length - 1]?.date}</span>
      </div>
    </div>
  );
});

export const ImpactHistoryTab = memo(ImpactHistoryTabImpl);
