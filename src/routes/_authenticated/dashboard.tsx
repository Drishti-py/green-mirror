import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Your Mirror — GreenMirror" }] }),
  component: Dashboard,
});

function Dashboard() {
  const navigate = useNavigate();
  const [name, setName] = useState<string>("");
  const [baseline, setBaseline] = useState<number | null>(null);

  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return;
      const [{ data: profile }, { data: ob }] = await Promise.all([
        supabase.from("profiles").select("display_name, onboarding_completed").eq("id", u.user.id).maybeSingle(),
        supabase.from("onboarding_responses").select("baseline_kg_co2_per_month").eq("user_id", u.user.id).maybeSingle(),
      ]);
      if (profile && !profile.onboarding_completed) {
        navigate({ to: "/onboarding", replace: true });
        return;
      }
      setName(profile?.display_name ?? "Friend");
      setBaseline(ob?.baseline_kg_co2_per_month ?? null);
    })();
  }, [navigate]);

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };

  return (
    <main className="min-h-dvh bg-background text-foreground px-6 py-20">
      <div className="max-w-3xl mx-auto space-y-10">
        <div>
          <span className="font-mono text-[10px] tracking-[0.3em] text-primary uppercase">
            Your Mirror
          </span>
          <h1 className="mt-3 text-4xl font-extrabold tracking-tight">
            Welcome back, {name.split(" ")[0]}.
          </h1>
          <p className="mt-2 text-muted-foreground">
            Your living ecosystem is being built. This is the foundation.
          </p>
        </div>

        <div className="rounded-2xl border border-border/60 bg-card/40 backdrop-blur p-8">
          <span className="font-mono text-[10px] tracking-widest uppercase text-muted-foreground">
            Baseline footprint
          </span>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-5xl font-extrabold text-primary">
              {baseline ? Math.round(baseline) : "—"}
            </span>
            <span className="font-mono text-xs text-muted-foreground">kg CO₂ / month</span>
          </div>
          <p className="mt-4 text-sm text-muted-foreground max-w-prose">
            Your full ecosystem, AI coach, and daily reflection arrive in the next milestone.
          </p>
        </div>

        <Button variant="outline" onClick={signOut}>Sign out</Button>
      </div>
    </main>
  );
}
