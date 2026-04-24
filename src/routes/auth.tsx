import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
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
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user) navigate({ to: "/gallery" });
  }, [user, loading, navigate]);

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
        toast.success("Check your email to confirm your account.");
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
        toast.success("Welcome back");
        navigate({ to: "/gallery" });
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="mx-auto flex max-w-md flex-col px-6 py-24">
      <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Account</p>
      <h1 className="serif mt-2 text-4xl">{mode === "signin" ? "Sign In" : "Create Account"}</h1>

      <div className="mt-6 flex gap-6 text-xs uppercase tracking-[0.25em]">
        <button
          type="button"
          onClick={() => setMode("signin")}
          className={`pb-1 ${mode === "signin" ? "border-b border-foreground" : "text-muted-foreground"}`}
        >
          Sign In
        </button>
        <button
          type="button"
          onClick={() => setMode("signup")}
          className={`pb-1 ${mode === "signup" ? "border-b border-foreground" : "text-muted-foreground"}`}
        >
          Sign Up
        </button>
      </div>

      <form onSubmit={onSubmit} className="mt-8 space-y-5">
        {mode === "signup" && (
          <div>
            <label className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Name</label>
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
          <label className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Email</label>
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
          <label className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Password</label>
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
          {mode === "signin" ? "Sign In →" : "Create Account →"}
        </button>
      </form>

      <Link to="/" className="mt-12 text-xs uppercase tracking-[0.25em] text-muted-foreground hover:text-foreground">
        ← Back to site
      </Link>
    </section>
  );
}
