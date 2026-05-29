export function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto min-h-screen max-w-md bg-background pb-24">
      {children}
    </div>
  );
}

export function SectionTitle({ children, action }: { children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="mb-3 mt-6 flex items-end justify-between px-4">
      <h2 className="display text-2xl uppercase leading-none tracking-tight">{children}</h2>
      {action}
    </div>
  );
}

export function Pill({ children, tone = "neutral" }: { children: React.ReactNode; tone?: "neutral" | "accent" | "dark" }) {
  const cls =
    tone === "accent"
      ? "bg-accent text-accent-foreground"
      : tone === "dark"
      ? "bg-foreground text-background"
      : "bg-muted text-foreground";
  return (
    <span className={`inline-flex items-center rounded-sm px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest ${cls}`}>
      {children}
    </span>
  );
}
