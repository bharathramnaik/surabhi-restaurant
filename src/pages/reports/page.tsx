import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useData } from "@/lib/data-context.tsx";
import { BarChart3, Download, Settings, Printer } from "lucide-react";
import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

export default function ReportsPage() {
  const { t } = useTranslation("common");
  const { orders, tables, employees, menuItems, menuCategories, inventory, bookings, settings, updateSetting } = useData();
  const [gstinInput, setGstinInput] = useState(settings.gstin ?? "29AABCS1429B1ZB");
  const [addressInput, setAddressInput] = useState(settings.restaurantAddress ?? "");
  const [phoneInput, setPhoneInput] = useState(settings.restaurantPhone ?? "");
  const [pinInput, setPinInput] = useState("");
  const [reportMonth, setReportMonth] = useState(String(new Date().getMonth() + 1));
  const [reportYear, setReportYear] = useState(String(new Date().getFullYear()));

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

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  const monthlyOrders = useMemo(() => orders.filter((o) => {
    const d = new Date(o.createdAt);
    return d.getMonth() + 1 === Number(reportMonth) && d.getFullYear() === Number(reportYear);
  }), [orders, reportMonth, reportYear]);

  const monthlyBookings = useMemo(() => bookings.filter((b) => {
    const d = new Date(b.date);
    return d.getMonth() + 1 === Number(reportMonth) && d.getFullYear() === Number(reportYear);
  }), [bookings, reportMonth, reportYear]);

  const monthlyBilledOrders = monthlyOrders.filter((o) => o.status === "billed");
  const monthlyRevenue = monthlyBilledOrders.reduce((s, o) => s + o.total, 0);

  const printMonthlyReport = () => {
    const now = new Date();
    const monthLabel = `${monthNames[Number(reportMonth) - 1]} ${reportYear}`;
    const itemsSold: Record<string, { qty: number; rev: number }> = {};
    for (const order of monthlyOrders) {
      for (const item of order.items) {
        if (!itemsSold[item.name]) itemsSold[item.name] = { qty: 0, rev: 0 };
        itemsSold[item.name].qty += item.quantity;
        itemsSold[item.name].rev += item.price * item.quantity;
      }
    }
    const topItems = Object.entries(itemsSold).sort((a, b) => b[1].qty - a[1].qty).slice(0, 10);
    const lowStockItems = inventory.filter((i) => i.quantity <= i.minStock);

    const rows = (cells: string[]) => `<tr>${cells.map((c) => `<td style="padding:4px 8px;border:1px solid #ccc;font-size:12px">${c}</td>`).join("")}</tr>`;
    const ordersHtml = monthlyOrders.length === 0 ? "<p style='color:#888;font-size:13px'>No orders this month</p>" :
      `<table style="width:100%;border-collapse:collapse;margin-top:8px">
        <thead><tr style="background:#f3f4f6">${["#", "Customer", "Items", "Total", "Status", "Date"].map((h) => `<th style="padding:6px 8px;border:1px solid #ccc;font-size:12px;text-align:left">${h}</th>`).join("")}</tr></thead>
        <tbody>${[...monthlyOrders].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).map((o) => rows([
          `#${o.orderNumber}`, o.customerName || "Walk-in", `${o.items.length} items`, `₹${o.total}`, o.status, new Date(o.createdAt).toLocaleDateString("en-IN"),
        ])).join("")}</tbody>
      </table>`;
    const bookingsHtml = monthlyBookings.length === 0 ? "<p style='color:#888;font-size:13px'>No bookings this month</p>" :
      `<table style="width:100%;border-collapse:collapse;margin-top:8px">
        <thead><tr style="background:#f3f4f6">${["Date", "Guest", "Table", "Party", "Status"].map((h) => `<th style="padding:6px 8px;border:1px solid #ccc;font-size:12px;text-align:left">${h}</th>`).join("")}</tr></thead>
        <tbody>${monthlyBookings.map((b) => {
          const tbl = tables.find((t) => t.id === b.tableId);
          return rows([b.date, b.guestName, tbl ? `Table ${tbl.number}` : "?", String(b.partySize), b.status]);
        }).join("")}</tbody>
      </table>`;
    const inventoryHtml = inventory.length === 0 ? "<p style='color:#888;font-size:13px'>No inventory data</p>" :
      `<table style="width:100%;border-collapse:collapse;margin-top:8px">
        <thead><tr style="background:#f3f4f6">${["Item", "Category", "Quantity", "Min Stock", "Status"].map((h) => `<th style="padding:6px 8px;border:1px solid #ccc;font-size:12px;text-align:left">${h}</th>`).join("")}</tr></thead>
        <tbody>${inventory.map((i) => rows([
          i.name, i.category, `${i.quantity} ${i.unit}`, `${i.minStock} ${i.unit}`,
          i.quantity <= i.minStock ? "<span style='color:#d97706'>Low Stock</span>" : "<span style='color:#16a34a'>OK</span>",
        ])).join("")}</tbody>
      </table>`;
    const topItemsHtml = topItems.length === 0 ? "<p style='color:#888;font-size:13px'>No items sold this month</p>" :
      `<table style="width:100%;border-collapse:collapse;margin-top:8px">
        <thead><tr style="background:#f3f4f6">${["#", "Item", "Qty Sold", "Revenue"].map((h) => `<th style="padding:6px 8px;border:1px solid #ccc;font-size:12px;text-align:left">${h}</th>`).join("")}</tr></thead>
        <tbody>${topItems.map(([name, data], i) => rows([String(i + 1), name, String(data.qty), `₹${data.rev.toLocaleString()}`])).join("")}</tbody>
      </table>`;
    const employeesHtml = employees.length === 0 ? "<p style='color:#888;font-size:13px'>No employees</p>" :
      `<table style="width:100%;border-collapse:collapse;margin-top:8px">
        <thead><tr style="background:#f3f4f6">${["Name", "Role", "Shift", "Phone", "Status"].map((h) => `<th style="padding:6px 8px;border:1px solid #ccc;font-size:12px;text-align:left">${h}</th>`).join("")}</tr></thead>
        <tbody>${employees.map((e) => rows([e.name, e.role, e.shift, e.phone, e.active ? "Active" : "Inactive"])).join("")}</tbody>
      </table>`;
    const menuHtml = menuItems.length === 0 ? "<p style='color:#888;font-size:13px'>No menu items</p>" :
      `<table style="width:100%;border-collapse:collapse;margin-top:8px">
        <thead><tr style="background:#f3f4f6">${["Item", "Category", "Price", "Status"].map((h) => `<th style="padding:6px 8px;border:1px solid #ccc;font-size:12px;text-align:left">${h}</th>`).join("")}</tr></thead>
        <tbody>${menuItems.map((m) => {
          const cat = menuCategories.find((c) => c.id === m.categoryId);
          return rows([m.name, cat?.name || "?", `₹${m.price}`, m.available ? "Available" : "Unavailable"]);
        }).join("")}</tbody>
      </table>`;

    const win = window.open("", "_blank");
    if (!win) { toast.error("Popup blocked. Allow popups to print."); return; }
    win.document.write(`<!DOCTYPE html>
