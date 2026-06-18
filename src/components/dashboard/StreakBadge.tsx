import { memo } from "react";

interface Props {
  current: number;
  longest: number;
  total: number;
}

export const StreakBadge = memo(function StreakBadge({ current, longest, total }: Props) {
  return (
    <div className="inline-flex items-center gap-4 rounded-full border border-border/60 bg-card/40 backdrop-blur px-5 py-2.5">
      <div className="flex items-center gap-2">
        <span
          className="inline-block w-2 h-2 rounded-full bg-primary"
          style={{ animation: "gm-pulse-dot 2.2s ease-in-out infinite" }}
          aria-hidden
        />
        <span className="font-mono text-[10px] tracking-[0.25em] uppercase text-muted-foreground">
          Streak
        </span>
        <span className="text-lg font-bold tabular-nums">{current}</span>
        <span className="text-xs text-muted-foreground">day{current === 1 ? "" : "s"}</span>
      </div>
      <span className="text-border">·</span>
      <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-muted-foreground">
        Best {longest} · Total {total}
      </span>
    </div>
  );
});
