import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const logSchema = z.object({
  transport_mode: z.enum(["walk_bike", "transit", "car", "long_drive", "flight"]),
  meals: z.enum(["plant_based", "mixed", "meat_heavy"]),
  energy_mindful: z.boolean(),
  water_mindful: z.boolean(),
  waste_mindful: z.boolean(),
  mood: z.enum(["renewed", "steady", "heavy"]),
  notes: z.string().max(500).optional().nullable(),
});

// rough per-day kg CO2 estimates (illustrative, not scientific)
const TRANSPORT_KG: Record<string, number> = {
  walk_bike: 0,
  transit: 1.2,
  car: 4.6,
  long_drive: 11,
  flight: 90,
};
const MEALS_KG: Record<string, number> = {
  plant_based: 1.7,
  mixed: 3.2,
  meat_heavy: 6.1,
};

export const logReflection = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: z.infer<typeof logSchema>) => logSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const today = new Date().toISOString().slice(0, 10);

    const energy = data.energy_mindful ? -0.6 : 0.4;
    const water = data.water_mindful ? -0.2 : 0.1;
    const waste = data.waste_mindful ? -0.3 : 0.2;
    const kg =
      TRANSPORT_KG[data.transport_mode] +
      MEALS_KG[data.meals] +
      energy + water + waste;

    // baseline daily: monthly / 30
    const { data: ob } = await supabase
      .from("onboarding_responses")
      .select("baseline_kg_co2_per_month")
      .eq("user_id", userId)
      .maybeSingle();
    const baselineDaily =
      ob?.baseline_kg_co2_per_month != null
        ? Number(ob.baseline_kg_co2_per_month) / 30
        : 15;
    const delta = baselineDaily - kg; // positive = better than baseline

    const { data: reflection, error } = await supabase
      .from("daily_reflections")
      .upsert(
        {
          user_id: userId,
          reflection_date: today,
          transport_mode: data.transport_mode,
          meals: data.meals,
          energy_mindful: data.energy_mindful,
          water_mindful: data.water_mindful,
          waste_mindful: data.waste_mindful,
          mood: data.mood,
          notes: data.notes ?? null,
          estimated_kg_co2_today: kg,
          ecosystem_delta: delta,
        },
        { onConflict: "user_id,reflection_date" },
      )
      .select()
      .single();
    if (error) throw new Error(error.message);

    const { data: streak, error: streakErr } = await supabase.rpc(
      "upsert_streak_for_user",
      { _user_id: userId, _today: today },
    );
    if (streakErr) throw new Error(streakErr.message);

    return { reflection, streak, kg, delta };
  });

export const getTodayContext = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const today = new Date().toISOString().slice(0, 10);
    const [{ data: reflection }, { data: streak }] = await Promise.all([
      supabase
        .from("daily_reflections")
        .select("*")
        .eq("user_id", userId)
        .eq("reflection_date", today)
        .maybeSingle(),
      supabase.from("streaks").select("*").eq("user_id", userId).maybeSingle(),
    ]);
    return { reflection, streak };
  });