<html><head><title>Monthly Report - ${monthLabel}</title>
<style>
  body { font-family: 'Courier New', monospace; padding: 20px; max-width: 1000px; margin: auto; color: #222; }
  h1 { text-align: center; font-size: 20px; margin-bottom: 2px; }
  .sub { text-align: center; font-size: 13px; color: #555; margin-bottom: 4px; }
  h2 { font-size: 15px; margin: 20px 0 4px; border-bottom: 2px solid #333; padding-bottom: 4px; }
  .summary { display: flex; gap: 16px; flex-wrap: wrap; margin: 8px 0; }
  .summary-item { flex: 1; min-width: 140px; background: #f9fafb; padding: 10px; border-radius: 6px; }
  .summary-item .val { font-size: 20px; font-weight: bold; }
  .summary-item .lbl { font-size: 11px; color: #666; }
  .footer { text-align: center; margin-top: 30px; font-size: 13px; border-top: 2px solid #333; padding-top: 10px; }
  @media print { @page { margin: 15mm 10mm; } body { padding: 0; } }
</style></head><body>
<h1>${settings.restaurantAddress ? `SURABHI HOTEL & FAMILY RESTAURANT` : "SURABHI HOTEL & RESTAURANT"}</h1>
<p class="sub">${settings.restaurantAddress || ""}${settings.restaurantAddress && settings.restaurantPhone ? " | " : ""}${settings.restaurantPhone ? `Phone: ${settings.restaurantPhone}` : ""}</p>
<p class="sub" style="font-size:12px">GSTIN: ${settings.gstin || "29AABCS1429B1ZB"} | Report generated: ${now.toLocaleDateString("en-IN")} ${now.toLocaleTimeString("en-IN")}</p>
<h1 style="font-size:18px;margin-top:8px">MONTHLY REPORT — ${monthLabel}</h1>
<div class="summary">
  <div class="summary-item"><div class="val">${monthlyOrders.length}</div><div class="lbl">Total Orders</div></div>
  <div class="summary-item"><div class="val">${monthlyBilledOrders.length}</div><div class="lbl">Billed Orders</div></div>
  <div class="summary-item"><div class="val">₹${monthlyRevenue.toLocaleString()}</div><div class="lbl">Total Revenue</div></div>
  <div class="summary-item"><div class="val">${monthlyBilledOrders.length > 0 ? `₹${Math.round(monthlyRevenue / monthlyBilledOrders.length).toLocaleString()}` : "—"}</div><div class="lbl">Avg. Order Value</div></div>
  <div class="summary-item"><div class="val">${monthlyBookings.length}</div><div class="lbl">Bookings</div></div>
  <div class="summary-item"><div class="val">${menuItems.length}</div><div class="lbl">Menu Items</div></div>
</div>
<h2>📋 ALL ORDERS (${monthlyOrders.length})</h2>${ordersHtml}
<h2>🥇 TOP SELLING ITEMS (${monthLabel})</h2>${topItemsHtml}
<h2>📅 BOOKINGS (${monthlyBookings.length})</h2>${bookingsHtml}
<h2>📦 INVENTORY STATUS (${inventory.length} items${lowStockItems.length > 0 ? `, ${lowStockItems.length} low stock` : ""})</h2>${inventoryHtml}
<h2>👥 EMPLOYEES (${employees.length})</h2>${employeesHtml}
<h2>🍽️ MENU ITEMS (${menuItems.length})</h2>${menuHtml}
<h2>📊 TABLES (${tables.length})</h2>
<p style="font-size:13px">${tables.filter((t) => t.status === "available").length} Available | ${tables.filter((t) => t.status === "occupied").length} Occupied | ${tables.filter((t) => t.status === "reserved").length} Reserved</p>
<div class="footer">Generated by Surabhi Restaurant Management System • ${now.toLocaleDateString("en-IN")}</div>
</body></html>`);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); }, 500);
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
        <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><Printer className="w-4 h-4" /> Monthly Report</CardTitle></CardHeader>
        <CardContent className="pt-0 space-y-3">
          <p className="text-sm text-muted-foreground">Print a comprehensive A–Z report for any month including all orders, bookings, inventory, menu items, employees, and revenue.</p>
          <div className="flex gap-3 items-end">
            <div className="space-y-1">
              <Label>Month</Label>
              <Select value={reportMonth} onValueChange={setReportMonth}>
                <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                <SelectContent>{monthNames.map((m, i) => <SelectItem key={i + 1} value={String(i + 1)}>{m}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Year</Label>
              <Input type="number" min={2024} max={2030} value={reportYear} onChange={(e) => setReportYear(e.target.value)} className="w-24" />
            </div>
            <Button onClick={printMonthlyReport} className="cursor-pointer"><Printer className="w-4 h-4 mr-2" /> Generate & Print</Button>
          </div>
        </CardContent>
      </Card>
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
