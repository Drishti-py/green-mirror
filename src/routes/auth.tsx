import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Enter GreenMirror" },
      { name: "description", content: "Sign in or create your GreenMirror." },
    ],
  }),
  component: AuthPage,
});

async function getNextRoute(userId: string): Promise<"/onboarding" | "/dashboard"> {
  const { data } = await supabase
    .from("profiles")
    .select("onboarding_completed")
    .eq("id", userId)
    .maybeSingle();
  return data?.onboarding_completed ? "/dashboard" : "/onboarding";
}

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  // Redirect away if already signed in
  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (data.user) {
        const next = await getNextRoute(data.user.id);
        navigate({ to: next, replace: true });
      }
    });
  }, [navigate]);

  const handleEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin + "/auth" },
        });
        if (error) throw error;
        if (data.user && !data.session) {
          toast.success("Check your email to confirm your account.");
          return;
        }
        if (data.user) {
          const next = await getNextRoute(data.user.id);
          navigate({ to: next, replace: true });
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        if (data.user) {
          const next = await getNextRoute(data.user.id);
          navigate({ to: next, replace: true });
        }
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setBusy(false);
    }
  };

  const handleGoogle = async () => {
    setBusy(true);
    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin + "/auth",
      });
      if (result.error) throw result.error;
      if (result.redirected) return;
      const { data } = await supabase.auth.getUser();
      if (data.user) {
        const next = await getNextRoute(data.user.id);
        navigate({ to: next, replace: true });
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Google sign-in failed");
      setBusy(false);
    }
  };

  return (
    <main className="min-h-dvh grid place-items-center bg-background text-foreground px-6 py-16">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center space-y-3">
          <Link to="/" className="font-mono text-[10px] tracking-[0.3em] text-primary uppercase">
            ← GreenMirror
          </Link>
          <h1 className="text-3xl font-extrabold tracking-tight">
            {mode === "signin" ? "Step into your mirror." : "Begin your reflection."}
          </h1>
          <p className="text-sm text-muted-foreground">
            {mode === "signin"
              ? "Continue where you left off."
              : "Create the world that responds to you."}
          </p>
        </div>

        <Button
          type="button"
          variant="outline"
          className="w-full h-11 border-border/60 bg-card/40 backdrop-blur"
          onClick={handleGoogle}
          disabled={busy}
        >
          <GoogleIcon />
          <span className="ml-2">Continue with Google</span>
        </Button>

        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-border/60" />
          <span className="font-mono text-[10px] tracking-widest uppercase text-muted-foreground">
            or
          </span>
          <div className="h-px flex-1 bg-border/60" />
        </div>

        <form onSubmit={handleEmail} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email" className="font-mono text-[10px] tracking-widest uppercase text-muted-foreground">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-11 bg-card/40 border-border/60"
              autoComplete="email"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password" className="font-mono text-[10px] tracking-widest uppercase text-muted-foreground">
              Password
            </Label>
            <Input
              id="password"
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-11 bg-card/40 border-border/60"
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
            />
          </div>
          <Button type="submit" disabled={busy} className="w-full h-11">
            {busy ? "…" : mode === "signin" ? "Sign in" : "Create account"}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          {mode === "signin" ? "New to GreenMirror?" : "Already have an account?"}{" "}
          <button
            type="button"
            onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
            className="text-primary hover:text-foreground transition-colors underline-offset-4 hover:underline"
          >
            {mode === "signin" ? "Create one" : "Sign in"}
          </button>
        </p>
      </div>
    </main>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.49h4.84a4.14 4.14 0 0 1-1.8 2.71v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62z" />
      <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.83.87-3.04.87-2.34 0-4.32-1.58-5.03-3.7H.96v2.33A9 9 0 0 0 9 18z" />
      <path fill="#FBBC05" d="M3.97 10.73A5.41 5.41 0 0 1 3.68 9c0-.6.1-1.19.29-1.73V4.94H.96A9 9 0 0 0 0 9c0 1.45.35 2.83.96 4.06l3.01-2.33z" />
      <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.59C13.46.89 11.43 0 9 0A9 9 0 0 0 .96 4.94l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58z" />
    </svg>
  );
}
