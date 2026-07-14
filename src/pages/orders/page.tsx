import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import ConfirmDialog from "@/components/ui/confirm-dialog.tsx";
import { useData } from "@/lib/data-context.tsx";
import { cn } from "@/lib/utils.ts";
import { Plus, Pencil, Trash2, Search, ShoppingCart, Receipt, X, Printer, Share2 } from "lucide-react";
import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

type OrderFormItem = { menuItemId: string; name: string; price: number; quantity: number };

const statusColor: Record<string, string> = { pending: "bg-yellow-100 text-yellow-800", in_progress: "bg-blue-100 text-blue-800", served: "bg-green-100 text-green-800", billed: "bg-gray-100 text-gray-700" };

function formatInvoice(order: { orderNumber: number; customerName: string; customerPhone: string; tableNumber: number | null; items: { name: string; price: number; quantity: number }[]; subtotal: number; tax: number; total: number; createdAt: string; status: string }, settings: Record<string, string>) {
  const itemsText = order.items.map((i) => `${i.name} x${i.quantity} = ₹${i.price * i.quantity}`).join("\n");
  const date = new Date(order.createdAt).toLocaleString("en-IN");
  return [
    "═══════════════════════════════",
    "    SURABHI HOTEL & RESTAURANT",
    "    & Family Restaurant",
    settings.restaurantAddress || "Main Road, Bangalore",
    `Phone: ${settings.restaurantPhone || "9876543210"}`,
    `GSTIN: ${settings.gstin || "29AABCS1429B1ZB"}`,
    "═══════════════════════════════",
    `Invoice #${order.orderNumber}`,
    `Date: ${date}`,
    `Customer: ${order.customerName || "Walk-in"}`,
    order.customerPhone ? `Phone: ${order.customerPhone}` : "",
    order.tableNumber ? `Table: ${order.tableNumber}` : "",
    "───────────────────────────────",
    itemsText,
    "───────────────────────────────",
    `Subtotal: ₹${order.subtotal}`,
    `Tax (5%): ₹${order.tax}`,
    `Total: ₹${order.total}`,
    "═══════════════════════════════",
    "       Thank you! Visit Again!",
    "═══════════════════════════════",
  ].filter(Boolean).join("\n");
}

