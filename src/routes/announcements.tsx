import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { AppHeader } from "@/components/AppHeader";
import { PageShell } from "@/components/PageShell";
import { createAnnouncement, fetchAnnouncements } from "@/lib/api";
import { Megaphone, Plus, X } from "lucide-react";

export const Route = createFileRoute("/announcements")({
  head: () => ({
    meta: [
      { title: "Announcements — NYC Toon Army" },
      { name: "description", content: "Chapter broadcasts and news." },
    ],
  }),
  component: AnnouncementsPage,
});

function AnnouncementsPage() {
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["announcements"], queryFn: () => fetchAnnouncements(50) });
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const m = useMutation({
    mutationFn: () => createAnnouncement({ title, body }),
    onSuccess: () => {
      setTitle(""); setBody(""); setOpen(false);
      qc.invalidateQueries({ queryKey: ["announcements"] });
    },
  });

  return (
    <PageShell>
      <AppHeader subtitle="Announcements" />
      <div className="flex items-center justify-end p-4">
        <button onClick={() => setOpen(true)} className="inline-flex items-center gap-1 bg-foreground px-3 py-2 text-[11px] font-bold uppercase tracking-widest text-background">
          <Plus className="h-3.5 w-3.5" /> Broadcast
        </button>
      </div>
      <ul className="space-y-3 px-4">
        {data?.map((a) => (
          <li key={a.id} className="border-l-4 border-accent bg-card p-3">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Megaphone className="h-3.5 w-3.5" />
              <span className="text-[10px] font-bold uppercase tracking-widest">
                {new Date(a.created_at).toLocaleDateString()}
              </span>
            </div>
            <h4 className="display mt-1 text-xl leading-tight">{a.title}</h4>
            <p className="mt-1 text-sm text-muted-foreground">{a.body}</p>
          </li>
        ))}
      </ul>
      {open && (
        <div className="fixed inset-0 z-50 grid place-items-end bg-foreground/40 backdrop-blur-sm">
          <div className="mx-auto w-full max-w-md border-t-2 border-foreground bg-background p-4 pb-8">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="display text-2xl">New broadcast</h3>
              <button onClick={() => setOpen(false)}><X className="h-5 w-5" /></button>
            </div>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" className="mb-2 w-full border border-foreground bg-background p-3 text-sm" />
            <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={4} placeholder="Message" className="w-full border border-foreground bg-background p-3 text-sm" />
            <button disabled={!title || !body || m.isPending} onClick={() => m.mutate()} className="mt-3 w-full bg-foreground py-3 text-xs font-bold uppercase tracking-widest text-background disabled:opacity-40">
              {m.isPending ? "Sending..." : "Send to chapter"}
            </button>
          </div>
        </div>
      )}
    </PageShell>
  );
}
