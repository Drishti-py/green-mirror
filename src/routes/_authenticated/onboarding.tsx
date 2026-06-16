import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { extractBaselineFromBill } from "@/lib/bill-ocr.functions";
import type { TablesInsert, Json } from "@/integrations/supabase/types";

type OnboardingRow = TablesInsert<"onboarding_responses">;

export const Route = createFileRoute("/_authenticated/onboarding")({
  head: () => ({ meta: [{ title: "Begin — GreenMirror" }] }),
  component: Onboarding,
});

type Answers = {
  home_type?: string;
  household_size?: number;
  diet?: string;
  transport?: string;
  energy_source?: string;
  climate_goal?: string;
  motivation?: string;
  notification_preference?: string;
  monthly_bill_amount?: number | null;
  bill_image_path?: string | null;
  baseline_kg_co2_per_month?: number | null;
  ai_extraction?: unknown;
};

const STEPS = [
  { key: "welcome", title: "Your mirror begins here.", subtitle: "Nine quiet questions. About two minutes." },
  { key: "home_type", title: "Where do you live?", subtitle: "We start with your walls.", options: ["Apartment", "House", "Shared housing", "Other"] },
  { key: "household_size", title: "How many people share your roof?", subtitle: "Including you." },
  { key: "diet", title: "How do you eat, most days?", subtitle: "There's no wrong answer.", options: ["Omnivore", "Flexitarian", "Pescatarian", "Vegetarian", "Vegan"] },
  { key: "transport", title: "How do you move?", subtitle: "Your most common mode.", options: ["Car (gas)", "Car (electric)", "Public transit", "Bike / walk", "Mixed"] },
  { key: "energy_source", title: "What powers your home?", subtitle: "If you're unsure, pick the closest.", options: ["Grid average", "Renewable plan", "Solar panels", "Mostly gas", "Not sure"] },
  { key: "bill", title: "Show us a recent utility bill.", subtitle: "We'll read it privately and estimate your baseline. Optional — you can skip." },
  { key: "climate_goal", title: "What's your climate goal?", subtitle: "Pick the closest. You can change it later.", options: ["Cut footprint 10%", "Cut footprint 25%", "Cut footprint 50%", "Reach net-zero"] },
  { key: "motivation", title: "What draws you here?", subtitle: "One sentence. Whatever's true." },
  { key: "notification_preference", title: "How should we reach you?", subtitle: "We'll only knock when it matters.", options: ["Daily reflection", "Weekly summary", "Milestones only", "Silent"] },
] as const;

function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const [busy, setBusy] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  const extractBill = useServerFn(extractBaselineFromBill);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) return;
      setUserId(data.user.id);
      const [{ data: profile }, { data: existing }] = await Promise.all([
        supabase.from("profiles").select("onboarding_completed").eq("id", data.user.id).maybeSingle(),
        supabase.from("onboarding_responses").select("*").eq("user_id", data.user.id).maybeSingle(),
      ]);
      if (profile?.onboarding_completed) {
        navigate({ to: "/dashboard", replace: true });
        return;
      }
      if (existing) setAnswers(existing as Answers);
    })();
  }, [navigate]);

  const progress = useMemo(() => Math.round((step / (STEPS.length - 1)) * 100), [step]);
  const current = STEPS[step];

  const next = () => setStep((s) => Math.min(STEPS.length - 1, s + 1));
  const back = () => setStep((s) => Math.max(0, s - 1));

  const finish = async () => {
    if (!userId) return;
    setBusy(true);
    try {
      const { error: e1 } = await supabase
        .from("onboarding_responses")
        .upsert({ user_id: userId, ...answers });
      if (e1) throw e1;
      const { error: e2 } = await supabase
        .from("profiles")
        .update({ onboarding_completed: true })
        .eq("id", userId);
      if (e2) throw e2;
      toast.success("Your mirror is ready.");
      navigate({ to: "/dashboard", replace: true });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save");
    } finally {
      setBusy(false);
    }
  };

  const saveDraft = async (patch: Answers) => {
    const merged = { ...answers, ...patch };
    setAnswers(merged);
    if (userId) {
      await supabase.from("onboarding_responses").upsert({ user_id: userId, ...merged });
    }
  };

  return (
    <main className="min-h-dvh bg-background text-foreground px-6 py-16">
      <div className="max-w-xl mx-auto">
        <div className="flex items-center justify-between mb-12">
          <span className="font-mono text-[10px] tracking-[0.3em] text-primary uppercase">
            Step {String(step + 1).padStart(2, "0")} / {String(STEPS.length).padStart(2, "0")}
          </span>
          <span className="font-mono text-[10px] tracking-widest text-muted-foreground">
            {progress}%
          </span>
        </div>
        <Progress value={progress} className="h-[2px] mb-12" />

        <div className="space-y-3 mb-10 animate-[gm-fade-in-up_500ms_ease-out]">
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
            {current.title}
          </h1>
          {"subtitle" in current && (
            <p className="text-muted-foreground">{current.subtitle}</p>
          )}
        </div>

        <div className="space-y-6">
          {current.key === "welcome" && (
            <Button onClick={next} className="w-full h-12">Begin</Button>
          )}

          {"options" in current && current.options && (
            <div className="grid gap-2">
              {current.options.map((opt) => {
                const active = (answers as Record<string, unknown>)[current.key] === opt;
                return (
                  <button
                    key={opt}
                    onClick={async () => {
                      await saveDraft({ [current.key]: opt } as Answers);
                      setTimeout(next, 180);
                    }}
                    className={`w-full text-left px-5 py-4 rounded-xl border transition-all ${
                      active
                        ? "border-primary bg-primary/10 text-foreground"
                        : "border-border/60 bg-card/40 hover:border-border hover:bg-card/60"
                    }`}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>
          )}

          {current.key === "household_size" && (
            <NumberStep
              value={answers.household_size}
              onSubmit={async (v) => {
                await saveDraft({ household_size: v });
                next();
              }}
            />
          )}

          {current.key === "motivation" && (
            <TextStep
              value={answers.motivation ?? ""}
              onSubmit={async (v) => {
                await saveDraft({ motivation: v });
                next();
              }}
            />
          )}

          {current.key === "bill" && (
            <BillStep
              userId={userId}
              existingPath={answers.bill_image_path ?? null}
              onComplete={async (patch) => {
                await saveDraft(patch);
                next();
              }}
              onSkip={next}
              extract={extractBill}
            />
          )}
        </div>

        <div className="mt-12 flex items-center justify-between">
          <button
            onClick={back}
            disabled={step === 0}
            className="font-mono text-[11px] tracking-widest uppercase text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors"
          >
            ← Back
          </button>
          {step === STEPS.length - 1 && (
            <Button onClick={finish} disabled={busy}>
              {busy ? "Saving…" : "Enter your mirror →"}
            </Button>
          )}
        </div>
      </div>
    </main>
  );
}

function NumberStep({ value, onSubmit }: { value?: number; onSubmit: (v: number) => void }) {
  const [v, setV] = useState<string>(value?.toString() ?? "");
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const n = parseInt(v, 10);
        if (!isNaN(n) && n > 0) onSubmit(n);
      }}
      className="space-y-4"
    >
      <Input
        type="number"
        min={1}
        max={20}
        value={v}
        onChange={(e) => setV(e.target.value)}
        className="h-14 text-2xl bg-card/40 border-border/60"
        autoFocus
      />
      <Button type="submit" className="w-full h-12">Continue</Button>
    </form>
  );
}

