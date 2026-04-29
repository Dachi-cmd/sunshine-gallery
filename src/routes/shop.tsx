import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useI18n, pickLocalized } from "@/lib/i18n";
import { resolveImage } from "@/lib/assetMap";
import { formatPrice } from "@/lib/siteSettings";
import { useCart } from "@/lib/cart";
import { ShoppingBag } from "lucide-react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";

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

type Product = {
  id: string;
  name: string;
  name_ka: string | null;
  description: string | null;
  description_ka: string | null;
  image_url: string;
  price_cents: number;
  currency: string;
  category: string;
  in_stock: boolean;
};

function Shop() {
  const { lang, t } = useI18n();
  const [category, setCategory] = useState<string>("all");
  const [openProductId, setOpenProductId] = useState<string | null>(null);
  const { data, isLoading } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("published", true)
        .order("sort_order");
      if (error) throw error;
      return data as Product[];
    },
  });

  const filtered = (data ?? []).filter((p) => category === "all" || (p.category ?? "other") === category);
  const openProduct = (data ?? []).find((p) => p.id === openProductId) ?? null;
  // Carousel slides: products sharing the open product's category
  const carouselItems = openProduct
    ? (data ?? []).filter((p) => (p.category ?? "other") === (openProduct.category ?? "other"))
    : [];
  const startIndex = openProduct ? Math.max(0, carouselItems.findIndex((p) => p.id === openProduct.id)) : 0;

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
            <button
              type="button"
              onClick={() => setOpenProductId(p.id)}
              className="block w-full text-left"
              aria-label={`Open ${pickLocalized(p, "name", lang)}`}
            >
              <div className="aspect-square overflow-hidden bg-muted">
                <img
                  src={resolveImage(p.image_url)}
                  alt={pickLocalized(p, "name", lang)}
                  loading="lazy"
                  className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.02]"
                />
              </div>
            </button>
            <div className="mt-5 flex items-start justify-between gap-4">
              <div>
                <h2 className="serif text-2xl">
                  <button
                    type="button"
                    onClick={() => setOpenProductId(p.id)}
                    className="hover:text-accent"
                  >
                    {pickLocalized(p, "name", lang)}
                  </button>
                </h2>
                <p className="mt-1 max-w-md text-sm text-muted-foreground">
                  {pickLocalized(p, "description", lang)}
                </p>
              </div>
              <div className="text-right">
                <p className="serif text-xl">{formatPrice(p.price_cents, p.currency, lang)}</p>
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

      <Dialog open={!!openProductId} onOpenChange={(o) => !o && setOpenProductId(null)}>
        <DialogContent className="max-w-4xl">
          {openProduct && (
            <ProductDialog
              key={openProduct.id}
              items={carouselItems}
              startIndex={startIndex}
              lang={lang}
              t={t}
            />
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}

function ProductDialog({
  items,
  startIndex,
  lang,
  t,
}: {
  items: Product[];
  startIndex: number;
  lang: "en" | "ka";
  t: (k: string) => string;
}) {
  const [api, setApi] = useState<CarouselApi | null>(null);
  const [current, setCurrent] = useState(startIndex);

  useEffect(() => {
    if (!api) return;
    api.scrollTo(startIndex, true);
    setCurrent(api.selectedScrollSnap());
    const onSelect = () => setCurrent(api.selectedScrollSnap());
    api.on("select", onSelect);
    api.on("reInit", onSelect);
    return () => {
      api.off("select", onSelect);
    };
  }, [api, startIndex]);

  const active = items[current] ?? items[0];

  return (
    <div>
      <DialogTitle className="sr-only">{active ? pickLocalized(active, "name", lang) : "Product"}</DialogTitle>
      <DialogDescription className="sr-only">
        {active ? pickLocalized(active, "description", lang) ?? "" : ""}
      </DialogDescription>

      <Carousel setApi={setApi} opts={{ startIndex, loop: items.length > 1 }} className="px-10">
        <CarouselContent>
          {items.map((p) => (
            <CarouselItem key={p.id}>
              <div className="aspect-square overflow-hidden bg-muted">
                <img
                  src={resolveImage(p.image_url)}
                  alt={pickLocalized(p, "name", lang)}
                  className="h-full w-full object-contain"
                />
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        {items.length > 1 && (
          <>
            <CarouselPrevious className="left-0" />
            <CarouselNext className="right-0" />
          </>
        )}
      </Carousel>

      {active && (
        <div className="mt-6 flex items-start justify-between gap-4 px-2">
          <div>
            <h2 className="serif text-2xl">{pickLocalized(active, "name", lang)}</h2>
            <p className="mt-1 max-w-lg text-sm text-muted-foreground">
              {pickLocalized(active, "description", lang)}
            </p>
            {items.length > 1 && (
              <p className="mt-2 text-[11px] uppercase tracking-[0.25em] text-muted-foreground">
                {current + 1} / {items.length}
              </p>
            )}
          </div>
          <div className="text-right">
            <p className="serif text-xl">{formatPrice(active.price_cents, active.currency, lang)}</p>
            {active.in_stock ? (
              <a
                href={`mailto:abramishvilidaviti@yahoo.com?subject=${encodeURIComponent(
                  `Inquiry: ${active.name}`,
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
      )}
    </div>
  );
}
