import { useMemo } from "react";

interface Props {
  /** kg CO₂ / month — null when unknown */
  value: number | null;
  /** healthy target in kg CO₂ / month (default ~417 = 5 t/yr) */
  target?: number;
}

/**
 * CarbonOrb — animated glass sphere whose health/hue/glow reflects footprint.
 * Pure SVG + CSS; no WebGL. Respects prefers-reduced-motion via base styles.
 */
export function CarbonOrb({ value, target = 417 }: Props) {
  const { health, hue, label } = useMemo(() => {
    if (value == null) return { health: 0.6, hue: 152, label: "—" };
    // ratio: 0 (none) → 0.5 (target) → >1 (over)
    const ratio = Math.min(value / target, 2);
    const h = Math.max(0, 1 - ratio / 2); // 1 healthy → 0 strained
    // hue glides forest-green (152) → amber (75) → ember (35)
    const hue = 152 - (1 - h) * (152 - 35);
    const label =
      ratio < 0.7 ? "Thriving" : ratio < 1.1 ? "Balanced" : ratio < 1.5 ? "Strained" : "Critical";
    return { health: h, hue, label };
  }, [value, target]);

  const glow = `oklch(0.82 0.16 ${hue.toFixed(0)})`;
  const deep = `oklch(0.35 0.10 ${hue.toFixed(0)})`;

  return (
    <div className="relative aspect-square w-full max-w-[420px] mx-auto select-none">
      {/* aurora halo */}
      <div
        className="absolute inset-[-15%] rounded-full blur-3xl opacity-60 animate-[gm-breathe_6s_ease-in-out_infinite]"
        style={{ background: `radial-gradient(circle, ${glow} 0%, transparent 65%)` }}
        aria-hidden
      />
      <svg viewBox="0 0 200 200" className="relative w-full h-full">
        <defs>
          <radialGradient id="orb-surface" cx="38%" cy="32%" r="75%">
            <stop offset="0%" stopColor="white" stopOpacity="0.85" />
            <stop offset="25%" stopColor={glow} stopOpacity="0.55" />
            <stop offset="70%" stopColor={deep} stopOpacity="0.95" />
            <stop offset="100%" stopColor="black" stopOpacity="1" />
          </radialGradient>
          <radialGradient id="orb-rim" cx="50%" cy="50%" r="50%">
            <stop offset="85%" stopColor="transparent" />
            <stop offset="100%" stopColor={glow} stopOpacity="0.9" />
          </radialGradient>
          <filter id="orb-soft">
            <feGaussianBlur stdDeviation="0.4" />
          </filter>
        </defs>

        {/* main orb */}
        <circle cx="100" cy="100" r="78" fill="url(#orb-surface)" filter="url(#orb-soft)" />
        <circle cx="100" cy="100" r="78" fill="url(#orb-rim)" />

        {/* inner currents — drifting */}
        <g opacity={0.55} style={{ mixBlendMode: "screen" }}>
          <ellipse
            cx="100"
            cy={100 + (1 - health) * 14}
            rx="62"
            ry={20 + health * 18}
            fill={glow}
            opacity="0.35"
          >
            <animateTransform
              attributeName="transform"
              type="rotate"
              from="0 100 100"
              to="360 100 100"
              dur="22s"
              repeatCount="indefinite"
            />
          </ellipse>
          <ellipse cx="100" cy="100" rx="48" ry="24" fill={deep} opacity="0.45">
            <animateTransform
              attributeName="transform"
              type="rotate"
              from="360 100 100"
              to="0 100 100"
              dur="34s"
              repeatCount="indefinite"
            />
          </ellipse>
        </g>

        {/* specular highlight */}
        <ellipse cx="78" cy="70" rx="22" ry="12" fill="white" opacity="0.35" />
        <ellipse cx="72" cy="64" rx="6" ry="3" fill="white" opacity="0.8" />
      </svg>

      {/* center readout */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <span className="font-mono text-[10px] tracking-[0.3em] uppercase text-foreground/70">
          {label}
        </span>
        <span className="mt-1 text-5xl font-extrabold tracking-tight text-foreground drop-shadow">
          {value == null ? "—" : Math.round(value)}
        </span>
        <span className="font-mono text-[10px] tracking-widest text-foreground/60 mt-1">
          kg CO₂ / month
        </span>
      </div>
    </div>
  );
}
