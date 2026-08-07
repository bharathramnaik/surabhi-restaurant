import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useData } from "@/lib/data-context.tsx";
import { usePrintPreview } from "@/components/ui/print-preview.tsx";
import { BarChart3, Download, Settings, Printer } from "lucide-react";
import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

export default function ReportsPage() {
  const { t } = useTranslation("common");
  const { orders, tables, employees, menuItems, menuCategories, inventory, bookings, settings, updateSetting } = useData();
  const { Preview, setPreview: openPrintPreview } = usePrintPreview();
  const [gstinInput, setGstinInput] = useState(settings.gstin ?? "29AABCS1429B1ZB");
  const [addressInput, setAddressInput] = useState(settings.restaurantAddress ?? "");
  const [phoneInput, setPhoneInput] = useState(settings.restaurantPhone ?? "");
  const [pinInput, setPinInput] = useState("");
  const [reportPeriod, setReportPeriod] = useState<"day" | "week" | "month" | "quarter" | "year">("month");
  const [reportDate, setReportDate] = useState(new Date().toISOString().slice(0, 10));
  const [reportMonth, setReportMonth] = useState(String(new Date().getMonth() + 1));
  const [reportYear, setReportYear] = useState(String(new Date().getFullYear()));
  const [reportQuarter, setReportQuarter] = useState(String(Math.floor(new Date().getMonth() / 3) + 1));

  const inRange = (createdAt: string, start: Date, end: Date) => {
    const t = new Date(createdAt).getTime();
    return t >= start.getTime() && t <= end.getTime();
  };
  const rangeFor = (period: "day" | "week" | "month" | "quarter" | "year", anchor: Date) => {
    const start = new Date(anchor); start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    if (period === "day") { end.setHours(23, 59, 59, 999); }
    else if (period === "week") { start.setDate(start.getDate() - ((start.getDay() + 6) % 7)); end.setDate(start.getDate() + 6); end.setHours(23, 59, 59, 999); }
    else if (period === "month") { start.setDate(1); end.setMonth(start.getMonth() + 1, 0); end.setHours(23, 59, 59, 999); }
    else if (period === "quarter") { start.setMonth(Math.floor(start.getMonth() / 3) * 3, 1); end.setMonth(start.getMonth() + 3, 0); end.setHours(23, 59, 59, 999); }
    else { start.setMonth(0, 1); end.setMonth(11, 31); end.setHours(23, 59, 59, 999); }
    return { start, end };
  };

  const today = new Date().toISOString().slice(0, 10);
  const now = new Date();
  const billedIn = (r: { start: Date; end: Date }) => orders.filter((o) => o.status === "billed" && inRange(o.createdAt, r.start, r.end));
  const dayOrders = billedIn(rangeFor("day", now));
  const weekOrders = billedIn(rangeFor("week", now));
  const monthOrders = billedIn(rangeFor("month", now));
  const quarterOrders = billedIn(rangeFor("quarter", now));
  const yearOrders = billedIn(rangeFor("year", now));
  const totalOrders = orders.filter((o) => o.status === "billed");
  const dayRevenue = dayOrders.reduce((s, o) => s + o.total, 0);
  const weekRevenue = weekOrders.reduce((s, o) => s + o.total, 0);
  const monthRevenue = monthOrders.reduce((s, o) => s + o.total, 0);
  const quarterRevenue = quarterOrders.reduce((s, o) => s + o.total, 0);
  const yearRevenue = yearOrders.reduce((s, o) => s + o.total, 0);
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

  const periodRange = useMemo(() => {
    if (reportPeriod === "day") return rangeFor("day", new Date(reportDate + "T00:00:00"));
    if (reportPeriod === "week") return rangeFor("week", new Date(reportDate + "T00:00:00"));
    if (reportPeriod === "month") return rangeFor("month", new Date(Number(reportYear), Number(reportMonth) - 1, 1));
    if (reportPeriod === "quarter") return rangeFor("quarter", new Date(Number(reportYear), (Number(reportQuarter) - 1) * 3, 1));
    return rangeFor("year", new Date(Number(reportYear), 0, 1));
  }, [reportPeriod, reportDate, reportMonth, reportQuarter, reportYear]);

  const periodOrders = useMemo(() => orders.filter((o) => inRange(o.createdAt, periodRange.start, periodRange.end)), [orders, periodRange]);
  const periodBookings = useMemo(() => bookings.filter((b) => inRange(b.date + "T00:00:00", periodRange.start, periodRange.end)), [bookings, periodRange]);

  const periodBilledOrders = periodOrders.filter((o) => o.status === "billed");
  const periodRevenue = periodBilledOrders.reduce((s, o) => s + o.total, 0);

  const periodName = { day: "Daily", week: "Weekly", month: "Monthly", quarter: "Quarterly", year: "Yearly" }[reportPeriod];
  const periodLabel = () => {
    if (reportPeriod === "day") return reportDate;
    if (reportPeriod === "week") return `Week of ${periodRange.start.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}`;
    if (reportPeriod === "month") return `${monthNames[Number(reportMonth) - 1]} ${reportYear}`;
    if (reportPeriod === "quarter") return `Q${reportQuarter} ${reportYear}`;
    return reportYear;
  };

  const printPeriodReport = () => {
    const now = new Date();
    const label = periodLabel();
    const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
    const itemsSold: Record<string, { qty: number; rev: number }> = {};
    for (const order of periodOrders) {
      for (const item of order.items) {
        if (!itemsSold[item.name]) itemsSold[item.name] = { qty: 0, rev: 0 };
        itemsSold[item.name].qty += item.quantity;
        itemsSold[item.name].rev += item.price * item.quantity;
      }
    }
    const topItems = Object.entries(itemsSold).sort((a, b) => b[1].qty - a[1].qty).slice(0, 10);
    const lowStockItems = inventory.filter((i) => i.quantity <= i.minStock);

    const orderStatusBadge: Record<string, string> = {
      billed: "badge-success", served: "badge-info", in_progress: "badge-warning", pending: "badge-neutral",
    };
    const rows = (cells: string[], badges: string[] = []) => `<tr>${cells.map((c, i) => `<td>${badges[i] ? `<span class="badge ${badges[i]}">${c}</span>` : c}</td>`).join("")}</tr>`;

    const ordersHtml = periodOrders.length === 0 ? `<div class="empty-state">No orders in this period</div>` :
      `<table>
        <thead><tr>${["#", "Customer", "Items", "Total", "Status", "Date"].map((h) => `<th>${h}</th>`).join("")}</tr></thead>
        <tbody>${[...periodOrders].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).map((o) => rows([
          `#${o.orderNumber}`, esc(o.customerName || "Walk-in"), `${o.items.length} items`, `₹${o.total}`, o.status, new Date(o.createdAt).toLocaleDateString("en-IN"),
        ], ["", "", "", "", orderStatusBadge[o.status] || "badge-neutral", ""])).join("")}</tbody>
      </table>`;
    const topItemsHtml = topItems.length === 0 ? `<div class="empty-state">No items sold in this period</div>` :
      `<table>
        <thead><tr>${["#", "Item", "Qty Sold", "Revenue"].map((h) => `<th>${h}</th>`).join("")}</tr></thead>
        <tbody>${topItems.map(([name, data], i) => rows([String(i + 1), esc(name), String(data.qty), `₹${data.rev.toLocaleString("en-IN")}`])).join("")}</tbody>
      </table>`;
    const bookingsHtml = periodBookings.length === 0 ? `<div class="empty-state">No bookings in this period</div>` :
      `<table>
        <thead><tr>${["Date", "Guest", "Table", "Party", "Status"].map((h) => `<th>${h}</th>`).join("")}</tr></thead>
        <tbody>${periodBookings.map((b) => {
          const tbl = tables.find((t) => t.id === b.tableId);
          return rows([b.date, esc(b.guestName), tbl ? `Table ${tbl.number}` : "?", String(b.partySize), b.status]);
        }).join("")}</tbody>
      </table>`;
    const inventoryHtml = inventory.length === 0 ? `<div class="empty-state">No inventory data</div>` :
      `<table>
        <thead><tr>${["Item", "Category", "Quantity", "Min Stock", "Status"].map((h) => `<th>${h}</th>`).join("")}</tr></thead>
        <tbody>${inventory.map((i) => rows([
          esc(i.name), esc(i.category), `${i.quantity} ${i.unit}`, `${i.minStock} ${i.unit}`,
          i.quantity <= i.minStock ? "Low Stock" : "OK",
        ], ["", "", "", "", i.quantity <= i.minStock ? "badge-warning" : "badge-success"])).join("")}</tbody>
      </table>`;
    const employeesHtml = employees.length === 0 ? `<div class="empty-state">No employees</div>` :
      `<table>
        <thead><tr>${["Name", "Role", "Shift", "Phone", "Status"].map((h) => `<th>${h}</th>`).join("")}</tr></thead>
        <tbody>${employees.map((e) => rows([
          esc(e.name), esc(e.role), esc(e.shift), e.phone ? esc(e.phone) : "—", e.active ? "Active" : "Inactive",
        ], ["", "", "", "", e.active ? "badge-success" : "badge-neutral"])).join("")}</tbody>
      </table>`;

    const avg = periodBilledOrders.length > 0 ? Math.round(periodRevenue / periodBilledOrders.length) : 0;

    const reportHtml = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>${periodName} Report - ${esc(label)}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #1f2937; background-color: #ffffff; padding: 24px; font-size: 13px; line-height: 1.4; }
  .report-header { border-bottom: 2px solid #e5e7eb; padding-bottom: 16px; margin-bottom: 20px; }
  .report-title { font-size: 20px; font-weight: 700; color: #111827; text-transform: uppercase; }
  .company-name { font-size: 14px; font-weight: 600; color: #374151; margin-top: 2px; }
  .meta-info { font-size: 12px; color: #6b7280; margin-top: 4px; }
  .kpi-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 12px; margin-bottom: 24px; }
  .kpi-card { border: 1px solid #d1d5db; border-radius: 6px; padding: 10px 12px; background-color: #f9fafb; }
  .kpi-title { font-size: 11px; font-weight: 600; color: #6b7280; text-transform: uppercase; }
  .kpi-value { font-size: 18px; font-weight: 700; color: #111827; margin-top: 4px; }
  .section-block { margin-bottom: 24px; break-inside: avoid; page-break-inside: avoid; }
  .section-title { font-size: 14px; font-weight: 700; color: #111827; margin-bottom: 8px; display: flex; align-items: center; gap: 6px; }
  table { width: 100%; border-collapse: collapse; font-size: 12px; text-align: left; border: 1px solid #d1d5db; }
  th, td { padding: 8px 10px; border: 1px solid #d1d5db; }
  th { background-color: #f3f4f6; font-weight: 600; color: #374151; border-bottom: 2px solid #9ca3af; }
  tr:nth-child(even) { background-color: #f9fafb; }
  tr { break-inside: avoid; page-break-inside: avoid; }
  .badge { display: inline-block; padding: 2px 8px; border-radius: 9999px; font-size: 11px; font-weight: 500; }
  .badge-success { background-color: #def7ec; color: #03543f; border: 1px solid #bcf0da; }
  .badge-warning { background-color: #fef3c7; color: #92400e; border: 1px solid #fde68a; }
  .badge-info { background-color: #e0f2fe; color: #075985; border: 1px solid #bae6fd; }
  .badge-neutral { background-color: #f3f4f6; color: #374151; border: 1px solid #e5e7eb; }
  .empty-state { padding: 12px; border: 1px dashed #d1d5db; border-radius: 6px; color: #6b7280; font-style: italic; }
  @media print { body { padding: 0; } .section-block { break-inside: avoid; page-break-inside: avoid; } thead { display: table-header-group; } }
</style>
</head>
<body>
<header class="report-header">
  <h1 class="report-title">${periodName} Report - ${esc(label)}</h1>
  <div class="company-name">SURABHI HOTEL &amp; FAMILY RESTAURANT</div>
  <div class="meta-info">
    ${esc(settings.restaurantAddress || "")}${settings.restaurantAddress ? " &bull; " : ""}Phone: ${esc(settings.restaurantPhone || "9902718290")} &bull; GSTIN: ${esc(settings.gstin || "29AABCS1429B1ZB")}<br>
    Report Generated: ${now.toLocaleDateString("en-IN")}, ${now.toLocaleTimeString("en-IN")}
  </div>
</header>
<div class="kpi-grid">
  <div class="kpi-card"><div class="kpi-title">Total Orders</div><div class="kpi-value">${periodOrders.length}</div></div>
  <div class="kpi-card"><div class="kpi-title">Billed Orders</div><div class="kpi-value">${periodBilledOrders.length}</div></div>
  <div class="kpi-card"><div class="kpi-title">Bookings</div><div class="kpi-value">${periodBookings.length}</div></div>
  <div class="kpi-card"><div class="kpi-title">Total Revenue</div><div class="kpi-value">₹${periodRevenue.toLocaleString("en-IN")}</div></div>
  <div class="kpi-card"><div class="kpi-title">Avg. Order Value</div><div class="kpi-value">${periodBilledOrders.length > 0 ? `₹${avg.toLocaleString("en-IN")}` : "—"}</div></div>
</div>
<section class="section-block"><h2 class="section-title">📦 ALL ORDERS (${periodOrders.length})</h2>${ordersHtml}</section>
<section class="section-block"><h2 class="section-title">🔥 TOP SELLING ITEMS (${esc(label)})</h2>${topItemsHtml}</section>
<section class="section-block"><h2 class="section-title">📅 BOOKINGS (${periodBookings.length})</h2>${bookingsHtml}</section>
<section class="section-block"><h2 class="section-title">📦 INVENTORY STATUS (${inventory.length} items${lowStockItems.length > 0 ? `, ${lowStockItems.length} low stock` : ""})</h2>${inventoryHtml}</section>
<section class="section-block"><h2 class="section-title">👥 EMPLOYEES (${employees.length})</h2>${employeesHtml}</section>
</body>
</html>`;
    openPrintPreview(`${periodName} Report - ${label}`, reportHtml);
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
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          {[
            { label: t("label.today_revenue"), value: `₹${dayRevenue.toLocaleString()}`, sub: `${dayOrders.length} ${t("nav.orders").toLowerCase()}` },
            { label: t("label.this_week"), value: `₹${weekRevenue.toLocaleString()}`, sub: `${weekOrders.length} ${t("nav.orders").toLowerCase()}` },
            { label: t("label.this_month"), value: `₹${monthRevenue.toLocaleString()}`, sub: `${monthOrders.length} ${t("nav.orders").toLowerCase()}` },
            { label: t("label.this_quarter"), value: `₹${quarterRevenue.toLocaleString()}`, sub: `${quarterOrders.length} ${t("nav.orders").toLowerCase()}` },
            { label: t("label.this_year"), value: `₹${yearRevenue.toLocaleString()}`, sub: `${yearOrders.length} ${t("nav.orders").toLowerCase()}` },
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
        <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><Printer className="w-4 h-4" /> {t("label.period_report")}</CardTitle></CardHeader>
        <CardContent className="pt-0 space-y-3">
          <p className="text-sm text-muted-foreground">{t("label.period_report_desc")}</p>
          <div className="flex gap-3 items-end flex-wrap">
            <div className="space-y-1">
              <Label>{t("label.period")}</Label>
              <Select value={reportPeriod} onValueChange={(v) => setReportPeriod(v as "day" | "week" | "month" | "quarter" | "year")}>
                <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="day">{t("label.day")}</SelectItem>
                  <SelectItem value="week">{t("label.week")}</SelectItem>
                  <SelectItem value="month">{t("label.month")}</SelectItem>
                  <SelectItem value="quarter">{t("label.quarter")}</SelectItem>
                  <SelectItem value="year">{t("label.year")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {(reportPeriod === "day" || reportPeriod === "week") && (
              <div className="space-y-1">
                <Label>{t("label.date")}</Label>
                <Input type="date" value={reportDate} onChange={(e) => setReportDate(e.target.value)} className="w-40" />
              </div>
            )}
            {(reportPeriod === "month" || reportPeriod === "quarter") && (
              <div className="space-y-1">
                <Label>{t("label.month")}</Label>
                <Select value={reportMonth} onValueChange={setReportMonth}>
                  <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                  <SelectContent>{monthNames.map((m, i) => <SelectItem key={i + 1} value={String(i + 1)}>{m}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            )}
            {reportPeriod === "quarter" && (
              <div className="space-y-1">
                <Label>{t("label.quarter")}</Label>
                <Select value={reportQuarter} onValueChange={setReportQuarter}>
                  <SelectTrigger className="w-24"><SelectValue /></SelectTrigger>
                  <SelectContent>{["1", "2", "3", "4"].map((q) => <SelectItem key={q} value={q}>Q{q}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-1">
              <Label>{t("label.year")}</Label>
              <Input type="number" min={2024} max={2030} value={reportYear} onChange={(e) => setReportYear(e.target.value)} className="w-24" />
            </div>
            <Button onClick={printPeriodReport} className="cursor-pointer"><Printer className="w-4 h-4 mr-2" /> {t("btn.generate_print")}</Button>
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
      {Preview}
    </div>
  );
}
