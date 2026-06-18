import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export interface ProfileStats {
  documents_uploaded: number;
  assessments_completed: number;
  days_active: number;
  total_reflections: number;
  current_streak: number;
  longest_streak: number;
  carbon_saved_kg: number; // sum of positive deltas
  carbon_overshoot_kg: number; // abs sum of negative deltas
  baseline_kg_per_month: number | null;
  member_since: string | null;
}

export const getProfileStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<ProfileStats> => {
    const { supabase, userId } = context;
    const [{ data: profile }, { data: ob }, { data: streak }, { data: refls }, { count: docCount }] =
      await Promise.all([
        supabase.from("profiles").select("created_at").eq("id", userId).maybeSingle(),
        supabase
          .from("onboarding_responses")
          .select("baseline_kg_co2_per_month")
          .eq("user_id", userId)
          .maybeSingle(),
        supabase
          .from("streaks")
          .select("current_streak, longest_streak, total_reflections")
          .eq("user_id", userId)
          .maybeSingle(),
        supabase
          .from("daily_reflections")
          .select("reflection_date, ecosystem_delta")
          .eq("user_id", userId),
        supabase
          .from("user_documents")
          .select("id", { count: "exact", head: true })
          .eq("user_id", userId),
      ]);

    const reflections = refls ?? [];
    const days = new Set(reflections.map((r) => r.reflection_date)).size;
    let saved = 0;
    let over = 0;
    for (const r of reflections) {
      const d = Number(r.ecosystem_delta ?? 0);
      if (d >= 0) saved += d;
      else over += -d;
    }

    return {
      documents_uploaded: docCount ?? 0,
      assessments_completed: ob ? 1 : 0,
      days_active: days,
      total_reflections: streak?.total_reflections ?? reflections.length,
      current_streak: streak?.current_streak ?? 0,
      longest_streak: streak?.longest_streak ?? 0,
      carbon_saved_kg: Math.round(saved * 10) / 10,
      carbon_overshoot_kg: Math.round(over * 10) / 10,
      baseline_kg_per_month: ob?.baseline_kg_co2_per_month ?? null,
      member_since: profile?.created_at ?? null,
    };
  });

export interface HistoryPoint {
  date: string;
  kg: number;
  delta: number;
  health: number;
}

export const getImpactHistory = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<HistoryPoint[]> => {
    const { supabase, userId } = context;
    const { data: ob } = await supabase
      .from("onboarding_responses")
      .select("baseline_kg_co2_per_month")
      .eq("user_id", userId)
      .maybeSingle();
    const baseline = ob?.baseline_kg_co2_per_month ? Number(ob.baseline_kg_co2_per_month) : null;
    const baseDaily = baseline != null ? baseline / 30 : null;

    const { data: refls } = await supabase
      .from("daily_reflections")
      .select("reflection_date, estimated_kg_co2_today, ecosystem_delta")
      .eq("user_id", userId)
      .order("reflection_date", { ascending: true })
      .limit(180);

    return (refls ?? []).map((r) => {
      const kg = Number(r.estimated_kg_co2_today ?? 0);
      const delta = Number(r.ecosystem_delta ?? 0);
      // Health derived: lower vs baseline daily = healthier
      const ratio = baseDaily ? Math.min(kg / baseDaily, 2) : 0.8;
      const health = Math.max(0, Math.min(1, 1 - ratio / 2));
      return { date: r.reflection_date as string, kg, delta, health };
    });
  });

export const updateProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => {
    const obj = d as { display_name?: string | null; avatar_url?: string | null };
    return {
      display_name:
        typeof obj.display_name === "string" ? obj.display_name.slice(0, 80) : undefined,
      avatar_url: typeof obj.avatar_url === "string" ? obj.avatar_url.slice(0, 500) : undefined,
    };
  })
  .handler(async ({ data, context }) => {
    const patch: Record<string, unknown> = {};
    if (data.display_name !== undefined) patch.display_name = data.display_name;
    if (data.avatar_url !== undefined) patch.avatar_url = data.avatar_url;
    if (Object.keys(patch).length === 0) return { ok: true };
    const { error } = await context.supabase
      .from("profiles")
      .update(patch)
      .eq("id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const getAvatarSignedUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => {
    const obj = d as { path?: unknown };
    if (typeof obj.path !== "string" || !obj.path) throw new Error("path required");
    return { path: obj.path };
  })
  .handler(async ({ data, context }) => {
    if (!data.path.startsWith(`${context.userId}/`)) throw new Error("forbidden");
    const { data: signed, error } = await context.supabase.storage
      .from("avatars")
      .createSignedUrl(data.path, 60 * 60);
    if (error || !signed) throw new Error(error?.message ?? "Could not sign");
    return { url: signed.signedUrl };
  });
