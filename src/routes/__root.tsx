import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  createRootRouteWithContext,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { BottomNav } from "@/components/BottomNav";

import appCss from "../styles.css?url";

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { name: "theme-color", content: "#000000" },
      { title: "Toon Army Hub" },
      { name: "description", content: "The digital Gallowgate End for the global Toon Army." },
    ],
    links: [{ rel: "stylesheet", href: appCss }],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: () => (
    <div className="grid min-h-screen place-items-center bg-background p-6 text-center">
      <div>
        <div className="display text-6xl">404</div>
        <p className="mt-2 text-sm text-muted-foreground">Howay — that page isn't here.</p>
        <a href="/" className="mt-4 inline-block bg-foreground px-4 py-2 text-xs font-bold uppercase tracking-widest text-background">Back to feed</a>
      </div>
    </div>
  ),
  errorComponent: ({ error }) => {
    console.error(error);
    return (
      <div className="grid min-h-screen place-items-center bg-background p-6 text-center">
        <div>
          <div className="display text-3xl">Something went wrong</div>
          <p className="mt-2 text-sm text-muted-foreground">Pull down to refresh, or head back to the feed.</p>
          <a href="/" className="mt-4 inline-block bg-foreground px-4 py-2 text-xs font-bold uppercase tracking-widest text-background">Back to feed</a>
        </div>
      </div>
    );
  },
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <Outlet />
      <BottomNav />
    </QueryClientProvider>
  );
}
