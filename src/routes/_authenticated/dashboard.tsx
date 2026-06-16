import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { CarbonOrb } from "@/components/dashboard/CarbonOrb";
import { LivingEcosystem } from "@/components/dashboard/LivingEcosystem";
import { CoachPanel } from "@/components/dashboard/CoachPanel";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Your Mirror — GreenMirror" }] }),
  component: Dashboard,
});

interface Ctx {
  diet: string | null;
  transport: string | null;
  energy_source: string | null;
  home_type: string | null;
  household_size: number | null;
  climate_goal: string | null;
}

function Dashboard() {
  const navigate = useNavigate();
  const [name, setName] = useState<string>("");
  const [baseline, setBaseline] = useState<number | null>(null);
  const [ctx, setCtx] = useState<Ctx | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return;
      const [{ data: profile }, { data: ob }] = await Promise.all([
        supabase
          .from("profiles")
          .select("display_name, onboarding_completed")
          .eq("id", u.user.id)
          .maybeSingle(),
        supabase
          .from("onboarding_responses")
          .select(
            "baseline_kg_co2_per_month, diet, transport, energy_source, home_type, household_size, climate_goal",
          )
          .eq("user_id", u.user.id)
          .maybeSingle(),
      ]);
      if (profile && !profile.onboarding_completed) {
        navigate({ to: "/onboarding", replace: true });
        return;
      }
      setName(profile?.display_name ?? "Friend");
      setBaseline(ob?.baseline_kg_co2_per_month ?? null);
      setCtx({
        diet: ob?.diet ?? null,
        transport: ob?.transport ?? null,
        energy_source: ob?.energy_source ?? null,
        home_type: ob?.home_type ?? null,
        household_size: ob?.household_size ?? null,
        climate_goal: ob?.climate_goal ?? null,
      });
      setReady(true);
    })();
  }, [navigate]);

  const health = useMemo(() => {
    if (baseline == null) return 0.6;
    const ratio = Math.min(baseline / 417, 2); // 417 kg/mo ≈ 5 t/yr target
    return Math.max(0, 1 - ratio / 2);
  }, [baseline]);

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };

  return (
    <main className="min-h-dvh bg-background text-foreground">
      {/* aurora backdrop */}
      <div
        className="fixed inset-0 -z-10 opacity-50 pointer-events-none"
        style={{ background: "var(--gradient-aurora, radial-gradient(at 30% 20%, oklch(0.3 0.08 152 / 0.35), transparent 60%))" }}
        aria-hidden
      />

      <div className="max-w-6xl mx-auto px-6 py-12 lg:py-16 space-y-10">
        {/* header */}
        <header className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <span className="font-mono text-[10px] tracking-[0.3em] text-primary uppercase">
              Your Mirror
            </span>
            <h1 className="mt-3 text-4xl lg:text-5xl font-extrabold tracking-tight">
              {ready ? <>Welcome back, {name.split(" ")[0]}.</> : "Loading your mirror…"}
            </h1>
            <p className="mt-2 text-muted-foreground max-w-xl">
              Your world reflects your footprint. Watch it breathe.
            </p>
          </div>
          <Button variant="ghost" onClick={signOut} className="font-mono text-xs">
            Sign out
          </Button>
        </header>

        {/* orb + coach */}
        <section className="grid lg:grid-cols-[1fr_1fr] gap-6 lg:gap-10 items-stretch">
          <div className="rounded-2xl border border-border/60 bg-card/30 backdrop-blur p-8 flex flex-col items-center justify-center">
            <CarbonOrb value={baseline} />
            <p className="mt-6 font-mono text-[10px] tracking-widest uppercase text-muted-foreground text-center max-w-xs">
              Your carbon orb pulses to the rhythm of your monthly emissions.
            </p>
          </div>
          {ctx && <CoachPanel baselineKg={baseline} context={ctx} />}
        </section>

        {/* ecosystem */}
        <section className="space-y-4">
          <div className="flex items-baseline justify-between flex-wrap gap-2">
            <h2 className="text-2xl font-bold tracking-tight">Living ecosystem</h2>
            <span className="font-mono text-[10px] tracking-[0.3em] uppercase text-muted-foreground">
              Health · {Math.round(health * 100)}%
            </span>
          </div>
          <LivingEcosystem health={health} />
          <p className="text-sm text-muted-foreground max-w-2xl">
            Each habit you log shapes this world — trees thicken, fireflies return, mist lifts.
            Daily reflection and wildlife unlocks arrive next.
          </p>
        </section>
      </div>
    </main>
  );
}
