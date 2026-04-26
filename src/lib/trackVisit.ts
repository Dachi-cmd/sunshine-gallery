import { supabase } from "@/integrations/supabase/client";

let recorded = false;

/** Records a single visit per browser session. */
export function trackVisit() {
  if (typeof window === "undefined") return;
  if (recorded) return;
  recorded = true;
  try {
    const key = "site_visit_recorded_at";
    const last = sessionStorage.getItem(key);
    if (last) return;
    sessionStorage.setItem(key, String(Date.now()));
  } catch {
    // ignore storage errors
  }
  void supabase
    .from("site_visits")
    .insert({
      path: window.location.pathname,
      referrer: document.referrer || null,
      user_agent: navigator.userAgent,
    })
    .then(() => {
      // no-op
    });
}
