/**
 * Pure achievement / level derivation.
 * Tested in achievements.test.ts.
 */

export interface AchievementInput {
  total_reflections: number;
  current_streak: number;
  longest_streak: number;
  days_active: number;
  carbon_saved_kg: number;
  documents_uploaded: number;
  baseline_kg_per_month: number | null;
}

export interface Badge {
  id: string;
  label: string;
  description: string;
  earned: boolean;
  progress: number; // 0..1
}

export interface SustainabilityLevel {
  tier: "Seedling" | "Sprout" | "Sapling" | "Grove" | "Forest" | "Biosphere";
  score: number; // 0..100
  next: string | null;
}

const BADGE_DEFS: Array<{
  id: string;
  label: string;
  description: string;
  goal: (i: AchievementInput) => number;
  value: (i: AchievementInput) => number;
}> = [
  {
    id: "first-reflection",
    label: "First Light",
    description: "Logged your first daily reflection.",
    goal: () => 1,
    value: (i) => i.total_reflections,
  },
  {
    id: "week-streak",
    label: "Seven Suns",
    description: "Reflected seven days in a row.",
    goal: () => 7,
    value: (i) => i.longest_streak,
  },
  {
    id: "month-streak",
    label: "Lunar Cycle",
    description: "Reflected thirty days in a row.",
    goal: () => 30,
    value: (i) => i.longest_streak,
  },
  {
    id: "carbon-saver-10",
    label: "Canopy Keeper",
    description: "Saved 10 kg CO₂ versus your baseline.",
    goal: () => 10,
    value: (i) => i.carbon_saved_kg,
  },
  {
    id: "carbon-saver-50",
    label: "Forest Friend",
    description: "Saved 50 kg CO₂ versus your baseline.",
    goal: () => 50,
    value: (i) => i.carbon_saved_kg,
  },
  {
    id: "documents-3",
    label: "Paper Trail",
    description: "Uploaded three documents to your mirror.",
    goal: () => 3,
    value: (i) => i.documents_uploaded,
  },
  {
    id: "active-30",
    label: "Quiet Devotion",
    description: "Active on thirty distinct days.",
    goal: () => 30,
    value: (i) => i.days_active,
  },
];

export function deriveBadges(input: AchievementInput): Badge[] {
  return BADGE_DEFS.map((b) => {
    const goal = Math.max(1, b.goal(input));
    const value = Math.max(0, b.value(input));
    return {
      id: b.id,
      label: b.label,
      description: b.description,
      earned: value >= goal,
      progress: Math.min(1, value / goal),
    };
  });
}

export function deriveLevel(input: AchievementInput): SustainabilityLevel {
  // Composite score 0..100
  const reflectScore = Math.min(40, input.total_reflections * 1.5);
  const streakScore = Math.min(20, input.longest_streak * 1.5);
  const savedScore = Math.min(30, input.carbon_saved_kg * 0.6);
  const docScore = Math.min(10, input.documents_uploaded * 2);
  const score = Math.round(reflectScore + streakScore + savedScore + docScore);

  const tiers: Array<SustainabilityLevel["tier"]> = [
    "Seedling",
    "Sprout",
    "Sapling",
    "Grove",
    "Forest",
    "Biosphere",
  ];
  const idx = Math.min(tiers.length - 1, Math.floor(score / 20));
  const next = idx === tiers.length - 1 ? null : tiers[idx + 1];
  return { tier: tiers[idx], score, next };
}

export function ecosystemStatusLabel(health: number): {
  label: string;
  description: string;
} {
  if (health >= 0.85) return { label: "Flourishing", description: "Canopy thick, fireflies dancing." };
  if (health >= 0.65) return { label: "Thriving", description: "Trees thicken, mist lifts." };
  if (health >= 0.45) return { label: "Steady", description: "Holding the balance." };
  if (health >= 0.25) return { label: "Strained", description: "Mist gathers at the edges." };
  return { label: "Critical", description: "The forest waits for your return." };
}
