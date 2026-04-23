import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useI18n, pickLocalized } from "@/lib/i18n";
import { resolveImage } from "@/lib/assetMap";

export const Route = createFileRoute("/gallery")({
  head: () => ({
    meta: [
      { title: "Gallery — Davit Abramishvili" },
      { name: "description", content: "Browse the full gallery of paintings and studio works." },
      { property: "og:title", content: "Gallery — Davit Abramishvili" },
      { property: "og:description", content: "Browse the full gallery of paintings." },
    ],
  }),
  component: GalleryPage,
});

function GalleryPage() {
  const { lang, t } = useI18n();
  const [index, setIndex] = useState(0);
  const { data, isLoading } = useQuery({
    queryKey: ["artworks-all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("artworks")
        .select("*")
        .eq("published", true)
        .order("sort_order");
      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return <div className="mx-auto max-w-6xl px-6 py-32 text-center text-muted-foreground">…</div>;
  }
  if (!data || data.length === 0) {
    return (
      <div className="mx-auto max-w-6xl px-6 py-32 text-center text-muted-foreground">
        {t("gallery.empty")}
      </div>
    );
  }

  const len = data.length;
  const prev = () => setIndex((i) => (i - 1 + len) % len);
  const next = () => setIndex((i) => (i + 1) % len);
  const center = data[index];
  const left = data[(index - 1 + len) % len];
  const right = data[(index + 1) % len];

  return (
    <section className="mx-auto max-w-7xl px-6 py-16 md:py-24">
      <header className="mb-12 flex items-end justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
            {String(index + 1).padStart(2, "0")} / {String(len).padStart(2, "0")}
          </p>
          <h1 className="serif mt-2 text-4xl md:text-5xl">{pickLocalized(center, "title", lang)}</h1>
        </div>
        <div className="hidden md:block text-right text-xs uppercase tracking-[0.25em] text-muted-foreground">
          {center.year} · {center.medium}
        </div>
      </header>

      <div className="relative">
        <button
          type="button"
          onClick={prev}
          aria-label="Previous"
          className="absolute left-0 top-1/2 z-10 -translate-y-1/2 grid h-12 w-12 place-items-center rounded-full bg-background/80 backdrop-blur border border-border transition hover:bg-foreground hover:text-background"
        >
          <ChevronLeft size={20} />
        </button>
        <button
          type="button"
          onClick={next}
          aria-label="Next"
          className="absolute right-0 top-1/2 z-10 -translate-y-1/2 grid h-12 w-12 place-items-center rounded-full bg-background/80 backdrop-blur border border-border transition hover:bg-foreground hover:text-background"
        >
          <ChevronRight size={20} />
        </button>

        <div className="grid grid-cols-1 items-center gap-4 md:grid-cols-[1fr_2.2fr_1fr]">
          <button
            type="button"
            onClick={prev}
            className="hidden md:block aspect-[4/5] overflow-hidden bg-muted opacity-40 transition hover:opacity-70"
          >
            <img
              src={resolveImage(left.image_url)}
              alt={pickLocalized(left, "title", lang)}
              loading="lazy"
              className="h-full w-full object-cover"
            />
          </button>

          <div className="aspect-[4/5] overflow-hidden bg-muted shadow-2xl">
            <img
              src={resolveImage(center.image_url)}
              alt={pickLocalized(center, "title", lang)}
              className="h-full w-full object-cover"
            />
          </div>

          <button
            type="button"
            onClick={next}
            className="hidden md:block aspect-[4/5] overflow-hidden bg-muted opacity-40 transition hover:opacity-70"
          >
            <img
              src={resolveImage(right.image_url)}
              alt={pickLocalized(right, "title", lang)}
              loading="lazy"
              className="h-full w-full object-cover"
            />
          </button>
        </div>
      </div>

      <p className="mx-auto mt-10 max-w-2xl text-center text-sm text-muted-foreground md:hidden">
        {center.year} · {center.medium}
      </p>
      {pickLocalized(center, "description", lang) && (
        <p className="mx-auto mt-8 max-w-2xl text-center text-base leading-relaxed">
          {pickLocalized(center, "description", lang)}
        </p>
      )}
    </section>
  );
}
