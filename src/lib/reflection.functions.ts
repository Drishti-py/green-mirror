import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import { dailyEmissionsKg, ecosystemDelta } from "./carbon";

const logSchema = z.object({
  transport_mode: z.enum(["walk_bike", "transit", "car", "long_drive", "flight"]),
  meals: z.enum(["plant_based", "mixed", "meat_heavy"]),
  energy_mindful: z.boolean(),
  water_mindful: z.boolean(),
  waste_mindful: z.boolean(),
  mood: z.enum(["renewed", "steady", "heavy"]),
  notes: z.string().max(500).optional().nullable(),
});

export const logReflection = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: z.infer<typeof logSchema>) => logSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const today = new Date().toISOString().slice(0, 10);

    const kg = dailyEmissionsKg({
      transport: data.transport_mode,
      meals: data.meals,
      energy_mindful: data.energy_mindful,
      water_mindful: data.water_mindful,
      waste_mindful: data.waste_mindful,
    });

    const { data: ob } = await supabase
      .from("onboarding_responses")
      .select("baseline_kg_co2_per_month")
      .eq("user_id", userId)
      .maybeSingle();
    const delta = ecosystemDelta(
      kg,
      ob?.baseline_kg_co2_per_month != null ? Number(ob.baseline_kg_co2_per_month) : null,
    );

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
