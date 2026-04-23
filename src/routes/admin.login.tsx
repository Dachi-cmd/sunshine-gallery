import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/login")({
  head: () => ({
    meta: [
      { title: "Admin Sign In" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const { t } = useI18n();
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user && isAdmin) navigate({ to: "/admin" });
  }, [user, isAdmin, loading, navigate]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setSubmitting(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Welcome back");
    navigate({ to: "/admin" });
  };

  const onSignUp = async () => {
    if (!email || !password) {
      toast.error("Enter email and password first");
      return;
    }
    setSubmitting(true);
    const redirect = typeof window !== "undefined" ? `${window.location.origin}/admin` : undefined;
    const { error, data } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: redirect },
    });
    setSubmitting(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    if (data.user) {
      toast.success("Account created. Ask the project owner to grant admin role.");
    }
  };

  return (
    <section className="mx-auto flex max-w-md flex-col px-6 py-24">
      <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Studio</p>
      <h1 className="serif mt-2 text-4xl">{t("admin.signIn")}</h1>

      <form onSubmit={onSubmit} className="mt-10 space-y-5">
        <div>
          <label className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
            {t("admin.email")}
          </label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-2 w-full border-b border-border bg-transparent py-2 outline-none focus:border-foreground"
          />
        </div>
        <div>
          <label className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
            {t("admin.password")}
          </label>
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-2 w-full border-b border-border bg-transparent py-2 outline-none focus:border-foreground"
          />
        </div>
        <div className="flex items-center justify-between gap-4 pt-4">
          <button
            type="submit"
            disabled={submitting}
            className="border-b border-foreground pb-1 text-xs uppercase tracking-[0.25em] hover:text-accent hover:border-accent disabled:opacity-50"
          >
            {t("admin.submit")} →
          </button>
          <button
            type="button"
            onClick={onSignUp}
            disabled={submitting}
            className="text-xs uppercase tracking-[0.25em] text-muted-foreground hover:text-foreground"
          >
            Sign up
          </button>
        </div>
      </form>

      <Link to="/" className="mt-12 text-xs uppercase tracking-[0.25em] text-muted-foreground hover:text-foreground">
        ← Back to site
      </Link>
    </section>
  );
}
