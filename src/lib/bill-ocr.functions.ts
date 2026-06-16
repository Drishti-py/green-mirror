import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const inputSchema = z.object({
  imageBase64: z.string().min(20), // data URL or raw base64
  mimeType: z.string().default("image/jpeg"),
});

type Extraction = {
  monthly_bill_amount: number | null;
  energy_source: string | null;
  kwh: number | null;
  estimated_kg_co2_per_month: number | null;
  currency: string | null;
  notes: string | null;
};

/**
 * Extract baseline carbon estimate from a utility bill image
 * using Lovable AI Gateway (Gemini 2.5 Flash, vision).
 */
export const extractBaselineFromBill = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => inputSchema.parse(d))
  .handler(async ({ data }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("AI gateway is not configured");

    const dataUrl = data.imageBase64.startsWith("data:")
      ? data.imageBase64
      : `data:${data.mimeType};base64,${data.imageBase64}`;

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content:
              "You analyze utility (electricity/gas) bills and estimate the household's monthly carbon footprint. Return JSON only.",
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Look at this bill image. Extract:
- monthly_bill_amount (numeric, in the bill's currency)
- currency (ISO code if visible)
- energy_source ("grid", "renewable", "gas", "mixed", or null)
- kwh (kilowatt-hours consumed this month, if visible)
- estimated_kg_co2_per_month (your best estimate using grid averages if needed)
- notes (one short sentence)

If the image isn't a utility bill, set all fields to null with a note explaining.`,
              },
              { type: "image_url", image_url: { url: dataUrl } },
            ],
          },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (res.status === 429) {
      throw new Error("AI is busy — please try again in a moment.");
    }
    if (res.status === 402) {
      throw new Error("AI credits exhausted. Add credits in the workspace.");
    }
    if (!res.ok) {
      const text = await res.text();
      console.error("AI gateway error", res.status, text);
      throw new Error("Could not analyze bill");
    }

    const json = await res.json();
    const raw = json.choices?.[0]?.message?.content ?? "{}";
    let parsed: Extraction;
    try {
      parsed = JSON.parse(raw);
    } catch {
      parsed = {
        monthly_bill_amount: null,
        energy_source: null,
        kwh: null,
        estimated_kg_co2_per_month: null,
        currency: null,
        notes: "Could not parse AI response",
      };
    }
    return parsed;
  });
