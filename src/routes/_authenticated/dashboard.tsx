import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { CarbonOrb } from "@/components/dashboard/CarbonOrb";
import { ReflectionRitual } from "@/components/dashboard/ReflectionRitual";
import { StreakBadge } from "@/components/dashboard/StreakBadge";
import { getTodayContext } from "@/lib/reflection.functions";

// Lazy-load heavy panels: AI Coach (server-fn chat) and the SVG ecosystem
// biome only render when their data is ready, so deferring them keeps the
// initial dashboard bundle small.
const LivingEcosystem = lazy(() =>
  import("@/components/dashboard/LivingEcosystem").then((m) => ({
    default: m.LivingEcosystem,
  })),
);
const CoachPanel = lazy(() =>
  import("@/components/dashboard/CoachPanel").then((m) => ({ default: m.CoachPanel })),
);

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

type Reflection = {
  transport_mode: string | null;
  meals: string | null;
  energy_mindful: boolean | null;
  water_mindful: boolean | null;
  waste_mindful: boolean | null;
  mood: string | null;
  notes: string | null;
  ecosystem_delta: number | null;
} | null;

type Streak = {
  current_streak: number;
  longest_streak: number;
  total_reflections: number;
} | null;

function Dashboard() {
  const navigate = useNavigate();
  const fetchToday = useServerFn(getTodayContext);
  const [name, setName] = useState<string>("");
  const [baseline, setBaseline] = useState<number | null>(null);
  const [ctx, setCtx] = useState<Ctx | null>(null);
  const [ready, setReady] = useState(false);
  const [reflection, setReflection] = useState<Reflection>(null);
  const [streak, setStreak] = useState<Streak>(null);
  const [todayDelta, setTodayDelta] = useState<number | null>(null);

  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return;
      const [{ data: profile }, { data: ob }, today] = await Promise.all([
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
        fetchToday().catch(() => ({ reflection: null, streak: null })),
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
      setReflection((today?.reflection as Reflection) ?? null);
      setStreak((today?.streak as Streak) ?? null);
      setTodayDelta(today?.reflection?.ecosystem_delta ?? null);
      setReady(true);
    })();
  }, [navigate, fetchToday]);

  const baselineHealth = useMemo(() => {
    if (baseline == null) return 0.6;
    const ratio = Math.min(baseline / 417, 2);
    return Math.max(0, 1 - ratio / 2);
  }, [baseline]);

  // Today's reflection nudges health up or down a touch in real time.
  const health = useMemo(() => {
    if (todayDelta == null) return baselineHealth;
    const nudge = Math.max(-0.18, Math.min(0.18, todayDelta / 30));
    return Math.max(0, Math.min(1, baselineHealth + nudge));
  }, [baselineHealth, todayDelta]);

  const handleLogged = useCallback(
    (delta: number) => {
      setTodayDelta(delta);
      // optimistic streak bump if first log today
      if (!reflection) {
        setStreak((s) => ({
          current_streak: (s?.current_streak ?? 0) + 1,
          longest_streak: Math.max(s?.longest_streak ?? 0, (s?.current_streak ?? 0) + 1),
          total_reflections: (s?.total_reflections ?? 0) + 1,
        }));
        setReflection({
          transport_mode: null,
          meals: null,
          energy_mindful: null,
          water_mindful: null,
          waste_mindful: null,
          mood: null,
          notes: null,
          ecosystem_delta: delta,
        });
      }
    },
    [reflection],
  );

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };

  return (
    <main className="min-h-dvh bg-background text-foreground">
      <div
        className="fixed inset-0 -z-10 opacity-50 pointer-events-none"
        style={{
          background:
            "var(--gradient-aurora, radial-gradient(at 30% 20%, oklch(0.3 0.08 152 / 0.35), transparent 60%))",
        }}
        aria-hidden
      />

      <div className="max-w-6xl mx-auto px-6 py-12 lg:py-16 space-y-10">
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
          <div className="flex items-center gap-3 flex-wrap">
            {streak && (
              <StreakBadge
                current={streak.current_streak}
                longest={streak.longest_streak}
                total={streak.total_reflections}
              />
            )}
            <Link to="/profile">
              <Button variant="ghost" className="font-mono text-xs">
                Profile
              </Button>
            </Link>
            <Button variant="ghost" onClick={signOut} className="font-mono text-xs">
              Sign out
            </Button>
          </div>
        </header>

        <section className="grid lg:grid-cols-[1fr_1fr] gap-6 lg:gap-10 items-stretch">
          <div className="rounded-2xl border border-border/60 bg-card/30 backdrop-blur p-8 flex flex-col items-center justify-center">
            <CarbonOrb value={baseline} />
            <p className="mt-6 font-mono text-[10px] tracking-widest uppercase text-muted-foreground text-center max-w-xs">
              Your carbon orb pulses to the rhythm of your monthly emissions.
            </p>
          </div>
          {ctx && (
            <Suspense
              fallback={
                <div className="rounded-2xl border border-border/60 bg-card/40 min-h-[420px] animate-pulse" />
              }
            >
              <CoachPanel baselineKg={baseline} context={ctx} />
            </Suspense>
          )}
        </section>

        <section className="grid lg:grid-cols-[1fr_1fr] gap-6 lg:gap-10 items-stretch">
          <div className="rounded-2xl border border-border/60 bg-card/30 backdrop-blur p-8 flex flex-col items-center justify-center">
            <CarbonOrb value={baseline} />
            <p className="mt-6 font-mono text-[10px] tracking-widest uppercase text-muted-foreground text-center max-w-xs">
              Your carbon orb pulses to the rhythm of your monthly emissions.
            </p>
          </div>
          {ctx && <CoachPanel baselineKg={baseline} context={ctx} />}
        </section>

        <section className="grid lg:grid-cols-[1.1fr_1fr] gap-6 lg:gap-10 items-start">
          <ReflectionRitual initial={reflection} onLogged={handleLogged} />
          <div className="space-y-4">
            <div className="flex items-baseline justify-between flex-wrap gap-2">
              <h2 className="text-2xl font-bold tracking-tight">Living ecosystem</h2>
              <span className="font-mono text-[10px] tracking-[0.3em] uppercase text-muted-foreground">
                Health · {Math.round(health * 100)}%
              </span>
            </div>
            <LivingEcosystem health={health} />
            <p className="text-sm text-muted-foreground">
              {todayDelta == null
                ? "Each habit you log shapes this world — trees thicken, fireflies return, mist lifts."
                : todayDelta >= 0
                  ? `Today you spared ${todayDelta.toFixed(1)} kg CO₂. The canopy thickens.`
                  : `Today ran ${Math.abs(todayDelta).toFixed(1)} kg over baseline. The mist returns.`}
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
