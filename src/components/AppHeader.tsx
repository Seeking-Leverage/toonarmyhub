import { DEMO_CHAPTER_NAME, DEMO_USER_NAME } from "@/lib/demo";
import { useQuery } from "@tanstack/react-query";
import { fetchMyPoints } from "@/lib/api";

export function AppHeader({ subtitle }: { subtitle?: string }) {
  const { data: points } = useQuery({
    queryKey: ["my-points"],
    queryFn: () => fetchMyPoints(),
  });
  return (
    <header className="sticky top-0 z-30 border-b border-foreground bg-background">
      <div className="toon-stripes-tight h-1.5 w-full opacity-90" />
      <div className="flex items-center justify-between px-4 py-3">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
            Toon Army Hub
          </div>
          <div className="display text-xl leading-none">
            {DEMO_CHAPTER_NAME}
          </div>
          {subtitle && (
            <div className="mt-0.5 text-xs text-muted-foreground">{subtitle}</div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <div className="flex flex-col items-end">
            <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
              Toon Pts
            </span>
            <span className="display text-lg leading-none text-foreground">
              {points?.toLocaleString() ?? "—"}
            </span>
          </div>
          <div className="grid h-9 w-9 place-items-center rounded-full bg-foreground text-background">
            <span className="text-xs font-bold">{DEMO_USER_NAME.slice(0, 2).toUpperCase()}</span>
          </div>
        </div>
      </div>
    </header>
  );
}
