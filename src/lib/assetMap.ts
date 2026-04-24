// Maps seed image_url placeholders (/src-asset/<file>) to bundled assets.
// Real uploads will be full Supabase storage URLs and pass through unchanged.
import s1 from "@/assets/sample-1.jpg";
import s2 from "@/assets/sample-2.jpg";
import s3 from "@/assets/sample-3.jpg";
import s4 from "@/assets/sample-4.jpg";
import s5 from "@/assets/sample-5.jpg";
import p1 from "@/assets/product-1.jpg";
import p2 from "@/assets/product-2.jpg";
import g6 from "@/assets/gallery-6.jpg";
import g7 from "@/assets/gallery-7.jpg";
import g8 from "@/assets/gallery-8.jpg";
import g9 from "@/assets/gallery-9.jpg";
import g10 from "@/assets/gallery-10.jpg";
import g11 from "@/assets/gallery-11.jpg";
import g12 from "@/assets/gallery-12.jpg";
import g13 from "@/assets/gallery-13.jpg";
import g14 from "@/assets/gallery-14.jpg";
import g15 from "@/assets/gallery-15.jpg";
import g16 from "@/assets/gallery-16.jpg";
import g17 from "@/assets/gallery-17.jpg";
import g18 from "@/assets/gallery-18.jpg";
import g19 from "@/assets/gallery-19.jpg";
import g20 from "@/assets/gallery-20.jpg";
import g21 from "@/assets/gallery-21.jpg";
import g22 from "@/assets/gallery-22.jpg";
import g23 from "@/assets/gallery-23.jpg";
import g24 from "@/assets/gallery-24.jpg";
import g25 from "@/assets/gallery-25.jpg";

const map: Record<string, string> = {
  "/src-asset/sample-1.jpg": s1,
  "/src-asset/sample-2.jpg": s2,
  "/src-asset/sample-3.jpg": s3,
  "/src-asset/sample-4.jpg": s4,
  "/src-asset/sample-5.jpg": s5,
  "/src-asset/product-1.jpg": p1,
  "/src-asset/product-2.jpg": p2,
  "/src-asset/gallery-6.jpg": g6,
  "/src-asset/gallery-7.jpg": g7,
  "/src-asset/gallery-8.jpg": g8,
  "/src-asset/gallery-9.jpg": g9,
  "/src-asset/gallery-10.jpg": g10,
  "/src-asset/gallery-11.jpg": g11,
  "/src-asset/gallery-12.jpg": g12,
  "/src-asset/gallery-13.jpg": g13,
  "/src-asset/gallery-14.jpg": g14,
  "/src-asset/gallery-15.jpg": g15,
  "/src-asset/gallery-16.jpg": g16,
  "/src-asset/gallery-17.jpg": g17,
  "/src-asset/gallery-18.jpg": g18,
  "/src-asset/gallery-19.jpg": g19,
  "/src-asset/gallery-20.jpg": g20,
  "/src-asset/gallery-21.jpg": g21,
  "/src-asset/gallery-22.jpg": g22,
  "/src-asset/gallery-23.jpg": g23,
  "/src-asset/gallery-24.jpg": g24,
  "/src-asset/gallery-25.jpg": g25,
};

export function resolveImage(url: string): string {
  return map[url] ?? url;
}
