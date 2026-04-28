import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type SiteSettings = {
  contact_email: string;
  contact_phone: string;
  contact_phone_link: string;
  social_instagram: string;
  social_youtube: string;
  social_facebook: string;
  social_linkedin: string;
  home_kicker_en: string;
  home_kicker_ka: string;
  home_title_en: string;
  home_title_ka: string;
  home_subtitle_en: string;
  home_subtitle_ka: string;
  about_kicker_en: string;
  about_kicker_ka: string;
  about_title_en: string;
  about_title_ka: string;
};

export const SETTINGS_DEFAULTS: SiteSettings = {
  contact_email: "abramishvilidaviti@yahoo.com",
  contact_phone: "597 00 93 91",
  contact_phone_link: "+995597009391",
  social_instagram: "https://instagram.com/",
  social_youtube: "https://youtube.com/",
  social_facebook: "https://facebook.com/",
  social_linkedin: "https://linkedin.com/",
  home_kicker_en: "Selected works · 2018 — 2024",
  home_kicker_ka: "რჩეული ნამუშევრები · 2018 — 2024",
  home_title_en: "Paintings of stillness,\nweight, and light.",
  home_title_ka: "მშვიდობის, სიმძიმის\nდა სინათლის მხატვრობა.",
  home_subtitle_en:
    "A studio practice rooted in oil and patience — figures, landscapes, and quiet still lifes made over slow seasons in Tbilisi.",
  home_subtitle_ka:
    "სტუდიური პრაქტიკა, დაფუძნებული ზეთზე და მოთმინებაზე — ფიგურები, პეიზაჟები და მშვიდი ნატურმორტები, შექმნილი ნელ სეზონებში თბილისში.",
  about_kicker_en: "About the Artist",
  about_kicker_ka: "მხატვრის შესახებ",
  about_title_en: "Davit Abramishvili",
  about_title_ka: "დავით აბრამიშვილი",
};

export function useSiteSettings() {
  return useQuery({
    queryKey: ["site-settings"],
    queryFn: async (): Promise<SiteSettings> => {
      const { data, error } = await supabase.from("site_settings").select("key,value");
      if (error) throw error;
      const map = { ...SETTINGS_DEFAULTS };
      for (const row of data ?? []) {
        if (row.value != null && row.key in map) {
          (map as Record<string, string>)[row.key] = row.value;
        }
      }
      return map;
    },
  });
}

// Approximate USD -> GEL conversion rate used for display when language is Georgian.
export const USD_TO_GEL = 2.7;

export function formatPrice(
  priceCents: number | null | undefined,
  currency: string | null | undefined,
  lang?: "en" | "ka",
): string | null {
  if (priceCents == null || !Number.isFinite(priceCents)) return null;
  let cur = currency || "USD";
  let amount = priceCents / 100;
  if (lang === "ka") {
    if (cur.toUpperCase() === "USD") {
      amount = amount * USD_TO_GEL;
    }
    cur = "GEL";
  }
  try {
    return new Intl.NumberFormat(lang === "ka" ? "ka-GE" : "en-US", {
      style: "currency",
      currency: cur,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${amount.toFixed(0)} ${cur}`;
  }
}
