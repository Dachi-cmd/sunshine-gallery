import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useI18n, pickLocalized } from "@/lib/i18n";
import { resolveImage } from "@/lib/assetMap";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Davit Abramishvili — Painter" },
      {
        name: "description",
        content: "Selected paintings, studio works, and prints by Davit Abramishvili.",
      },
      { property: "og:title", content: "Davit Abramishvili — Painter" },
      { property: "og:description", content: "Selected paintings and prints." },
    ],
  }),
  component: Index,
});

function Index() {
  const { lang, t } = useI18n();
  const { data } = useQuery({
    queryKey: ["artworks-newest"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("artworks")
        .select("*")
        .eq("published", true)
        .order("created_at", { ascending: false })
        .limit(3);
      if (error) throw error;
      return data;
    },
  });

  return (
    <div>
      <section className="mx-auto max-w-6xl px-6 pt-20 pb-16 md:pt-32 md:pb-24">
        <p className="mb-6 text-xs uppercase tracking-[0.3em] text-muted-foreground">
          Selected works · 2018 — 2024
        </p>
        <h1 className="serif text-5xl leading-[1.05] md:text-7xl">
          Paintings of stillness,
          <br />
          weight, and light.
        </h1>
        <p className="mt-8 max-w-xl text-base text-muted-foreground md:text-lg">
          A studio practice rooted in oil and patience — figures, landscapes, and quiet still lifes
          made over slow seasons in Tbilisi.
        </p>
        <div className="mt-10 flex gap-6">
          <Link
            to="/gallery"
            className="border-b border-foreground pb-1 text-xs uppercase tracking-[0.25em] transition hover:text-accent hover:border-accent"
          >
            {t("nav.gallery")} →
          </Link>
          <Link
            to="/shop"
            className="border-b border-transparent pb-1 text-xs uppercase tracking-[0.25em] text-muted-foreground transition hover:text-foreground hover:border-foreground"
          >
            {t("nav.shop")}
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-24">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {data?.map((a) => (
            <Link
              key={a.id}
              to="/gallery"
              className="group block"
            >
              <div className="aspect-[4/5] overflow-hidden bg-muted">
                <img
                  src={resolveImage(a.image_url)}
                  alt={pickLocalized(a, "title", lang)}
                  loading="lazy"
                  className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.02]"
                />
              </div>
              <p className="mt-3 serif text-lg">{pickLocalized(a, "title", lang)}</p>
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                {a.year} · {a.medium}
              </p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
