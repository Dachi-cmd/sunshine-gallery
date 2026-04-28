import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

async function loadKnowledge(): Promise<string> {
  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return "";
    const url =
      `${SUPABASE_URL}/rest/v1/site_settings?select=key,value&key=in.(chat_knowledge_en,chat_knowledge_ka,chat_qas)`;
    const resp = await fetch(url, {
      headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` },
    });
    if (!resp.ok) return "";
    const rows: Array<{ key: string; value: string | null }> = await resp.json();
    const map: Record<string, string> = {};
    for (const r of rows) if (r.value) map[r.key] = r.value;

    let text = "";
    if (map.chat_knowledge_en) text += `\n[Knowledge EN]\n${map.chat_knowledge_en}`;
    if (map.chat_knowledge_ka) text += `\n[Knowledge KA]\n${map.chat_knowledge_ka}`;
    if (map.chat_qas) {
      try {
        const qas = JSON.parse(map.chat_qas) as Array<{ q_en: string; q_ka: string; a_en: string; a_ka: string }>;
        if (Array.isArray(qas) && qas.length) {
          text += "\n[FAQ — prefer these answers when relevant]";
          for (const qa of qas) {
            if (qa.q_en && qa.a_en) text += `\nQ (EN): ${qa.q_en}\nA (EN): ${qa.a_en}`;
            if (qa.q_ka && qa.a_ka) text += `\nQ (KA): ${qa.q_ka}\nA (KA): ${qa.a_ka}`;
          }
        }
      } catch {}
    }
    return text;
  } catch {
    return "";
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const knowledge = await loadKnowledge();

    const SYSTEM_PROMPT = `You are the friendly website assistant for Davit Abramishvili, a contemporary painter.
Keep answers short (1-3 sentences), warm, and helpful. Reply in the user's language (English or Georgian).
Use the knowledge base below as the source of truth. If asked something outside it, politely redirect to contacting via WhatsApp.
${knowledge}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [{ role: "system", content: SYSTEM_PROMPT }, ...messages],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limits exceeded, please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
