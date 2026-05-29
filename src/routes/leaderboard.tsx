import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AppHeader } from "@/components/AppHeader";
import { PageShell } from "@/components/PageShell";
import { fetchLeaderboard } from "@/lib/api";

export const Route = createFileRoute("/leaderboard")({
  head: () => ({
    meta: [
      { title: "Leaderboard — NYC Toon Army" },
      { name: "description", content: "Top Toon Points earners this chapter." },
    ],
  }),
  component: LeaderboardPage,
});

function LeaderboardPage() {
  const { data } = useQuery({ queryKey: ["leaderboard", "all"], queryFn: () => fetchLeaderboard(50) });
  return (
    <PageShell>
      <AppHeader subtitle="Toon Points leaderboard" />
      <ol className="mt-4 divide-y divide-border border-y border-border bg-card">
        {data?.map((row) => (
          <li key={row.user_id} className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-3">
              <span className={`display w-8 text-center text-2xl ${row.rank === 1 ? "text-accent" : row.rank <= 3 ? "text-foreground" : "text-muted-foreground"}`}>
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
