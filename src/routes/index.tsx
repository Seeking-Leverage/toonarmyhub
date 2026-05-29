import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AppHeader } from "@/components/AppHeader";
import { PageShell, SectionTitle, Pill } from "@/components/PageShell";
import {
  fetchUpcomingEvents,
  fetchAnnouncements,
  fetchContent,
  fetchLeaderboard,
  fetchRsvpCount,
} from "@/lib/api";
import { Calendar, MapPin, Megaphone, Inbox, Trophy, ChevronRight } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "NYC Toon Army — Feed" },
      { name: "description", content: "Your chapter's feed: next watch party, announcements, queue and leaderboard." },
    ],
  }),
  component: FeedPage,
});

function formatWhen(iso: string) {
  const d = new Date(iso);
  const days = Math.round((d.getTime() - Date.now()) / 86400000);
  const dayLabel =
    days === 0 ? "Today" : days === 1 ? "Tomorrow" : days < 7 ? d.toLocaleDateString(undefined, { weekday: "long" }) : d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  const time = d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  return `${dayLabel} · ${time}`;
}

function FeedPage() {
  const { data: events } = useQuery({ queryKey: ["events", "upcoming"], queryFn: fetchUpcomingEvents });
  const { data: announcements } = useQuery({ queryKey: ["announcements"], queryFn: () => fetchAnnouncements(3) });
  const { data: pending } = useQuery({ queryKey: ["content", "pending"], queryFn: () => fetchContent("pending") });
  const { data: leaderboard } = useQuery({ queryKey: ["leaderboard"], queryFn: () => fetchLeaderboard(5) });
  const nextEvent = events?.[0];
  const { data: rsvpCount } = useQuery({
    queryKey: ["rsvp-count", nextEvent?.id],
    queryFn: () => fetchRsvpCount(nextEvent!.id),
    enabled: !!nextEvent,
  });

  return (
    <PageShell>
      <AppHeader />

      {/* Next event hero */}
      {nextEvent && (
        <section className="px-4 pt-4">
          <Link to="/events" className="group block overflow-hidden border-2 border-foreground bg-foreground text-background">
            <div className="toon-stripes h-2 w-full opacity-100" />
            <div className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <Pill tone="accent">Next Up · Watch Party</Pill>
                  <h3 className="display mt-2 text-2xl leading-[0.95]">
                    {nextEvent.title}
                  </h3>
                </div>
                <ChevronRight className="mt-1 h-5 w-5 opacity-60 transition-transform group-hover:translate-x-0.5" />
              </div>
              <div className="mt-3 space-y-1 text-sm">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 opacity-70" />
                  <span>{formatWhen(nextEvent.starts_at)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 opacity-70" />
                  <span>{nextEvent.venue}</span>
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between border-t border-background/20 pt-3">
                <span className="text-xs uppercase tracking-widest opacity-70">
                  {rsvpCount ?? 0} going
                </span>
                <span className="bg-accent px-3 py-1.5 text-[11px] font-bold uppercase tracking-widest text-accent-foreground">
                  RSVP
                </span>
              </div>
            </div>
          </Link>
        </section>
      )}

      {/* Quick tiles */}
      <section className="mt-4 grid grid-cols-2 gap-2 px-4">
        <Link to="/content" className="group border border-foreground bg-background p-3">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Inbox className="h-4 w-4" />
            <span className="text-[10px] font-bold uppercase tracking-widest">Queue</span>
          </div>
          <div className="display mt-1 text-3xl leading-none">{pending?.length ?? 0}</div>
          <div className="mt-0.5 text-[11px] text-muted-foreground">pending review</div>
        </Link>
        <Link to="/leaderboard" className="group border border-foreground bg-background p-3">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Trophy className="h-4 w-4" />
            <span className="text-[10px] font-bold uppercase tracking-widest">Top Toon</span>
          </div>
          <div className="display mt-1 truncate text-lg leading-none">{leaderboard?.[0]?.display_name ?? "—"}</div>
          <div className="mt-0.5 text-[11px] text-muted-foreground">{leaderboard?.[0]?.points ?? 0} pts</div>
        </Link>
      </section>

      <SectionTitle action={<Link to="/announcements" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">View all</Link>}>
        Announcements
      </SectionTitle>
      <ul className="space-y-2 px-4">
        {announcements?.map((a) => (
          <li key={a.id} className="border-l-4 border-accent bg-card p-3">
            <div className="flex items-center gap-2">
              <Megaphone className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                {new Date(a.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
              </span>
            </div>
            <h4 className="display mt-1 text-lg leading-tight">{a.title}</h4>
            <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{a.body}</p>
          </li>
        ))}
        {announcements && announcements.length === 0 && (
          <li className="border border-dashed border-border p-4 text-center text-sm text-muted-foreground">No announcements yet.</li>
        )}
      </ul>

      <SectionTitle action={<Link to="/leaderboard" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">View all</Link>}>
        Leaderboard
      </SectionTitle>
      <ol className="divide-y divide-border border-y border-border bg-card">
        {leaderboard?.map((row) => (
          <li key={row.user_id} className="flex items-center justify-between px-4 py-2.5">
            <div className="flex items-center gap-3">
              <span className={`display w-6 text-center text-lg ${row.rank === 1 ? "text-accent" : "text-foreground"}`}>
                {row.rank}
              </span>
              <span className="text-sm font-semibold">{row.display_name}</span>
            </div>
            <span className="font-mono text-sm tabular-nums">{row.points.toLocaleString()}</span>
          </li>
        ))}
      </ol>
    </PageShell>
  );
}
