import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useData } from "@/lib/data-context.tsx";
import { BarChart3, ClipboardList, IndianRupee, Package, UtensilsCrossed, Users, Plus, BookOpen, AlertTriangle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
import { cn } from "@/lib/utils.ts";
import { Skeleton } from "@/components/ui/skeleton.tsx";

export default function Dashboard() {
  const { t } = useTranslation(["dashboard", "common"]);
  const { lng } = useParams<{ lng: string }>();
  const navigate = useNavigate();
  const { orders, tables, employees, inventory, isLoading } = useData();

  const today = new Date().toISOString().slice(0, 10);
  const todayOrders = orders.filter((o) => o.createdAt.startsWith(today));
  const todayRevenue = todayOrders.filter((o) => o.status === "billed").reduce((s, o) => s + o.total, 0);
  const occupiedTables = tables.filter((t) => t.status === "occupied" || t.status === "reserved").length;
  const activeEmployees = employees.filter((e) => e.active).length;
  const lowStockItems = inventory.filter((i) => i.quantity <= i.minStock);
  const recentOrders = [...orders].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 5);

  const statusColor: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800",
    in_progress: "bg-blue-100 text-blue-800",
    served: "bg-green-100 text-green-800",
    billed: "bg-gray-100 text-gray-700",
  };

  if (isLoading) return (
    <div className="p-4 md:p-6 space-y-6 pb-20 md:pb-6">
      <Skeleton className="h-8 w-64" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">{[1,2,3,4].map((i) => <Skeleton key={i} className="h-24" />)}</div>
    </div>
  );

  return (
    <div className="p-4 md:p-6 space-y-6 pb-20 md:pb-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">{t("welcome")}</h1>
        <p className="text-muted-foreground text-sm mt-1">{new Date().toLocaleDateString(lng === "kn" ? "kn-IN" : "en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
      </div>
      {lowStockItems.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-amber-800">{t("label.low_stock_alert", { ns: "common" })}</p>
            <p className="text-xs text-amber-600 truncate">{lowStockItems.map((i) => i.name).join(", ")}</p>
          </div>
           <Button size="sm" variant="ghost" className="text-amber-700 cursor-pointer text-xs" onClick={() => navigate(`/${lng}/inventory`)}>{t("btn.view", { ns: "common" })} →</Button>
        </div>
      )}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: t("today_orders"), value: todayOrders.length, icon: ClipboardList, color: "text-blue-600", bg: "bg-blue-50" },
          { label: t("today_revenue"), value: `₹${todayRevenue.toLocaleString()}`, icon: IndianRupee, color: "text-green-600", bg: "bg-green-50" },
          { label: t("active_tables"), value: `${occupiedTables}/${tables.length}`, icon: UtensilsCrossed, color: "text-sky-600", bg: "bg-sky-50" },
          { label: t("total_employees"), value: activeEmployees, icon: Users, color: "text-indigo-600", bg: "bg-indigo-50" },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <Card key={label} className="shadow-sm">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-start justify-between">
                <div><p className="text-xs text-muted-foreground">{label}</p><p className="text-2xl font-bold mt-1">{value}</p></div>
                <div className={cn("p-2 rounded-lg", bg)}><Icon className={cn("w-5 h-5", color)} /></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid md:grid-cols-2 gap-6">
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">{t("recent_orders")}</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => navigate(`/${lng}/orders`)} className="cursor-pointer text-xs">{t("btn.view", { ns: "common" })} →</Button>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {recentOrders.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-6">{t("msg.no_data", { ns: "common" })}</p>
            ) : (
              <div className="space-y-2">
                {recentOrders.map((order) => (
                  <div key={order.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                    <div>
                      <p className="text-sm font-medium">#{order.orderNumber} — {order.customerName || `Table ${order.tableNumber}`}</p>
                      <p className="text-xs text-muted-foreground">{order.items.length} items</p>
                    </div>
                    <div className="text-right">
                      <span className={cn("text-xs px-2 py-0.5 rounded-full", statusColor[order.status])}>{t(`label.${order.status}`, { ns: "common" })}</span>
                      <p className="text-sm font-semibold mt-1">₹{order.total}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">{t("table_status")}</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => navigate(`/${lng}/tables`)} className="cursor-pointer text-xs">{t("btn.view", { ns: "common" })} →</Button>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-4 gap-2">
              {tables.map((table) => (
                <div key={table.id} className={cn("aspect-square rounded-lg flex flex-col items-center justify-center text-xs font-bold cursor-pointer border-2", table.status === "available" && "bg-green-50 border-green-200 text-green-700", table.status === "occupied" && "bg-red-50 border-red-200 text-red-700", table.status === "reserved" && "bg-yellow-50 border-yellow-200 text-yellow-700")} onClick={() => navigate(`/${lng}/tables`)}>
                  <span className="text-lg">{table.number}</span>
                  <span className="text-[9px] opacity-70">{table.capacity}p</span>
                </div>
              ))}
            </div>
            <div className="flex gap-4 mt-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500" />{t("label.available", { ns: "common" })}</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500" />{t("label.occupied", { ns: "common" })}</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-500" />{t("label.reserved", { ns: "common" })}</span>
            </div>
          </CardContent>
        </Card>
      </div>
      <Card className="shadow-sm">
        <CardHeader className="pb-3"><CardTitle className="text-base">{t("quick_actions")}</CardTitle></CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: t("new_order"), icon: Plus, path: "orders", className: "bg-primary text-primary-foreground hover:bg-primary/90" },
              { label: t("new_booking"), icon: BookOpen, path: "tables", className: "bg-sky-600 text-white hover:bg-sky-700" },
              { label: t("view_menu"), icon: BarChart3, path: "menu", className: "bg-secondary text-secondary-foreground hover:bg-secondary/80" },
              { label: t("nav.inventory", { ns: "common" }), icon: Package, path: "inventory", className: "bg-secondary text-secondary-foreground hover:bg-secondary/80" },
            ].map(({ label, icon: Icon, path, className }) => (
              <Button key={label} onClick={() => navigate(`/${lng}/${path}`)} className={cn("flex items-center gap-2 h-12 cursor-pointer", className)} variant="ghost">
                <Icon className="w-4 h-4" /><span className="text-sm">{label}</span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
