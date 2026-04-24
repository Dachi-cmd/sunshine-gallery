import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";

export type CartItem = {
  id: string;
  artwork_id: string;
  quantity: number;
  artwork: {
    id: string;
    title: string;
    title_ka: string | null;
    image_url: string;
    medium: string | null;
    year: number | null;
  };
};

type CartCtx = {
  items: CartItem[];
  count: number;
  loading: boolean;
  addToCart: (artworkId: string) => Promise<void>;
  removeFromCart: (id: string) => Promise<void>;
  clearCart: () => Promise<void>;
  refresh: () => Promise<void>;
};

const Ctx = createContext<CartCtx | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!user) {
      setItems([]);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from("cart_items")
      .select("id, artwork_id, quantity, artwork:artworks(id, title, title_ka, image_url, medium, year)")
      .order("created_at", { ascending: false });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setItems((data ?? []) as unknown as CartItem[]);
  }, [user]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const addToCart = async (artworkId: string) => {
    if (!user) {
      toast.error("Please sign in to add to cart");
      return;
    }
    const { error } = await supabase
      .from("cart_items")
      .insert({ user_id: user.id, artwork_id: artworkId, quantity: 1 });
    if (error) {
      if (error.code === "23505") {
        toast.info("Already in your cart");
      } else {
        toast.error(error.message);
      }
      return;
    }
    toast.success("Added to cart");
    await refresh();
  };

  const removeFromCart = async (id: string) => {
    const { error } = await supabase.from("cart_items").delete().eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    await refresh();
  };

  const clearCart = async () => {
    if (!user) return;
    const { error } = await supabase.from("cart_items").delete().eq("user_id", user.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    setItems([]);
  };

  return (
    <Ctx.Provider
      value={{ items, count: items.length, loading, addToCart, removeFromCart, clearCart, refresh }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useCart() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useCart must be inside CartProvider");
  return c;
}

export const WHATSAPP_NUMBER = "599597009391"; // +599 597 009 391

export function buildWhatsappLink(message: string) {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}
