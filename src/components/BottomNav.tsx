import { Link, useRouterState } from "@tanstack/react-router";
import { Home, Calendar, Inbox, BarChart3, User } from "lucide-react";

const tabs = [
  { to: "/", label: "Feed", icon: Home },
  { to: "/events", label: "Events", icon: Calendar },
  { to: "/content", label: "Queue", icon: Inbox },
  { to: "/analytics", label: "Stats", icon: BarChart3 },
  { to: "/profile", label: "Me", icon: User },
] as const;

export function BottomNav() {
  const { location } = useRouterState();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 backdrop-blur">
      <ul className="mx-auto grid max-w-md grid-cols-5">
        {tabs.map((t) => {
          const active =
            t.to === "/"
              ? location.pathname === "/"
              : location.pathname.startsWith(t.to);
          const Icon = t.icon;
          return (
            <li key={t.to}>
              <Link
                to={t.to}
                className={`flex flex-col items-center gap-1 py-2.5 text-[10px] uppercase tracking-wider transition-colors ${
                  active ? "text-foreground" : "text-muted-foreground"
                }`}
              >
                <Icon className="h-5 w-5" strokeWidth={active ? 2.5 : 2} />
                <span className="font-semibold">{t.label}</span>
                {active && (
                  <span className="absolute -mt-0.5 h-0.5 w-6 -translate-y-3 bg-accent" />
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
