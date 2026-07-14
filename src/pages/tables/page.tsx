import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useData } from "@/lib/data-context.tsx";
import { cn } from "@/lib/utils.ts";
import { Plus, Pencil, Trash2, UtensilsCrossed, CalendarPlus } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

export default function TablesPage() {
  const { t } = useTranslation("common");
  const { tables, bookings, addTable, updateTable, deleteTable, addBooking, updateBooking } = useData();
  const [tableDialogOpen, setTableDialogOpen] = useState(false);
  const [bookingDialogOpen, setBookingDialogOpen] = useState(false);
  const [editingTableId, setEditingTableId] = useState<string | null>(null);
  const [tableForm, setTableForm] = useState<{ number: number; capacity: number; status: "available" | "occupied" | "reserved"; floor: string }>({ number: 1, capacity: 4, status: "available", floor: "Ground Floor" });
  const [bookingForm, setBookingForm] = useState<{ tableId: string; guestName: string; phone: string; date: string; time: string; partySize: number; notes: string; status: "confirmed" | "cancelled" | "completed" }>({ tableId: "", guestName: "", phone: "", date: new Date().toISOString().slice(0, 10), time: "19:00", partySize: 2, notes: "", status: "confirmed" });
  const [filterStatus, setFilterStatus] = useState("all");

  const today = new Date().toISOString().slice(0, 10);
  const activeBookings = bookings.filter((b) => b.status === "confirmed" && b.date >= today);
  const filteredTables = tables.filter((t) => filterStatus === "all" || t.status === filterStatus);

  const openAddTable = () => { setEditingTableId(null); setTableForm({ number: tables.length + 1, capacity: 4, status: "available", floor: "Ground Floor" }); setTableDialogOpen(true); };
  const openEditTable = (table: typeof tables[0]) => { setEditingTableId(table.id); setTableForm({ number: table.number, capacity: table.capacity, status: table.status, floor: table.floor }); setTableDialogOpen(true); };

  const handleSaveTable = () => {
    if (editingTableId) updateTable(editingTableId, tableForm);
    else addTable(tableForm);
    toast.success(t("msg.saved")); setTableDialogOpen(false);
  };

  const openAddBooking = (tableId?: string) => {
    setBookingForm({ tableId: tableId ?? tables[0]?.id ?? "", guestName: "", phone: "", date: today, time: "19:00", partySize: 2, notes: "", status: "confirmed" });
    setBookingDialogOpen(true);
  };

  const handleSaveBooking = () => {
    if (!bookingForm.guestName || !bookingForm.tableId) { toast.error("Fill guest name and select table"); return; }
    addBooking(bookingForm);
    const table = tables.find((t) => t.id === bookingForm.tableId);
    if (table) updateTable(bookingForm.tableId, { status: "reserved" });
    toast.success(t("msg.saved")); setBookingDialogOpen(false);
  };

  return (
    <div className="p-4 md:p-6 pb-20 md:pb-6 space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <h1 className="text-2xl font-bold">{t("nav.tables")}</h1>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={() => openAddBooking()} className="cursor-pointer"><CalendarPlus className="w-4 h-4 mr-1" /> Booking</Button>
          <Button size="sm" onClick={openAddTable} className="cursor-pointer"><Plus className="w-4 h-4 mr-1" /> {t("btn.add")}</Button>
        </div>
      </div>
      <div className="flex gap-2 flex-wrap">
        {["all", "available", "occupied", "reserved"].map((s) => (
          <Button key={s} variant={filterStatus === s ? "default" : "secondary"} size="sm" onClick={() => setFilterStatus(s)} className="cursor-pointer text-xs">
            {s === "all" ? "All" : t(`label.${s}`)}
          </Button>
        ))}
      </div>
      <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3">
        {filteredTables.map((table) => (
          <div key={table.id} onClick={() => openEditTable(table)}
            className={cn("aspect-square rounded-xl flex flex-col items-center justify-center text-xs font-bold cursor-pointer border-2 transition-all hover:scale-105",
              table.status === "available" && "bg-green-50 border-green-200 text-green-700",
              table.status === "occupied" && "bg-red-50 border-red-200 text-red-700",
              table.status === "reserved" && "bg-yellow-50 border-yellow-200 text-yellow-700",
            )}>
            <span className="text-xl">{table.number}</span>
            <span className="text-[9px] opacity-70">{table.capacity}p</span>
            <span className="text-[8px] opacity-50 mt-0.5">{table.floor}</span>
          </div>
        ))}
      </div>
      {activeBookings.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">Upcoming Bookings</h2>
          <div className="space-y-2">
            {activeBookings.map((b) => (
              <Card key={b.id} className="shadow-sm"><CardContent className="pt-3 pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{b.guestName} — Table {tables.find((t) => t.id === b.tableId)?.number ?? "?"}</p>
                    <p className="text-xs text-muted-foreground">{b.date} at {b.time} • {b.partySize} guests</p>
                  </div>
                  <Button variant="ghost" size="icon" className="h-7 w-7 cursor-pointer" onClick={() => { setBookingForm({ tableId: b.tableId, guestName: b.guestName, phone: b.phone, date: b.date, time: b.time, partySize: b.partySize, notes: b.notes, status: b.status }); setBookingDialogOpen(true); }}><Pencil className="w-3.5 h-3.5" /></Button>
                </div>
              </CardContent></Card>
            ))}
          </div>
        </div>
      )}
      <Dialog open={tableDialogOpen} onOpenChange={setTableDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>{editingTableId ? "Edit Table" : "Add Table"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><Label>Table Number</Label><Input type="number" min={1} value={tableForm.number} onChange={(e) => setTableForm({ ...tableForm, number: Number(e.target.value) })} /></div>
              <div className="space-y-1"><Label>Capacity</Label><Input type="number" min={1} value={tableForm.capacity} onChange={(e) => setTableForm({ ...tableForm, capacity: Number(e.target.value) })} /></div>
            </div>
            <div className="space-y-1"><Label>Floor</Label><Select value={tableForm.floor} onValueChange={(v) => setTableForm({ ...tableForm, floor: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Ground Floor">Ground Floor</SelectItem><SelectItem value="First Floor">First Floor</SelectItem></SelectContent></Select></div>
            <div className="space-y-1"><Label>Status</Label><Select value={tableForm.status} onValueChange={(v: "available" | "occupied" | "reserved") => setTableForm({ ...tableForm, status: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="available">Available</SelectItem><SelectItem value="occupied">Occupied</SelectItem><SelectItem value="reserved">Reserved</SelectItem></SelectContent></Select></div>
            <div className="flex gap-2 justify-end pt-2">
              {editingTableId && <Button variant="destructive" size="sm" onClick={() => { deleteTable(editingTableId); setTableDialogOpen(false); }} className="cursor-pointer"><Trash2 className="w-4 h-4" /></Button>}
              <Button variant="secondary" onClick={() => setTableDialogOpen(false)} className="cursor-pointer">{t("btn.cancel")}</Button>
              <Button onClick={handleSaveTable} className="cursor-pointer">{t("btn.save")}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      <Dialog open={bookingDialogOpen} onOpenChange={setBookingDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>New Booking</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1"><Label>Table</Label><Select value={bookingForm.tableId} onValueChange={(v) => setBookingForm({ ...bookingForm, tableId: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{tables.map((t) => <SelectItem key={t.id} value={t.id}>Table {t.number} ({t.capacity}p)</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-1"><Label>Guest Name *</Label><Input value={bookingForm.guestName} onChange={(e) => setBookingForm({ ...bookingForm, guestName: e.target.value })} /></div>
            <div className="space-y-1"><Label>Phone</Label><Input value={bookingForm.phone} onChange={(e) => setBookingForm({ ...bookingForm, phone: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><Label>Date</Label><Input type="date" value={bookingForm.date} onChange={(e) => setBookingForm({ ...bookingForm, date: e.target.value })} /></div>
              <div className="space-y-1"><Label>Time</Label><Input type="time" value={bookingForm.time} onChange={(e) => setBookingForm({ ...bookingForm, time: e.target.value })} /></div>
            </div>
            <div className="space-y-1"><Label>Party Size</Label><Input type="number" min={1} value={bookingForm.partySize} onChange={(e) => setBookingForm({ ...bookingForm, partySize: Number(e.target.value) })} /></div>
            <div className="flex gap-2 justify-end pt-2">
              <Button variant="secondary" onClick={() => setBookingDialogOpen(false)} className="cursor-pointer">{t("btn.cancel")}</Button>
              <Button onClick={handleSaveBooking} className="cursor-pointer">{t("btn.save")}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
