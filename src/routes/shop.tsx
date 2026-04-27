import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useI18n, pickLocalized } from "@/lib/i18n";
import { resolveImage } from "@/lib/assetMap";

const CATEGORIES = [
  { value: "all", label: "All" },
  { value: "t-shirts", label: "T-Shirts" },
  { value: "hoodies", label: "Hoodies" },
  { value: "bags", label: "Bags" },
  { value: "posters", label: "Posters" },
  { value: "postcards", label: "Postcards" },
  { value: "other", label: "Other" },
] as const;

export const Route = createFileRoute("/shop")({
  head: () => ({
    meta: [
      { title: "Shop — Davit Abramishvili" },
      { name: "description", content: "Limited edition prints and books from the studio." },
      { property: "og:title", content: "Shop — Davit Abramishvili" },
      { property: "og:description", content: "Limited edition prints and books." },
    ],
  }),
  component: Shop,
});

function formatPrice(cents: number, currency: string) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(cents / 100);
}

function Shop() {
  const { lang, t } = useI18n();
  const [category, setCategory] = useState<string>("all");
  const { data, isLoading } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("published", true)
        .order("sort_order");
      if (error) throw error;
      return data;
    },
  });

  const filtered = (data ?? []).filter((p) => category === "all" || (p.category ?? "other") === category);

  return (
    <section className="mx-auto max-w-6xl px-6 py-20 md:py-28">
      <header className="mb-14">
        <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Studio</p>
        <h1 className="serif mt-2 text-4xl md:text-5xl">Shop</h1>
      </header>

      <div className="mb-10 flex flex-wrap gap-x-6 gap-y-2 border-b border-border pb-4">
        {CATEGORIES.map((c) => (
          <button
            key={c.value}
            onClick={() => setCategory(c.value)}
            className={`text-xs uppercase tracking-[0.25em] transition ${
              category === c.value ? "text-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {isLoading && <p className="text-muted-foreground">…</p>}
      {!isLoading && filtered.length === 0 && (
        <p className="text-muted-foreground">{t("shop.empty")}</p>
      )}

      <div className="grid grid-cols-1 gap-12 md:grid-cols-2">
        {filtered.map((p) => (
          <article key={p.id} className="group">
            <div className="aspect-square overflow-hidden bg-muted">
              <img
                src={resolveImage(p.image_url)}
                alt={pickLocalized(p, "name", lang)}
                loading="lazy"
                className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.02]"
              />
            </div>
            <div className="mt-5 flex items-start justify-between gap-4">
              <div>
                <h2 className="serif text-2xl">{pickLocalized(p, "name", lang)}</h2>
                <p className="mt-1 max-w-md text-sm text-muted-foreground">
                  {pickLocalized(p, "description", lang)}
                </p>
              </div>
              <div className="text-right">
                <p className="serif text-xl">{formatPrice(p.price_cents, p.currency)}</p>
                {p.in_stock ? (
                  <a
                    href={`mailto:abramishvilidaviti@yahoo.com?subject=${encodeURIComponent(
                      `Inquiry: ${p.name}`,
                    )}`}
                    className="mt-2 inline-block border-b border-foreground pb-0.5 text-[11px] uppercase tracking-[0.25em] hover:text-accent hover:border-accent"
                  >
                    {t("shop.buy")}
                  </a>
                ) : (
                  <p className="mt-2 text-[11px] uppercase tracking-[0.25em] text-muted-foreground">
                    {t("shop.outOfStock")}
                  </p>
                )}
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
