import { Facebook, Instagram, Linkedin, Youtube } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useSiteSettings, SETTINGS_DEFAULTS } from "@/lib/siteSettings";

export function SiteFooter() {
  const { t } = useI18n();
  const { data } = useSiteSettings();
  const s = data ?? SETTINGS_DEFAULTS;

  const socials = [
    { href: s.social_instagram, label: "Instagram", Icon: Instagram },
    { href: s.social_youtube, label: "YouTube", Icon: Youtube },
    { href: s.social_facebook, label: "Facebook", Icon: Facebook },
    { href: s.social_linkedin, label: "LinkedIn", Icon: Linkedin },
  ].filter((x) => x.href && x.href.trim().length > 0);

  return (
    <footer className="mt-32 border-t border-border bg-surface">
      <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 px-6 py-12 md:flex-row md:items-center">
        <div>
          <p className="serif text-2xl">Davit Abramishvili</p>
          <p className="mt-1 text-xs uppercase tracking-[0.25em] text-muted-foreground">
            Painter · Tbilisi
          </p>
          <div className="mt-4 flex gap-4">
            {socials.map(({ href, label, Icon }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                className="text-muted-foreground transition hover:text-accent"
              >
                <Icon size={18} />
              </a>
            ))}
          </div>
        </div>
        <div className="text-sm">
          <p className="mb-2 text-xs uppercase tracking-[0.25em] text-muted-foreground">
            {t("footer.contact")}
          </p>
          <p>
            <a href={`tel:${s.contact_phone_link}`} className="hover:text-accent transition">
              {s.contact_phone}
            </a>
          </p>
          <p>
            <a href={`mailto:${s.contact_email}`} className="hover:text-accent transition">
              {s.contact_email}
            </a>
          </p>
        </div>
      </div>
      <div className="border-t border-border px-6 py-4 text-center text-[11px] uppercase tracking-[0.25em] text-muted-foreground">
        © {new Date().getFullYear()} — All works reserved
      </div>
    </footer>
  );
}
