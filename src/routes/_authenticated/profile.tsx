import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  getProfileStats,
  updateProfile,
  getAvatarSignedUrl,
  type ProfileStats,
} from "@/lib/profile-stats.functions";
import {
  deriveBadges,
  deriveLevel,
  ecosystemStatusLabel,
} from "@/lib/achievements";
import { CalendarDays, Flame, Leaf, Sparkles, Upload } from "lucide-react";

const DocumentsTab = lazy(() =>
  import("@/components/profile/DocumentsTab").then((m) => ({ default: m.DocumentsTab })),
);
const ImpactHistoryTab = lazy(() =>
  import("@/components/profile/ImpactHistoryTab").then((m) => ({
    default: m.ImpactHistoryTab,
  })),
);

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({ meta: [{ title: "Your Identity — GreenMirror" }] }),
  component: ProfilePage,
});

function ProfilePage() {
  const navigate = useNavigate();
  const fetchStats = useServerFn(getProfileStats);
  const saveProfile = useServerFn(updateProfile);
  const signAvatar = useServerFn(getAvatarSignedUrl);

  const [stats, setStats] = useState<ProfileStats | null>(null);
  const [name, setName] = useState("");
  const [editingName, setEditingName] = useState(false);
  const [draftName, setDraftName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return;
      const [{ data: profile }, s] = await Promise.all([
        supabase
          .from("profiles")
          .select("display_name, avatar_url")
          .eq("id", u.user.id)
          .maybeSingle(),
        fetchStats().catch(() => null),
      ]);
      if (!active) return;
      setName(profile?.display_name ?? "Friend");
      setDraftName(profile?.display_name ?? "");
      setStats(s);
      if (profile?.avatar_url) {
        try {
          const { url } = await signAvatar({ data: { path: profile.avatar_url } });
          if (active) setAvatarUrl(url);
        } catch {
          /* ignore */
        }
      }
    })();
    return () => {
      active = false;
    };
  }, [fetchStats, signAvatar]);

  const badges = useMemo(() => {
    if (!stats) return [];
    return deriveBadges({
      total_reflections: stats.total_reflections,
      current_streak: stats.current_streak,
      longest_streak: stats.longest_streak,
      days_active: stats.days_active,
      carbon_saved_kg: stats.carbon_saved_kg,
      documents_uploaded: stats.documents_uploaded,
      baseline_kg_per_month: stats.baseline_kg_per_month,
    });
  }, [stats]);

  const level = useMemo(() => {
    if (!stats) return null;
    return deriveLevel({
      total_reflections: stats.total_reflections,
      current_streak: stats.current_streak,
      longest_streak: stats.longest_streak,
      days_active: stats.days_active,
      carbon_saved_kg: stats.carbon_saved_kg,
      documents_uploaded: stats.documents_uploaded,
      baseline_kg_per_month: stats.baseline_kg_per_month,
    });
  }, [stats]);

  const baselineHealth = useMemo(() => {
    if (!stats?.baseline_kg_per_month) return 0.6;
    const ratio = Math.min(stats.baseline_kg_per_month / 417, 2);
    return Math.max(0, 1 - ratio / 2);
  }, [stats]);

  const ecoStatus = useMemo(() => ecosystemStatusLabel(baselineHealth), [baselineHealth]);

  const handleAvatar = useCallback(
    async (file: File) => {
      if (file.size > 4 * 1024 * 1024) {
        toast.error("Please use an image under 4 MB.");
        return;
      }
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return;
      setUploading(true);
      try {
        const ext = file.name.split(".").pop()?.replace(/[^a-z0-9]/gi, "") ?? "jpg";
        const path = `${u.user.id}/avatar-${Date.now()}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from("avatars")
          .upload(path, file, { upsert: true });
        if (upErr) throw upErr;
        await saveProfile({ data: { avatar_url: path } });
        const { url } = await signAvatar({ data: { path } });
        setAvatarUrl(url);
        toast.success("Profile picture updated.");
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Upload failed");
      } finally {
        setUploading(false);
      }
    },
    [saveProfile, signAvatar],
  );

  const saveName = useCallback(async () => {
    const v = draftName.trim();
    if (!v || v === name) {
      setEditingName(false);
      return;
    }
    try {
      await saveProfile({ data: { display_name: v } });
      setName(v);
      setEditingName(false);
      toast.success("Name updated.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    }
  }, [draftName, name, saveProfile]);

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
        <header className="flex items-center justify-between gap-4 flex-wrap">
          <span className="font-mono text-[10px] tracking-[0.3em] uppercase text-primary">
            Identity
          </span>
          <div className="flex gap-3">
            <Link to="/dashboard">
              <Button variant="ghost" className="font-mono text-xs">
                ← Mirror
              </Button>
            </Link>
            <Button variant="ghost" onClick={signOut} className="font-mono text-xs">
              Sign out
            </Button>
          </div>
        </header>

        {/* Hero identity card */}
        <section className="rounded-3xl border border-border/60 bg-card/40 backdrop-blur p-8 lg:p-10 grid lg:grid-cols-[auto_1fr_auto] gap-8 items-center">
          <div className="relative">
            <div className="w-28 h-28 rounded-full overflow-hidden bg-gradient-to-br from-primary/40 to-primary/10 border border-primary/40 flex items-center justify-center text-4xl font-bold">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt="Profile"
                  loading="lazy"
                  className="w-full h-full object-cover"
                />
              ) : (
                <span>{name.charAt(0).toUpperCase()}</span>
              )}
            </div>
            <label className="absolute -bottom-1 -right-1 w-9 h-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center cursor-pointer border-2 border-background hover:scale-105 transition-transform">
              <Upload className="w-4 h-4" />
              <input
                type="file"
                accept="image/*"
                className="hidden"
                disabled={uploading}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleAvatar(f);
                }}
              />
              <span className="sr-only">Upload profile picture</span>
            </label>
          </div>

          <div className="space-y-2">
            {editingName ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  saveName();
                }}
                className="flex gap-2"
              >
                <input
                  autoFocus
                  value={draftName}
                  onChange={(e) => setDraftName(e.target.value)}
                  className="bg-background/40 border border-border/60 rounded-lg px-3 py-2 text-2xl font-bold flex-1"
                  maxLength={80}
                />
                <Button type="submit" size="sm">
                  Save
                </Button>
              </form>
            ) : (
              <button
                onClick={() => setEditingName(true)}
                className="text-3xl lg:text-4xl font-extrabold tracking-tight hover:text-primary transition-colors text-left"
              >
                {name}
              </button>
            )}
            <div className="flex items-center gap-3 flex-wrap">
              {level && (
                <span className="inline-flex items-center gap-1.5 font-mono text-[10px] tracking-[0.2em] uppercase px-3 py-1.5 rounded-full bg-primary/15 border border-primary/40 text-primary">
                  <Leaf className="w-3 h-3" />
                  {level.tier} · {level.score}
                </span>
              )}
              <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-muted-foreground">
                Ecosystem · {ecoStatus.label}
              </span>
              {stats?.member_since && (
                <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-muted-foreground">
                  Member since {new Date(stats.member_since).getFullYear()}
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground max-w-md">{ecoStatus.description}</p>
          </div>

          <div className="flex flex-col gap-2 text-right">
            <span className="font-mono text-[10px] tracking-[0.3em] uppercase text-muted-foreground">
              Carbon score
            </span>
            <span className="text-4xl font-extrabold">
              {stats?.baseline_kg_per_month != null
                ? Math.round(Number(stats.baseline_kg_per_month))
                : "—"}
              <span className="text-sm font-mono ml-1 text-muted-foreground">kg/mo</span>
            </span>
            {stats && stats.carbon_saved_kg > 0 && (
              <span className="font-mono text-[10px] tracking-widest uppercase text-primary">
                −{stats.carbon_saved_kg.toFixed(1)} kg saved
              </span>
            )}
          </div>
        </section>

        {/* Stat tiles */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatTile
            icon={<Upload className="w-4 h-4" />}
            label="Documents"
            value={stats?.documents_uploaded ?? 0}
          />
          <StatTile
            icon={<Sparkles className="w-4 h-4" />}
            label="Assessments"
            value={stats?.assessments_completed ?? 0}
          />
          <StatTile
            icon={<CalendarDays className="w-4 h-4" />}
            label="Days active"
            value={stats?.days_active ?? 0}
          />
          <StatTile
            icon={<Flame className="w-4 h-4" />}
            label="Current streak"
            value={stats?.current_streak ?? 0}
            suffix="d"
          />
        </section>

        {/* Tabs */}
        <Tabs defaultValue="achievements">
          <TabsList className="bg-card/40 border border-border/60">
            <TabsTrigger value="achievements">Achievements</TabsTrigger>
            <TabsTrigger value="documents">My Documents</TabsTrigger>
            <TabsTrigger value="history">Impact History</TabsTrigger>
          </TabsList>

          <TabsContent value="achievements" className="space-y-4 mt-6">
            <h2 className="text-xl font-bold">Badges earned along the way</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {badges.map((b) => (
                <div
                  key={b.id}
                  className={`rounded-2xl border p-5 transition-all ${
                    b.earned
                      ? "border-primary/50 bg-primary/10"
                      : "border-border/60 bg-card/40 opacity-70"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold tracking-tight">{b.label}</span>
                    {b.earned && (
                      <span className="font-mono text-[9px] tracking-widest uppercase text-primary">
                        Earned
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{b.description}</p>
                  <div className="mt-4 h-1 bg-background/60 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all"
                      style={{ width: `${b.progress * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
            {stats && stats.carbon_saved_kg > 0 && (
              <p className="text-sm text-muted-foreground">
                Reduction progress: you've saved{" "}
                <strong className="text-primary">
                  {stats.carbon_saved_kg.toFixed(1)} kg CO₂
                </strong>{" "}
                versus baseline across {stats.days_active} days.
              </p>
            )}
          </TabsContent>

          <TabsContent value="documents" className="mt-6">
            <Suspense fallback={<TabSkeleton />}>
              <DocumentsTab />
            </Suspense>
          </TabsContent>

          <TabsContent value="history" className="mt-6">
            <Suspense fallback={<TabSkeleton />}>
              <ImpactHistoryTab baselineKg={stats?.baseline_kg_per_month ?? null} />
            </Suspense>
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}

function StatTile({
  icon,
  label,
  value,
  suffix,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  suffix?: string;
}) {
  return (
    <div className="rounded-2xl border border-border/60 bg-card/40 backdrop-blur p-5">
      <div className="flex items-center gap-2 text-muted-foreground">
        {icon}
        <span className="font-mono text-[10px] tracking-[0.25em] uppercase">{label}</span>
      </div>
      <div className="mt-3 text-3xl font-extrabold tracking-tight">
        {value}
        {suffix && <span className="text-sm font-mono ml-1 text-muted-foreground">{suffix}</span>}
      </div>
    </div>
  );
}

function TabSkeleton() {
  return (
    <div className="rounded-2xl border border-border/60 bg-card/40 p-8 animate-pulse">
      <div className="h-4 w-40 bg-foreground/10 rounded" />
      <div className="mt-4 space-y-2">
        <div className="h-3 w-full bg-foreground/10 rounded" />
        <div className="h-3 w-3/4 bg-foreground/10 rounded" />
      </div>
    </div>
  );
}
