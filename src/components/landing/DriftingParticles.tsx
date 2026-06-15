import { useMemo } from "react";

/**
 * Subtle CSS-only drifting spore particles. No WebGL needed.
 */
export function DriftingParticles({ count = 28 }: { count?: number }) {
  const particles = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        size: 1 + Math.random() * 3,
        delay: Math.random() * 20,
        duration: 18 + Math.random() * 22,
        opacity: 0.25 + Math.random() * 0.55,
      })),
    [count],
  );

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 overflow-hidden motion-reduce:hidden"
    >
      {particles.map((p) => (
        <span
          key={p.id}
          className="absolute bottom-0 rounded-full bg-primary blur-[1px]"
          style={{
            left: `${p.left}%`,
            width: `${p.size}px`,
            height: `${p.size}px`,
            opacity: p.opacity,
            animation: `gm-drift ${p.duration}s linear ${p.delay}s infinite`,
            boxShadow: "0 0 8px var(--color-primary)",
          }}
        />
      ))}
    </div>
  );
}
