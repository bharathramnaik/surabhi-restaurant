import { useTranslation } from "react-i18next";
import { SUPPORTED_LOCALES } from "@/i18n.ts";
import { changeLocale, type SupportedLocale } from "@/i18n.ts";
import { Globe } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils.ts";

export default function LocaleSwitcher() {
  const { i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const current = i18n.language as SupportedLocale;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer",
          "text-muted-foreground hover:text-foreground hover:bg-accent",
        )}
      >
        <Globe className="w-3.5 h-3.5" />
        <span>{SUPPORTED_LOCALES[current]?.nativeName ?? "EN"}</span>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 z-50 bg-popover border border-border rounded-lg shadow-lg py-1 min-w-[120px]">
            {Object.entries(SUPPORTED_LOCALES).map(([code, locale]) => (
              <button
                key={code}
                onClick={() => {
                  void changeLocale(code as SupportedLocale);
                  setOpen(false);
                }}
                className={cn(
                  "w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors cursor-pointer",
                  current === code
                    ? "bg-accent text-accent-foreground font-medium"
                    : "text-foreground hover:bg-accent",
                )}
              >
                <span>{locale.emoji}</span>
                <span>{locale.nativeName}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
