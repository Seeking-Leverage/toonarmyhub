import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { AppHeader } from "@/components/AppHeader";
import { PageShell, SectionTitle, Pill } from "@/components/PageShell";
import { createEvent, fetchUpcomingEvents } from "@/lib/api";
import { Calendar, MapPin, Plus, X } from "lucide-react";

export const Route = createFileRoute("/events")({
  head: () => ({
    meta: [
      { title: "Events — NYC Toon Army" },
      { name: "description", content: "Watch parties, pub meets, away days." },
    ],
  }),
  component: EventsPage,
});

function EventsPage() {
  const qc = useQueryClient();
  const { data: events } = useQuery({ queryKey: ["events", "upcoming"], queryFn: fetchUpcomingEvents });
  const [open, setOpen] = useState(false);
  return (
    <PageShell>
      <AppHeader subtitle="Upcoming events" />
      <div className="flex items-center justify-between px-4 pt-4">
        <Pill tone="dark">{events?.length ?? 0} upcoming</Pill>
        <button
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-1.5 bg-foreground px-3 py-2 text-[11px] font-bold uppercase tracking-widest text-background"
        >
          <Plus className="h-3.5 w-3.5" /> New
        </button>
      </div>

      <ul className="mt-4 space-y-3 px-4">
        {events?.map((e) => {
          const d = new Date(e.starts_at);
          return (
            <li key={e.id} className="border-2 border-foreground bg-card">
              <div className="flex items-stretch">
                <div className="flex w-20 flex-col items-center justify-center bg-foreground px-3 py-4 text-background">
                  <span className="text-[10px] font-bold uppercase tracking-widest opacity-70">
                    {d.toLocaleDateString(undefined, { month: "short" })}
                  </span>
                  <span className="display text-3xl leading-none">{d.getDate()}</span>
                  <span className="mt-1 text-[10px] uppercase opacity-70">
                    {d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}
                  </span>
                </div>
                <div className="flex-1 p-3">
                  <Pill>{e.type.replace("_", " ")}</Pill>
                  <h3 className="display mt-1.5 text-lg leading-tight">{e.title}</h3>
                  <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{e.description}</p>
                  <div className="mt-2 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                    <MapPin className="h-3 w-3" /> {e.venue}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 border-t-2 border-foreground text-[11px] font-bold uppercase tracking-widest">
                <button className="bg-accent py-2 text-accent-foreground">RSVP Going</button>
                <button className="bg-background py-2">Check in</button>
              </div>
            </li>
          );
        })}
        {events && events.length === 0 && (
          <li className="border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            No upcoming events. Tap “New” to create one.
          </li>
        )}
      </ul>

      {open && <NewEventModal onClose={() => setOpen(false)} onCreated={() => qc.invalidateQueries({ queryKey: ["events"] })} />}
    </PageShell>
  );
}

function NewEventModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [title, setTitle] = useState("");
  const [venue, setVenue] = useState("Peter Dillon's, Midtown");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(() => new Date(Date.now() + 86400000).toISOString().slice(0, 16));
  const [type, setType] = useState<"watch_party" | "pub_meet" | "away_day" | "other">("watch_party");
  const m = useMutation({
    mutationFn: () =>
      createEvent({
        title,
        venue,
        description,
        starts_at: new Date(date).toISOString(),
        type,
      }),
    onSuccess: () => {
      onCreated();
      onClose();
    },
  });

  return (
    <div className="fixed inset-0 z-50 grid place-items-end bg-foreground/40 backdrop-blur-sm">
      <div className="mx-auto w-full max-w-md border-t-2 border-foreground bg-background p-4 pb-8">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="display text-2xl">New Event</h3>
          <button onClick={onClose} className="p-1"><X className="h-5 w-5" /></button>
        </div>
        <div className="space-y-3">
          <Field label="Title">
            <input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full border border-foreground bg-background px-3 py-2 text-sm" placeholder="Newcastle vs ..." />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Type">
              <select value={type} onChange={(e) => setType(e.target.value as typeof type)} className="w-full border border-foreground bg-background px-3 py-2 text-sm">
                <option value="watch_party">Watch party</option>
                <option value="pub_meet">Pub meet</option>
                <option value="away_day">Away day</option>
                <option value="other">Other</option>
              </select>
            </Field>
            <Field label="When">
              <input type="datetime-local" value={date} onChange={(e) => setDate(e.target.value)} className="w-full border border-foreground bg-background px-3 py-2 text-sm" />
            </Field>
          </div>
          <Field label="Venue">
            <input value={venue} onChange={(e) => setVenue(e.target.value)} className="w-full border border-foreground bg-background px-3 py-2 text-sm" />
          </Field>
          <Field label="Details">
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="w-full border border-foreground bg-background px-3 py-2 text-sm" />
          </Field>
          <button
            disabled={!title || m.isPending}
            onClick={() => m.mutate()}
            className="w-full bg-foreground py-3 text-xs font-bold uppercase tracking-widest text-background disabled:opacity-40"
          >
            {m.isPending ? "Creating..." : "Create event"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}
