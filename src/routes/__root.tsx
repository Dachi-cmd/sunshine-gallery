import { Outlet, createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

import appCss from "../styles.css?url";
import { ThemeProvider } from "@/lib/theme";
import { I18nProvider } from "@/lib/i18n";
import { AuthProvider } from "@/lib/auth";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Toaster } from "@/components/ui/sonner";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="serif text-7xl">404</h1>
        <p className="mt-4 text-sm uppercase tracking-[0.25em] text-muted-foreground">
          Page not found
        </p>
        <a
          href="/"
          className="mt-8 inline-block border-b border-foreground pb-1 text-xs uppercase tracking-[0.25em]"
        >
          Return home
        </a>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Davit Abramishvili — Painter" },
      {
        name: "description",
        content: "Contemporary paintings by Davit Abramishvili. Gallery, studio prints, and shop.",
      },
      { property: "og:title", content: "Davit Abramishvili — Painter" },
      { name: "twitter:title", content: "Davit Abramishvili — Painter" },
      { name: "description", content: "Sunshine Gallery is an art portfolio website with e-commerce capabilities." },
      { property: "og:description", content: "Sunshine Gallery is an art portfolio website with e-commerce capabilities." },
      { name: "twitter:description", content: "Sunshine Gallery is an art portfolio website with e-commerce capabilities." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/ea5057e2-e984-4c7f-88ca-c8b3b1e8acea/id-preview-94eb338b--d4b09021-ce7d-4bbc-96a5-7431e1cb3cf3.lovable.app-1776938645422.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/ea5057e2-e984-4c7f-88ca-c8b3b1e8acea/id-preview-94eb338b--d4b09021-ce7d-4bbc-96a5-7431e1cb3cf3.lovable.app-1776938645422.png" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:type", content: "website" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;500&family=Inter:wght@300;400;500;600&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
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
  const [qc] = useState(() => new QueryClient());
  return (
    <QueryClientProvider client={qc}>
      <ThemeProvider>
        <I18nProvider>
          <AuthProvider>
            <div className="flex min-h-screen flex-col">
              <SiteHeader />
              <main className="flex-1">
                <Outlet />
              </main>
              <SiteFooter />
            </div>
            <Toaster />
          </AuthProvider>
        </I18nProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
