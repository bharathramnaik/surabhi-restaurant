import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import ConfirmDialog from "@/components/ui/confirm-dialog.tsx";
import { usePrintPreview } from "@/components/ui/print-preview.tsx";
import { useData } from "@/lib/data-context.tsx";
import { cn } from "@/lib/utils.ts";
import { Plus, Pencil, Trash2, Search, ShoppingCart, Receipt, X, Printer, Share2 } from "lucide-react";
import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

type OrderFormItem = { menuItemId: string; name: string; price: number; quantity: number };

const statusColor: Record<string, string> = { pending: "bg-yellow-100 text-yellow-800", in_progress: "bg-blue-100 text-blue-800", served: "bg-green-100 text-green-800", billed: "bg-gray-100 text-gray-700" };

function formatInvoiceText(order: { orderNumber: number; customerName: string; customerPhone: string; tableNumber: number | null; items: { name: string; price: number; quantity: number }[]; subtotal: number; tax: number; discount: number; total: number; createdAt: string; status: string }, settings: Record<string, string>) {
  const date = new Date(order.createdAt).toLocaleString("en-IN");
  const discount = order.discount ?? order.tax;
  const nameW = Math.min(24, Math.max(10, ...order.items.map((i) => i.name.length)));
  const padName = (s: string) => s.padEnd(nameW);
  const col = (n: number, w: number) => String(n).padStart(w);
  const itemsText = [
    `${padName("Item Description")}  ${"Qty".padStart(3)}   ${"Rate".padStart(6)}   ${"Total".padStart(7)}`,
    ...order.items.map((i) => `${padName(i.name)}  ${col(i.quantity, 3)}   ${col(i.price, 6)}   ${col(i.price * i.quantity, 7)}`),
  ].join("\n");
  const summary = (label: string, amt: string) => `${label.padEnd(30)}${amt.padStart(10)}`;
  const text = [
    "═".repeat(42),
    "        SURABHI HOTEL & RESTAURANT",
    "            & Family Restaurant",
    "       Hotel Surabhi, Chanal Road, Thyavanige",
    `  Phone: ${settings.restaurantPhone || "9876543210"}  |  GSTIN: ${settings.gstin || "29AABCS1429B1ZB"}`,
    "═".repeat(42),
    `Invoice #${order.orderNumber}`,
    `Date: ${date}`,
    `Customer: ${order.customerName || "Walk-in"}`,
    order.customerPhone ? `Phone: ${order.customerPhone}` : "",
    order.tableNumber ? `Table: ${order.tableNumber}` : "",
    "─".repeat(42),
    itemsText,
    "─".repeat(42),
    summary("Subtotal", `₹${order.subtotal}`),
    summary("Tax (5%)", `₹${order.tax}`),
    summary("Discount (5%)", `-₹${discount}`),
    summary("Grand Total", `₹${order.total}`),
    "═".repeat(42),
    "          Thank you! Visit Again!",
    "═".repeat(42),
  ].filter(Boolean).join("\n");
  return text;
}

