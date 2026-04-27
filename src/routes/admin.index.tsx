import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { resolveImage } from "@/lib/assetMap";
import { SETTINGS_DEFAULTS, type SiteSettings } from "@/lib/siteSettings";
import { ABOUT_DEFAULTS, type AboutSettings, type Exhibition } from "@/lib/aboutSettings";

export const Route = createFileRoute("/admin/")({
  head: () => ({
    meta: [
      { title: "Admin — Studio" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminPage,
});

type TabKey = "artworks" | "products" | "about" | "settings" | "analytics";

function AdminPage() {
  const { user, isAdmin, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [tab, setTab] = useState<TabKey>("artworks");

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
        {(["artworks", "products", "about", "settings", "analytics"] as const).map((k) => (
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

      {tab === "artworks" && <ArtworksAdmin onChange={() => qc.invalidateQueries()} />}
      {tab === "products" && <ProductsAdmin onChange={() => qc.invalidateQueries()} />}
      {tab === "about" && <AboutAdmin onChange={() => qc.invalidateQueries()} />}
      {tab === "settings" && <SettingsAdmin onChange={() => qc.invalidateQueries()} />}
      {tab === "analytics" && <AnalyticsAdmin />}

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

type ArtworkRow = {
  id: string;
  title: string;
  title_ka: string | null;
  description: string | null;
  description_ka: string | null;
  image_url: string;
  year: number | null;
  medium: string | null;
  price_cents: number | null;
  currency: string | null;
  published: boolean;
  sort_order: number;
};

function ArtworksAdmin({ onChange }: { onChange: () => void }) {
  const { data, refetch } = useQuery({
    queryKey: ["admin-artworks"],
    queryFn: async () => {
      const { data, error } = await supabase.from("artworks").select("*").order("sort_order");
      if (error) throw error;
      return data as ArtworkRow[];
    },
  });

  const [form, setForm] = useState({ title: "", title_ka: "", year: "", medium: "", description: "", description_ka: "", price: "", currency: "USD" });
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return toast.error("Pick an image");
    setBusy(true);
    try {
      const image_url = await uploadImage(file);
      const priceNum = form.price ? Number(form.price) : null;
      const { error } = await supabase.from("artworks").insert({
        title: form.title,
        title_ka: form.title_ka || null,
        year: form.year ? Number(form.year) : null,
        medium: form.medium || null,
        description: form.description || null,
        description_ka: form.description_ka || null,
        price_cents: priceNum != null && Number.isFinite(priceNum) ? Math.round(priceNum * 100) : null,
        currency: form.currency || "USD",
        image_url,
        sort_order: (data?.length ?? 0) + 1,
      });
      if (error) throw error;
      toast.success("Artwork added");
      setForm({ title: "", title_ka: "", year: "", medium: "", description: "", description_ka: "", price: "", currency: "USD" });
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
      <form onSubmit={submit} className="space-y-4 rounded border border-border bg-surface p-6 self-start">
        <h2 className="serif text-xl">New artwork</h2>
        <Input label="Title (EN)" value={form.title} onChange={(v) => setForm({ ...form, title: v })} required />
        <Input label="Title (KA)" value={form.title_ka} onChange={(v) => setForm({ ...form, title_ka: v })} />
        <div className="grid grid-cols-2 gap-3">
          <Input label="Year" value={form.year} onChange={(v) => setForm({ ...form, year: v })} type="number" />
          <Input label="Medium" value={form.medium} onChange={(v) => setForm({ ...form, medium: v })} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Input label="Price" value={form.price} onChange={(v) => setForm({ ...form, price: v })} type="number" />
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
          {busy ? "Uploading…" : "Add artwork →"}
        </button>
      </form>

      <div className="space-y-4">
        {data?.map((a) =>
          editingId === a.id ? (
            <EditArtwork
              key={a.id}
              artwork={a}
              onCancel={() => setEditingId(null)}
              onSaved={() => {
                setEditingId(null);
                void refetch();
                onChange();
              }}
            />
          ) : (
            <div key={a.id} className="flex gap-4 border-b border-border pb-4">
              <img src={resolveImage(a.image_url)} alt={a.title} className="h-24 w-20 object-cover bg-muted" />
              <div className="flex-1">
                <p className="serif text-lg">{a.title}</p>
                <p className="text-xs text-muted-foreground">
                  {[a.year, a.medium].filter(Boolean).join(" · ")}
                  {a.price_cents != null ? ` · ${(a.price_cents / 100).toFixed(0)} ${a.currency || "USD"}` : ""}
                </p>
                <div className="mt-2 flex flex-wrap gap-3 text-[11px] uppercase tracking-[0.2em]">
                  <button onClick={() => setEditingId(a.id)} className="hover:text-accent">
                    Edit
                  </button>
                  <button onClick={() => void togglePublish(a.id, a.published)} className="hover:text-accent">
                    {a.published ? "Unpublish" : "Publish"}
                  </button>
                  <button onClick={() => void remove(a.id)} className="text-destructive hover:opacity-70">
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ),
        )}
      </div>
    </div>
  );
}

function EditArtwork({ artwork, onCancel, onSaved }: { artwork: ArtworkRow; onCancel: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({
    title: artwork.title,
    title_ka: artwork.title_ka ?? "",
    year: artwork.year != null ? String(artwork.year) : "",
    medium: artwork.medium ?? "",
    description: artwork.description ?? "",
    description_ka: artwork.description_ka ?? "",
    price: artwork.price_cents != null ? String(artwork.price_cents / 100) : "",
    currency: artwork.currency ?? "USD",
  });
  const [busy, setBusy] = useState(false);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const priceNum = form.price ? Number(form.price) : null;
    const { error } = await supabase
      .from("artworks")
      .update({
        title: form.title,
        title_ka: form.title_ka || null,
        year: form.year ? Number(form.year) : null,
        medium: form.medium || null,
        description: form.description || null,
        description_ka: form.description_ka || null,
        price_cents: priceNum != null && Number.isFinite(priceNum) ? Math.round(priceNum * 100) : null,
        currency: form.currency || "USD",
      })
      .eq("id", artwork.id);
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Saved");
    onSaved();
  };

  return (
    <form onSubmit={save} className="space-y-3 rounded border border-foreground/40 bg-surface p-4">
      <div className="flex gap-4">
        <img src={resolveImage(artwork.image_url)} alt={artwork.title} className="h-24 w-20 object-cover bg-muted" />
        <div className="flex-1 space-y-3">
          <Input label="Title (EN)" value={form.title} onChange={(v) => setForm({ ...form, title: v })} required />
          <Input label="Title (KA)" value={form.title_ka} onChange={(v) => setForm({ ...form, title_ka: v })} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Input label="Year" value={form.year} onChange={(v) => setForm({ ...form, year: v })} type="number" />
        <Input label="Medium" value={form.medium} onChange={(v) => setForm({ ...form, medium: v })} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Input label="Price" value={form.price} onChange={(v) => setForm({ ...form, price: v })} type="number" />
        <Input label="Currency" value={form.currency} onChange={(v) => setForm({ ...form, currency: v })} />
      </div>
      <Textarea label="Description (EN)" value={form.description} onChange={(v) => setForm({ ...form, description: v })} />
      <Textarea label="Description (KA)" value={form.description_ka} onChange={(v) => setForm({ ...form, description_ka: v })} />
      <div className="flex gap-4 pt-2">
        <button type="submit" disabled={busy} className="border-b border-foreground pb-1 text-xs uppercase tracking-[0.25em] hover:text-accent hover:border-accent disabled:opacity-50">
          {busy ? "Saving…" : "Save changes"}
        </button>
        <button type="button" onClick={onCancel} className="text-xs uppercase tracking-[0.25em] text-muted-foreground hover:text-foreground">
          Cancel
        </button>
      </div>
    </form>
  );
}

type ProductRow = {
  id: string;
  name: string;
  name_ka: string | null;
  description: string | null;
  description_ka: string | null;
  image_url: string;
  price_cents: number;
  currency: string;
  category: string;
};

export const PRODUCT_CATEGORIES = [
  { value: "t-shirts", label: "T-Shirts" },
  { value: "hoodies", label: "Hoodies" },
  { value: "bags", label: "Bags" },
  { value: "posters", label: "Posters" },
  { value: "postcards", label: "Postcards" },
  { value: "other", label: "Other" },
] as const;

function ProductsAdmin({ onChange }: { onChange: () => void }) {
  const { data, refetch } = useQuery({
    queryKey: ["admin-products"],
    queryFn: async () => {
      const { data, error } = await supabase.from("products").select("*").order("sort_order");
      if (error) throw error;
      return data as ProductRow[];
    },
  });

  const [form, setForm] = useState({ name: "", name_ka: "", price: "", currency: "USD", description: "", description_ka: "", category: "t-shirts" });
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

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
        category: form.category,
        sort_order: (data?.length ?? 0) + 1,
      });
      if (error) throw error;
      toast.success("Product added");
      setForm({ name: "", name_ka: "", price: "", currency: "USD", description: "", description_ka: "", category: "t-shirts" });
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
      <form onSubmit={submit} className="space-y-4 rounded border border-border bg-surface p-6 self-start">
        <h2 className="serif text-xl">New product</h2>
        <Input label="Name (EN)" value={form.name} onChange={(v) => setForm({ ...form, name: v })} required />
        <Input label="Name (KA)" value={form.name_ka} onChange={(v) => setForm({ ...form, name_ka: v })} />
        <div className="grid grid-cols-2 gap-3">
          <Input label="Price" value={form.price} onChange={(v) => setForm({ ...form, price: v })} type="number" required />
          <Input label="Currency" value={form.currency} onChange={(v) => setForm({ ...form, currency: v })} />
        </div>
        <div>
          <label className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Category</label>
          <select
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
            className="mt-2 block w-full rounded border border-border bg-background px-3 py-2 text-sm"
          >
            {PRODUCT_CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
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
        {data?.map((p) =>
          editingId === p.id ? (
            <EditProduct
              key={p.id}
              product={p}
              onCancel={() => setEditingId(null)}
              onSaved={() => {
                setEditingId(null);
                void refetch();
                onChange();
              }}
            />
          ) : (
            <div key={p.id} className="flex gap-4 border-b border-border pb-4">
              <img src={resolveImage(p.image_url)} alt={p.name} className="h-24 w-24 object-cover bg-muted" />
              <div className="flex-1">
                <p className="serif text-lg">{p.name}</p>
                <p className="text-xs text-muted-foreground">{(p.price_cents / 100).toFixed(2)} {p.currency} · {p.category}</p>
                <div className="mt-2 flex gap-3 text-[11px] uppercase tracking-[0.2em]">
                  <button onClick={() => setEditingId(p.id)} className="hover:text-accent">Edit</button>
                  <button onClick={() => void remove(p.id)} className="text-destructive hover:opacity-70">
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ),
        )}
      </div>
    </div>
  );
}

function EditProduct({ product, onCancel, onSaved }: { product: ProductRow; onCancel: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({
    name: product.name,
    name_ka: product.name_ka ?? "",
    price: String(product.price_cents / 100),
    currency: product.currency,
    description: product.description ?? "",
    description_ka: product.description_ka ?? "",
    category: product.category ?? "other",
  });
  const [busy, setBusy] = useState(false);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const priceNum = Number(form.price);
    if (!Number.isFinite(priceNum) || priceNum < 0) return toast.error("Invalid price");
    setBusy(true);
    const { error } = await supabase
      .from("products")
      .update({
        name: form.name,
        name_ka: form.name_ka || null,
        price_cents: Math.round(priceNum * 100),
        currency: form.currency,
        description: form.description || null,
        description_ka: form.description_ka || null,
        category: form.category,
      })
      .eq("id", product.id);
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Saved");
    onSaved();
  };

  return (
    <form onSubmit={save} className="space-y-3 rounded border border-foreground/40 bg-surface p-4">
      <div className="flex gap-4">
        <img src={resolveImage(product.image_url)} alt={product.name} className="h-24 w-24 object-cover bg-muted" />
        <div className="flex-1 space-y-3">
          <Input label="Name (EN)" value={form.name} onChange={(v) => setForm({ ...form, name: v })} required />
          <Input label="Name (KA)" value={form.name_ka} onChange={(v) => setForm({ ...form, name_ka: v })} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Input label="Price" value={form.price} onChange={(v) => setForm({ ...form, price: v })} type="number" required />
        <Input label="Currency" value={form.currency} onChange={(v) => setForm({ ...form, currency: v })} />
      </div>
      <div>
        <label className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Category</label>
        <select
          value={form.category}
          onChange={(e) => setForm({ ...form, category: e.target.value })}
          className="mt-2 block w-full rounded border border-border bg-background px-3 py-2 text-sm"
        >
          {PRODUCT_CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>
      </div>
      <Textarea label="Description (EN)" value={form.description} onChange={(v) => setForm({ ...form, description: v })} />
      <Textarea label="Description (KA)" value={form.description_ka} onChange={(v) => setForm({ ...form, description_ka: v })} />
      <div className="flex gap-4 pt-2">
        <button type="submit" disabled={busy} className="border-b border-foreground pb-1 text-xs uppercase tracking-[0.25em] hover:text-accent hover:border-accent disabled:opacity-50">
          {busy ? "Saving…" : "Save changes"}
        </button>
        <button type="button" onClick={onCancel} className="text-xs uppercase tracking-[0.25em] text-muted-foreground hover:text-foreground">
          Cancel
        </button>
      </div>
    </form>
  );
}

const SETTINGS_FIELDS: { key: keyof SiteSettings; label: string; type?: string; placeholder?: string }[] = [
  { key: "contact_email", label: "Contact email", type: "email" },
  { key: "contact_phone", label: "Contact phone (display)", placeholder: "597 00 93 91" },
  { key: "contact_phone_link", label: "Contact phone (tel: link)", placeholder: "+995597009391" },
  { key: "social_instagram", label: "Instagram URL" },
  { key: "social_youtube", label: "YouTube URL" },
  { key: "social_facebook", label: "Facebook URL" },
  { key: "social_linkedin", label: "LinkedIn URL" },
];

function SettingsAdmin({ onChange }: { onChange: () => void }) {
  const { data, refetch } = useQuery({
    queryKey: ["admin-site-settings"],
    queryFn: async (): Promise<SiteSettings> => {
      const { data, error } = await supabase.from("site_settings").select("key,value");
      if (error) throw error;
      const map: SiteSettings = { ...SETTINGS_DEFAULTS };
      for (const r of data ?? []) {
        if (r.value != null && r.key in map) (map as Record<string, string>)[r.key] = r.value;
      }
      return map;
    },
  });

  const [form, setForm] = useState<SiteSettings | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (data && !form) setForm(data);
  }, [data, form]);

  if (!form) return <div className="text-muted-foreground">…</div>;

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const rows = SETTINGS_FIELDS.map((f) => ({ key: f.key, value: form[f.key] ?? "" }));
    const { error } = await supabase.from("site_settings").upsert(rows, { onConflict: "key" });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Settings saved");
    void refetch();
    onChange();
  };

  return (
    <form onSubmit={save} className="max-w-xl space-y-4 rounded border border-border bg-surface p-6">
      <h2 className="serif text-xl">Site settings</h2>
      <p className="text-xs text-muted-foreground">
        These appear in the footer across the site. Leave a social URL empty to hide that icon.
      </p>
      {SETTINGS_FIELDS.map((f) => (
        <Input
          key={f.key}
          label={f.label}
          type={f.type}
          value={form[f.key] ?? ""}
          onChange={(v) => setForm({ ...form, [f.key]: v })}
        />
      ))}
      <button
        type="submit"
        disabled={busy}
        className="border-b border-foreground pb-1 text-xs uppercase tracking-[0.25em] hover:text-accent hover:border-accent disabled:opacity-50"
      >
        {busy ? "Saving…" : "Save settings →"}
      </button>
    </form>
  );
}

function Input({
  label, value, onChange, type = "text", required, placeholder,
}: { label: string; value: string; onChange: (v: string) => void; type?: string; required?: boolean; placeholder?: string }) {
  return (
    <div>
      <label className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{label}</label>
      <input
        type={type}
        value={value}
        required={required}
        placeholder={placeholder}
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

function AnalyticsAdmin() {
  const visitsQ = useQuery({
    queryKey: ["admin-visits"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_visits")
        .select("id, path, referrer, user_agent, created_at")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data ?? [];
    },
  });

  const usersQ = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, email, display_name, created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const visits = visitsQ.data ?? [];
  const now = Date.now();
  const last24 = visits.filter((v) => now - new Date(v.created_at).getTime() < 86400000).length;
  const last7 = visits.filter((v) => now - new Date(v.created_at).getTime() < 7 * 86400000).length;

  return (
    <div className="space-y-12">
      <div>
        <h2 className="serif text-2xl mb-4">Visits</h2>
        <div className="grid grid-cols-3 gap-4 mb-6">
          <Stat label="Total (recent)" value={visits.length} />
          <Stat label="Last 24h" value={last24} />
          <Stat label="Last 7 days" value={last7} />
        </div>
        <div className="overflow-auto border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted/30 text-xs uppercase tracking-[0.2em] text-muted-foreground">
              <tr>
                <th className="text-left p-2">When</th>
                <th className="text-left p-2">Path</th>
                <th className="text-left p-2">Referrer</th>
                <th className="text-left p-2">User agent</th>
              </tr>
            </thead>
            <tbody>
              {visitsQ.isLoading && (
                <tr><td colSpan={4} className="p-4 text-muted-foreground">Loading…</td></tr>
              )}
              {visits.map((v) => (
                <tr key={v.id} className="border-t border-border">
                  <td className="p-2 whitespace-nowrap">{new Date(v.created_at).toLocaleString()}</td>
                  <td className="p-2">{v.path ?? "—"}</td>
                  <td className="p-2 max-w-[200px] truncate" title={v.referrer ?? ""}>{v.referrer || "—"}</td>
                  <td className="p-2 max-w-[280px] truncate text-muted-foreground" title={v.user_agent ?? ""}>{v.user_agent || "—"}</td>
                </tr>
              ))}
              {!visitsQ.isLoading && visits.length === 0 && (
                <tr><td colSpan={4} className="p-4 text-muted-foreground">No visits yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <h2 className="serif text-2xl mb-4">Registered users</h2>
        <div className="grid grid-cols-1 gap-4 mb-6">
          <Stat label="Total users" value={usersQ.data?.length ?? 0} />
        </div>
        <div className="overflow-auto border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted/30 text-xs uppercase tracking-[0.2em] text-muted-foreground">
              <tr>
                <th className="text-left p-2">Registered</th>
                <th className="text-left p-2">Name</th>
                <th className="text-left p-2">Email</th>
              </tr>
            </thead>
            <tbody>
              {usersQ.isLoading && (
                <tr><td colSpan={3} className="p-4 text-muted-foreground">Loading…</td></tr>
              )}
              {(usersQ.data ?? []).map((u) => (
                <tr key={u.id} className="border-t border-border">
                  <td className="p-2 whitespace-nowrap">{new Date(u.created_at).toLocaleString()}</td>
                  <td className="p-2">{u.display_name || "—"}</td>
                  <td className="p-2">{u.email || "—"}</td>
                </tr>
              ))}
              {!usersQ.isLoading && (usersQ.data?.length ?? 0) === 0 && (
                <tr><td colSpan={3} className="p-4 text-muted-foreground">No users yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="border border-border p-4">
      <div className="text-xs uppercase tracking-[0.25em] text-muted-foreground">{label}</div>
      <div className="serif text-3xl mt-2">{value}</div>
    </div>
  );
}

async function uploadToArtworks(file: File): Promise<string> {
  const ext = file.name.split(".").pop() || "bin";
  const name = `about/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from("artworks").upload(name, file, {
    cacheControl: "3600",
    upsert: false,
    contentType: file.type || undefined,
  });
  if (error) throw error;
  const { data } = supabase.storage.from("artworks").getPublicUrl(name);
  return data.publicUrl;
}

function AboutAdmin({ onChange }: { onChange: () => void }) {
  const { data, refetch } = useQuery({
    queryKey: ["admin-about-settings"],
    queryFn: async (): Promise<AboutSettings> => {
      const { data, error } = await supabase
        .from("site_settings")
        .select("key,value")
        .in("key", ["about_portrait_url", "about_video_url", "about_studio_images", "about_exhibitions", "about_bio_en", "about_bio_ka"]);
      if (error) throw error;
      const map: Record<string, string | null> = {};
      for (const r of data ?? []) map[r.key] = r.value;
      const parse = <T,>(v: string | null | undefined, fb: T): T => {
        if (!v) return fb;
        try { return JSON.parse(v) as T; } catch { return fb; }
      };
      return {
        about_portrait_url: map.about_portrait_url || ABOUT_DEFAULTS.about_portrait_url,
        about_video_url: map.about_video_url || ABOUT_DEFAULTS.about_video_url,
        about_studio_images: parse<string[]>(map.about_studio_images, ABOUT_DEFAULTS.about_studio_images),
        about_exhibitions: parse<Exhibition[]>(map.about_exhibitions, ABOUT_DEFAULTS.about_exhibitions),
        about_bio_en: map.about_bio_en || ABOUT_DEFAULTS.about_bio_en,
        about_bio_ka: map.about_bio_ka || ABOUT_DEFAULTS.about_bio_ka,
      };
    },
  });

  const [form, setForm] = useState<AboutSettings | null>(null);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);

  useEffect(() => {
    if (data && !form) setForm(data);
  }, [data, form]);

  if (!form) return <div className="text-muted-foreground">…</div>;

  const persist = async (next: AboutSettings) => {
    setForm(next);
    const rows = [
      { key: "about_portrait_url", value: next.about_portrait_url },
      { key: "about_video_url", value: next.about_video_url },
      { key: "about_studio_images", value: JSON.stringify(next.about_studio_images) },
      { key: "about_exhibitions", value: JSON.stringify(next.about_exhibitions) },
      { key: "about_bio_en", value: next.about_bio_en },
      { key: "about_bio_ka", value: next.about_bio_ka },
    ];
    const { error } = await supabase.from("site_settings").upsert(rows, { onConflict: "key" });
    if (error) toast.error(error.message);
  };

  const saveAll = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    await persist(form);
    setBusy(false);
    toast.success("About page saved");
    void refetch();
    onChange();
  };

  const handlePortraitUpload = async (file: File) => {
    setUploading("portrait");
    try {
      const url = await uploadToArtworks(file);
      const next = { ...form, about_portrait_url: url };
      await persist(next);
      toast.success("Portrait updated");
      void refetch();
      onChange();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(null);
    }
  };

  const handleVideoUpload = async (file: File) => {
    setUploading("video");
    try {
      const url = await uploadToArtworks(file);
      const next = { ...form, about_video_url: url };
      await persist(next);
      toast.success("Video updated");
      void refetch();
      onChange();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(null);
    }
  };

  const addStudioImage = async (file: File) => {
    setUploading("studio");
    try {
      const url = await uploadToArtworks(file);
      const next = { ...form, about_studio_images: [...form.about_studio_images, url] };
      await persist(next);
      toast.success("Image added");
      void refetch();
      onChange();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(null);
    }
  };

  const removeStudioImage = async (idx: number) => {
    const next = { ...form, about_studio_images: form.about_studio_images.filter((_, i) => i !== idx) };
    await persist(next);
    void refetch();
    onChange();
  };

  const updateExhibition = (idx: number, field: "year" | "en.title" | "en.venue" | "ka.title" | "ka.venue", value: string) => {
    const list = form.about_exhibitions.map((ex, i) => {
      if (i !== idx) return ex;
      if (field === "year") return { ...ex, year: value };
      if (field === "en.title") return { ...ex, en: { ...ex.en, title: value } };
      if (field === "en.venue") return { ...ex, en: { ...ex.en, venue: value } };
      if (field === "ka.title") return { ...ex, ka: { ...ex.ka, title: value } };
      return { ...ex, ka: { ...ex.ka, venue: value } };
    });
    setForm({ ...form, about_exhibitions: list });
  };

  const addExhibition = () => {
    setForm({
      ...form,
      about_exhibitions: [
        ...form.about_exhibitions,
        { year: "", en: { title: "", venue: "" }, ka: { title: "", venue: "" } },
      ],
    });
  };

  const removeExhibition = (idx: number) => {
    setForm({ ...form, about_exhibitions: form.about_exhibitions.filter((_, i) => i !== idx) });
  };

  return (
    <form onSubmit={saveAll} className="space-y-12">
      <section className="space-y-4 rounded border border-border bg-surface p-6">
        <h2 className="serif text-xl">Portrait image</h2>
        <p className="text-xs text-muted-foreground">Shown at the top of the About page.</p>
        <div className="flex gap-6">
          {form.about_portrait_url ? (
            <img src={form.about_portrait_url} alt="" className="h-40 w-32 object-cover bg-muted" />
          ) : (
            <div className="h-40 w-32 bg-muted flex items-center justify-center text-xs text-muted-foreground">Default</div>
          )}
          <div className="flex-1 space-y-3">
            <input
              type="file"
              accept="image/*"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) void handlePortraitUpload(f); }}
              className="block w-full text-sm"
            />
            {uploading === "portrait" && <p className="text-xs text-muted-foreground">Uploading…</p>}
            {form.about_portrait_url && (
              <button type="button" onClick={() => void persist({ ...form, about_portrait_url: "" })} className="text-[11px] uppercase tracking-[0.2em] text-destructive">
                Reset to default
              </button>
            )}
          </div>
        </div>
      </section>

      <section className="space-y-4 rounded border border-border bg-surface p-6">
        <h2 className="serif text-xl">About text / Bio</h2>
        <p className="text-xs text-muted-foreground">Paragraphs of the artist bio shown on the About page. Separate paragraphs with a blank line.</p>
        <Textarea
          label="Bio (EN)"
          value={form.about_bio_en}
          onChange={(v) => setForm({ ...form, about_bio_en: v })}
        />
        <Textarea
          label="Bio (KA)"
          value={form.about_bio_ka}
          onChange={(v) => setForm({ ...form, about_bio_ka: v })}
        />

      <section className="space-y-4 rounded border border-border bg-surface p-6">
        <h2 className="serif text-xl">Studio video</h2>
        <p className="text-xs text-muted-foreground">MP4 file. Replaces the studio video at the bottom of About.</p>
        <div className="flex gap-6">
          {form.about_video_url ? (
            <video src={form.about_video_url} className="h-40 w-64 object-cover bg-black" muted playsInline />
          ) : (
            <div className="h-40 w-64 bg-muted flex items-center justify-center text-xs text-muted-foreground">Default</div>
          )}
          <div className="flex-1 space-y-3">
            <input
              type="file"
              accept="video/*"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) void handleVideoUpload(f); }}
              className="block w-full text-sm"
            />
            {uploading === "video" && <p className="text-xs text-muted-foreground">Uploading… (large files may take a while)</p>}
            {form.about_video_url && (
              <button type="button" onClick={() => void persist({ ...form, about_video_url: "" })} className="text-[11px] uppercase tracking-[0.2em] text-destructive">
                Reset to default
              </button>
            )}
          </div>
        </div>
      </section>

      <section className="space-y-4 rounded border border-border bg-surface p-6">
        <h2 className="serif text-xl">Studio slideshow</h2>
        <p className="text-xs text-muted-foreground">Add images to override the default studio gallery. Leave empty to use defaults.</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {form.about_studio_images.map((url, i) => (
            <div key={url + i} className="relative group">
              <img src={url} alt="" className="aspect-[16/10] w-full object-cover bg-muted" />
              <button
                type="button"
                onClick={() => void removeStudioImage(i)}
                className="absolute top-1 right-1 bg-background/80 px-2 py-0.5 text-[10px] uppercase tracking-[0.2em] text-destructive opacity-0 group-hover:opacity-100"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) { void addStudioImage(f); e.target.value = ""; } }}
          className="block w-full text-sm"
        />
        {uploading === "studio" && <p className="text-xs text-muted-foreground">Uploading…</p>}
      </section>

      <section className="space-y-4 rounded border border-border bg-surface p-6">
        <div className="flex items-center justify-between">
          <h2 className="serif text-xl">Exhibitions</h2>
          <button type="button" onClick={addExhibition} className="text-xs uppercase tracking-[0.25em] hover:text-accent">
            + Add exhibition
          </button>
        </div>
        <div className="space-y-4">
          {form.about_exhibitions.map((ex, i) => (
            <div key={i} className="grid gap-3 rounded border border-border p-4 md:grid-cols-[100px_1fr_1fr_auto]">
              <Input label="Year" value={ex.year} onChange={(v) => updateExhibition(i, "year", v)} />
              <div className="space-y-2">
                <Input label="Title (EN)" value={ex.en.title} onChange={(v) => updateExhibition(i, "en.title", v)} />
                <Input label="Venue (EN)" value={ex.en.venue} onChange={(v) => updateExhibition(i, "en.venue", v)} />
              </div>
              <div className="space-y-2">
                <Input label="Title (KA)" value={ex.ka.title} onChange={(v) => updateExhibition(i, "ka.title", v)} />
                <Input label="Venue (KA)" value={ex.ka.venue} onChange={(v) => updateExhibition(i, "ka.venue", v)} />
              </div>
              <button
                type="button"
                onClick={() => removeExhibition(i)}
                className="text-[11px] uppercase tracking-[0.2em] text-destructive self-start"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      </section>

      <button
        type="submit"
        disabled={busy}
        className="border-b border-foreground pb-1 text-xs uppercase tracking-[0.25em] hover:text-accent hover:border-accent disabled:opacity-50"
      >
        {busy ? "Saving…" : "Save About page →"}
      </button>
    </form>
  );
}
