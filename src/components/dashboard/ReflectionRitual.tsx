import { memo, useCallback, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { logReflection } from "@/lib/reflection.functions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

type Transport = "walk_bike" | "transit" | "car" | "long_drive" | "flight";
type Meals = "plant_based" | "mixed" | "meat_heavy";
type Mood = "renewed" | "steady" | "heavy";

const TRANSPORT_OPTS: { value: Transport; label: string }[] = [
  { value: "walk_bike", label: "Walked / cycled" },
  { value: "transit", label: "Transit" },
  { value: "car", label: "Drove" },
  { value: "long_drive", label: "Long drive" },
  { value: "flight", label: "Flew" },
];
const MEALS_OPTS: { value: Meals; label: string }[] = [
  { value: "plant_based", label: "Mostly plants" },
  { value: "mixed", label: "Mixed" },
  { value: "meat_heavy", label: "Meat-heavy" },
];
const MOOD_OPTS: { value: Mood; label: string }[] = [
  { value: "renewed", label: "Renewed" },
  { value: "steady", label: "Steady" },
  { value: "heavy", label: "Heavy" },
];

interface Props {
  initial?: {
    transport_mode?: string | null;
    meals?: string | null;
    energy_mindful?: boolean | null;
    water_mindful?: boolean | null;
    waste_mindful?: boolean | null;
    mood?: string | null;
    notes?: string | null;
    ecosystem_delta?: number | null;
  } | null;
  onLogged: (delta: number) => void;
}

export const ReflectionRitual = memo(function ReflectionRitual({ initial, onLogged }: Props) {
  const submit = useServerFn(logReflection);
  const [transport, setTransport] = useState<Transport>(
    (initial?.transport_mode as Transport) ?? "transit",
  );
  const [meals, setMeals] = useState<Meals>((initial?.meals as Meals) ?? "mixed");
  const [energy, setEnergy] = useState(initial?.energy_mindful ?? false);
  const [water, setWater] = useState(initial?.water_mindful ?? false);
  const [waste, setWaste] = useState(initial?.waste_mindful ?? false);
  const [mood, setMood] = useState<Mood>((initial?.mood as Mood) ?? "steady");
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [busy, setBusy] = useState(false);
  const logged = initial != null;

  const handleSubmit = useCallback(async () => {
    setBusy(true);
    try {
      const res = await submit({
        data: {
          transport_mode: transport,
          meals,
          energy_mindful: energy,
          water_mindful: water,
          waste_mindful: waste,
          mood,
          notes: notes.trim() || null,
        },
      });
      toast.success(
        res.delta >= 0
          ? `+${res.delta.toFixed(1)} kg CO₂ saved today. Your world thickens.`
          : `${Math.abs(res.delta).toFixed(1)} kg over baseline. Your world dims a little.`,
      );
      onLogged(res.delta);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save reflection");
    } finally {
      setBusy(false);
    }
  }, [submit, transport, meals, energy, water, waste, mood, notes, onLogged]);

  return (
    <div className="rounded-2xl border border-border/60 bg-card/40 backdrop-blur p-7 space-y-6">
      <header>
        <span className="font-mono text-[10px] tracking-[0.3em] uppercase text-primary">
          Daily reflection
        </span>
        <h3 className="mt-2 text-xl font-bold tracking-tight">
          {logged ? "You've logged today. Adjust if needed." : "How did today touch the world?"}
        </h3>
      </header>

      <Group label="How did you move?">
        <ChipRow options={TRANSPORT_OPTS} value={transport} onChange={setTransport} />
      </Group>

      <Group label="What did you eat?">
        <ChipRow options={MEALS_OPTS} value={meals} onChange={setMeals} />
      </Group>

      <Group label="Quiet wins">
        <div className="flex flex-wrap gap-2">
          <Toggle on={energy} onChange={setEnergy} label="Energy mindful" />
          <Toggle on={water} onChange={setWater} label="Water mindful" />
          <Toggle on={waste} onChange={setWaste} label="Waste mindful" />
        </div>
      </Group>

      <Group label="And you?">
        <ChipRow options={MOOD_OPTS} value={mood} onChange={setMood} />
      </Group>

      <Group label="A note to your future self">
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="What moved you today?"
          maxLength={500}
          className="bg-background/40 border-border/60 resize-none"
          rows={3}
        />
      </Group>

      <Button
        onClick={handleSubmit}
        disabled={busy}
        className="w-full font-mono text-xs tracking-[0.2em] uppercase"
      >
        {busy ? "Reflecting…" : logged ? "Update reflection" : "Mirror today"}
      </Button>
    </div>
  );
}

function Group({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <span className="block font-mono text-[10px] tracking-[0.25em] uppercase text-muted-foreground">
        {label}
      </span>
      {children}
    </div>
  );
}

function ChipRow<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            className={
              "px-3.5 py-1.5 rounded-full text-sm border transition-colors " +
              (active
                ? "bg-primary/15 border-primary/60 text-primary"
                : "bg-background/40 border-border/60 text-muted-foreground hover:text-foreground hover:border-border")
            }
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

function Toggle({
  on,
  onChange,
  label,
}: {
  on: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!on)}
      aria-pressed={on}
      className={
        "px-3.5 py-1.5 rounded-full text-sm border transition-colors inline-flex items-center gap-2 " +
        (on
          ? "bg-primary/15 border-primary/60 text-primary"
          : "bg-background/40 border-border/60 text-muted-foreground hover:text-foreground")
      }
    >
      <span
        className={
          "inline-block w-1.5 h-1.5 rounded-full " + (on ? "bg-primary" : "bg-muted-foreground/50")
        }
        aria-hidden
      />
      {label}
    </button>
  );
}
