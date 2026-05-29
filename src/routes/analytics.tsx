import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AppHeader } from "@/components/AppHeader";
import { PageShell, Pill } from "@/components/PageShell";
import { fetchAnalytics } from "@/lib/api";
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Bar, BarChart } from "recharts";

export const Route = createFileRoute("/analytics")({
  head: () => ({
    meta: [
      { title: "Analytics — NYC Toon Army" },
      { name: "description", content: "Chapter engagement, content, points trend." },
    ],
  }),
  component: AnalyticsPage,
});

function Stat({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <div className="border-2 border-foreground bg-card p-3">
      <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="display mt-1 text-3xl leading-none">{value}</div>
      {hint && <div className="mt-1 text-[11px] text-muted-foreground">{hint}</div>}
    </div>
  );
}

function AnalyticsPage() {
  const { data } = useQuery({ queryKey: ["analytics"], queryFn: fetchAnalytics });
  if (!data) {
    return (
      <PageShell>
        <AppHeader subtitle="Analytics" />
        <div className="p-6 text-sm text-muted-foreground">Loading…</div>
      </PageShell>
    );
  }
  return (
    <PageShell>
      <AppHeader subtitle="Chapter analytics" />
      <div className="px-4 pt-4">
        <Pill tone="dark">{data.chapter.name}</Pill>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 px-4">
        <Stat label="Members" value={data.totalMembers} />
        <Stat label="Upcoming" value={data.upcomingEvents} hint="events" />
        <Stat label="RSVPs" value={data.totalRsvps} hint={`${data.checkIns} checked in`} />
        <Stat label="Toon Pts" value={data.totalPoints.toLocaleString()} hint="awarded all-time" />
        <Stat label="Pending" value={data.pendingContent} hint="queue" />
        <Stat label="Sent to NUFC" value={data.escalatedContent} hint="all-time" />
      </div>

      <h3 className="display mb-2 mt-6 px-4 text-xl uppercase">Points · last 12 weeks</h3>
      <div className="mx-4 h-44 border-2 border-foreground bg-card p-2">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data.weeks} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
            <XAxis dataKey="label" tick={{ fontSize: 10 }} stroke="currentColor" />
            <YAxis tick={{ fontSize: 10 }} stroke="currentColor" />
            <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--foreground)", fontSize: 12 }} />
            <Line type="monotone" dataKey="points" stroke="var(--foreground)" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <h3 className="display mb-2 mt-6 px-4 text-xl uppercase">Submissions · last 12 weeks</h3>
      <div className="mx-4 mb-6 h-40 border-2 border-foreground bg-card p-2">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data.weeks} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
            <XAxis dataKey="label" tick={{ fontSize: 10 }} stroke="currentColor" />
            <YAxis tick={{ fontSize: 10 }} stroke="currentColor" allowDecimals={false} />
            <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--foreground)", fontSize: 12 }} />
            <Bar dataKey="submissions" fill="var(--accent)" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </PageShell>
  );
}
