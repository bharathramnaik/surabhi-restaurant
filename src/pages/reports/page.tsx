import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useData } from "@/lib/data-context.tsx";
import { BarChart3, Download, Settings } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

export default function ReportsPage() {
  const { t } = useTranslation("common");
  const { orders, tables, employees, menuItems, inventory, settings, updateSetting } = useData();
  const [gstinInput, setGstinInput] = useState(settings.gstin ?? "29AABCS1429B1ZB");
  const [addressInput, setAddressInput] = useState(settings.restaurantAddress ?? "");
  const [phoneInput, setPhoneInput] = useState(settings.restaurantPhone ?? "");
  const [pinInput, setPinInput] = useState("");

  const today = new Date().toISOString().slice(0, 10);
  const thisMonth = new Date().toISOString().slice(0, 7);
  const todayOrders = orders.filter((o) => new Date(o.createdAt).toISOString().startsWith(today) && o.status === "billed");
  const monthOrders = orders.filter((o) => new Date(o.createdAt).toISOString().startsWith(thisMonth) && o.status === "billed");
  const totalOrders = orders.filter((o) => o.status === "billed");
  const todayRevenue = todayOrders.reduce((s, o) => s + o.total, 0);
  const monthRevenue = monthOrders.reduce((s, o) => s + o.total, 0);
  const totalRevenue = totalOrders.reduce((s, o) => s + o.total, 0);
  const itemCounts: Record<string, { name: string; count: number; revenue: number }> = {};
  for (const order of totalOrders) {
    for (const item of order.items) {
      if (!itemCounts[item.name]) itemCounts[item.name] = { name: item.name, count: 0, revenue: 0 };
      itemCounts[item.name].count += item.quantity;
      itemCounts[item.name].revenue += item.price * item.quantity;
    }
  }
  const topItems = Object.values(itemCounts).sort((a, b) => b.count - a.count).slice(0, 5);

  const exportJSON = () => {
    const blob = new Blob([JSON.stringify({ orders, tables, employees, menuItems, inventory, exportedAt: new Date().toISOString() }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `surabhi-data-${today}.json`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url); toast.success(t("msg.export_success"));
  };

  const saveSettings = () => {
    if (gstinInput) updateSetting("gstin", gstinInput);
    if (addressInput) updateSetting("restaurantAddress", addressInput);
    if (phoneInput) updateSetting("restaurantPhone", phoneInput);
    if (pinInput && pinInput.length >= 4) updateSetting("adminPin", pinInput);
    toast.success(t("msg.settings_saved"));
  };

  return (
    <div className="p-4 md:p-6 pb-20 md:pb-6 space-y-6">
      <h1 className="text-2xl font-bold">{t("nav.reports")}</h1>
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2"><BarChart3 className="w-4 h-4" /> {t("label.sales_summary")}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: t("label.today_revenue"), value: `₹${todayRevenue.toLocaleString()}`, sub: `${todayOrders.length} ${t("nav.orders").toLowerCase()}` },
            { label: t("label.this_month"), value: `₹${monthRevenue.toLocaleString()}`, sub: `${monthOrders.length} ${t("nav.orders").toLowerCase()}` },
            { label: t("label.all_time_revenue"), value: `₹${totalRevenue.toLocaleString()}`, sub: `${totalOrders.length} ${t("nav.orders").toLowerCase()}` },
          ].map(({ label, value, sub }) => (
            <Card key={label} className="shadow-sm"><CardContent className="pt-4 pb-4"><p className="text-sm text-muted-foreground">{label}</p><p className="text-2xl font-bold mt-1">{value}</p><p className="text-xs text-muted-foreground mt-1">{sub}</p></CardContent></Card>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[{ label: t("label.menu_item") + "s", value: menuItems.length }, { label: t("label.table") + "s", value: tables.length }, { label: t("label.total_orders"), value: orders.length }, { label: t("label.employees"), value: employees.length }].map(({ label, value }) => (
          <Card key={label} className="shadow-sm"><CardContent className="pt-4 pb-4 text-center"><p className="text-3xl font-bold text-primary">{value}</p><p className="text-sm text-muted-foreground mt-1">{label}</p></CardContent></Card>
        ))}
      </div>
      {topItems.length > 0 && (
        <Card className="shadow-sm">
          <CardHeader className="pb-3"><CardTitle className="text-base">{t("label.top_selling_items")}</CardTitle></CardHeader>
          <CardContent className="pt-0 space-y-2">
            {topItems.map((item, i) => (
              <div key={item.name} className="flex items-center justify-between">
                <div className="flex items-center gap-3"><span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">{i+1}</span><span className="text-sm">{item.name}</span></div>
                <div className="text-right"><p className="text-sm font-medium">{item.count} sold</p><p className="text-xs text-muted-foreground">₹{item.revenue.toLocaleString()}</p></div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
      <Card className="shadow-sm">
        <CardHeader className="pb-3"><CardTitle className="text-base">{t("label.export_data")}</CardTitle></CardHeader>
        <CardContent className="pt-0 space-y-3">
          <p className="text-sm text-muted-foreground">{t("label.export_description")}</p>
          <Button onClick={exportJSON} className="cursor-pointer"><Download className="w-4 h-4 mr-2" /> {t("btn.export")}</Button>
        </CardContent>
      </Card>
      <Card className="shadow-sm">
        <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><Settings className="w-4 h-4" /> {t("label.restaurant_settings")}</CardTitle></CardHeader>
        <CardContent className="pt-0 space-y-3">
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="space-y-1"><Label>{t("label.gstin")}</Label><Input value={gstinInput} onChange={(e) => setGstinInput(e.target.value)} placeholder="29AABCS1429B1ZB" /><p className="text-xs text-muted-foreground">{t("label.gstin_hint")}</p></div>
            <div className="space-y-1"><Label>{t("label.restaurant_phone")}</Label><Input value={phoneInput} onChange={(e) => setPhoneInput(e.target.value)} placeholder="9876543210" /></div>
            <div className="space-y-1 sm:col-span-2"><Label>{t("label.restaurant_address")}</Label><Input value={addressInput} onChange={(e) => setAddressInput(e.target.value)} placeholder="Main Road, Bangalore, Karnataka" /></div>
            <div className="space-y-1"><Label>{t("label.new_pin")}</Label><Input type="password" value={pinInput} onChange={(e) => setPinInput(e.target.value)} placeholder={t("label.leave_blank")} maxLength={6} /><p className="text-xs text-muted-foreground">{t("label.pin_help")}</p></div>
          </div>
          <Button onClick={saveSettings} className="cursor-pointer">{t("btn.save")} {t("btn.settings")}</Button>
        </CardContent>
      </Card>
    </div>
  );
}
