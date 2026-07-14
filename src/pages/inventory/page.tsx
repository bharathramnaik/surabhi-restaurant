import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useData } from "@/lib/data-context.tsx";
import { cn } from "@/lib/utils.ts";
import { Plus, Pencil, Trash2, Search, Package, AlertTriangle } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

const CATEGORIES = ["Vegetables", "Meat", "Grains", "Dairy", "Oils & Condiments", "Spices", "Beverages", "Other"];

export default function InventoryPage() {
  const { t } = useTranslation("common");
  const { inventory, addInventoryItem, updateInventoryItem, deleteInventoryItem } = useData();
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", category: "Vegetables", quantity: 0, unit: "kg", minStock: 0, notes: "" });

  const filtered = inventory.filter((item) => {
    const matchSearch = item.name.toLowerCase().includes(search.toLowerCase());
    const matchCat = filterCategory === "all" || item.category === filterCategory;
    return matchSearch && matchCat;
  });
  const lowStockItems = inventory.filter((i) => i.quantity <= i.minStock);

  const openAdd = () => { setEditingId(null); setForm({ name: "", category: "Vegetables", quantity: 0, unit: "kg", minStock: 0, notes: "" }); setDialogOpen(true); };
  const openEdit = (item: typeof inventory[0]) => { setEditingId(item.id); setForm({ name: item.name, category: item.category, quantity: item.quantity, unit: item.unit, minStock: item.minStock, notes: item.notes }); setDialogOpen(true); };

  const handleSave = () => {
    if (!form.name) { toast.error("Name is required"); return; }
    const data = { ...form, lastUpdated: new Date().toISOString() };
    if (editingId) updateInventoryItem(editingId, data);
    else addInventoryItem(data);
    toast.success(t("msg.saved")); setDialogOpen(false);
  };

  return (
    <div className="p-4 md:p-6 pb-20 md:pb-6 space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <h1 className="text-2xl font-bold">{t("nav.inventory")}</h1>
        <Button size="sm" onClick={openAdd} className="cursor-pointer"><Plus className="w-4 h-4 mr-1" /> {t("btn.add")}</Button>
      </div>
      {lowStockItems.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
          <div className="flex-1 min-w-0"><p className="text-sm font-medium text-amber-800">Low Stock Alert</p><p className="text-xs text-amber-600 truncate">{lowStockItems.map((i) => `${i.name} (${i.quantity} ${i.unit})`).join(", ")}</p></div>
        </div>
      )}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" /><Input placeholder="Search inventory..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" /></div>
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-full sm:w-44"><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="all">All Categories</SelectItem>{CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground"><Package className="w-10 h-10 mx-auto mb-2 opacity-30" /><p>{t("msg.no_data")}</p></div>
        ) : filtered.map((item) => (
          <Card key={item.id} className={cn("shadow-sm", item.quantity <= item.minStock && "border-amber-300 bg-amber-50/50")}>
            <CardContent className="pt-3 pb-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2"><p className="font-semibold text-sm">{item.name}</p>{item.quantity <= item.minStock && <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />}</div>
                  <p className="text-xs text-muted-foreground mt-0.5">{item.category}</p>
                </div>
                <div className="text-right"><p className={cn("text-sm font-bold", item.quantity <= item.minStock ? "text-amber-600" : "")}>{item.quantity} {item.unit}</p><p className="text-[10px] text-muted-foreground">Min: {item.minStock} {item.unit}</p></div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="h-7 w-7 cursor-pointer" onClick={() => openEdit(item)}><Pencil className="w-3.5 h-3.5" /></Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive cursor-pointer" onClick={() => deleteInventoryItem(item.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>{editingId ? "Edit Item" : "Add Item"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1"><Label>Name *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Tomatoes" /></div>
            <div className="space-y-1"><Label>Category</Label><Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><Label>Quantity</Label><Input type="number" min={0} value={form.quantity} onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })} /></div>
              <div className="space-y-1"><Label>Unit</Label><Select value={form.unit} onValueChange={(v) => setForm({ ...form, unit: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="kg">kg</SelectItem><SelectItem value="L">L</SelectItem><SelectItem value="pcs">pcs</SelectItem><SelectItem value="g">g</SelectItem></SelectContent></Select></div>
            </div>
            <div className="space-y-1"><Label>Min Stock Alert</Label><Input type="number" min={0} value={form.minStock} onChange={(e) => setForm({ ...form, minStock: Number(e.target.value) })} /></div>
            <div className="space-y-1"><Label>Notes</Label><Textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
            <div className="flex gap-2 justify-end pt-2">
              <Button variant="secondary" onClick={() => setDialogOpen(false)} className="cursor-pointer">{t("btn.cancel")}</Button>
              <Button onClick={handleSave} className="cursor-pointer">{t("btn.save")}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