export default function OrdersPage() {
  const { t } = useTranslation("common");
  const { orders, tables, menuItems, menuCategories, settings, addOrder, updateOrder, deleteOrder, updateTable } = useData();
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ tableId: null as string | null, tableNumber: null as number | null, customerName: "", customerPhone: "", items: [] as OrderFormItem[], notes: "" });
  const [addItemOpen, setAddItemOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedMenuItem, setSelectedMenuItem] = useState("");
  const [selectedQty, setSelectedQty] = useState(1);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const sortedOrders = useMemo(() => [...orders].filter((o) => {
    const matchSearch = o.customerName.toLowerCase().includes(search.toLowerCase()) || String(o.orderNumber).includes(search);
    const matchStatus = filterStatus === "all" || o.status === filterStatus;
    return matchSearch && matchStatus;
  }).sort((a, b) => b.createdAt.localeCompare(a.createdAt)), [orders, search, filterStatus]);

  const openNewOrder = () => { setEditingId(null); setForm({ tableId: null, tableNumber: null, customerName: "", customerPhone: "", items: [], notes: "" }); setDialogOpen(true); };
  const openEditOrder = (order: typeof orders[0]) => { setEditingId(order.id); setForm({ tableId: order.tableId, tableNumber: order.tableNumber, customerName: order.customerName, customerPhone: order.customerPhone, items: order.items, notes: order.notes }); setDialogOpen(true); };

  const handleAddItem = () => {
    const mi = menuItems.find((m) => m.id === selectedMenuItem);
    if (!mi) return;
    const existing = form.items.find((i) => i.menuItemId === selectedMenuItem);
    if (existing) setForm({ ...form, items: form.items.map((i) => i.menuItemId === selectedMenuItem ? { ...i, quantity: i.quantity + selectedQty } : i) });
    else setForm({ ...form, items: [...form.items, { menuItemId: mi.id, name: mi.name, price: mi.price, quantity: selectedQty }] });
    setSelectedMenuItem(""); setSelectedQty(1); setSelectedCategory(null); setAddItemOpen(false);
  };

  const subtotal = form.items.reduce((s, i) => s + i.price * i.quantity, 0);
  const tax = Math.round(subtotal * 0.05);
  const total = subtotal + tax;

  const handleSave = () => {
    if (form.items.length === 0) { toast.error(t("msg.add_item_error")); return; }
    if (editingId) {
      const prev = orders.find((o) => o.id === editingId);
      updateOrder(editingId, { ...form, subtotal, tax, total });
      if (form.tableId && form.tableId !== prev?.tableId) {
        updateTable(form.tableId, { status: "occupied" });
        if (prev?.tableId) updateTable(prev.tableId, { status: "available" });
      }
    } else {
      addOrder({ ...form, status: "pending", subtotal, tax, total });
      if (form.tableId) updateTable(form.tableId, { status: "occupied" });
    }
    toast.success(t("msg.saved")); setDialogOpen(false);
  };

  const handlePrintOrder = (order: typeof orders[0]) => {
    const invoiceText = formatInvoice(order, settings);
    const win = window.open("", "_blank");
    if (!win) { toast.error(t("msg.popup_blocked")); return; }
    win.document.write(`<html><head><title>Invoice #${order.orderNumber}</title><style>
      body { font-family: 'Courier New', monospace; white-space: pre; padding: 20px; font-size: 14px; }
      @media print { @page { margin: 0; } body { padding: 10px; } }
    </style></head><body>${invoiceText}</body></html>`);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); win.close(); }, 300);
  };

  const handleWhatsAppOrder = (order: typeof orders[0]) => {
    const invoiceText = formatInvoice(order, settings);
    const encoded = encodeURIComponent(invoiceText);
    const targetPhone = order.customerPhone || "";
    const url = targetPhone ? `https://api.whatsapp.com/send?phone=${targetPhone}&text=${encoded}` : `https://api.whatsapp.com/send?text=${encoded}`;
    window.open(url, "_blank");
  };

  const handleStatusChange = (id: string, status: "pending" | "in_progress" | "served" | "billed") => {
    updateOrder(id, { status });
    if (status === "billed") { const order = orders.find((o) => o.id === id); if (order?.tableId) updateTable(order.tableId, { status: "available" }); }
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
                      <Button size="sm" variant="destructive" className="cursor-pointer text-xs h-6" onClick={() => setDeleteConfirmId(order.id)}><Trash2 className="w-3 h-3 mr-1" /> {t("btn.delete")}</Button>
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
              <div className="flex items-center justify-between mb-2"><Label>{t("label.items")}</Label><Button size="sm" variant="secondary" onClick={() => setAddItemOpen(true)} className="cursor-pointer"><Plus className="w-3 h-3 mr-1" /> {t("btn.add")}</Button></div>
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
      <Dialog open={addItemOpen} onOpenChange={(o) => { if (!o) { setSelectedCategory(null); setAddItemOpen(false); } }}>
        <DialogContent className="max-w-sm max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{selectedCategory ? menuCategories.find((c) => c.id === selectedCategory)?.name || t("btn.add_item") : t("btn.add_item")}</DialogTitle></DialogHeader>
          {selectedCategory === null ? (
            <div className="grid grid-cols-2 gap-2">
              {menuCategories.sort((a, b) => a.sortOrder - b.sortOrder).map((cat) => {
                const count = menuItems.filter((m) => m.available && m.categoryId === cat.id).length;
                if (count === 0) return null;
                return (
                  <button key={cat.id} onClick={() => setSelectedCategory(cat.id)}
                    className="flex flex-col items-center justify-center p-4 rounded-lg border border-gray-200 hover:border-sky-400 hover:bg-sky-50 dark:hover:bg-sky-900/20 transition-colors cursor-pointer">
                    <span className="font-medium text-sm text-center">{cat.name}</span>
                    <span className="text-xs text-gray-400 mt-1">{count} items</span>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="space-y-2">
              {menuItems.filter((m) => m.available && m.categoryId === selectedCategory).map((m) => (
                <div key={m.id} onClick={() => { setSelectedMenuItem(m.id); setSelectedQty(1); }}
                  className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${selectedMenuItem === m.id ? "border-sky-500 bg-sky-50 dark:bg-sky-900/20" : "border-gray-200 hover:border-gray-300"}`}>
                  <div>
                    <div className="font-medium text-sm">{m.name}</div>
                    <div className="text-xs text-gray-500">₹{m.price}</div>
                  </div>
                  {selectedMenuItem === m.id && (
                    <div className="flex items-center gap-2">
                      <button type="button" onClick={(e) => { e.stopPropagation(); setSelectedQty(Math.max(1, selectedQty - 1)); }}
                        className="w-7 h-7 rounded-full border border-gray-300 flex items-center justify-center text-sm cursor-pointer">−</button>
                      <span className="w-6 text-center text-sm font-medium">{selectedQty}</span>
                      <button type="button" onClick={(e) => { e.stopPropagation(); setSelectedQty(selectedQty + 1); }}
                        className="w-7 h-7 rounded-full border border-gray-300 flex items-center justify-center text-sm cursor-pointer">+</button>
                    </div>
                  )}
                </div>
              ))}
              <div className="flex gap-2 justify-between pt-2">
                <Button variant="secondary" onClick={() => { setSelectedCategory(null); setSelectedMenuItem(""); }} className="cursor-pointer">{t("btn.back")}</Button>
                <Button onClick={handleAddItem} disabled={!selectedMenuItem} className="cursor-pointer">{t("btn.add")}</Button>
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
    </div>
  );
}
