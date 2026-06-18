import { memo, useMemo } from "react";

interface Props {
  /** 0 (collapsed) → 1 (flourishing) */
  health: number;
}

/**
 * LivingEcosystem — SVG biome that morphs with the user's footprint health.
 * Trees, mist, wildlife dots appear progressively. CSS-only motion.
 */
export const LivingEcosystem = memo(function LivingEcosystem({ health }: Props) {
  const h = Math.max(0, Math.min(1, health));

  const trees = useMemo(() => {
    const count = Math.round(4 + h * 14); // 4 → 18
    return Array.from({ length: count }, (_, i) => {
      const x = (i / count) * 100 + (Math.sin(i * 9.1) * 3);
      const scale = 0.6 + ((i * 37) % 100) / 250 + h * 0.4;
      const depth = ((i * 53) % 100) / 100; // 0 far → 1 near
      return { x, scale, depth, key: i };
    });
  }, [h]);

  const skyTop = `oklch(${0.22 + h * 0.08} 0.04 ${200 - h * 40})`;
  const skyMid = `oklch(${0.30 + h * 0.06} 0.06 ${180 - h * 30})`;
  const ground = `oklch(${0.22 + h * 0.05} 0.06 ${150})`;
  const canopy = `oklch(${0.55 + h * 0.2} 0.12 152)`;
  const trunk = `oklch(0.32 0.04 50)`;

  return (
    <div className="relative w-full aspect-[16/9] rounded-2xl overflow-hidden border border-border/60 bg-card/40">
      <svg viewBox="0 0 320 180" className="w-full h-full" preserveAspectRatio="xMidYMid slice">
        <defs>
          <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={skyTop} />
            <stop offset="100%" stopColor={skyMid} />
          </linearGradient>
          <radialGradient id="sun" cx="78%" cy="22%" r="22%">
            <stop offset="0%" stopColor={`oklch(0.92 0.14 ${75 + h * 60})`} stopOpacity={0.9} />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>
          <linearGradient id="ground" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={ground} />
            <stop offset="100%" stopColor="oklch(0.14 0.02 150)" />
          </linearGradient>
        </defs>

        <rect width="320" height="180" fill="url(#sky)" />
        <rect width="320" height="180" fill="url(#sun)" />

        {/* distant hills */}
        <path
          d={`M0,120 Q60,${110 - h * 10} 120,118 T240,114 T320,120 L320,180 L0,180 Z`}
          fill={`oklch(${0.20 + h * 0.04} 0.05 160)`}
          opacity="0.85"
        />
        <path
          d={`M0,135 Q70,${122 - h * 8} 140,132 T280,130 T320,134 L320,180 L0,180 Z`}
          fill={`oklch(${0.24 + h * 0.05} 0.06 150)`}
          opacity="0.9"
        />

        {/* trees */}
        {trees.map((t) => {
          const baseY = 140 + t.depth * 28;
          const scale = t.scale * (0.7 + t.depth * 0.6);
          const x = t.x * 3.2;
          const trunkW = 1.2 * scale;
          const trunkH = 10 * scale;
          const canopyR = 6 * scale;
          return (
            <g
              key={t.key}
              transform={`translate(${x} ${baseY})`}
              opacity={0.55 + t.depth * 0.45}
              style={{
                transformOrigin: `${x}px ${baseY}px`,
                animation: `gm-drift ${10 + (t.key % 5)}s ease-in-out ${t.key * 0.13}s infinite`,
              }}
            >
              <rect x={-trunkW / 2} y={-trunkH} width={trunkW} height={trunkH} fill={trunk} />
              <circle cx="0" cy={-trunkH - canopyR * 0.7} r={canopyR} fill={canopy} />
              <circle
                cx={canopyR * 0.6}
                cy={-trunkH - canopyR * 0.9}
                r={canopyR * 0.8}
                fill={canopy}
                opacity="0.9"
              />
              <circle
                cx={-canopyR * 0.6}
                cy={-trunkH - canopyR * 0.9}
                r={canopyR * 0.8}
                fill={canopy}
                opacity="0.9"
              />
            </g>
          );
        })}

        {/* foreground ground */}
        <rect y="150" width="320" height="30" fill="url(#ground)" />

        {/* wildlife: fireflies unlock with health */}
        {h > 0.5 &&
          Array.from({ length: Math.round((h - 0.5) * 20) }, (_, i) => (
            <circle
              key={`fly-${i}`}
              cx={20 + ((i * 37) % 280)}
              cy={60 + ((i * 53) % 70)}
              r="1.2"
              fill="oklch(0.95 0.16 90)"
              opacity="0.85"
            >
              <animate
                attributeName="opacity"
                values="0.15;0.95;0.15"
                dur={`${3 + (i % 3)}s`}
                repeatCount="indefinite"
                begin={`${(i % 5) * 0.4}s`}
              />
            </circle>
          ))}

        {/* mist when strained */}
        {h < 0.5 && (
          <rect
            width="320"
            height="180"
            fill="oklch(0.85 0.04 65)"
            opacity={(0.5 - h) * 0.6}
            style={{ mixBlendMode: "screen" }}
          />
        )}
      </svg>
    </div>
  );
});
