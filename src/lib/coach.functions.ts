import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const MessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string(),
});

const InputSchema = z.object({
  messages: z.array(MessageSchema).min(1).max(40),
  baselineKg: z.number().nullable().optional(),
  context: z
    .object({
      diet: z.string().nullable().optional(),
      transport: z.string().nullable().optional(),
      energy_source: z.string().nullable().optional(),
      home_type: z.string().nullable().optional(),
      household_size: z.number().nullable().optional(),
      climate_goal: z.string().nullable().optional(),
    })
    .optional(),
});

const SYSTEM = `You are GreenMirror's AI coach — a calm, warm, slightly poetic guide who helps a person see how their daily choices ripple through a living ecosystem.

Voice:
- Speak like a thoughtful naturalist. Short sentences. Sensory verbs.
- Never moralize. Never shame. Celebrate the smallest shifts.
- Reference the person's living "mirror" / ecosystem when it fits.

Rules:
- Replies are 2–4 sentences unless the user asks for detail.
- Ground advice in their context (diet, transport, energy, household).
- If they ask for a number, give one realistic estimate in kg CO₂, then a single concrete next step.
- Never invent data about their account.`;

export const askCoach = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => InputSchema.parse(d))
  .handler(async ({ data }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("Missing LOVABLE_API_KEY");

    const ctxLine = data.context
      ? `User context: ${JSON.stringify(data.context)}. Monthly baseline: ${
          data.baselineKg ? `${Math.round(data.baselineKg)} kg CO₂` : "unknown"
        }.`
      : "";

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Lovable-API-Key": key,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEM + (ctxLine ? `\n\n${ctxLine}` : "") },
          ...data.messages,
        ],
      }),
    });

    if (res.status === 429) throw new Error("Rate limit reached — give it a moment.");
    if (res.status === 402) throw new Error("AI credits exhausted. Please top up.");
    if (!res.ok) throw new Error(`Coach unavailable (${res.status})`);

    const json = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const reply = json.choices?.[0]?.message?.content?.trim() ?? "";
    return { reply };
  });
