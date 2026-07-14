import LocaleSwitcher from "@/components/ui/locale-switcher.tsx";
import { cn } from "@/lib/utils.ts";
import { useEffect } from "react";
import {
  BarChart3, BookOpen, ClipboardList, LayoutDashboard,
  Menu, Package, Users, UtensilsCrossed, X, Wifi, WifiOff,
} from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, Outlet, useLocation, useParams } from "react-router-dom";

const navItems = [
  { key: "nav.dashboard", path: "", icon: LayoutDashboard },
  { key: "nav.menu", path: "menu", icon: BookOpen },
  { key: "nav.tables", path: "tables", icon: UtensilsCrossed },
  { key: "nav.orders", path: "orders", icon: ClipboardList },
  { key: "nav.inventory", path: "inventory", icon: Package },
  { key: "nav.employees", path: "employees", icon: Users },
  { key: "nav.reports", path: "reports", icon: BarChart3 },
];

function WhaleLogo({ size = 40 }: { size?: number }) {
  return (
    <img src="/icon/logo.jpg" alt="Surabhi Hotel" width={size} height={size} className="rounded-xl object-cover" style={{ transform: "scaleX(-1)" }} />
  );
}

export { WhaleLogo };

export default function AppLayout() {
  const { t } = useTranslation("common");
  const { lng } = useParams<{ lng: string }>();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const on = () => setIsOnline(true);
    const off = () => setIsOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => { window.removeEventListener("online", on); window.removeEventListener("offline", off); };
  }, []);

  const isActive = (path: string) => {
    const fullPath = `/${lng}${path ? `/${path}` : ""}`;
    if (path === "") return location.pathname === `/${lng}` || location.pathname === `/${lng}/`;
    return location.pathname.startsWith(fullPath);
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <WhaleLogo size={40} />
          <div className="min-w-0">
            <p className="font-bold text-sm leading-tight text-sidebar-foreground truncate">Surabhi Hotel</p>
            <p className="text-xs text-sidebar-foreground/60 truncate">& Family Restaurant</p>
          </div>
        </div>
      </div>
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {navItems.map(({ key, path, icon: Icon }) => (
          <Link
            key={key}
            to={`/${lng}${path ? `/${path}` : ""}`}
            onClick={() => setSidebarOpen(false)}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer",
              isActive(path)
                ? "bg-sidebar-primary text-sidebar-primary-foreground"
                : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            )}
          >
            <Icon className="w-4 h-4 flex-shrink-0" />
            <span>{t(key)}</span>
          </Link>
        ))}
      </nav>
      <div className="p-3 border-t border-sidebar-border">
        <div className="flex items-center justify-between text-xs text-sidebar-foreground/40">
          <span>v2.0 © 2025 Surabhi</span>
          {isOnline ? <Wifi className="w-3 h-3 text-green-400" /> : <WifiOff className="w-3 h-3 text-red-400" />}
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-background">
      <aside className="hidden md:flex md:w-56 flex-col bg-sidebar border-r border-sidebar-border flex-shrink-0">
        <SidebarContent />
      </aside>
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-64 bg-sidebar flex flex-col">
            <button onClick={() => setSidebarOpen(false)} className="absolute top-3 right-3 p-1 rounded text-sidebar-foreground/60 hover:text-sidebar-foreground cursor-pointer">
              <X className="w-5 h-5" />
            </button>
            <SidebarContent />
          </aside>
        </div>
      )}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-14 border-b border-border flex items-center justify-between px-4 bg-white/80 backdrop-blur-sm flex-shrink-0">
          <button onClick={() => setSidebarOpen(true)} className="md:hidden p-2 rounded-lg hover:bg-accent cursor-pointer">
            <Menu className="w-5 h-5" />
          </button>
          <div className="md:hidden flex items-center gap-2">
            <WhaleLogo size={28} />
            <span className="font-semibold text-sm">Surabhi Restaurant</span>
          </div>
          <div className="hidden md:flex items-center gap-2">
            {!isOnline && <span className="text-xs text-destructive flex items-center gap-1"><WifiOff className="w-3 h-3" /> Offline</span>}
          </div>
          <LocaleSwitcher />
        </header>
        <main className="flex-1 overflow-y-auto"><Outlet /></main>
      </div>
      <nav className="fixed bottom-0 left-0 right-0 md:hidden bg-sidebar border-t border-sidebar-border z-40">
        <div className="flex justify-around py-1">
          {navItems.slice(0, 5).map(({ key, path, icon: Icon }) => (
            <Link
              key={key}
              to={`/${lng}${path ? `/${path}` : ""}`}
              className={cn(
                "flex flex-col items-center gap-0.5 px-2 py-2 rounded-lg text-xs transition-colors cursor-pointer",
                isActive(path) ? "text-sidebar-primary" : "text-sidebar-foreground/60"
              )}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px]">{t(key).split(" ")[0]}</span>
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}
