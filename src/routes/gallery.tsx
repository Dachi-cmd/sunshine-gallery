import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState, useEffect } from "react";
import { Search, X, ChevronLeft, ChevronRight, ShoppingBag, MessageCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useI18n, pickLocalized } from "@/lib/i18n";
import { resolveImage } from "@/lib/assetMap";
import { useCart, buildWhatsappLink } from "@/lib/cart";
import { formatPrice } from "@/lib/siteSettings";

export const Route = createFileRoute("/gallery")({
  head: () => ({
    meta: [
      { title: "Gallery — Davit Abramishvili" },
      { name: "description", content: "Browse the full gallery of paintings, search by title, medium and year." },
      { property: "og:title", content: "Gallery — Davit Abramishvili" },
      { property: "og:description", content: "Browse the full gallery of paintings." },
    ],
  }),
  component: GalleryPage,
});

type Artwork = {
  id: string;
  title: string;
  title_ka: string | null;
  description: string | null;
  description_ka: string | null;
  image_url: string;
  year: number | null;
  medium: string | null;
  price_cents: number | null;
  currency: string | null;
};

function GalleryPage() {
  const { lang, t } = useI18n();
  const { addToCart } = useCart();
  const [query, setQuery] = useState("");
  const [medium, setMedium] = useState<string>("");
  const [year, setYear] = useState<string>("");
  const [lightbox, setLightbox] = useState<number | null>(null);
  const [descExpanded, setDescExpanded] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["artworks-all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("artworks")
        .select("*")
        .eq("published", true)
        .order("sort_order");
      if (error) throw error;
      return (data ?? []) as Artwork[];
    },
  });

  const mediums = useMemo(() => {
    const set = new Set<string>();
    data?.forEach((a) => a.medium && set.add(a.medium));
    return Array.from(set).sort();
  }, [data]);

  const years = useMemo(() => {
    const set = new Set<number>();
    data?.forEach((a) => a.year && set.add(a.year));
    return Array.from(set).sort((a, b) => b - a);
  }, [data]);

  const filtered = useMemo(() => {
    if (!data) return [];
    const q = query.trim().toLowerCase();
    return data.filter((a) => {
      if (medium && a.medium !== medium) return false;
      if (year && String(a.year) !== year) return false;
      if (!q) return true;
      const hay = [
        a.title,
        a.title_ka,
        a.medium,
        a.year ? String(a.year) : "",
        a.description,
        a.description_ka,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [data, query, medium, year]);

  const hasFilters = query || medium || year;
  const clearAll = () => {
    setQuery("");
    setMedium("");
    setYear("");
  };

  useEffect(() => {
    setDescExpanded(false);
  }, [lightbox]);

  // Lightbox keyboard nav
  useEffect(() => {
    if (lightbox === null) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightbox(null);
      if (e.key === "ArrowRight") setLightbox((i) => (i === null ? null : (i + 1) % filtered.length));
      if (e.key === "ArrowLeft") setLightbox((i) => (i === null ? null : (i - 1 + filtered.length) % filtered.length));
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [lightbox, filtered.length]);

  return (
    <section className="mx-auto max-w-7xl px-6 py-12 md:py-20">
      <header className="mb-10 md:mb-14">
        <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Collection</p>
        <h1 className="serif mt-2 text-4xl md:text-6xl">Gallery</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          {filtered.length} {t("gallery.results")}
          {data && filtered.length !== data.length ? ` / ${data.length}` : ""}
        </p>
      </header>

      {/* Search & filter toolbar */}
      <div className="mb-10 flex flex-col gap-3 md:flex-row md:items-center">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("gallery.search")}
            className="w-full rounded-none border border-border bg-background py-2.5 pl-10 pr-3 text-sm outline-none transition focus:border-foreground"
          />
        </div>
        <select
          value={medium}
          onChange={(e) => setMedium(e.target.value)}
          className="rounded-none border border-border bg-background px-3 py-2.5 text-sm outline-none transition focus:border-foreground"
        >
          <option value="">{t("gallery.allMediums")}</option>
          {mediums.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
        <select
          value={year}
          onChange={(e) => setYear(e.target.value)}
          className="rounded-none border border-border bg-background px-3 py-2.5 text-sm outline-none transition focus:border-foreground"
        >
          <option value="">{t("gallery.allYears")}</option>
          {years.map((y) => (
            <option key={y} value={String(y)}>
              {y}
            </option>
          ))}
        </select>
        {hasFilters && (
          <button
            type="button"
            onClick={clearAll}
            className="inline-flex items-center gap-1 border border-border px-3 py-2.5 text-xs uppercase tracking-[0.2em] transition hover:bg-foreground hover:text-background"
          >
            <X size={14} /> {t("gallery.clear")}
          </button>
        )}
      </div>

      {isLoading && (
        <div className="py-32 text-center text-muted-foreground">…</div>
      )}

      {!isLoading && filtered.length === 0 && (
        <div className="py-32 text-center text-muted-foreground">
          {data && data.length === 0 ? t("gallery.empty") : t("gallery.noResults")}
        </div>
      )}

      {/* Realistic gallery wall */}
      {filtered.length > 0 && (
        <div className="gallery-wall">
          <div className="gallery-wall__lighting" aria-hidden />
          <div className="gallery-wall__grid">
            {filtered.map((art, i) => (
              <button
                key={art.id}
                type="button"
                onClick={() => setLightbox(i)}
                className="group frame"
                aria-label={pickLocalized(art, "title", lang)}
              >
                <div className="frame__matte">
                  <div className="frame__art">
                    <img
                      src={resolveImage(art.image_url)}
                      alt={pickLocalized(art, "title", lang)}
                      loading="lazy"
                      className="transition duration-700 group-hover:scale-[1.03]"
                    />
                  </div>
                </div>
                <div className="frame__plaque">
                  <p className="serif text-sm leading-tight">{pickLocalized(art, "title", lang)}</p>
                  <p className="mt-0.5 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                    {[art.medium, art.year].filter(Boolean).join(" · ")}
                  </p>
                  {formatPrice(art.price_cents, art.currency) && (
                    <p className="mt-1 text-[11px] font-medium tracking-wide text-foreground">
                      {formatPrice(art.price_cents, art.currency)}
                    </p>
                  )}
                </div>
              </button>
            ))}
          </div>
          <div className="gallery-wall__floor" aria-hidden />
        </div>
      )}

      {/* Lightbox */}
      {lightbox !== null && filtered[lightbox] && (() => {
        const art = filtered[lightbox];
        const desc = pickLocalized(art, "description", lang) as string | null;
        const LIMIT = 240;
        const isLong = !!desc && desc.length > LIMIT;
        const shownDesc = !desc ? "" : !isLong || descExpanded ? desc : desc.slice(0, LIMIT).trimEnd() + "…";
        return (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-3 sm:p-6 backdrop-blur-sm"
            onClick={() => setLightbox(null)}
          >
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setLightbox(null);
              }}
              className="absolute right-3 top-3 z-10 grid h-9 w-9 place-items-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
              aria-label="Close"
            >
              <X size={16} />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setLightbox((i) => (i === null ? null : (i - 1 + filtered.length) % filtered.length));
              }}
              className="absolute left-2 top-1/2 z-10 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
              aria-label="Previous"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setLightbox((i) => (i === null ? null : (i + 1) % filtered.length));
              }}
              className="absolute right-2 top-1/2 z-10 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
              aria-label="Next"
            >
              <ChevronRight size={18} />
            </button>

            <div
              className="flex h-full max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-sm bg-black shadow-2xl md:flex-row"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Image side — preserves natural aspect */}
              <div className="flex flex-1 items-center justify-center bg-black p-4 md:p-6 min-h-0">
                <img
                  src={resolveImage(art.image_url)}
                  alt={pickLocalized(art, "title", lang)}
                  className="max-h-full max-w-full object-contain"
                />
              </div>

              {/* Info side — fixed-width black panel */}
              <aside className="flex w-full shrink-0 flex-col bg-black text-white md:w-[340px] md:border-l md:border-white/10">
                <div className="flex-1 overflow-y-auto px-6 py-6 md:px-7 md:py-8">
                  <p className="text-[10px] uppercase tracking-[0.3em] text-white/40">
                    {lightbox + 1} / {filtered.length}
                  </p>
                  <h2 className="serif mt-3 text-2xl leading-tight md:text-3xl">
                    {pickLocalized(art, "title", lang)}
                  </h2>
                  {(art.medium || art.year) && (
                    <p className="mt-2 text-[10px] uppercase tracking-[0.25em] text-white/50">
                      {[art.medium, art.year].filter(Boolean).join(" · ")}
                    </p>
                  )}
                  {formatPrice(art.price_cents, art.currency) && (
                    <p className="serif mt-4 text-xl text-white">
                      {formatPrice(art.price_cents, art.currency)}
                    </p>
                  )}
                  {desc && (
                    <div className="mt-5 border-t border-white/10 pt-4">
                      <p className="text-[10px] uppercase tracking-[0.25em] text-white/40">
                        {lang === "en" ? "Description" : "აღწერა"}
                      </p>
                      <p className="mt-2 text-sm leading-relaxed text-white/80">{shownDesc}</p>
                      {isLong && (
                        <button
                          type="button"
                          onClick={() => setDescExpanded((v) => !v)}
                          className="mt-2 text-[10px] uppercase tracking-[0.25em] text-white/60 underline-offset-4 hover:text-white hover:underline"
                        >
                          {descExpanded ? t("gallery.less") ?? "Less" : t("gallery.more") ?? "More"}
                        </button>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-2 border-t border-white/10 bg-black px-5 py-4 md:px-7 md:py-5">
                  <button
                    type="button"
                    onClick={() => void addToCart(art.id)}
                    className="inline-flex w-full items-center justify-center gap-1.5 bg-white px-3 py-2 text-[10px] uppercase tracking-[0.2em] text-black transition hover:bg-white/90"
                  >
                    <ShoppingBag size={12} /> {t("cart.add")}
                  </button>
                  <a
                    href={buildWhatsappLink(
                      `Hi! I'm interested in "${pickLocalized(art, "title", lang)}"${art.year ? ` (${art.year})` : ""}.`,
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex w-full items-center justify-center gap-1.5 border border-white/30 px-3 py-2 text-[10px] uppercase tracking-[0.2em] text-white transition hover:bg-white/10"
                  >
                    <MessageCircle size={12} /> {t("cart.inquire")}
                  </a>
                </div>
              </aside>
            </div>
          </div>
        );
      })()}
    </section>
  );
}
