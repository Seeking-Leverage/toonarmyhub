import { supabase } from "@/integrations/supabase/client";
import {
  DEMO_CHAPTER_ID,
  DEMO_CHAPTER_NAME,
  DEMO_USER_ID,
  DEMO_USER_NAME,
} from "@/lib/demo";

export type LeaderboardRow = {
  user_id: string;
  display_name: string;
  points: number;
  rank: number;
};

export async function fetchUpcomingEvents() {
  const { data, error } = await supabase
    .from("events")
    .select("id,title,description,venue,starts_at,type")
    .eq("chapter_id", DEMO_CHAPTER_ID)
    .gte("starts_at", new Date().toISOString())
    .order("starts_at", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function fetchAnnouncements(limit = 10) {
  const { data, error } = await supabase
    .from("announcements")
    .select("id,title,body,created_at")
    .eq("chapter_id", DEMO_CHAPTER_ID)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data ?? [];
}

export async function fetchContent(status?: "pending" | "approved" | "rejected" | "escalated") {
  let q = supabase
    .from("content_items")
    .select("id,caption,status,created_at,author_id,media_url")
    .eq("chapter_id", DEMO_CHAPTER_ID)
    .order("created_at", { ascending: false });
  if (status) q = q.eq("status", status);
  const { data, error } = await q;
  if (error) throw error;
  // Attach author display name
  const authorIds = Array.from(new Set((data ?? []).map((d) => d.author_id).filter(Boolean))) as string[];
  let names: Record<string, string> = {};
  if (authorIds.length) {
    const { data: profs } = await supabase
      .from("profiles")
      .select("id,display_name")
      .in("id", authorIds);
    names = Object.fromEntries((profs ?? []).map((p) => [p.id, p.display_name]));
  }
  return (data ?? []).map((d) => ({ ...d, author_name: d.author_id ? names[d.author_id] ?? "Member" : "Member" }));
}

export async function fetchMembers() {
  const { data, error } = await supabase
    .from("profiles")
    .select("id,display_name,joined_at")
    .eq("chapter_id", DEMO_CHAPTER_ID)
    .order("joined_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function fetchLeaderboard(limit = 50): Promise<LeaderboardRow[]> {
  const { data: ledger, error } = await supabase
    .from("points_ledger")
    .select("user_id,delta")
    .eq("chapter_id", DEMO_CHAPTER_ID);
  if (error) throw error;
  const totals = new Map<string, number>();
  for (const row of ledger ?? []) {
    totals.set(row.user_id, (totals.get(row.user_id) ?? 0) + row.delta);
  }
  const ids = Array.from(totals.keys());
  const { data: profs } = ids.length
    ? await supabase.from("profiles").select("id,display_name").in("id", ids)
    : { data: [] as { id: string; display_name: string }[] };
  const nameMap = Object.fromEntries((profs ?? []).map((p) => [p.id, p.display_name]));
  return Array.from(totals.entries())
    .map(([user_id, points]) => ({
      user_id,
      points,
      display_name: nameMap[user_id] ?? "Member",
    }))
    .sort((a, b) => b.points - a.points)
    .slice(0, limit)
    .map((row, i) => ({ ...row, rank: i + 1 }));
}

export async function fetchMyPoints(userId = DEMO_USER_ID) {
  const { data, error } = await supabase
    .from("points_ledger")
    .select("delta")
    .eq("user_id", userId)
    .eq("chapter_id", DEMO_CHAPTER_ID);
  if (error) throw error;
  return (data ?? []).reduce((s, r) => s + r.delta, 0);
}

export async function fetchRsvpCount(eventId: string) {
  const { count, error } = await supabase
    .from("event_rsvps")
    .select("*", { count: "exact", head: true })
    .eq("event_id", eventId)
    .eq("status", "going");
  if (error) throw error;
  return count ?? 0;
}

export async function fetchAnalytics() {
  const [members, content, events, ledger, rsvps] = await Promise.all([
    supabase.from("profiles").select("id,joined_at").eq("chapter_id", DEMO_CHAPTER_ID),
    supabase.from("content_items").select("id,status,created_at").eq("chapter_id", DEMO_CHAPTER_ID),
    supabase.from("events").select("id,starts_at").eq("chapter_id", DEMO_CHAPTER_ID),
    supabase.from("points_ledger").select("delta,created_at,user_id").eq("chapter_id", DEMO_CHAPTER_ID),
    supabase.from("event_rsvps").select("event_id,status,checked_in_at"),
  ]);

  const totalMembers = members.data?.length ?? 0;
  const contentRows = content.data ?? [];
  const ledgerRows = ledger.data ?? [];
  const eventsRows = events.data ?? [];
  const rsvpRows = rsvps.data ?? [];

  const now = Date.now();
  const days = (n: number) => now - n * 24 * 60 * 60 * 1000;

  const contentByStatus = contentRows.reduce<Record<string, number>>((acc, r) => {
    acc[r.status] = (acc[r.status] ?? 0) + 1;
    return acc;
  }, {});

  // Last 12 weeks points trend
  const weeks: { label: string; points: number; submissions: number }[] = [];
  for (let i = 11; i >= 0; i--) {
    const weekStart = days(i * 7 + 6);
    const weekEnd = days(i * 7);
    const points = ledgerRows
      .filter((r) => {
        const t = new Date(r.created_at).getTime();
        return t >= weekStart && t < weekEnd;
      })
      .reduce((s, r) => s + r.delta, 0);
    const subs = contentRows.filter((r) => {
      const t = new Date(r.created_at).getTime();
      return t >= weekStart && t < weekEnd;
    }).length;
    const d = new Date(weekEnd);
    weeks.push({
      label: `${d.getMonth() + 1}/${d.getDate()}`,
      points,
      submissions: subs,
    });
  }

  const upcomingEvents = eventsRows.filter((e) => new Date(e.starts_at).getTime() > now).length;
  const totalRsvps = rsvpRows.filter((r) => r.status === "going").length;
  const checkIns = rsvpRows.filter((r) => r.checked_in_at).length;
  const totalPoints = ledgerRows.reduce((s, r) => s + r.delta, 0);

  return {
    chapter: { id: DEMO_CHAPTER_ID, name: DEMO_CHAPTER_NAME },
    totalMembers,
    upcomingEvents,
    totalRsvps,
    checkIns,
    totalPoints,
    pendingContent: contentByStatus.pending ?? 0,
    approvedContent: contentByStatus.approved ?? 0,
    escalatedContent: contentByStatus.escalated ?? 0,
    weeks,
  };
}

export async function approveContent(id: string, action: "approved" | "rejected" | "escalated") {
  const { error } = await supabase
    .from("content_items")
    .update({ status: action, reviewed_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}

export async function submitContent(caption: string) {
  const { error } = await supabase.from("content_items").insert({
    chapter_id: DEMO_CHAPTER_ID,
    author_id: DEMO_USER_ID,
    caption,
    status: "pending",
  });
  if (error) throw error;
}

export async function createEvent(input: {
  title: string;
  description: string;
  venue: string;
  starts_at: string;
  type: "watch_party" | "pub_meet" | "away_day" | "other";
}) {
  const { error } = await supabase.from("events").insert({
    chapter_id: DEMO_CHAPTER_ID,
    created_by: DEMO_USER_ID,
    ...input,
  });
  if (error) throw error;
}

export async function createAnnouncement(input: { title: string; body: string }) {
  const { error } = await supabase.from("announcements").insert({
    chapter_id: DEMO_CHAPTER_ID,
    created_by: DEMO_USER_ID,
    ...input,
  });
  if (error) throw error;
}

export { DEMO_USER_NAME, DEMO_USER_ID, DEMO_CHAPTER_NAME };
