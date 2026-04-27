import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import portrait from "@/assets/portrait.jpg";
import studio1 from "@/assets/studio-1.jpg";
import studio2 from "@/assets/studio-2.jpg";
import studio3 from "@/assets/studio-3.jpg";
import studio4 from "@/assets/studio-4.jpg";
import studioVideo from "@/assets/studio-video.mp4.asset.json";
import { useI18n } from "@/lib/i18n";
import { useAboutSettings } from "@/lib/aboutSettings";

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

const defaultStudio = [studio1, studio2, studio3, studio4];

function About() {
  const { t, lang } = useI18n();
  const { data: settings } = useAboutSettings();
  const [slide, setSlide] = useState(0);

  const portraitSrc = settings?.about_portrait_url || portrait;
  const videoSrc = settings?.about_video_url || studioVideo.url;
  const slides = (settings?.about_studio_images?.length ? settings.about_studio_images : defaultStudio) as string[];
  const exhibitions = settings?.about_exhibitions ?? [];
  const bio = (lang === "en" ? settings?.about_bio_en : settings?.about_bio_ka) ?? "";
  const bioParagraphs = bio.split(/\n\s*\n/).map((s) => s.trim()).filter(Boolean);

  useEffect(() => {
    if (slides.length < 2) return;
    const id = setInterval(() => setSlide((s) => (s + 1) % slides.length), 4000);
    return () => clearInterval(id);
  }, [slides.length]);

  return (
    <section className="mx-auto grid max-w-6xl grid-cols-1 gap-16 px-6 py-20 md:grid-cols-2 md:py-28">
      <div className="aspect-[4/5] overflow-hidden bg-muted">
        <img
          src={portraitSrc}
          alt="Portrait of the artist"
          className="h-full w-full object-cover grayscale"
        />
      </div>
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
          {t("about.title")}
        </p>
        <h1 className="serif mt-4 text-4xl md:text-5xl">Davit Abramishvili</h1>
        <div className="mt-8 space-y-5 text-base leading-relaxed text-foreground/90">
          {bioParagraphs.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>
      </div>
      <div className="md:col-span-2">
        <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
          {lang === "en" ? "Exhibitions" : "გამოფენები"}
        </p>
        <h2 className="serif mt-4 text-3xl md:text-4xl">
          {lang === "en" ? "Selected Exhibitions" : "რჩეული გამოფენები"}
        </h2>
        <ul className="mt-10 divide-y divide-border border-y border-border">
          {exhibitions.map((ex) => {
            const loc = lang === "en" ? ex.en : ex.ka;
            return (
              <li
                key={ex.year + loc.title}
                className="grid grid-cols-[80px_1fr] gap-6 py-5 md:grid-cols-[100px_1fr_auto]"
              >
                <span className="serif text-lg text-muted-foreground">{ex.year}</span>
                <span className="text-base text-foreground">{loc.title}</span>
                <span className="text-sm text-muted-foreground md:text-right">{loc.venue}</span>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="md:col-span-2">
        <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
          {lang === "en" ? "Studio" : "სტუდია"}
        </p>
        <h2 className="serif mt-4 text-3xl md:text-4xl">
          {lang === "en" ? "Inside the Studio" : "სტუდიის შიგნით"}
        </h2>

        <div className="relative mt-8 aspect-[16/9] overflow-hidden bg-muted">
          {slides.map((src, i) => (
            <img
              key={src + i}
              src={src}
              alt=""
              loading="lazy"
              width={1280}
              height={800}
              className="absolute inset-0 h-full w-full object-cover transition-opacity duration-1000"
              style={{ opacity: slide === i ? 1 : 0 }}
            />
          ))}
          {slides.length > 1 && (
            <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2">
              {slides.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setSlide(i)}
                  aria-label={`Slide ${i + 1}`}
                  className="h-1.5 w-8 bg-white/40 transition-colors hover:bg-white/70"
                  style={{ backgroundColor: slide === i ? "rgba(255,255,255,0.95)" : undefined }}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="md:col-span-2">
        <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
          {lang === "en" ? "Video" : "ვიდეო"}
        </p>
        <h2 className="serif mt-4 text-3xl md:text-4xl">
          {lang === "en" ? "A Visit to the Studio" : "ვიზიტი სტუდიაში"}
        </h2>
        <div className="mt-8 aspect-video overflow-hidden bg-black">
          <video
            src={videoSrc}
            controls
            playsInline
            preload="metadata"
            className="h-full w-full object-cover"
          />
        </div>
      </div>
    </section>
  );
}
