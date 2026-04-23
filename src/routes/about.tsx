import { createFileRoute } from "@tanstack/react-router";
import portrait from "@/assets/portrait.jpg";
import exhibition from "@/assets/exhibition.jpg";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — Davit Abramishvili" },
      { name: "description", content: "About the artist Davit Abramishvili — biography and studio practice." },
      { property: "og:title", content: "About — Davit Abramishvili" },
      { property: "og:description", content: "Biography and studio practice." },
    ],
  }),
  component: About,
});

function About() {
  const { t, lang } = useI18n();
  return (
    <section className="mx-auto grid max-w-6xl grid-cols-1 gap-16 px-6 py-20 md:grid-cols-2 md:py-28">
      <div className="aspect-[4/5] overflow-hidden bg-muted">
        <img
          src={portrait}
          alt="Portrait of the artist"
          className="h-full w-full object-cover grayscale"
        />
      </div>
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
          {t("about.title")}
        </p>
        <h1 className="serif mt-4 text-4xl md:text-5xl">Davit Abramishvili</h1>
        {lang === "en" ? (
          <div className="mt-8 space-y-5 text-base leading-relaxed text-foreground/90">
            <p>
              Davit Abramishvili is a painter based in Tbilisi, Georgia. His practice moves between
              quiet figuration, atmospheric landscape, and intimate still life — pursuing a single
              question: how does paint hold time?
            </p>
            <p>
              Working primarily in oil on canvas and linen, Davit builds his images slowly in thin,
              translucent layers, letting the surface settle before returning. The work has been
              exhibited in group and solo shows across the Caucasus and Europe.
            </p>
            <p>
              The studio remains open to collectors and curators by appointment. For inquiries about
              available works, commissions, or studio visits, please get in touch directly.
            </p>
          </div>
        ) : (
          <div className="mt-8 space-y-5 text-base leading-relaxed text-foreground/90">
            <p>
              დავით აბრამიშვილი მხატვარია, რომელიც თბილისში მუშაობს. მისი პრაქტიკა მოიცავს მშვიდ
              ფიგურატივს, ატმოსფერულ პეიზაჟს და ინტიმურ ნატურმორტს — ერთი კითხვის გარშემო: როგორ
              ინახავს საღებავი დროს?
            </p>
            <p>
              ძირითადად ზეთით ტილოსა და ტილოზე მუშაობს, სურათებს ნელა და თხელი, გამჭვირვალე ფენებით
              ქმნის. ნამუშევრები გამოფენილია კავკასიასა და ევროპაში.
            </p>
            <p>
              სტუდია ღიაა კოლექციონერებისა და კურატორებისთვის შეთანხმებით. დაკავშირებისთვის გთხოვთ
              მოგვწეროთ ან დაგვირეკოთ.
            </p>
          </div>
        )}
      </div>
      <div className="md:col-span-2">
        <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
          {lang === "en" ? "Exhibition" : "გამოფენა"}
        </p>
        <h2 className="serif mt-4 text-3xl md:text-4xl">
          {lang === "en" ? "Art New York — Group Exhibition" : "Art New York — ჯგუფური გამოფენა"}
        </h2>
        <div className="mt-8 overflow-hidden bg-muted">
          <img
            src={exhibition}
            alt={
              lang === "en"
                ? "Davit Abramishvili at the Art New York group exhibition"
                : "დავით აბრამიშვილი Art New York-ის ჯგუფურ გამოფენაზე"
            }
            className="h-auto w-full object-cover"
            loading="lazy"
          />
        </div>
        <p className="mt-8 max-w-3xl text-base leading-relaxed text-foreground/90">
          {lang === "en"
            ? "Davit Abramishvili's work stands apart for its raw intensity and philosophical depth. Each canvas becomes a field of tension — a dialogue between silence and revelation, memory and absence. His presence in the group exhibition affirmed not only his unique voice, but also his ability to transform painting into a profound existential statement."
            : "დავით აბრამიშვილის ნამუშევრები გამოირჩევა ნედლი ინტენსივობითა და ფილოსოფიური სიღრმით. თითოეული ტილო იქცევა დაძაბულობის ველად — დიალოგად სიჩუმესა და გამოცხადებას, მეხსიერებასა და არყოფნას შორის. მისი მონაწილეობა ჯგუფურ გამოფენაში დაადასტურა არა მხოლოდ მისი უნიკალური ხმა, არამედ უნარი, ფერწერა აქციოს ღრმა ეგზისტენციალურ გამონათქვამად."}
        </p>
      </div>
    </section>
  );
}
