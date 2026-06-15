export function FloatingNav() {
  return (
    <nav className="fixed top-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-8 px-6 py-3 rounded-full glass-panel">
      <span className="font-mono text-[10px] tracking-widest uppercase text-primary">
        GreenMirror
      </span>
      <div className="h-4 w-px bg-border" />
      <div className="hidden sm:flex gap-6 text-[11px] uppercase tracking-wider font-medium text-muted-foreground">
        <a href="#ecosystem" className="hover:text-foreground transition-colors">
          The Ecosystem
        </a>
        <a href="#impact" className="hover:text-foreground transition-colors">
          Impact
        </a>
        <a href="#journal" className="hover:text-foreground transition-colors">
          Journal
        </a>
      </div>
    </nav>
  );
}
