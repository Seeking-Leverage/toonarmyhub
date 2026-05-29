import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { AppHeader } from "@/components/AppHeader";
import { PageShell, Pill } from "@/components/PageShell";
import { approveContent, fetchContent, submitContent } from "@/lib/api";
import { Check, Send, X, Plus } from "lucide-react";

export const Route = createFileRoute("/content")({
  head: () => ({
    meta: [
      { title: "Content Queue — NYC Toon Army" },
      { name: "description", content: "Approve member content and escalate to NUFC." },
    ],
  }),
  component: ContentPage,
});

function ContentPage() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<"pending" | "approved" | "escalated">("pending");
  const [composeOpen, setComposeOpen] = useState(false);
  const [caption, setCaption] = useState("");
  const { data } = useQuery({ queryKey: ["content", tab], queryFn: () => fetchContent(tab) });

  const review = useMutation({
    mutationFn: ({ id, action }: { id: string; action: "approved" | "rejected" | "escalated" }) =>
      approveContent(id, action),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["content"] }),
  });

  const submit = useMutation({
    mutationFn: () => submitContent(caption),
    onSuccess: () => {
      setCaption("");
      setComposeOpen(false);
      qc.invalidateQueries({ queryKey: ["content"] });
    },
  });

  return (
    <PageShell>
      <AppHeader subtitle="Content queue" />
      <div className="sticky top-[73px] z-20 flex items-center gap-2 border-b border-border bg-background px-4 py-2">
        {(["pending", "approved", "escalated"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-3 py-1.5 text-[11px] font-bold uppercase tracking-widest ${
              tab === t ? "bg-foreground text-background" : "bg-muted text-muted-foreground"
            }`}
          >
            {t}
          </button>
        ))}
        <button
          onClick={() => setComposeOpen(true)}
          className="ml-auto inline-flex items-center gap-1 bg-accent px-3 py-1.5 text-[11px] font-bold uppercase tracking-widest text-accent-foreground"
        >
          <Plus className="h-3.5 w-3.5" /> Submit
        </button>
      </div>

      <ul className="space-y-3 p-4">
        {data?.map((c) => (
          <li key={c.id} className="border-2 border-foreground bg-card">
            <div className="p-3">
              <div className="flex items-center justify-between">
                <Pill tone="dark">{c.author_name}</Pill>
                <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
                  {new Date(c.created_at).toLocaleDateString()}
                </span>
              </div>
              <p className="mt-2 text-sm">{c.caption}</p>
            </div>
            {tab === "pending" && (
              <div className="grid grid-cols-3 border-t-2 border-foreground text-[11px] font-bold uppercase tracking-widest">
                <button
                  onClick={() => review.mutate({ id: c.id, action: "approved" })}
                  className="flex items-center justify-center gap-1 bg-accent py-2 text-accent-foreground"
                >
                  <Check className="h-3.5 w-3.5" /> Approve
                </button>
                <button
                  onClick={() => review.mutate({ id: c.id, action: "escalated" })}
                  className="flex items-center justify-center gap-1 bg-foreground py-2 text-background"
                >
                  <Send className="h-3.5 w-3.5" /> NUFC
                </button>
                <button
                  onClick={() => review.mutate({ id: c.id, action: "rejected" })}
                  className="flex items-center justify-center gap-1 bg-background py-2"
                >
                  <X className="h-3.5 w-3.5" /> Reject
                </button>
              </div>
            )}
          </li>
        ))}
        {data && data.length === 0 && (
          <li className="border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            Nothing in {tab}.
          </li>
        )}
      </ul>

      {composeOpen && (
        <div className="fixed inset-0 z-50 grid place-items-end bg-foreground/40 backdrop-blur-sm">
          <div className="mx-auto w-full max-w-md border-t-2 border-foreground bg-background p-4 pb-8">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="display text-2xl">Submit content</h3>
              <button onClick={() => setComposeOpen(false)}><X className="h-5 w-5" /></button>
            </div>
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              rows={4}
              placeholder="What's the story? (Photo upload coming soon)"
              className="w-full border border-foreground bg-background p-3 text-sm"
            />
            <button
              disabled={!caption || submit.isPending}
              onClick={() => submit.mutate()}
              className="mt-3 w-full bg-foreground py-3 text-xs font-bold uppercase tracking-widest text-background disabled:opacity-40"
            >
              {submit.isPending ? "Sending..." : "Send to queue"}
            </button>
          </div>
        </div>
      )}
    </PageShell>
  );
}
