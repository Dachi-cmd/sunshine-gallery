import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign In or Sign Up" },
      { name: "description", content: "Sign in or create an account to save favorites and check out." },
    ],
  }),
  component: AuthPage,
});

const signupSchema = z.object({
  name: z.string().trim().min(1, "Name required").max(100),
  email: z.string().trim().email("Invalid email").max(255),
  password: z.string().min(6, "Password must be at least 6 characters").max(128),
});

const loginSchema = z.object({
  email: z.string().trim().email("Invalid email").max(255),
  password: z.string().min(1, "Password required").max(128),
});

function AuthPage() {
  const { user, loading } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user) navigate({ to: "/gallery" });
  }, [user, loading, navigate]);

  const handleOAuth = async (provider: "google" | "apple") => {
    setSubmitting(true);
    try {
      const redirect = typeof window !== "undefined" ? window.location.origin : undefined;
      const result = await lovable.auth.signInWithOAuth(provider, { redirect_uri: redirect });
      if (result.error) {
        toast.error(result.error.message ?? "Sign in failed");
        return;
      }
      if (result.redirected) return;
      navigate({ to: "/gallery" });
    } finally {
      setSubmitting(false);
    }
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (mode === "signup") {
        const parsed = signupSchema.safeParse({ name, email, password });
        if (!parsed.success) {
          toast.error(parsed.error.issues[0].message);
          return;
        }
        const redirect = typeof window !== "undefined" ? `${window.location.origin}/gallery` : undefined;
        const { error } = await supabase.auth.signUp({
          email: parsed.data.email,
          password: parsed.data.password,
          options: {
            emailRedirectTo: redirect,
            data: { display_name: parsed.data.name },
          },
        });
        if (error) {
          toast.error(error.message);
          return;
        }
        toast.success("Account created");
        navigate({ to: "/gallery" });
      } else {
        const parsed = loginSchema.safeParse({ email, password });
        if (!parsed.success) {
          toast.error(parsed.error.issues[0].message);
          return;
        }
        const { error } = await supabase.auth.signInWithPassword({
          email: parsed.data.email,
          password: parsed.data.password,
        });
        if (error) {
          toast.error(error.message);
          return;
        }
        toast.success(t("auth.welcome"));
        navigate({ to: "/gallery" });
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="mx-auto flex max-w-md flex-col px-6 py-24">
      <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">{t("auth.account")}</p>
      <h1 className="serif mt-2 text-4xl">
        {mode === "signin" ? t("auth.signIn") : t("auth.createAccount")}
      </h1>

      <div className="mt-6 flex gap-6 text-xs uppercase tracking-[0.25em]">
        <button
          type="button"
          onClick={() => setMode("signin")}
          className={`pb-1 ${mode === "signin" ? "border-b border-foreground" : "text-muted-foreground"}`}
        >
          {t("auth.signIn")}
        </button>
        <button
          type="button"
          onClick={() => setMode("signup")}
          className={`pb-1 ${mode === "signup" ? "border-b border-foreground" : "text-muted-foreground"}`}
        >
          {t("auth.signUp")}
        </button>
      </div>

      <div className="mt-8 space-y-3">
        <button
          type="button"
          disabled={submitting}
          onClick={() => void handleOAuth("google")}
          className="flex w-full items-center justify-center gap-3 border border-border bg-background px-4 py-3 text-xs uppercase tracking-[0.2em] transition hover:bg-secondary disabled:opacity-50"
        >
          <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden>
            <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3l5.7-5.7C34 6 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/>
            <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 19 13 24 13c3.1 0 5.8 1.2 7.9 3l5.7-5.7C34 6 29.3 4 24 4 16.3 4 9.6 8.3 6.3 14.7z"/>
            <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/>
            <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.1 5.6l6.2 5.2c-.4.4 6.6-4.8 6.6-14.8 0-1.3-.1-2.4-.4-3.5z"/>
          </svg>
          {t("auth.continueGoogle")}
        </button>
        <button
          type="button"
          disabled={submitting}
          onClick={() => void handleOAuth("apple")}
          className="flex w-full items-center justify-center gap-3 border border-border bg-background px-4 py-3 text-xs uppercase tracking-[0.2em] transition hover:bg-secondary disabled:opacity-50"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
            <path d="M16.365 1.43c0 1.14-.46 2.25-1.215 3.04-.81.85-2.13 1.5-3.21 1.41-.13-1.13.42-2.31 1.17-3.06.83-.84 2.27-1.46 3.255-1.39zM20.5 17.27c-.6 1.39-.89 2-1.66 3.23-1.07 1.71-2.58 3.84-4.45 3.86-1.66.02-2.09-1.08-4.34-1.07-2.25.01-2.72 1.09-4.39 1.07-1.87-.02-3.3-1.95-4.37-3.66C-1.69 16.99-2 11.32 1.07 8.34c1.42-1.39 3.59-2.27 5.52-2.27 1.81 0 2.95 1.09 4.45 1.09 1.45 0 2.34-1.09 4.43-1.09 1.72 0 3.55.94 4.85 2.56-4.27 2.34-3.58 8.41.18 9.64z"/>
          </svg>
          {t("auth.continueApple")}
        </button>
      </div>

      <div className="my-6 flex items-center gap-3 text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
        <span className="h-px flex-1 bg-border" />
        {t("auth.or")}
        <span className="h-px flex-1 bg-border" />
      </div>

      <form onSubmit={onSubmit} className="space-y-5">
        {mode === "signup" && (
          <div>
            <label className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{t("auth.name")}</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={100}
              className="mt-2 w-full border-b border-border bg-transparent py-2 outline-none focus:border-foreground"
            />
          </div>
        )}
        <div>
          <label className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{t("auth.email")}</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            maxLength={255}
            className="mt-2 w-full border-b border-border bg-transparent py-2 outline-none focus:border-foreground"
          />
        </div>
        <div>
          <label className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{t("auth.password")}</label>
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-2 w-full border-b border-border bg-transparent py-2 outline-none focus:border-foreground"
          />
        </div>
        <button
          type="submit"
          disabled={submitting}
          className="border-b border-foreground pb-1 text-xs uppercase tracking-[0.25em] hover:text-accent hover:border-accent disabled:opacity-50"
        >
          {mode === "signin" ? `${t("auth.signIn")} →` : `${t("auth.createAccount")} →`}
        </button>
      </form>

      <Link to="/" className="mt-12 text-xs uppercase tracking-[0.25em] text-muted-foreground hover:text-foreground">
        {t("auth.back")}
      </Link>
    </section>
  );
}