function formatInvoiceHtml(order: { orderNumber: number; customerName: string; customerPhone: string; tableNumber: number | null; items: { name: string; price: number; quantity: number }[]; subtotal: number; tax: number; discount: number; total: number; createdAt: string; status: string }, settings: Record<string, string>) {
  const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  const date = new Date(order.createdAt).toLocaleString("en-IN");
  const discount = order.discount ?? order.tax;
  const rows = order.items.map((i) => `<tr><td>${esc(i.name)}</td><td class="center">${i.quantity}</td><td class="right">${i.price}</td><td class="right">${i.price * i.quantity}</td></tr>`).join("");
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Invoice #${order.orderNumber} - Surabhi Hotel &amp; Restaurant</title>
<style>
body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 20px auto; padding: 30px; border: 1px solid #e0e0e0; border-radius: 8px; box-shadow: 0 4px 10px rgba(0,0,0,0.05); color: #333; }
.text-center { text-align: center; }
.header h1 { margin: 0 0 5px 0; font-size: 22px; color: #1a1a1a; text-transform: uppercase; }
.header p { margin: 3px 0; font-size: 13px; color: #555; }
.divider { border-top: 1px dashed #ccc; margin: 15px 0; }
.meta-table { width: 100%; border-collapse: collapse; font-size: 13px; margin-bottom: 10px; }
.meta-table td { padding: 3px 0; }
.items-table { width: 100%; border-collapse: collapse; font-size: 13px; margin-top: 10px; }
.items-table th, .items-table td { padding: 8px 6px; text-align: left; }
.items-table th { border-bottom: 2px solid #333; background-color: #f8f9fa; }
.items-table td { border-bottom: 1px solid #eee; }
.items-table .center { text-align: center; }
.items-table .right { text-align: right; }
.summary-table { width: 100%; border-collapse: collapse; font-size: 13px; margin-top: 10px; }
.summary-table td { padding: 4px 6px; text-align: right; }
.summary-table .bold { font-weight: bold; }
.footer { margin-top: 25px; font-weight: bold; font-size: 14px; color: #444; }
@media print { body { border: none; box-shadow: none; margin: 0; padding: 0; max-width: 100%; } }
</style>
</head>
<body>
<div class="header text-center">
  <h1>Surabhi Hotel &amp; Restaurant</h1>
  <p><strong>Family Restaurant</strong></p>
  <p>${esc(settings.restaurantAddress || "Main Road, Bangalore")}</p>
  <p><strong>Phone:</strong> ${esc(settings.restaurantPhone || "9876543210")} &nbsp;|&nbsp; <strong>GSTIN:</strong> ${esc(settings.gstin || "29AABCS1429B1ZB")}</p>
</div>
<div class="divider"></div>
<table class="meta-table">
  <tr>
    <td><strong>Invoice #:</strong> ${order.orderNumber}</td>
    <td style="text-align: right;"><strong>Date:</strong> ${esc(date)}</td>
  </tr>
  <tr>
    <td colspan="2"><strong>Customer:</strong> ${esc(order.customerName || "Walk-in")}</td>
  </tr>
  ${order.customerPhone ? `<tr><td colspan="2"><strong>Phone:</strong> ${esc(order.customerPhone)}</td></tr>` : ""}
  ${order.tableNumber ? `<tr><td colspan="2"><strong>Table:</strong> ${order.tableNumber}</td></tr>` : ""}
</table>
<table class="items-table">
  <thead>
    <tr>
      <th>Item Description</th>
      <th class="center">Qty</th>
      <th class="right">Rate (₹)</th>
      <th class="right">Total (₹)</th>
    </tr>
  </thead>
  <tbody>${rows}</tbody>
</table>
<div class="divider"></div>
<table class="summary-table">
  <tr><td style="width: 70%;">Subtotal:</td><td class="bold">₹${order.subtotal}</td></tr>
  <tr><td>Tax (5%):</td><td class="bold">₹${order.tax}</td></tr>
  <tr><td>Discount (5%):</td><td class="bold">-₹${discount}</td></tr>
  <tr style="font-size: 15px;"><td><strong>Grand Total:</strong></td><td class="bold"><strong>₹${order.total}</strong></td></tr>
</table>
<div class="divider"></div>
<div class="footer text-center">Thank you! Visit Again!</div>
</body>
</html>`;
}

export default function OrdersPage() {
  const { t, i18n } = useTranslation("common");
  const isKn = i18n.language === "kn";
  const { orders, tables, menuItems, menuCategories, settings, addOrder, updateOrder, deleteOrder, updateTable } = useData();
  const { Preview, setPreview: openPrintPreview } = usePrintPreview();
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ tableId: null as string | null, tableNumber: null as number | null, customerName: "", customerPhone: "", items: [] as OrderFormItem[], notes: "" });
  const [addItemOpen, setAddItemOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [pendingItems, setPendingItems] = useState<OrderFormItem[]>([]);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [pinOpen, setPinOpen] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const sortedOrders = useMemo(() => [...orders].filter((o) => {
    const matchSearch = o.customerName.toLowerCase().includes(search.toLowerCase()) || String(o.orderNumber).includes(search);
    const matchStatus = filterStatus === "all" || o.status === filterStatus;
    return matchSearch && matchStatus;
  }).sort((a, b) => b.createdAt.localeCompare(a.createdAt)), [orders, search, filterStatus]);

  const openNewOrder = () => { setEditingId(null); setForm({ tableId: null, tableNumber: null, customerName: "", customerPhone: "", items: [], notes: "" }); setDialogOpen(true); };
  const openEditOrder = (order: typeof orders[0]) => { setEditingId(order.id); setForm({ tableId: order.tableId, tableNumber: order.tableNumber, customerName: order.customerName, customerPhone: order.customerPhone, items: order.items, notes: order.notes }); setDialogOpen(true); };

  const handleChangeQty = (menuItemId: string, delta: number) => {
    setPendingItems((prev) => {
      const existing = prev.find((i) => i.menuItemId === menuItemId);
      if (!existing) return prev;
      const qty = Math.max(0, existing.quantity + delta);
      if (qty === 0) return prev.filter((i) => i.menuItemId !== menuItemId);
      return prev.map((i) => i.menuItemId === menuItemId ? { ...i, quantity: qty } : i);
    });
  };

  const commitPendingItems = () => {
    if (pendingItems.length === 0) { toast.error(t("msg.add_item_error")); return; }
    setForm((prev) => {
      const items = [...prev.items];
      pendingItems.forEach((pi) => {
        const existing = items.find((i) => i.menuItemId === pi.menuItemId);
        if (existing) existing.quantity += pi.quantity;
        else items.push(pi);
      });
      return { ...prev, items };
    });
    setPendingItems([]); setSelectedCategory(null); setAddItemOpen(false);
  };

  const subtotal = form.items.reduce((s, i) => s + i.price * i.quantity, 0);
  const tax = Math.round(subtotal * 0.05);
  const discount = tax;
  const total = subtotal + tax - discount;

  const handleSave = () => {
    if (form.items.length === 0) { toast.error(t("msg.add_item_error")); return; }
    if (editingId) {
      const prev = orders.find((o) => o.id === editingId);
      updateOrder(editingId, { ...form, subtotal, tax, discount, total });
      if (form.tableId && form.tableId !== prev?.tableId) {
        updateTable(form.tableId, { status: "occupied" });
        if (prev?.tableId) updateTable(prev.tableId, { status: "available" });
      }
    } else {
      addOrder({ ...form, status: "pending", subtotal, tax, discount, total });
      if (form.tableId) updateTable(form.tableId, { status: "occupied" });
    }
    toast.success(t("msg.saved")); setDialogOpen(false);
  };

  const handlePrintOrder = (order: typeof orders[0]) => {
    openPrintPreview(`Invoice #${order.orderNumber}`, formatInvoiceHtml(order, settings));
  };

  const activeCategory = selectedCategory ? menuCategories.find((c) => c.id === selectedCategory) : null;
  const activeCategoryName = activeCategory ? (isKn ? (activeCategory.nameKn || activeCategory.name) : activeCategory.name) : null;

  const handleWhatsAppOrder = (order: typeof orders[0]) => {
    const invoiceText = "```\n" + formatInvoiceText(order, settings) + "\n```";
    const encoded = encodeURIComponent(invoiceText);
    const targetPhone = order.customerPhone || "";
    const url = targetPhone ? `https://api.whatsapp.com/send?phone=${targetPhone}&text=${encoded}` : `https://api.whatsapp.com/send?text=${encoded}`;
    window.open(url, "_blank");
  };

  const handleStatusChange = (id: string, status: "pending" | "in_progress" | "served" | "billed") => {
    updateOrder(id, { status });
    if (status === "billed") { const order = orders.find((o) => o.id === id); if (order?.tableId) updateTable(order.tableId, { status: "available" }); }
  };

  const requestDelete = (orderId: string) => {
    setPendingDeleteId(orderId);
    setPinOpen(true);
  };

  const verifyDeletePin = () => {
    if (pinInput === (settings.adminPin ?? "1234")) {
      setPinOpen(false);
      setPinInput("");
      if (pendingDeleteId) { setDeleteConfirmId(pendingDeleteId); setPendingDeleteId(null); }
    } else {
      toast.error(t("msg.invalid_pin"));
      setPinInput("");
    }
  };

  return (
    <div className="p-4 md:p-6 pb-20 md:pb-6 space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <h1 className="text-2xl font-bold">{t("nav.orders")}</h1>
        <Button size="sm" onClick={openNewOrder} className="cursor-pointer"><Plus className="w-4 h-4 mr-1" /> {t("btn.new_order")}</Button>
      </div>
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" /><Input placeholder={t("btn.search")} value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" /></div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-full sm:w-40"><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="all">{t("label.all_status")}</SelectItem><SelectItem value="pending">{t("label.pending")}</SelectItem><SelectItem value="in_progress">{t("label.in_progress")}</SelectItem><SelectItem value="served">{t("label.served")}</SelectItem><SelectItem value="billed">{t("label.billed")}</SelectItem></SelectContent>
        </Select>
      </div>
      <div className="space-y-3">
        {sortedOrders.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground"><ShoppingCart className="w-10 h-10 mx-auto mb-2 opacity-30" /><p>{t("msg.no_data")}</p></div>
        ) : sortedOrders.map((order) => (
          <Card key={order.id} className="shadow-sm"><CardContent className="pt-4 pb-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-sm">#{order.orderNumber}</span>
                  <span className={cn("text-xs px-2 py-0.5 rounded-full", statusColor[order.status])}>{t(`label.${order.status}`)}</span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">{order.customerName || "Walk-in"}{order.tableNumber ? ` • Table ${order.tableNumber}` : ""}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{order.items.length} items • ₹{order.total}</p>
                <div className="flex gap-1 mt-2 flex-wrap">
                  {order.status === "pending" && <Button size="sm" variant="secondary" className="cursor-pointer text-xs h-6" onClick={() => handleStatusChange(order.id, "in_progress")}>{t("btn.start")}</Button>}
                  {order.status === "in_progress" && <Button size="sm" variant="secondary" className="cursor-pointer text-xs h-6" onClick={() => handleStatusChange(order.id, "served")}>{t("btn.serve")}</Button>}
                  {order.status === "served" && <Button size="sm" variant="secondary" className="cursor-pointer text-xs h-6" onClick={() => handleStatusChange(order.id, "billed")}><Receipt className="w-3 h-3 mr-1" /> {t("btn.bill")}</Button>}
                   {order.status === "billed" && (
                    <>
                      <Button size="sm" variant="secondary" className="cursor-pointer text-xs h-6" onClick={() => handlePrintOrder(order)}><Printer className="w-3 h-3 mr-1" /> {t("btn.print")}</Button>
                      <Button size="sm" variant="secondary" className="cursor-pointer text-xs h-6" onClick={() => handleWhatsAppOrder(order)}><Share2 className="w-3 h-3 mr-1" /> {t("btn.whatsapp")}</Button>
                      <Button size="sm" variant="destructive" className="cursor-pointer text-xs h-6" onClick={() => requestDelete(order.id)}><Trash2 className="w-3 h-3 mr-1" /> {t("btn.delete")}</Button>
                    </>
                  )}
                </div>
              </div>
              <Button variant="ghost" size="icon" className="h-7 w-7 cursor-pointer" onClick={() => openEditOrder(order)}><Pencil className="w-3.5 h-3.5" /></Button>
            </div>
          </CardContent></Card>
        ))}
      </div>
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editingId ? t("btn.edit") : t("btn.new_order")}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><Label>{t("label.customer_name")}</Label><Input value={form.customerName} onChange={(e) => setForm({ ...form, customerName: e.target.value })} placeholder={t("label.walk_in")} /></div>
              <div className="space-y-1"><Label>{t("label.phone")}</Label><Input value={form.customerPhone} onChange={(e) => setForm({ ...form, customerPhone: e.target.value })} /></div>
            </div>
            <div className="space-y-1"><Label>{t("label.table")}</Label><Select value={form.tableId ?? "none"} onValueChange={(v) => { const tbl = tables.find((tbl) => tbl.id === v); setForm({ ...form, tableId: v === "none" ? null : v, tableNumber: tbl?.number ?? null }); }}><SelectTrigger><SelectValue placeholder={t("label.no_table")} /></SelectTrigger><SelectContent><SelectItem value="none">{t("label.no_table")}</SelectItem>{tables.map((tbl) => <SelectItem key={tbl.id} value={tbl.id}>{t("label.table")} {tbl.number} ({tbl.capacity}p)</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-1"><Label>{t("label.notes")}</Label><Textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
            <div className="border rounded-lg p-3">
              <div className="flex items-center justify-between mb-2"><Label>{t("label.items")}</Label><Button size="sm" variant="secondary" onClick={() => { setPendingItems([]); setAddItemOpen(true); }} className="cursor-pointer"><Plus className="w-3 h-3 mr-1" /> {t("btn.add")}</Button></div>
              {form.items.length === 0 ? <p className="text-xs text-muted-foreground text-center py-3">{t("msg.no_items")}</p> : (
                <div className="space-y-2">{form.items.map((item) => (
                  <div key={item.menuItemId} className="flex items-center justify-between text-sm">
                    <span>{item.name} x{item.quantity}</span>
                    <div className="flex items-center gap-2"><span className="font-medium">₹{item.price * item.quantity}</span><button onClick={() => setForm({ ...form, items: form.items.filter((i) => i.menuItemId !== item.menuItemId) })} className="text-destructive cursor-pointer"><X className="w-3.5 h-3.5" /></button></div>
                  </div>
                ))}</div>
              )}
              <div className="border-t mt-2 pt-2 space-y-1 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">{t("label.subtotal")}</span><span>₹{subtotal}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">{t("label.tax")}</span><span>₹{tax}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">{t("label.discount")}</span><span>-₹{discount}</span></div>
                <div className="flex justify-between font-bold"><span>{t("label.grand_total")}</span><span>₹{total}</span></div>
              </div>
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <Button variant="secondary" onClick={() => setDialogOpen(false)} className="cursor-pointer">{t("btn.cancel")}</Button>
              <Button onClick={handleSave} className="cursor-pointer">{t("btn.save")}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      <Dialog open={addItemOpen} onOpenChange={(o) => { if (!o) { setSelectedCategory(null); setPendingItems([]); setAddItemOpen(false); } }}>
        <DialogContent className="max-w-sm max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between gap-2">
              <span>{activeCategoryName || t("btn.add_item")}</span>
              {pendingItems.length > 0 && <span className="text-xs font-normal text-muted-foreground">{pendingItems.reduce((s, i) => s + i.quantity, 0)} {t("label.items")}</span>}
            </DialogTitle>
          </DialogHeader>
          {selectedCategory === null ? (
            <div className="grid grid-cols-2 gap-2">
              {menuCategories.sort((a, b) => a.sortOrder - b.sortOrder).map((cat) => {
                const count = menuItems.filter((m) => m.available && m.categoryId === cat.id).length;
                if (count === 0) return null;
                return (
                  <button key={cat.id} onClick={() => setSelectedCategory(cat.id)}
                    className="flex flex-col items-center justify-center p-4 rounded-lg border border-gray-200 hover:border-sky-400 hover:bg-sky-50 dark:hover:bg-sky-900/20 transition-colors cursor-pointer">
                    <span className="font-medium text-sm text-center">{isKn ? (cat.nameKn || cat.name) : cat.name}</span>
                    <span className="text-xs text-gray-400 mt-1">{count} {t("label.items")}</span>
                  </button>
                );
              })}
              {pendingItems.length > 0 && (
                <Button onClick={commitPendingItems} className="col-span-2 cursor-pointer mt-2"><Plus className="w-4 h-4 mr-1" /> {t("btn.add")} ({pendingItems.reduce((s, i) => s + i.quantity, 0)})</Button>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {menuItems.filter((m) => m.available && m.categoryId === selectedCategory).map((m) => {
                const qty = pendingItems.find((i) => i.menuItemId === m.id)?.quantity ?? 0;
                return (
                  <div key={m.id} className="flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:border-gray-300">
                    <div>
                      <div className="font-medium text-sm">{isKn ? (m.nameKn || m.name) : m.name}</div>
                      <div className="text-xs text-gray-500">₹{m.price}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      {qty > 0 && (
                        <button type="button" onClick={() => handleChangeQty(m.id, -1)} className="w-7 h-7 rounded-full border border-gray-300 flex items-center justify-center text-sm cursor-pointer">−</button>
                      )}
                      <span className={`w-6 text-center text-sm font-medium ${qty > 0 ? "" : "text-gray-400"}`}>{qty}</span>
                      <button type="button" onClick={() => {
                        setPendingItems((prev) => prev.some((i) => i.menuItemId === m.id) ? prev : [...prev, { menuItemId: m.id, name: m.name, price: m.price, quantity: 0 }]);
                        handleChangeQty(m.id, 1);
                      }} className="w-7 h-7 rounded-full border border-gray-300 flex items-center justify-center text-sm cursor-pointer">+</button>
                    </div>
                  </div>
                );
              })}
              <div className="flex gap-2 justify-between pt-2">
                <Button variant="secondary" onClick={() => setSelectedCategory(null)} className="cursor-pointer">{t("btn.back")}</Button>
                <Button onClick={commitPendingItems} className="cursor-pointer">{t("btn.add")}{pendingItems.length > 0 ? ` (${pendingItems.reduce((s, i) => s + i.quantity, 0)})` : ""}</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      <ConfirmDialog
        open={!!deleteConfirmId}
        onOpenChange={(o) => { if (!o) setDeleteConfirmId(null); }}
        onConfirm={() => { if (deleteConfirmId) deleteOrder(deleteConfirmId); setDeleteConfirmId(null); }}
        title={t("msg.delete_billed_order")}
      />
      <Dialog open={pinOpen} onOpenChange={(o) => { if (!o) { setPinOpen(false); setPendingDeleteId(null); setPinInput(""); } }}>
        <DialogContent className="max-w-xs">
          <DialogHeader><DialogTitle>{t("msg.admin_access_required")}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">{t("msg.enter_pin")}</p>
            <Input type="password" value={pinInput} onChange={(e) => setPinInput(e.target.value)} placeholder={t("label.pin")} maxLength={6} onKeyDown={(e) => { if (e.key === "Enter") verifyDeletePin(); }} className="text-center text-lg" autoFocus />
            <div className="flex gap-2 justify-end">
              <Button variant="secondary" onClick={() => { setPinOpen(false); setPendingDeleteId(null); setPinInput(""); }} className="cursor-pointer">{t("btn.cancel")}</Button>
              <Button onClick={verifyDeletePin} className="cursor-pointer">{t("btn.confirm")}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      {Preview}
    </div>
  );
}
