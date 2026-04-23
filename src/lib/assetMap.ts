// Maps seed image_url placeholders (/src-asset/<file>) to bundled assets.
// Real uploads will be full Supabase storage URLs and pass through unchanged.
import s1 from "@/assets/sample-1.jpg";
import s2 from "@/assets/sample-2.jpg";
import s3 from "@/assets/sample-3.jpg";
import s4 from "@/assets/sample-4.jpg";
import s5 from "@/assets/sample-5.jpg";
import p1 from "@/assets/product-1.jpg";
import p2 from "@/assets/product-2.jpg";

const map: Record<string, string> = {
  "/src-asset/sample-1.jpg": s1,
  "/src-asset/sample-2.jpg": s2,
  "/src-asset/sample-3.jpg": s3,
  "/src-asset/sample-4.jpg": s4,
  "/src-asset/sample-5.jpg": s5,
  "/src-asset/product-1.jpg": p1,
  "/src-asset/product-2.jpg": p2,
};

export function resolveImage(url: string): string {
  return map[url] ?? url;
}
