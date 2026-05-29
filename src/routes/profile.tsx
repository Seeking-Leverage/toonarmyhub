import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AppHeader } from "@/components/AppHeader";
import { PageShell, Pill, SectionTitle } from "@/components/PageShell";
import { fetchMembers, fetchMyPoints } from "@/lib/api";
import { DEMO_USER_NAME, DEMO_USER_ROLE } from "@/lib/demo";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "Profile — NYC Toon Army" },
      { name: "description", content: "Your Toon Points and chapter members." },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const { data: points } = useQuery({ queryKey: ["my-points"], queryFn: () => fetchMyPoints() });
  const { data: members } = useQuery({ queryKey: ["members"], queryFn: fetchMembers });
  return (
    <PageShell>
      <AppHeader subtitle="Your profile" />
      <section className="m-4 border-2 border-foreground bg-foreground p-4 text-background">
        <div className="flex items-center gap-3">
          <div className="grid h-14 w-14 place-items-center rounded-full bg-accent text-accent-foreground">
            <span className="display text-xl">{DEMO_USER_NAME.slice(0, 2).toUpperCase()}</span>
          </div>
          <div>
            <div className="display text-2xl leading-none">{DEMO_USER_NAME}</div>
            <div className="mt-1 inline-block bg-accent px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-accent-foreground">
              {DEMO_USER_ROLE}
            </div>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3 border-t border-background/20 pt-3">
          <div>
            <div className="text-[10px] uppercase tracking-widest opacity-70">Toon Points</div>
            <div className="display text-3xl leading-none">{points?.toLocaleString() ?? "—"}</div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-widest opacity-70">Tier</div>
            <div className="display text-3xl leading-none">NYC Legend</div>
          </div>
        </div>
      </section>

      <SectionTitle action={<Link to="/leaderboard" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Leaderboard</Link>}>
        Chapter ({members?.length ?? 0})
      </SectionTitle>
      <ul className="mx-4 divide-y divide-border border-y border-border bg-card">
        {members?.map((m) => (
          <li key={m.id} className="flex items-center justify-between px-3 py-2.5">
            <div className="flex items-center gap-3">
              <div className="grid h-8 w-8 place-items-center rounded-full bg-foreground text-background">
                <span className="text-[10px] font-bold">{m.display_name.slice(0, 2).toUpperCase()}</span>
              </div>
              <span className="text-sm font-semibold">{m.display_name}</span>
            </div>
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
              {new Date(m.joined_at).toLocaleDateString(undefined, { month: "short", year: "2-digit" })}
            </span>
          </li>
        ))}
      </ul>

      <div className="m-4">
        <Pill>Demo mode</Pill>
        <p className="mt-2 text-xs text-muted-foreground">
          The MVP is ungated. Sign-in, invite codes and per-user OAuth will turn on once the chapter is ready to switch over.
        </p>
      </div>
    </PageShell>
  );
}
