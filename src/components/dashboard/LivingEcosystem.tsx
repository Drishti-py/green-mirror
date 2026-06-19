import { memo, useMemo } from "react";

interface Props {
  /** 0 (collapsed) → 1 (flourishing) */
  health: number;
}

/** Smooth bell weight peaking at center, used to cross-fade ecosystem states. */
function band(value: number, center: number, width: number) {
  const d = (value - center) / width;
  return Math.max(0, 1 - d * d);
}

/**
 * LivingEcosystem — a cinematic SVG biome that morphs dramatically with the
 * user's footprint health. Five cross-faded states: industrial wasteland →
 * polluted city → balanced grove → flourishing forest → paradise.
 *
 * Each state contributes a weighted opacity layer so transitions feel
 * continuous. CSS animations drive smoke, rain, sun rays, butterflies,
 * fireflies, birds and drifting clouds.
 */
export const LivingEcosystem = memo(function LivingEcosystem({ health }: Props) {
  const h = Math.max(0, Math.min(1, health));

  // State weights — each state peaks at its center health value.
  const wIndustrial = band(h, 0.0, 0.28);
  const wPolluted = band(h, 0.28, 0.28);
  const wBalanced = band(h, 0.55, 0.25);
  const wFlourishing = band(h, 0.78, 0.22);
  const wParadise = band(h, 1.0, 0.25);

  // Sky shifts from toxic orange/grey through dawn into vivid blue.
  const skyTop = `oklch(${0.18 + h * 0.55} ${0.05 + h * 0.04} ${50 + h * 180})`;
  const skyMid = `oklch(${0.28 + h * 0.4} ${0.06 + h * 0.05} ${40 + h * 170})`;
  const sunHue = 75 + h * 50;
  const sunChroma = 0.1 + h * 0.16;
  const sunLight = 0.55 + h * 0.4;
  const groundTop = `oklch(${0.18 + h * 0.18} ${0.03 + h * 0.08} ${60 + h * 90})`;
  const groundBot = `oklch(${0.1 + h * 0.1} ${0.02 + h * 0.06} ${60 + h * 90})`;

  // Trees scale from a few dead trunks to a lush canopy.
  const trees = useMemo(() => {
    const count = Math.round(3 + h * 22);
    return Array.from({ length: count }, (_, i) => {
      const seed = i * 9301 + 49297;
      const r1 = ((seed * 233) % 1000) / 1000;
      const r2 = ((seed * 977) % 1000) / 1000;
      const x = (i / Math.max(1, count - 1)) * 100 + (r1 - 0.5) * 6;
      const depth = r2;
      const scale = 0.55 + r1 * 0.5 + h * 0.45;
      return { x, depth, scale, key: i, sway: 6 + (i % 7), delay: r2 * 4 };
    });
  }, [h]);

  // Smoke stacks (industrial). Bushes / flowers (healthy).
  const smokeCount = Math.round(wIndustrial * 4 + wPolluted * 2);
  const flowerCount = Math.round((wFlourishing + wParadise) * 26);
  const butterflyCount = Math.round(wParadise * 6 + wFlourishing * 3);
  const fireflyCount = Math.round((wFlourishing + wParadise * 1.2) * 14);
  const birdCount = Math.round((wBalanced + wFlourishing + wParadise) * 4);
  const cloudCount = Math.round(2 + wParadise * 3);
  const rainCount = Math.round(wPolluted * 36);

  return (
    <div
      className="relative w-full aspect-[16/9] rounded-2xl overflow-hidden border border-border/60"
      style={{
        background: `linear-gradient(180deg, ${skyTop}, ${skyMid})`,
        transition: "background 1.6s var(--ease-in-out-soft)",
      }}
      aria-label={`Ecosystem health ${(h * 100).toFixed(0)} percent`}
    >
      {/* Sun / moon halo — color & position drift with health */}
      <div
        className="absolute pointer-events-none animate-breathe"
        style={{
          width: "32%",
          height: "55%",
          left: `${10 + h * 60}%`,
          top: `${22 - h * 8}%`,
          background: `radial-gradient(circle, oklch(${sunLight} ${sunChroma} ${sunHue} / ${0.55 + h * 0.4}) 0%, transparent 65%)`,
          filter: "blur(2px)",
          transition: "left 2s var(--ease-in-out-soft), top 2s var(--ease-in-out-soft), background 1.6s ease",
        }}
      />

      {/* Sun rays at high health */}
      {wParadise > 0.05 && (
        <div
          className="absolute inset-0 pointer-events-none gm-sunrays"
          style={{ opacity: wParadise * 0.55 }}
        />
      )}

      {/* Smog overlay — thick at low health, gone at high */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at 50% 70%, oklch(0.7 0.06 60 / 0.55), transparent 60%)",
          opacity: wIndustrial * 0.85 + wPolluted * 0.55,
          mixBlendMode: "multiply",
          transition: "opacity 1.6s ease",
        }}
      />

      {/* Drifting clouds */}
      {Array.from({ length: cloudCount }, (_, i) => (
        <div
          key={`cloud-${i}`}
          className="absolute gm-cloud"
          style={{
            top: `${8 + i * 9}%`,
            width: `${22 + (i % 3) * 8}%`,
            height: `${8 + (i % 2) * 4}%`,
            background: `oklch(${0.7 + h * 0.2} 0.02 240 / ${0.25 + wParadise * 0.5 + wFlourishing * 0.3})`,
            borderRadius: "999px",
            filter: "blur(8px)",
            animationDuration: `${60 + i * 14}s`,
            animationDelay: `${i * -12}s`,
          }}
        />
      ))}

      {/* Rain (acid rain at polluted state) */}
      {rainCount > 0 && (
        <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 320 180">
          {Array.from({ length: rainCount }, (_, i) => (
            <line
              key={`rain-${i}`}
              x1={(i * 17) % 320}
              x2={((i * 17) % 320) - 4}
              y1={-10}
              y2={6}
              stroke={`oklch(0.7 0.05 220 / ${0.35 * wPolluted})`}
              strokeWidth="0.8"
              strokeLinecap="round"
            >
              <animateTransform
                attributeName="transform"
                type="translate"
                from="0 0"
                to="-20 200"
                dur={`${0.6 + (i % 5) * 0.15}s`}
                repeatCount="indefinite"
                begin={`${(i % 9) * -0.1}s`}
              />
            </line>
          ))}
        </svg>
      )}

      <svg viewBox="0 0 320 180" className="absolute inset-0 w-full h-full" preserveAspectRatio="xMidYMid slice">
        <defs>
          <linearGradient id="gm-ground" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={groundTop} />
            <stop offset="100%" stopColor={groundBot} />
          </linearGradient>
          <linearGradient id="gm-river" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={`oklch(0.55 0.12 220 / ${0.6 + wParadise * 0.3})`} />
            <stop offset="100%" stopColor={`oklch(0.7 0.14 200 / ${0.6 + wParadise * 0.3})`} />
          </linearGradient>
        </defs>

        {/* Distant mountain silhouette */}
        <path
          d={`M0,118 L40,98 L70,108 L110,86 L150,104 L200,90 L250,108 L300,94 L320,108 L320,180 L0,180 Z`}
          fill={`oklch(${0.18 + h * 0.06} 0.04 ${200 - h * 30})`}
          opacity={0.7}
        />

        {/* Mid hills */}
        <path
          d={`M0,128 Q60,${118 - h * 8} 120,126 T240,122 T320,128 L320,180 L0,180 Z`}
          fill={`oklch(${0.2 + h * 0.05} 0.05 ${160 - h * 10})`}
          opacity="0.85"
        />

        {/* INDUSTRIAL: factories & smokestacks */}
        <g opacity={wIndustrial} style={{ transition: "opacity 1.6s ease" }}>
          {[0, 1, 2].map((i) => (
            <g key={`fac-${i}`} transform={`translate(${30 + i * 90} 132)`}>
              <rect x="-18" y="-22" width="36" height="22" fill="oklch(0.22 0.02 50)" />
              <rect x="-4" y="-34" width="6" height="14" fill="oklch(0.18 0.02 50)" />
              <rect x="8" y="-30" width="5" height="10" fill="oklch(0.18 0.02 50)" />
              <rect x="-14" y="-16" width="4" height="4" fill={`oklch(0.7 0.18 60 / 0.7)`} />
              <rect x="-6" y="-16" width="4" height="4" fill={`oklch(0.7 0.18 60 / 0.7)`} />
              <rect x="2" y="-16" width="4" height="4" fill={`oklch(0.7 0.18 60 / 0.7)`} />
            </g>
          ))}
          {/* Cracked dead earth tone */}
          <path
            d="M0,150 L320,150 L320,180 L0,180 Z"
            fill="oklch(0.22 0.04 50)"
          />
        </g>

        {/* Smoke columns */}
        {Array.from({ length: smokeCount }, (_, i) => (
          <g key={`smoke-${i}`}>
            {[0, 1, 2].map((j) => (
              <circle
                key={j}
                cx={32 + i * 90}
                cy={98 - j * 6}
                r={4 + j}
                fill={`oklch(0.45 0.02 60 / ${(0.5 - j * 0.1) * (wIndustrial * 0.9 + wPolluted * 0.5)})`}
                style={{
                  transformOrigin: `${32 + i * 90}px ${98 - j * 6}px`,
                  animation: `gm-smoke ${5 + j}s ease-in-out ${i * 0.4 + j * 0.6}s infinite`,
                }}
              />
            ))}
          </g>
        ))}

        {/* River — appears at balanced+ */}
        <path
          d="M-10,158 Q80,150 160,160 T330,156 L330,164 Q160,170 -10,166 Z"
          fill="url(#gm-river)"
          opacity={wBalanced * 0.6 + wFlourishing * 0.9 + wParadise}
          style={{ transition: "opacity 1.6s ease" }}
        />

        {/* Foreground ground */}
        <rect y="150" width="320" height="30" fill="url(#gm-ground)" />

        {/* Trees */}
        {trees.map((t) => {
          const baseY = 148 + t.depth * 20;
          const scale = t.scale * (0.65 + t.depth * 0.55);
          const x = t.x * 3.2;
          const trunkW = 1.4 * scale;
          const trunkH = 11 * scale;
          const canopyR = 6.5 * scale;

          // Tree appearance morphs: dead stick → bare branches → green → lush
          const dead = wIndustrial;
          const bare = wPolluted;
          const green = wBalanced + wFlourishing;
          const lush = wParadise + wFlourishing * 0.6;

          const canopyColor = `oklch(${0.4 + h * 0.35} ${0.05 + h * 0.16} ${130 + h * 25})`;
          const trunkColor = `oklch(${0.22 + h * 0.1} ${0.03 + h * 0.04} ${40 + h * 20})`;

          return (
            <g
              key={t.key}
              transform={`translate(${x} ${baseY})`}
              opacity={0.55 + t.depth * 0.45}
              style={{
                transformOrigin: `${x}px ${baseY}px`,
                animation: `gm-sway ${t.sway}s ease-in-out ${t.delay}s infinite`,
              }}
            >
              {/* trunk */}
              <rect x={-trunkW / 2} y={-trunkH} width={trunkW} height={trunkH} fill={trunkColor} />

              {/* dead branches (industrial) */}
              <g opacity={dead}>
                <line x1="0" y1={-trunkH} x2={-canopyR * 0.8} y2={-trunkH - canopyR * 0.6} stroke={trunkColor} strokeWidth={trunkW * 0.6} />
                <line x1="0" y1={-trunkH} x2={canopyR * 0.7} y2={-trunkH - canopyR * 0.8} stroke={trunkColor} strokeWidth={trunkW * 0.6} />
              </g>

              {/* sparse canopy (polluted) */}
              <g opacity={bare * 0.8}>
                <circle cx="0" cy={-trunkH - canopyR * 0.5} r={canopyR * 0.55} fill={`oklch(0.45 0.05 80)`} />
              </g>

              {/* full green canopy */}
              <g opacity={Math.min(1, green)} style={{ transition: "opacity 1.6s ease" }}>
                <circle cx="0" cy={-trunkH - canopyR * 0.7} r={canopyR} fill={canopyColor} />
                <circle cx={canopyR * 0.6} cy={-trunkH - canopyR * 0.9} r={canopyR * 0.85} fill={canopyColor} />
                <circle cx={-canopyR * 0.6} cy={-trunkH - canopyR * 0.9} r={canopyR * 0.85} fill={canopyColor} />
                <circle cx="0" cy={-trunkH - canopyR * 1.3} r={canopyR * 0.75} fill={canopyColor} />
              </g>

              {/* lush highlights — bright dapples */}
              <g opacity={Math.min(1, lush)}>
                <circle cx={canopyR * 0.3} cy={-trunkH - canopyR * 1.2} r={canopyR * 0.35} fill={`oklch(0.85 0.18 140)`} />
                <circle cx={-canopyR * 0.4} cy={-trunkH - canopyR * 0.8} r={canopyR * 0.28} fill={`oklch(0.85 0.18 140)`} />
              </g>
            </g>
          );
        })}

        {/* Flowers / grass tufts */}
        {Array.from({ length: flowerCount }, (_, i) => {
          const x = (i * 11.7) % 320;
          const y = 156 + ((i * 7) % 18);
          const hue = [340, 30, 80, 280, 200][i % 5];
          return (
            <g key={`flower-${i}`} opacity={Math.min(1, wFlourishing + wParadise)}>
              <line x1={x} y1={y} x2={x} y2={y - 3} stroke="oklch(0.5 0.14 140)" strokeWidth="0.5" />
              <circle cx={x} cy={y - 3.5} r="1.1" fill={`oklch(0.85 0.2 ${hue})`} />
            </g>
          );
        })}

        {/* Birds */}
        {Array.from({ length: birdCount }, (_, i) => (
          <path
            key={`bird-${i}`}
            d="M0,0 q2,-2 4,0 q2,-2 4,0"
            stroke={`oklch(0.2 0.02 240)`}
            strokeWidth="0.8"
            fill="none"
            opacity={0.6 + wParadise * 0.4}
            style={{
              transformBox: "fill-box",
              animation: `gm-fly ${22 + i * 4}s linear ${i * -3}s infinite`,
            }}
            transform={`translate(${-20 + i * 80} ${30 + (i % 3) * 14})`}
          />
        ))}

        {/* Butterflies */}
        {Array.from({ length: butterflyCount }, (_, i) => (
          <circle
            key={`bf-${i}`}
            cx={40 + ((i * 53) % 240)}
            cy={110 + ((i * 31) % 30)}
            r="1.6"
            fill={`oklch(0.85 0.2 ${[20, 280, 50, 320][i % 4]})`}
            style={{
              transformOrigin: `${40 + ((i * 53) % 240)}px ${110 + ((i * 31) % 30)}px`,
              animation: `gm-flutter ${5 + (i % 4)}s ease-in-out ${i * 0.4}s infinite`,
            }}
          />
        ))}

        {/* Fireflies */}
        {Array.from({ length: fireflyCount }, (_, i) => (
          <circle
            key={`fly-${i}`}
            cx={20 + ((i * 37) % 280)}
            cy={70 + ((i * 53) % 60)}
            r="1.2"
            fill={`oklch(0.95 0.18 95)`}
          >
            <animate
              attributeName="opacity"
              values="0.1;0.95;0.1"
              dur={`${3 + (i % 3)}s`}
              repeatCount="indefinite"
              begin={`${(i % 5) * 0.4}s`}
            />
          </circle>
        ))}
      </svg>

      {/* Heat-haze shimmer at industrial / polluted states */}
      {(wIndustrial + wPolluted) > 0.1 && (
        <div
          className="absolute inset-x-0 bottom-0 h-1/3 pointer-events-none gm-haze"
          style={{ opacity: (wIndustrial + wPolluted) * 0.35 }}
        />
      )}

      {/* Paradise sparkle vignette */}
      {wParadise > 0.05 && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse at 50% 60%, transparent 50%, oklch(0.95 0.18 95 / 0.08) 100%)",
            opacity: wParadise,
          }}
        />
      )}
    </div>
  );
});
