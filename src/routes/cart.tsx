import { createFileRoute, Link } from "@tanstack/react-router";
import { Trash2, MessageCircle } from "lucide-react";
import { useCart, buildWhatsappLink, type CartItem } from "@/lib/cart";
import { useAuth } from "@/lib/auth";
import { useI18n, pickLocalized } from "@/lib/i18n";
import { resolveImage } from "@/lib/assetMap";
import { formatPrice } from "@/lib/siteSettings";

export const Route = createFileRoute("/cart")({
  head: () => ({
    meta: [
      { title: "Your Cart — Davit Abramishvili" },
      { name: "description", content: "Review your selected artworks and inquire via WhatsApp." },
    ],
  }),
  component: CartPage,
});

function getDisplay(item: CartItem, lang: "en" | "ka") {
  if (item.artwork) {
    return {
      title: pickLocalized(item.artwork, "title", lang),
      image: item.artwork.image_url,
      meta: [item.artwork.medium, item.artwork.year].filter(Boolean).join(" · "),
      price: null as string | null,
      year: item.artwork.year,
    };
  }
  if (item.product) {
    return {
      title: pickLocalized(item.product, "name", lang),
      image: item.product.image_url,
      meta: "",
      price: formatPrice(item.product.price_cents, item.product.currency, lang),
      year: null as number | null,
    };
  }
  return { title: "Item", image: "", meta: "", price: null, year: null };
}

function CartPage() {
  const { user, loading } = useAuth();
  const { items, removeFromCart, clearCart } = useCart();
  const { lang, t } = useI18n();

  if (loading) return <div className="py-32 text-center text-muted-foreground">…</div>;

  if (!user) {
    return (
      <section className="mx-auto max-w-md px-6 py-24 text-center">
        <h1 className="serif text-4xl">{t("cart.title")}</h1>
        <p className="mt-4 text-sm text-muted-foreground">{t("cart.signInPrompt")}</p>
        <Link
          to="/auth"
          className="mt-8 inline-block border-b border-foreground pb-1 text-xs uppercase tracking-[0.25em]"
        >
          {t("auth.signIn")} →
        </Link>
      </section>
    );
  }

  const checkoutMessage = () => {
    const lines = items.map((i, n) => {
      const d = getDisplay(i, lang);
      return `${n + 1}. ${d.title}${d.year ? ` (${d.year})` : ""}`;
    });
    return `Hi! I'd like to inquire about these items:\n\n${lines.join("\n")}`;
  };

  return (
    <section className="mx-auto max-w-4xl px-6 py-12 md:py-20">
      <header className="mb-10">
        <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">{t("cart.label")}</p>
        <h1 className="serif mt-2 text-4xl md:text-5xl">{t("cart.title")}</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          {items.length} {items.length === 1 ? t("cart.item") : t("cart.items")}
        </p>
      </header>

      {items.length === 0 ? (
        <div className="py-24 text-center">
          <p className="text-muted-foreground">{t("cart.empty")}</p>
          <Link
            to="/gallery"
            className="mt-6 inline-block border-b border-foreground pb-1 text-xs uppercase tracking-[0.25em]"
          >
            {t("cart.browse")}
          </Link>
        </div>
      ) : (
        <>
          <ul className="divide-y divide-border border-y border-border">
            {items.map((item) => {
              const d = getDisplay(item, lang);
              return (
                <li key={item.id} className="flex items-center gap-5 py-5">
                  <div className="h-20 w-20 overflow-hidden bg-muted">
                    {d.image && (
                      <img
                        src={resolveImage(d.image)}
                        alt={d.title}
                        className="h-full w-full object-cover"
                      />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="serif text-lg">{d.title}</p>
                    {d.meta && (
                      <p className="mt-0.5 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                        {d.meta}
                      </p>
                    )}
                    {d.price && (
                      <p className="mt-0.5 text-sm text-muted-foreground">{d.price}</p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => removeFromCart(item.id)}
                    className="grid h-9 w-9 place-items-center text-muted-foreground transition hover:text-foreground"
                    aria-label="Remove"
                  >
                    <Trash2 size={16} />
                  </button>
                </li>
              );
            })}
          </ul>

          <div className="mt-10 flex flex-col items-stretch gap-3 sm:flex-row sm:justify-between">
            <button
              type="button"
              onClick={clearCart}
              className="text-xs uppercase tracking-[0.25em] text-muted-foreground hover:text-foreground"
            >
              {t("cart.clear")}
            </button>
            <a
              href={buildWhatsappLink(checkoutMessage())}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 bg-foreground px-6 py-3 text-xs uppercase tracking-[0.25em] text-background transition hover:bg-accent"
            >
              <MessageCircle size={14} /> {t("cart.checkout")}
            </a>
          </div>
        </>
      )}
    </section>
  );
}
