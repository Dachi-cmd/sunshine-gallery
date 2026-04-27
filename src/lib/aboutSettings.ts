import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type Exhibition = {
  year: string;
  en: { title: string; venue: string };
  ka: { title: string; venue: string };
};

export type AboutSettings = {
  about_portrait_url: string;
  about_video_url: string;
  about_studio_images: string[];
  about_exhibitions: Exhibition[];
  about_bio_en: string;
  about_bio_ka: string;
};

export const DEFAULT_BIO_EN = `Davit Abramishvili is a painter based in Tbilisi, Georgia. His practice moves between quiet figuration, atmospheric landscape, and intimate still life — pursuing a single question: how does paint hold time?

Working primarily in oil on canvas and linen, Davit builds his images slowly in thin, translucent layers, letting the surface settle before returning. The work has been exhibited in group and solo shows across the Caucasus and Europe.

The studio remains open to collectors and curators by appointment. For inquiries about available works, commissions, or studio visits, please get in touch directly.`;

export const DEFAULT_BIO_KA = `დავით აბრამიშვილი მხატვარია, რომელიც თბილისში მუშაობს. მისი პრაქტიკა მოიცავს მშვიდ ფიგურატივს, ატმოსფერულ პეიზაჟს და ინტიმურ ნატურმორტს — ერთი კითხვის გარშემო: როგორ ინახავს საღებავი დროს?

ძირითადად ზეთით ტილოსა და ტილოზე მუშაობს, სურათებს ნელა და თხელი, გამჭვირვალე ფენებით ქმნის. ნამუშევრები გამოფენილია კავკასიასა და ევროპაში.

სტუდია ღიაა კოლექციონერებისა და კურატორებისთვის შეთანხმებით. დაკავშირებისთვის გთხოვთ მოგვწეროთ ან დაგვირეკოთ.`;

export const ABOUT_DEFAULTS: AboutSettings = {
  about_portrait_url: "",
  about_video_url: "",
  about_studio_images: [],
  about_bio_en: DEFAULT_BIO_EN,
  about_bio_ka: DEFAULT_BIO_KA,
  about_exhibitions: [
    { year: "2024", en: { title: "Art New York — Group Exhibition", venue: "New York, USA" }, ka: { title: "Art New York — ჯგუფური გამოფენა", venue: "ნიუ-იორკი, აშშ" } },
    { year: "2023", en: { title: "Solo Show — Studio Practice", venue: "Tbilisi, Georgia" }, ka: { title: "სოლო გამოფენა — სტუდიური პრაქტიკა", venue: "თბილისი, საქართველო" } },
    { year: "2022", en: { title: "Caucasus Contemporary", venue: "Berlin, Germany" }, ka: { title: "კავკასიის თანამედროვე ხელოვნება", venue: "ბერლინი, გერმანია" } },
    { year: "2021", en: { title: "Quiet Figuration — Group Show", venue: "Tbilisi, Georgia" }, ka: { title: "მშვიდი ფიგურატივი — ჯგუფური გამოფენა", venue: "თბილისი, საქართველო" } },
  ],
};

const KEYS = [
  "about_portrait_url",
  "about_video_url",
  "about_studio_images",
  "about_exhibitions",
  "about_bio_en",
  "about_bio_ka",
] as const;

function parseJSON<T>(value: string | null, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

export function useAboutSettings() {
  return useQuery({
    queryKey: ["about-settings"],
    queryFn: async (): Promise<AboutSettings> => {
      const { data, error } = await supabase
        .from("site_settings")
        .select("key,value")
        .in("key", KEYS as unknown as string[]);
      if (error) throw error;
      const map: Record<string, string | null> = {};
      for (const row of data ?? []) map[row.key] = row.value;
      return {
        about_portrait_url: map.about_portrait_url || ABOUT_DEFAULTS.about_portrait_url,
        about_video_url: map.about_video_url || ABOUT_DEFAULTS.about_video_url,
        about_studio_images: parseJSON<string[]>(map.about_studio_images ?? null, ABOUT_DEFAULTS.about_studio_images),
        about_exhibitions: parseJSON<Exhibition[]>(map.about_exhibitions ?? null, ABOUT_DEFAULTS.about_exhibitions),
        about_bio_en: map.about_bio_en || ABOUT_DEFAULTS.about_bio_en,
        about_bio_ka: map.about_bio_ka || ABOUT_DEFAULTS.about_bio_ka,
      };
    },
  });
}
