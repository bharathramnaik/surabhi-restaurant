import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useData, type MenuItem } from "@/lib/data-context.tsx";
import { cn } from "@/lib/utils.ts";
import { Pencil, Plus, Search, Trash2, Leaf } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

type ItemForm = { name: string; nameKn: string; description: string; descriptionKn: string; price: number; categoryId: string; subCategory: string; available: boolean; isVeg: boolean };
const emptyForm = (): ItemForm => ({ name: "", nameKn: "", description: "", descriptionKn: "", price: 0, categoryId: "", subCategory: "", available: true, isVeg: true });

export default function MenuPage() {
  const { t, i18n } = useTranslation("common");
  const isKn = i18n.language === "kn";
  const { menuCategories: categories, menuItems: items, addMenuItem, updateMenuItem, deleteMenuItem, addCategory, deleteCategory } = useData();
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ItemForm>(emptyForm());
  const [catDialogOpen, setCatDialogOpen] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [newCatNameKn, setNewCatNameKn] = useState("");

  const filtered = items.filter((item) => {
    const matchSearch = item.name.toLowerCase().includes(search.toLowerCase()) || item.nameKn.includes(search);
    const matchCat = selectedCategory === "all" || item.categoryId === selectedCategory;
    return matchSearch && matchCat;
  });

  const openAdd = () => { setForm(emptyForm()); setEditingId(null); setDialogOpen(true); };
  const openEdit = (item: MenuItem) => {
    setForm({ name: item.name, nameKn: item.nameKn, description: item.description, descriptionKn: item.descriptionKn, price: item.price, categoryId: item.categoryId, subCategory: item.subCategory ?? "", available: item.available, isVeg: item.isVeg });
    setEditingId(item.id); setDialogOpen(true);
  };

  const handleSave = () => {
    if (!form.name || !form.categoryId || form.price <= 0) { toast.error(t("msg.fill_name_category_price")); return; }
    const data = form.subCategory ? form : { ...form, subCategory: undefined };
    if (editingId) updateMenuItem(editingId, data);
    else addMenuItem(data);
    toast.success(t("msg.saved")); setDialogOpen(false);
  };

  const handleDelete = (id: string) => {
    if (!confirm(t("msg.confirm_delete"))) return;
    deleteMenuItem(id); toast.success(t("msg.deleted"));
  };

  const handleAddCat = () => {
    if (!newCatName) return;
    addCategory({ name: newCatName, nameKn: newCatNameKn || newCatName, sortOrder: categories.length + 1 });
    setNewCatName(""); setNewCatNameKn(""); toast.success(t("msg.saved")); setCatDialogOpen(false);
  };

  const subCategories = [...new Set(filtered.map((i) => i.subCategory).filter(Boolean))].sort();

  return (
    <div className="p-4 md:p-6 pb-20 md:pb-6 space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <h1 className="text-2xl font-bold">{t("nav.menu")}</h1>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={() => setCatDialogOpen(true)} className="cursor-pointer"><Plus className="w-4 h-4 mr-1" /> {t("label.category")}</Button>
          <Button size="sm" onClick={openAdd} className="cursor-pointer"><Plus className="w-4 h-4 mr-1" /> {t("btn.add")}</Button>
        </div>
      </div>
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder={t("btn.search")} value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-full sm:w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("label.all_categories")}</SelectItem>
            {categories.map((c) => <SelectItem key={c.id} value={c.id}>{isKn ? c.nameKn : c.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      {categories.filter((cat) => selectedCategory === "all" || cat.id === selectedCategory).map((cat) => {
        const catItems = filtered.filter((i) => i.categoryId === cat.id);
        if (catItems.length === 0 && selectedCategory === "all") return null;
        const catSubs = [...new Set(catItems.map((i) => i.subCategory).filter(Boolean))].sort();
        const itemsNoSub = catItems.filter((i) => !i.subCategory);
        return (
          <div key={cat.id}>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">{isKn ? cat.nameKn : cat.name} ({catItems.length})</h2>
              <Button variant="ghost" size="sm" className="text-destructive h-6 text-xs cursor-pointer" onClick={() => { if (confirm(t("msg.confirm_delete"))) deleteCategory(cat.id); }}><Trash2 className="w-3 h-3" /></Button>
            </div>
            {catSubs.length > 0 && catSubs.map((sub) => (
              <div key={sub} className="mb-4">
                <h3 className="text-xs font-medium text-muted-foreground mb-2 ml-1">{sub}</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {catItems.filter((i) => i.subCategory === sub).map((item) => (
                    <Card key={item.id} className={cn("shadow-sm", !item.available && "opacity-60")}>
                      <CardContent className="pt-4 pb-4">
                        <div className="flex justify-between items-start">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className={cn("w-3 h-3 rounded-full border-2 flex-shrink-0", item.isVeg ? "border-green-600 bg-green-100" : "border-red-600 bg-red-100")} />
                              <p className="font-semibold text-sm truncate">{isKn ? item.nameKn : item.name}</p>
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{isKn ? item.descriptionKn : item.description}</p>
                            <p className="text-primary font-bold mt-2">₹{item.price}</p>
                            {!item.available && <span className="text-xs text-destructive">{t("label.unavailable")}</span>}
                          </div>
                          <div className="flex gap-1 ml-2">
                            <Button variant="ghost" size="icon" className="h-7 w-7 cursor-pointer" onClick={() => openEdit(item)}><Pencil className="w-3.5 h-3.5" /></Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive cursor-pointer" onClick={() => handleDelete(item.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
            {itemsNoSub.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
                {itemsNoSub.map((item) => (
                  <Card key={item.id} className={cn("shadow-sm", !item.available && "opacity-60")}>
                    <CardContent className="pt-4 pb-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className={cn("w-3 h-3 rounded-full border-2 flex-shrink-0", item.isVeg ? "border-green-600 bg-green-100" : "border-red-600 bg-red-100")} />
                            <p className="font-semibold text-sm truncate">{isKn ? item.nameKn : item.name}</p>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{isKn ? item.descriptionKn : item.description}</p>
                          <p className="text-primary font-bold mt-2">₹{item.price}</p>
                          {!item.available && <span className="text-xs text-destructive">{t("label.unavailable")}</span>}
                        </div>
                        <div className="flex gap-1 ml-2">
                          <Button variant="ghost" size="icon" className="h-7 w-7 cursor-pointer" onClick={() => openEdit(item)}><Pencil className="w-3.5 h-3.5" /></Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive cursor-pointer" onClick={() => handleDelete(item.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        );
      })}
      {filtered.length === 0 && <div className="text-center py-12 text-muted-foreground"><Leaf className="w-10 h-10 mx-auto mb-2 opacity-30" /><p>{t("msg.no_data")}</p></div>}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editingId ? t("btn.edit") : t("btn.add")} {t("label.menu_item")}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><Label>{t("label.name")} (EN)</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Chicken Curry" /></div>
              <div className="space-y-1"><Label>{t("label.name")} (ಕನ್ನಡ)</Label><Input value={form.nameKn} onChange={(e) => setForm({ ...form, nameKn: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><Label>{t("label.description")} (EN)</Label><Textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
              <div className="space-y-1"><Label>{t("label.description")} (KN)</Label><Textarea rows={2} value={form.descriptionKn} onChange={(e) => setForm({ ...form, descriptionKn: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><Label>{t("label.price")} *</Label><Input type="number" min={0} value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} /></div>
              <div className="space-y-1"><Label>{t("label.category")} *</Label><Select value={form.categoryId} onValueChange={(v) => setForm({ ...form, categoryId: v })}><SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger><SelectContent>{categories.map((c) => <SelectItem key={c.id} value={c.id}>{isKn ? c.nameKn : c.name}</SelectItem>)}</SelectContent></Select></div>
            </div>
            <div className="space-y-1"><Label>{t("label.subcategory")}</Label><Input value={form.subCategory} onChange={(e) => setForm({ ...form, subCategory: e.target.value })} placeholder="e.g. Chicken items" /></div>
            <div className="flex gap-6">
              <div className="flex items-center gap-2"><Switch checked={form.isVeg} onCheckedChange={(v) => setForm({ ...form, isVeg: v })} id="isVeg" /><Label htmlFor="isVeg">{t("label.vegetarian")}</Label></div>
              <div className="flex items-center gap-2"><Switch checked={form.available} onCheckedChange={(v) => setForm({ ...form, available: v })} id="avail" /><Label htmlFor="avail">{t("label.available")}</Label></div>
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <Button variant="secondary" onClick={() => setDialogOpen(false)} className="cursor-pointer">{t("btn.cancel")}</Button>
              <Button onClick={handleSave} className="cursor-pointer">{t("btn.save")}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      <Dialog open={catDialogOpen} onOpenChange={setCatDialogOpen}>
        <DialogContent className="max-w-sm"><DialogHeader><DialogTitle>{t("btn.add")} {t("label.category")}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1"><Label>{t("label.name")} (EN)</Label><Input value={newCatName} onChange={(e) => setNewCatName(e.target.value)} placeholder="e.g. Starters" /></div>
            <div className="space-y-1"><Label>{t("label.name")} (ಕನ್ನಡ)</Label><Input value={newCatNameKn} onChange={(e) => setNewCatNameKn(e.target.value)} /></div>
            <div className="flex gap-2 justify-end">
              <Button variant="secondary" onClick={() => setCatDialogOpen(false)} className="cursor-pointer">{t("btn.cancel")}</Button>
              <Button onClick={handleAddCat} className="cursor-pointer">{t("btn.save")}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