function TextStep({ value, onSubmit }: { value: string; onSubmit: (v: string) => void }) {
  const [v, setV] = useState(value);
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(v.trim() || "—");
      }}
      className="space-y-4"
    >
      <Input
        value={v}
        onChange={(e) => setV(e.target.value)}
        placeholder="I want to…"
        className="h-14 text-lg bg-card/40 border-border/60"
        autoFocus
      />
      <Button type="submit" className="w-full h-12">Continue</Button>
    </form>
  );
}

function BillStep({
  userId,
  existingPath,
  onComplete,
  onSkip,
  extract,
}: {
  userId: string | null;
  existingPath: string | null;
  onComplete: (patch: Answers) => void;
  onSkip: () => void;
  extract: ReturnType<typeof useServerFn<typeof extractBaselineFromBill>>;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string>("");

  const handleFile = async (file: File) => {
    if (!userId) return;
    if (file.size > 8 * 1024 * 1024) {
      toast.error("Please use an image under 8 MB.");
      return;
    }
    setBusy(true);
    setStatus("Uploading…");
    try {
      const path = `${userId}/${Date.now()}-${file.name.replace(/[^a-z0-9.-]/gi, "_")}`;
      const { error: upErr } = await supabase.storage.from("bills").upload(path, file);
      if (upErr) throw upErr;

      setStatus("Reading your bill…");
      const base64 = await fileToBase64(file);
      const extraction = await extract({
        data: { imageBase64: base64, mimeType: file.type || "image/jpeg" },
      });

      onComplete({
        bill_image_path: path,
        monthly_bill_amount: extraction.monthly_bill_amount ?? null,
        baseline_kg_co2_per_month: extraction.estimated_kg_co2_per_month ?? null,
        energy_source: extraction.energy_source ?? undefined,
        ai_extraction: extraction,
      });
      toast.success("Baseline captured.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not process bill");
    } finally {
      setBusy(false);
      setStatus("");
    }
  };

  return (
    <div className="space-y-4">
      <label
        htmlFor="bill-upload"
        className="block cursor-pointer rounded-2xl border border-dashed border-border/60 bg-card/30 hover:border-primary/50 hover:bg-card/50 transition-all px-6 py-12 text-center"
      >
        <div className="font-mono text-[10px] tracking-widest uppercase text-muted-foreground">
          {existingPath ? "Replace bill" : "Upload bill image"}
        </div>
        <div className="mt-3 text-sm">
          {busy ? status : "Tap to choose a photo or PDF screenshot"}
        </div>
        <input
          ref={fileRef}
          id="bill-upload"
          type="file"
          accept="image/*"
          className="hidden"
          disabled={busy}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
          }}
        />
      </label>
      <button
        type="button"
        onClick={onSkip}
        disabled={busy}
        className="block mx-auto font-mono text-[11px] tracking-widest uppercase text-muted-foreground hover:text-foreground transition-colors"
      >
        Skip for now
      </button>
    </div>
  );
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
