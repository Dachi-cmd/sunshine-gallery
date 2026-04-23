import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { resolveImage } from "@/lib/assetMap";

export const Route = createFileRoute("/admin/")({
  head: () => ({
    meta: [
      { title: "Admin — Studio" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminPage,
});

function AdminPage() {
  const { user, isAdmin, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [tab, setTab] = useState<"artworks" | "products">("artworks");

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/admin/login" });
  }, [user, loading, navigate]);

  if (loading) return <div className="p-12 text-muted-foreground">…</div>;
  if (!user) return null;
  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-md px-6 py-24 text-center">
        <h1 className="serif text-3xl">Access pending</h1>
        <p className="mt-4 text-sm text-muted-foreground">
          Your account does not yet have admin access. Ask the project owner to grant the{" "}
          <code className="rounded bg-muted px-1.5 py-0.5">admin</code> role for user id:
        </p>
        <code className="mt-4 inline-block break-all rounded bg-muted px-3 py-2 text-xs">
          {user.id}
        </code>
        <button
          onClick={() => void signOut()}
          className="mt-8 block mx-auto text-xs uppercase tracking-[0.25em] text-muted-foreground hover:text-foreground"
        >
          Sign out
        </button>
      </div>
    );
  }

  return (
    <section className="mx-auto max-w-6xl px-6 py-16">
      <header className="mb-10 flex items-end justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Studio</p>
          <h1 className="serif mt-2 text-4xl">Admin</h1>
        </div>
        <button
          onClick={() => void signOut().then(() => navigate({ to: "/" }))}
          className="text-xs uppercase tracking-[0.25em] hover:text-accent"
        >
          Sign out
        </button>
      </header>

      <div className="mb-8 flex gap-6 border-b border-border">
        {(["artworks", "products"] as const).map((k) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            className={`pb-3 text-xs uppercase tracking-[0.25em] -mb-px border-b-2 transition ${
              tab === k ? "border-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {k}
          </button>
        ))}
      </div>

      {tab === "artworks" ? <ArtworksAdmin onChange={() => qc.invalidateQueries()} /> : <ProductsAdmin onChange={() => qc.invalidateQueries()} />}

      <Link to="/" className="mt-12 inline-block text-xs uppercase tracking-[0.25em] text-muted-foreground hover:text-foreground">
        ← View site
      </Link>
    </section>
  );
}

async function uploadImage(file: File): Promise<string> {
  const ext = file.name.split(".").pop() || "jpg";
  const name = `${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from("artworks").upload(name, file, {
    cacheControl: "3600",
    upsert: false,
  });
  if (error) throw error;
  const { data } = supabase.storage.from("artworks").getPublicUrl(name);
  return data.publicUrl;
}

function ArtworksAdmin({ onChange }: { onChange: () => void }) {
  const { data, refetch } = useQuery({
    queryKey: ["admin-artworks"],
    queryFn: async () => {
      const { data, error } = await supabase.from("artworks").select("*").order("sort_order");
      if (error) throw error;
      return data;
    },
  });

  const [form, setForm] = useState({ title: "", title_ka: "", year: "", medium: "", description: "", description_ka: "" });
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return toast.error("Pick an image");
    setBusy(true);
    try {
      const image_url = await uploadImage(file);
      const { error } = await supabase.from("artworks").insert({
        title: form.title,
        title_ka: form.title_ka || null,
        year: form.year ? Number(form.year) : null,
        medium: form.medium || null,
        description: form.description || null,
        description_ka: form.description_ka || null,
        image_url,
        sort_order: (data?.length ?? 0) + 1,
      });
      if (error) throw error;
      toast.success("Artwork added");
      setForm({ title: "", title_ka: "", year: "", medium: "", description: "", description_ka: "" });
      setFile(null);
      void refetch();
      onChange();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this artwork?")) return;
    const { error } = await supabase.from("artworks").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Deleted");
    void refetch();
    onChange();
  };

  const togglePublish = async (id: string, published: boolean) => {
    const { error } = await supabase.from("artworks").update({ published: !published }).eq("id", id);
    if (error) return toast.error(error.message);
    void refetch();
    onChange();
  };

  return (
    <div className="grid grid-cols-1 gap-12 md:grid-cols-[1fr_1.4fr]">
      <form onSubmit={submit} className="space-y-4 rounded border border-border bg-surface p-6">
        <h2 className="serif text-xl">New artwork</h2>
        <Input label="Title (EN)" value={form.title} onChange={(v) => setForm({ ...form, title: v })} required />
        <Input label="Title (KA)" value={form.title_ka} onChange={(v) => setForm({ ...form, title_ka: v })} />
        <div className="grid grid-cols-2 gap-3">
          <Input label="Year" value={form.year} onChange={(v) => setForm({ ...form, year: v })} type="number" />
          <Input label="Medium" value={form.medium} onChange={(v) => setForm({ ...form, medium: v })} />
        </div>
        <Textarea label="Description (EN)" value={form.description} onChange={(v) => setForm({ ...form, description: v })} />
        <Textarea label="Description (KA)" value={form.description_ka} onChange={(v) => setForm({ ...form, description_ka: v })} />
        <div>
          <label className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Image</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="mt-2 block w-full text-sm"
            required
          />
        </div>
        <button
          type="submit"
          disabled={busy}
          className="border-b border-foreground pb-1 text-xs uppercase tracking-[0.25em] hover:text-accent hover:border-accent disabled:opacity-50"
        >
          {busy ? "Uploading…" : "Add artwork →"}
        </button>
      </form>

      <div className="space-y-4">
        {data?.map((a) => (
          <div key={a.id} className="flex gap-4 border-b border-border pb-4">
            <img src={resolveImage(a.image_url)} alt={a.title} className="h-24 w-20 object-cover bg-muted" />
            <div className="flex-1">
              <p className="serif text-lg">{a.title}</p>
              <p className="text-xs text-muted-foreground">{a.year} · {a.medium}</p>
              <div className="mt-2 flex gap-3 text-[11px] uppercase tracking-[0.2em]">
                <button onClick={() => void togglePublish(a.id, a.published)} className="hover:text-accent">
                  {a.published ? "Unpublish" : "Publish"}
                </button>
                <button onClick={() => void remove(a.id)} className="text-destructive hover:opacity-70">
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ProductsAdmin({ onChange }: { onChange: () => void }) {
  const { data, refetch } = useQuery({
    queryKey: ["admin-products"],
    queryFn: async () => {
      const { data, error } = await supabase.from("products").select("*").order("sort_order");
      if (error) throw error;
      return data;
    },
  });

  const [form, setForm] = useState({ name: "", name_ka: "", price: "", currency: "USD", description: "", description_ka: "" });
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return toast.error("Pick an image");
    const priceNum = Number(form.price);
    if (!Number.isFinite(priceNum) || priceNum < 0) return toast.error("Invalid price");
    setBusy(true);
    try {
      const image_url = await uploadImage(file);
      const { error } = await supabase.from("products").insert({
        name: form.name,
        name_ka: form.name_ka || null,
        price_cents: Math.round(priceNum * 100),
        currency: form.currency,
        description: form.description || null,
        description_ka: form.description_ka || null,
        image_url,
        sort_order: (data?.length ?? 0) + 1,
      });
      if (error) throw error;
      toast.success("Product added");
      setForm({ name: "", name_ka: "", price: "", currency: "USD", description: "", description_ka: "" });
      setFile(null);
      void refetch();
      onChange();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this product?")) return;
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) return toast.error(error.message);
    void refetch();
    onChange();
  };

  return (
    <div className="grid grid-cols-1 gap-12 md:grid-cols-[1fr_1.4fr]">
      <form onSubmit={submit} className="space-y-4 rounded border border-border bg-surface p-6">
        <h2 className="serif text-xl">New product</h2>
        <Input label="Name (EN)" value={form.name} onChange={(v) => setForm({ ...form, name: v })} required />
        <Input label="Name (KA)" value={form.name_ka} onChange={(v) => setForm({ ...form, name_ka: v })} />
        <div className="grid grid-cols-2 gap-3">
          <Input label="Price" value={form.price} onChange={(v) => setForm({ ...form, price: v })} type="number" required />
          <Input label="Currency" value={form.currency} onChange={(v) => setForm({ ...form, currency: v })} />
        </div>
        <Textarea label="Description (EN)" value={form.description} onChange={(v) => setForm({ ...form, description: v })} />
        <Textarea label="Description (KA)" value={form.description_ka} onChange={(v) => setForm({ ...form, description_ka: v })} />
        <div>
          <label className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Image</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="mt-2 block w-full text-sm"
            required
          />
        </div>
        <button
          type="submit"
          disabled={busy}
          className="border-b border-foreground pb-1 text-xs uppercase tracking-[0.25em] hover:text-accent hover:border-accent disabled:opacity-50"
        >
          {busy ? "Uploading…" : "Add product →"}
        </button>
      </form>

      <div className="space-y-4">
        {data?.map((p) => (
          <div key={p.id} className="flex gap-4 border-b border-border pb-4">
            <img src={resolveImage(p.image_url)} alt={p.name} className="h-24 w-24 object-cover bg-muted" />
            <div className="flex-1">
              <p className="serif text-lg">{p.name}</p>
              <p className="text-xs text-muted-foreground">{(p.price_cents / 100).toFixed(2)} {p.currency}</p>
              <button onClick={() => void remove(p.id)} className="mt-2 text-[11px] uppercase tracking-[0.2em] text-destructive hover:opacity-70">
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Input({
  label, value, onChange, type = "text", required,
}: { label: string; value: string; onChange: (v: string) => void; type?: string; required?: boolean }) {
  return (
    <div>
      <label className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{label}</label>
      <input
        type={type}
        value={value}
        required={required}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1.5 w-full border-b border-border bg-transparent py-1.5 outline-none focus:border-foreground"
      />
    </div>
  );
}

function Textarea({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{label}</label>
      <textarea
        value={value}
        rows={3}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1.5 w-full border border-border bg-transparent p-2 text-sm outline-none focus:border-foreground"
      />
    </div>
  );
}
