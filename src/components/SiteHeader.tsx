import { Link } from "@tanstack/react-router";
import { Sun, Moon, ShoppingBag, User, LogOut } from "lucide-react";
import { useTheme } from "@/lib/theme";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { useCart } from "@/lib/cart";
import brandLogo from "@/assets/brand-logo-02.png";

export function SiteHeader() {
  const { theme, toggle } = useTheme();
  const { lang, setLang, t } = useI18n();
  const { isAdmin, user, signOut } = useAuth();
  const { count } = useCart();

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <Link to="/" className="flex items-center gap-2.5">
          <img
            src={brandLogo}
            alt="Davit Abramishvili logo"
            className={`h-8 w-auto object-contain ${theme === "light" ? "invert" : ""}`}
          />
          <span className="serif text-xl tracking-tight">Davit Abramishvili</span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          <Link to="/gallery" className="nav-link">{t("nav.gallery")}</Link>
          <Link to="/about" className="nav-link">{t("nav.about")}</Link>
          <Link to="/shop" className="nav-link">{t("nav.shop")}</Link>
          {isAdmin && (
            <Link to="/admin" className="nav-link">{t("nav.admin")}</Link>
          )}
        </nav>

        <div className="flex items-center gap-3">
          <Link
            to="/cart"
            aria-label="Cart"
            className="relative grid h-9 w-9 place-items-center rounded-full border border-border transition hover:bg-secondary"
          >
            <ShoppingBag size={15} />
            {count > 0 && (
              <span className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-foreground px-1 text-[9px] font-medium text-background">
                {count}
              </span>
            )}
          </Link>

          {user ? (
            <button
              type="button"
              onClick={() => void signOut()}
              aria-label="Sign out"
              className="grid h-9 w-9 place-items-center rounded-full border border-border transition hover:bg-secondary"
            >
              <LogOut size={15} />
            </button>
          ) : (
            <Link
              to="/auth"
              aria-label="Sign in"
              className="grid h-9 w-9 place-items-center rounded-full border border-border transition hover:bg-secondary"
            >
              <User size={15} />
            </Link>
          )}

          <button
            type="button"
            onClick={toggle}
            aria-label="Toggle theme"
            className="grid h-9 w-9 place-items-center rounded-full border border-border transition hover:bg-secondary"
          >
            {theme === "light" ? <Moon size={15} /> : <Sun size={15} />}
          </button>
          <button
            type="button"
            onClick={() => setLang(lang === "en" ? "ka" : "en")}
            aria-label="Toggle language"
            className="rounded-full border border-border px-3 py-1.5 text-[10px] tracking-widest uppercase transition hover:bg-secondary"
          >
            {lang === "en" ? "🇬🇧 EN" : "🇬🇪 KA"}
          </button>
        </div>
      </div>

      <nav className="flex items-center justify-center gap-6 border-t border-border px-6 py-3 md:hidden">
        <Link to="/gallery" className="nav-link">{t("nav.gallery")}</Link>
        <Link to="/about" className="nav-link">{t("nav.about")}</Link>
        <Link to="/shop" className="nav-link">{t("nav.shop")}</Link>
        {isAdmin && <Link to="/admin" className="nav-link">{t("nav.admin")}</Link>}
      </nav>
    </header>
  );
}
