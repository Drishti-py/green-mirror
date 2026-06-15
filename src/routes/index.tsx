import { createFileRoute } from "@tanstack/react-router";
import heroOrb from "@/assets/hero-orb.jpg";
import beatParadise from "@/assets/beat-paradise.jpg";
import beatConsequence from "@/assets/beat-consequence.jpg";
import { FloatingNav } from "@/components/landing/FloatingNav";
import { DriftingParticles } from "@/components/landing/DriftingParticles";
import { CTAButton } from "@/components/landing/CTAButton";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "GreenMirror — Your world reflects your footprint" },
      {
        name: "description",
        content:
          "Watch your carbon footprint become a living digital ecosystem. An AI-powered mirror of your environmental impact.",
      },
      {
        property: "og:title",
        content: "GreenMirror — Your world reflects your footprint",
      },
      {
        property: "og:description",
        content:
          "Witness your impact translated into a breathing world. Powered by AI, in real time.",
      },
    ],
  }),
  component: LandingPage,
});

function LandingPage() {
  return (
    <main className="min-h-screen bg-background text-foreground font-display">
      <FloatingNav />

      {/* HERO */}
      <section className="relative h-dvh flex flex-col items-center justify-center overflow-hidden">
        {/* Background orb */}
        <div
          aria-hidden
          className="absolute inset-0 z-0 flex items-center justify-center"
        >
          <img
            src={heroOrb}
            alt=""
            width={1920}
            height={1080}
            className="w-full h-full object-cover opacity-60 animate-breathe"
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse at center, transparent 0%, var(--color-background) 75%)",
            }}
          />
        </div>

        <DriftingParticles />

        {/* Foreground content */}
        <div className="relative z-10 text-center px-6 max-w-4xl">
          <div className="font-mono text-[12px] tracking-[0.3em] text-primary mb-6 animate-fade-in [animation-delay:100ms]">
            A NEW PERSPECTIVE
          </div>
          <h1 className="text-5xl sm:text-6xl md:text-8xl font-extrabold tracking-tighter text-balance mb-12 animate-fade-in [animation-delay:300ms] leading-[0.95]">
            Your world reflects
            <br />
            <span className="text-gradient-aurora">your footprint.</span>
          </h1>

          <div className="animate-fade-in [animation-delay:500ms] flex justify-center">
            <CTAButton to="/auth">Start My GreenMirror Journey</CTAButton>
          </div>
        </div>

        {/* Scroll indicator */}
        <div
          aria-hidden
          className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-4 animate-fade-in [animation-delay:900ms]"
        >
          <span className="font-mono text-[9px] tracking-[0.2em] text-muted-foreground uppercase">
            Begin the Narrative
          </span>
          <div className="w-px h-12 bg-gradient-to-b from-primary to-transparent opacity-60" />
        </div>
      </section>

      {/* NARRATIVE BEATS */}
      <div id="ecosystem" className="relative">
        {/* Vertical guide line */}
        <div
          aria-hidden
          className="absolute left-12 top-0 bottom-0 w-px bg-border hidden lg:block"
        >
          <div className="sticky top-1/2 -translate-y-1/2 h-20 w-px bg-primary shadow-[0_0_20px_var(--color-primary)]" />
        </div>

        {/* Beat 1: Paradise */}
        <section className="relative min-h-screen py-32 px-6 lg:pl-32 flex items-center">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center max-w-7xl mx-auto">
            <div>
              <span className="font-mono text-primary text-xs mb-4 block tracking-widest">
                01 / PARADISE
              </span>
              <h2 className="text-4xl md:text-5xl font-extrabold mb-6 tracking-tight leading-tight">
                The baseline of existence.
              </h2>
              <p className="text-muted-foreground text-lg leading-relaxed max-w-md">
                Every ecosystem begins in balance. Your journey starts by
                visualizing the pristine potential of your environment —
                untouched, breathing, alive.
              </p>
            </div>
            <div className="aspect-[4/3] overflow-hidden rounded-2xl border border-primary/20 shadow-[var(--shadow-elevated)]">
              <img
                src={beatParadise}
                alt="Iridescent dew on emerald moss — the pristine baseline"
                width={1280}
                height={960}
                loading="lazy"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </section>

        {/* Beat 2: Consequence */}
        <section className="relative min-h-screen py-32 px-6 lg:pl-32 flex items-center bg-accent/[0.04]">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center max-w-7xl mx-auto">
            <div className="order-2 lg:order-1 aspect-[4/3] overflow-hidden rounded-2xl border border-accent/20 shadow-[var(--shadow-elevated)]">
              <img
                src={beatConsequence}
                alt="Cracked earth with a glowing amber vein — the strain"
                width={1280}
                height={960}
                loading="lazy"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="order-1 lg:order-2">
              <span className="font-mono text-accent text-xs mb-4 block tracking-widest">
                03 / CONSEQUENCE
              </span>
              <h2 className="text-4xl md:text-5xl font-extrabold mb-6 tracking-tight leading-tight">
                Witness the friction.
              </h2>
              <p className="text-muted-foreground text-lg leading-relaxed max-w-md">
                As your data flows in, the mirror shifts. The heat rises. Water
                recedes. The AI translates your footprint into tangible,
                atmospheric change.
              </p>
            </div>
          </div>
        </section>
      </div>

      {/* FEATURES */}
      <section id="impact" className="py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-24">
            <h3 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-4">
              Hyper-personal intelligence.
            </h3>
            <p className="text-muted-foreground max-w-xl mx-auto text-lg">
              Beyond numbers. A living, breathing model of your impact on the
              biosphere.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <article className="group p-8 md:p-10 rounded-3xl bg-card/50 border border-border hover:border-primary/50 transition-colors">
              <div className="size-12 rounded-full bg-primary/10 border border-primary/20 mb-6 flex items-center justify-center">
                <span className="size-2 bg-primary rounded-full animate-pulse-dot" />
              </div>
              <h4 className="text-xl font-bold mb-3">Biometric Sync</h4>
              <p className="text-muted-foreground leading-relaxed">
                Your mirror syncs with your lifestyle data — pulsing in
                real-time with your energy use, transport, diet, and movement.
              </p>
            </article>

            <article className="group p-8 md:p-10 rounded-3xl bg-card/50 border border-border hover:border-accent/50 transition-colors">
              <div className="size-12 rounded-full bg-accent/10 border border-accent/20 mb-6 flex items-center justify-center">
                <span
                  className="size-2 bg-accent rounded-full animate-pulse-dot"
                  style={{ animationDelay: "1.2s" }}
                />
              </div>
              <h4 className="text-xl font-bold mb-3">Temporal Sight</h4>
              <p className="text-muted-foreground leading-relaxed">
                Scrub through the timeline of your world. Predict future
                ecologies based on the smallest behavioral shift.
              </p>
            </article>
          </div>
        </div>
      </section>

      {/* CLOSING CTA */}
      <section id="journal" className="py-32 px-6">
        <div className="max-w-5xl mx-auto rounded-[3rem] p-12 md:p-24 relative overflow-hidden bg-gradient-to-br from-card to-background border border-border text-center">
          <div
            aria-hidden
            className="absolute -bottom-1/2 left-1/2 -translate-x-1/2 w-full h-[500px] rounded-full blur-[120px]"
            style={{
              background:
                "radial-gradient(ellipse at center, color-mix(in oklch, var(--color-primary) 30%, transparent), transparent 70%)",
            }}
          />
          <div className="relative z-10">
            <h2 className="text-4xl md:text-6xl font-extrabold tracking-tighter mb-8 leading-[1.05]">
              Your mirror is waiting.
            </h2>
            <p className="text-muted-foreground text-lg mb-12 max-w-lg mx-auto">
              Join a community of conscious observers turning data into life.
              Start your journey into the living ecosystem.
            </p>
            <div className="flex justify-center">
              <CTAButton to="/auth" variant="primary">
                Start My GreenMirror Journey
              </CTAButton>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-12 border-t border-border px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="font-mono text-[10px] tracking-widest uppercase text-muted-foreground">
            © 2026 GreenMirror
          </div>
          <div className="flex gap-12 font-mono text-[10px] tracking-widest uppercase text-muted-foreground">
            <a href="#" className="hover:text-primary transition-colors">
              Privacy
            </a>
            <a href="#" className="hover:text-primary transition-colors">
              Technical Spec
            </a>
            <a href="#" className="hover:text-primary transition-colors">
              Ethical AI
            </a>
          </div>
        </div>
      </footer>
    </main>
  );
}
