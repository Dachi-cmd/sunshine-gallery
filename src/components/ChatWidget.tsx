import { useEffect, useRef, useState } from "react";
import { MessageCircle, X, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";
import { useChatSettings } from "@/lib/chatSettings";

type Msg = { role: "user" | "assistant"; content: string };

const FALLBACK_QUESTIONS = {
  en: ["How much does it cost?", "Where are you located?", "How can I purchase an artwork?", "Delivery", "Contact"],
  ka: ["რამდენი ღირს?", "სად მდებარეობთ?", "როგორ შევიძინო ნამუშევარი?", "მიწოდება", "კონტაქტი"],
};

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;

export function ChatWidget() {
  const { lang } = useI18n();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const greeting =
    lang === "ka"
      ? "გამარჯობა! მე საიტის ასისტენტი ვარ. აირჩიეთ კითხვა ან დაწერეთ შეტყობინება."
      : "Hello! I'm the website assistant. Choose a question or type your message.";

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  async function send(text: string) {
    if (!text.trim() || loading) return;
    const userMsg: Msg = { role: "user", content: text };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput("");
    setLoading(true);

    try {
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ messages: next }),
      });

      if (!resp.ok || !resp.body) {
        const errText =
          resp.status === 429
            ? lang === "ka"
              ? "ძალიან ბევრი მოთხოვნა. სცადეთ მოგვიანებით."
              : "Too many requests. Please try again shortly."
            : lang === "ka"
              ? "რაღაც შეცდომა მოხდა."
              : "Something went wrong.";
        setMessages((p) => [...p, { role: "assistant", content: errText }]);
        setLoading(false);
        return;
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      let acc = "";
      let started = false;
      let done = false;

      while (!done) {
        const { done: rDone, value } = await reader.read();
        if (rDone) break;
        buf += decoder.decode(value, { stream: true });

        let idx: number;
        while ((idx = buf.indexOf("\n")) !== -1) {
          let line = buf.slice(0, idx);
          buf = buf.slice(idx + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line || line.startsWith(":")) continue;
          if (!line.startsWith("data: ")) continue;
          const js = line.slice(6).trim();
          if (js === "[DONE]") {
            done = true;
            break;
          }
          try {
            const parsed = JSON.parse(js);
            const delta = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (delta) {
              acc += delta;
              if (!started) {
                started = true;
                setMessages((p) => [...p, { role: "assistant", content: acc }]);
              } else {
                setMessages((p) =>
                  p.map((m, i) => (i === p.length - 1 ? { ...m, content: acc } : m)),
                );
              }
            }
          } catch {
            buf = line + "\n" + buf;
            break;
          }
        }
      }
    } catch (e) {
      console.error(e);
      setMessages((p) => [
        ...p,
        {
          role: "assistant",
          content: lang === "ka" ? "შეცდომა ქსელში." : "Network error.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  const { data: chatSettings } = useChatSettings();
  const questions: string[] =
    chatSettings?.chat_qas && chatSettings.chat_qas.length > 0
      ? chatSettings.chat_qas.map((qa) => (lang === "ka" ? qa.q_ka : qa.q_en)).filter(Boolean)
      : FALLBACK_QUESTIONS[lang];

  return (
    <>
      {/* Toggle bubble */}
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Open chat"
        className={cn(
          "fixed bottom-5 right-5 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-foreground text-background shadow-lg transition hover:scale-105",
        )}
      >
        {open ? <X className="h-5 w-5" /> : <MessageCircle className="h-5 w-5" />}
      </button>

      {/* Panel */}
      {open && (
        <div className="fixed bottom-20 right-5 z-50 flex h-[480px] w-[340px] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-2xl border border-border bg-background shadow-2xl">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <div>
              <p className="serif text-base leading-tight">
                {lang === "ka" ? "ასისტენტი" : "Assistant"}
              </p>
              <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                {lang === "ka" ? "ონლაინ" : "Online"}
              </p>
            </div>
            <button
              onClick={() => setOpen(false)}
              aria-label="Close"
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-3 text-sm">
            <div className="rounded-2xl rounded-tl-sm bg-muted px-3 py-2 text-foreground">
              {greeting}
            </div>

            {messages.length === 0 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {questions.map((q) => (
                  <button
                    key={q}
                    onClick={() => send(q)}
                    className="rounded-full border border-border px-3 py-1 text-xs text-foreground transition hover:bg-muted"
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}

            {messages.map((m, i) => (
              <div
                key={i}
                className={cn(
                  "max-w-[85%] whitespace-pre-wrap rounded-2xl px-3 py-2",
                  m.role === "user"
                    ? "ml-auto rounded-tr-sm bg-foreground text-background"
                    : "rounded-tl-sm bg-muted text-foreground",
                )}
              >
                {m.content}
              </div>
            ))}

            {loading && messages[messages.length - 1]?.role === "user" && (
              <div className="rounded-2xl rounded-tl-sm bg-muted px-3 py-2 text-muted-foreground">
                …
              </div>
            )}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
            className="flex items-center gap-2 border-t border-border px-3 py-2"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={lang === "ka" ? "დაწერეთ შეტყობინება…" : "Type a message…"}
              className="flex-1 bg-transparent px-2 py-2 text-sm outline-none placeholder:text-muted-foreground"
              disabled={loading}
            />
            <Button
              type="submit"
              size="icon"
              variant="ghost"
              disabled={loading || !input.trim()}
              className="h-8 w-8"
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      )}
    </>
  );
}
