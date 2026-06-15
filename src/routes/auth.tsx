import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — GreenMirror" },
      { name: "description", content: "Enter your GreenMirror." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  return (
    <main className="min-h-dvh grid place-items-center bg-background text-foreground px-6">
      <div className="max-w-md w-full text-center space-y-6">
        <span className="font-mono text-[10px] tracking-[0.3em] text-primary uppercase">
          The Threshold
        </span>
        <h1 className="text-4xl font-extrabold tracking-tight">
          Sign in is coming next.
        </h1>
        <p className="text-muted-foreground">
          The onboarding flow and authenticated experience are being built.
        </p>
        <Link
          to="/"
          className="inline-block font-mono text-[11px] tracking-widest uppercase text-primary hover:text-foreground transition-colors"
        >
          ← Back to landing
        </Link>
      </div>
    </main>
  );
}
