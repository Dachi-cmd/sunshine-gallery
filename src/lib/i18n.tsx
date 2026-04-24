import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Lang = "en" | "ka";

type Dict = Record<string, { en: string; ka: string }>;

const dict: Dict = {
  "nav.gallery": { en: "Gallery", ka: "გალერეა" },
  "nav.about": { en: "About", ka: "შესახებ" },
  "nav.shop": { en: "Shop", ka: "მაღაზია" },
  "nav.admin": { en: "Admin", ka: "ადმინი" },
  "footer.contact": { en: "Contact", ka: "კონტაქტი" },
  "gallery.empty": { en: "No artworks yet.", ka: "ნამუშევრები ჯერ არ არის." },
  "gallery.noResults": { en: "No works match your search.", ka: "ვერაფერი მოიძებნა." },
  "gallery.search": { en: "Search title, medium, year…", ka: "ძიება სათაურით, ტექნიკით, წლით…" },
  "gallery.allMediums": { en: "All mediums", ka: "ყველა ტექნიკა" },
  "gallery.allYears": { en: "All years", ka: "ყველა წელი" },
  "gallery.clear": { en: "Clear", ka: "გასუფთავება" },
  "gallery.results": { en: "works", ka: "ნამუშევარი" },
  "shop.empty": { en: "Shop is empty.", ka: "მაღაზია ცარიელია." },
  "shop.outOfStock": { en: "Sold out", ka: "გაყიდულია" },
  "shop.buy": { en: "Inquire", ka: "დაკავშირება" },
  "about.title": { en: "About the Artist", ka: "მხატვრის შესახებ" },
  "admin.signIn": { en: "Admin Sign In", ka: "ადმინის შესვლა" },
  "admin.email": { en: "Email", ka: "ელფოსტა" },
  "admin.password": { en: "Password", ka: "პაროლი" },
  "admin.submit": { en: "Sign In", ka: "შესვლა" },
  "auth.account": { en: "Account", ka: "ანგარიში" },
  "auth.signIn": { en: "Sign In", ka: "შესვლა" },
  "auth.signUp": { en: "Sign Up", ka: "რეგისტრაცია" },
  "auth.createAccount": { en: "Create Account", ka: "ანგარიშის შექმნა" },
  "auth.name": { en: "Name", ka: "სახელი" },
  "auth.email": { en: "Email", ka: "ელფოსტა" },
  "auth.password": { en: "Password", ka: "პაროლი" },
  "auth.continueGoogle": { en: "Continue with Google", ka: "გაგრძელება Google-ით" },
  "auth.continueApple": { en: "Continue with Apple", ka: "გაგრძელება Apple-ით" },
  "auth.or": { en: "or", ka: "ან" },
  "auth.welcome": { en: "Welcome back", ka: "კეთილი იყოს თქვენი დაბრუნება" },
  "auth.back": { en: "← Back to site", ka: "← საიტზე დაბრუნება" },
  "cart.title": { en: "Your Selections", ka: "თქვენი არჩევანი" },
  "cart.label": { en: "Cart", ka: "კალათა" },
  "cart.empty": { en: "Your cart is empty.", ka: "კალათა ცარიელია." },
  "cart.signInPrompt": { en: "Sign in to view your cart.", ka: "შედით თქვენი კალათის სანახავად." },
  "cart.browse": { en: "Browse Gallery →", ka: "გალერეის ნახვა →" },
  "cart.clear": { en: "Clear cart", ka: "კალათის გასუფთავება" },
  "cart.checkout": { en: "Checkout via WhatsApp", ka: "შეკვეთა WhatsApp-ით" },
  "cart.item": { en: "item", ka: "ნივთი" },
  "cart.items": { en: "items", ka: "ნივთი" },
  "cart.add": { en: "Add to Cart", ka: "კალათაში დამატება" },
  "cart.inquire": { en: "Inquire on WhatsApp", ka: "შეკითხვა WhatsApp-ით" },
};

type Ctx = {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: keyof typeof dict) => string;
};

const I18nCtx = createContext<Ctx | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");

  useEffect(() => {
    const stored = (typeof window !== "undefined" && localStorage.getItem("lang")) as Lang | null;
    if (stored === "en" || stored === "ka") setLangState(stored);
  }, []);

  const setLang = (l: Lang) => {
    setLangState(l);
    if (typeof window !== "undefined") localStorage.setItem("lang", l);
  };

  const t = (key: keyof typeof dict) => dict[key]?.[lang] ?? String(key);
  return <I18nCtx.Provider value={{ lang, setLang, t }}>{children}</I18nCtx.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nCtx);
  if (!ctx) throw new Error("useI18n must be used inside I18nProvider");
  return ctx;
}

export function pickLocalized<T extends Record<string, unknown>>(
  row: T,
  base: keyof T & string,
  lang: Lang,
): string {
  if (lang === "ka") {
    const ka = row[`${base}_ka` as keyof T];
    if (typeof ka === "string" && ka.trim()) return ka;
  }
  const v = row[base];
  return typeof v === "string" ? v : "";
}
