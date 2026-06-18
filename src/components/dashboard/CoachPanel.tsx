import { memo, useCallback, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { askCoach } from "@/lib/coach.functions";
import { Button } from "@/components/ui/button";
import { Sparkles, Send, Loader2 } from "lucide-react";

type Msg = { role: "user" | "assistant"; content: string };

interface Props {
  baselineKg: number | null;
  context: {
    diet: string | null;
    transport: string | null;
    energy_source: string | null;
    home_type: string | null;
    household_size: number | null;
    climate_goal: string | null;
  };
}

const STARTERS = [
  "What's the single biggest thing I can shift this week?",
  "How does my footprint compare to a balanced one?",
  "Give me a 7-day micro-challenge.",
];

export const CoachPanel = memo(function CoachPanel({ baselineKg, context }: Props) {
  const ask = useServerFn(askCoach);
  const [messages, setMessages] = useState<Msg[]>([
    {
      role: "assistant",
      content:
        "I'm your mirror's quiet voice. Ask me anything — or tap a starter below to begin.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const send = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || loading) return;
      const next: Msg[] = [...messages, { role: "user", content: trimmed }];
      setMessages(next);
      setInput("");
      setLoading(true);
      try {
        const res = await ask({ data: { messages: next, baselineKg, context } });
        setMessages([...next, { role: "assistant", content: res.reply || "…" }]);
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Coach unavailable.";
        setMessages([...next, { role: "assistant", content: `⚠ ${msg}` }]);
      } finally {
        setLoading(false);
        requestAnimationFrame(() => {
          scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
        });
      }
    },
    [ask, baselineKg, context, loading, messages],
  );

  return (
    <div className="flex flex-col rounded-2xl border border-border/60 bg-card/40 backdrop-blur overflow-hidden h-full min-h-[420px]">
      <div className="flex items-center gap-2 px-5 py-4 border-b border-border/50">
        <Sparkles className="h-4 w-4 text-primary" />
        <span className="font-mono text-[10px] tracking-[0.3em] uppercase text-muted-foreground">
          AI Coach
        </span>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                m.role === "user"
                  ? "bg-primary/15 text-foreground border border-primary/30"
                  : "bg-secondary/60 text-foreground/90"
              }`}
            >
              {m.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="rounded-2xl px-4 py-2.5 bg-secondary/60 text-foreground/70 text-sm flex items-center gap-2">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              listening to your mirror…
            </div>
          </div>
        )}
      </div>

      {messages.length <= 1 && (
        <div className="px-5 pb-2 flex flex-wrap gap-2">
          {STARTERS.map((s) => (
            <button
              key={s}
              onClick={() => send(s)}
              className="text-xs font-mono px-3 py-1.5 rounded-full border border-border/60 hover:border-primary/60 hover:bg-primary/10 transition-colors"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="flex items-center gap-2 px-4 py-3 border-t border-border/50"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask your mirror…"
          className="flex-1 bg-transparent outline-none text-sm placeholder:text-muted-foreground/70 px-2 py-2"
          aria-label="Message the coach"
        />
        <Button type="submit" size="icon" disabled={loading || !input.trim()}>
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}
