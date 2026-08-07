import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { fetchLatestRelease, isNewerVersion, currentAppVersion, type AppUpdateInfo } from "@/lib/app-update";

const CHECK_INTERVAL_MS = 10 * 60 * 1000;
const SNOOZE_MS = 24 * 60 * 60 * 1000;

export default function AppUpdateDialog() {
  const { t } = useTranslation("common");
  const [info, setInfo] = useState<AppUpdateInfo | null>(null);

  useEffect(() => {
    let cancelled = false;

    const check = async () => {
      try {
        const lastCheck = Number(localStorage.getItem("updateLastCheck") ?? 0);
        if (Date.now() - lastCheck < CHECK_INTERVAL_MS) return;
        localStorage.setItem("updateLastCheck", String(Date.now()));

        const release = await fetchLatestRelease();
        if (cancelled || !release) return;
        if (!isNewerVersion(release.latestVersion, currentAppVersion())) return;

        const snoozed = Number(localStorage.getItem("updateSnooze") ?? 0);
        if (Date.now() - snoozed < SNOOZE_MS) return;
        setInfo(release);
      } catch {
        /* silent */
      }
    };

    check();
    const onVisible = () => {
      if (document.visibilityState === "visible") check();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  const close = () => {
    setInfo(null);
    localStorage.setItem("updateSnooze", String(Date.now()));
  };

  const update = () => {
    if (info) window.open(info.url, "_blank");
    close();
  };

  return (
    <Dialog open={!!info} onOpenChange={(o) => { if (!o) close(); }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="w-4 h-4 text-primary" />
            {t("update.title")}
          </DialogTitle>
        </DialogHeader>
        <div className="text-sm text-muted-foreground space-y-2">
          <p>{t("update.description", { version: info?.latestVersion ?? "" })}</p>
          {info?.body ? (
            <p className="text-xs border-t pt-2 line-clamp-3 break-words">{info.body}</p>
          ) : null}
        </div>
        <div className="flex gap-2 justify-end pt-3">
          <Button variant="secondary" onClick={close} className="cursor-pointer">{t("btn.later")}</Button>
          <Button onClick={update} className="cursor-pointer">{t("update.button")}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}