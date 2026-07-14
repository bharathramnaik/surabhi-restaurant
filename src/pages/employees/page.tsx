import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { useData } from "@/lib/data-context.tsx";
import { cn } from "@/lib/utils.ts";
import { Plus, Pencil, Trash2, Search, Users, IndianRupee, Shield } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

const ROLES = ["Manager", "Chef", "Waiter", "Cleaner", "Accountant", "Other"];
const SHIFTS = ["Morning (6am-2pm)", "Afternoon (2pm-10pm)", "Night (10pm-6am)", "Full Day"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export default function EmployeesPage() {
  const { t } = useTranslation("common");
  const { employees, salaryRecords, settings, addEmployee, updateEmployee, deleteEmployee, addSalaryRecord, updateSalaryRecord } = useData();
  const [search, setSearch] = useState("");
  const [empDialogOpen, setEmpDialogOpen] = useState(false);
  const [salaryDialogOpen, setSalaryDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [empForm, setEmpForm] = useState({ name: "", phone: "", email: "", role: "Waiter", shift: "Morning (6am-2pm)", joinDate: new Date().toISOString().slice(0, 10), salary: 0, active: true, notes: "" });
  const [salaryForm, setSalaryForm] = useState({ employeeId: "", month: new Date().getMonth() + 1, year: new Date().getFullYear(), amount: 0, paid: false, notes: "" });
  const [isAdmin, setIsAdmin] = useState(false);
  const [pinDialogOpen, setPinDialogOpen] = useState(true);
  const [pinInput, setPinInput] = useState("");
  const [activeTab, setActiveTab] = useState<"employees" | "salary">("employees");

  const verifyPin = () => { if (pinInput === (settings.adminPin ?? "1234")) { setIsAdmin(true); setPinDialogOpen(false); setPinInput(""); toast.success(t("msg.admin_granted")); } else toast.error(t("msg.invalid_pin")); };
  const filtered = employees.filter((e) => e.name.toLowerCase().includes(search.toLowerCase()) || e.role.toLowerCase().includes(search.toLowerCase()));

  const openAddEmp = () => { setEditingId(null); setEmpForm({ name: "", phone: "", email: "", role: "Waiter", shift: "Morning (6am-2pm)", joinDate: new Date().toISOString().slice(0, 10), salary: 0, active: true, notes: "" }); setEmpDialogOpen(true); };
  const openEditEmp = (emp: typeof employees[0]) => { setEditingId(emp.id); setEmpForm({ name: emp.name, phone: emp.phone, email: emp.email, role: emp.role, shift: emp.shift, joinDate: emp.joinDate, salary: emp.salary, active: emp.active, notes: emp.notes }); setEmpDialogOpen(true); };

  const handleSaveEmp = () => {
    if (!empForm.name) { toast.error(t("msg.name_required")); return; }
    if (editingId) updateEmployee(editingId, empForm); else addEmployee(empForm);
    toast.success(t("msg.saved")); setEmpDialogOpen(false);
  };

  const openAddSalary = (empId?: string) => {
    const emp = empId ? employees.find((e) => e.id === empId) : null;
    setSalaryForm({ employeeId: empId ?? employees[0]?.id ?? "", month: new Date().getMonth() + 1, year: new Date().getFullYear(), amount: emp?.salary ?? 0, paid: false, notes: "" });
    setSalaryDialogOpen(true);
  };

  const handleSaveSalary = () => {
    if (!salaryForm.employeeId) { toast.error(t("msg.select_employee")); return; }
    addSalaryRecord(salaryForm); toast.success(t("msg.saved")); setSalaryDialogOpen(false);
  };

  if (!isAdmin) {
    return (
      <div className="p-4 md:p-6 pb-20 md:pb-6 space-y-4">
        <h1 className="text-2xl font-bold">{t("nav.employees")}</h1>
        <Card className="max-w-sm mx-auto mt-8">
          <CardContent className="pt-6 pb-6 text-center space-y-4">
            <Shield className="w-12 h-12 mx-auto text-muted-foreground" />
            <p className="font-semibold">{t("msg.admin_access_required")}</p>
            <p className="text-sm text-muted-foreground">{t("msg.enter_pin")}</p>
            <Input type="password" value={pinInput} onChange={(e) => setPinInput(e.target.value)} placeholder={t("label.pin")} maxLength={6} onKeyDown={(e) => { if (e.key === "Enter") verifyPin(); }} className="max-w-40 mx-auto text-center text-lg" />
            <Button onClick={verifyPin} className="cursor-pointer w-full max-w-40">{t("btn.confirm")}</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 pb-20 md:pb-6 space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <h1 className="text-2xl font-bold">{t("nav.employees")}</h1>
        <div className="flex gap-2">
          {activeTab === "employees" && <Button size="sm" onClick={openAddEmp} className="cursor-pointer"><Plus className="w-4 h-4 mr-1" /> {t("btn.add")}</Button>}
          {activeTab === "salary" && <Button size="sm" onClick={() => openAddSalary()} className="cursor-pointer"><IndianRupee className="w-4 h-4 mr-1" /> {t("btn.add_salary")}</Button>}
        </div>
      </div>
      <div className="flex gap-2">
        <Button variant={activeTab === "employees" ? "default" : "secondary"} size="sm" onClick={() => setActiveTab("employees")} className="cursor-pointer"><Users className="w-4 h-4 mr-1" /> {t("label.employees")}</Button>
        <Button variant={activeTab === "salary" ? "default" : "secondary"} size="sm" onClick={() => setActiveTab("salary")} className="cursor-pointer"><IndianRupee className="w-4 h-4 mr-1" /> {t("label.salary")}</Button>
      </div>
      {activeTab === "employees" && (
        <>
          <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" /><Input placeholder={t("btn.search")} value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" /></div>
          <div className="space-y-2">
            {filtered.length === 0 ? <div className="text-center py-12 text-muted-foreground"><Users className="w-10 h-10 mx-auto mb-2 opacity-30" /><p>{t("msg.no_data")}</p></div> :
              filtered.map((emp) => (
                <Card key={emp.id} className="shadow-sm"><CardContent className="pt-3 pb-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2"><p className="font-semibold text-sm">{emp.name}</p><span className={cn("text-[10px] px-1.5 py-0.5 rounded-full", emp.active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500")}>{emp.active ? t("label.active") : t("label.inactive")}</span></div>
                      <p className="text-xs text-muted-foreground mt-0.5">{emp.role} • {emp.shift}</p>
                      <p className="text-xs text-muted-foreground">{emp.phone}{emp.email ? ` • ${emp.email}` : ""}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold">₹{emp.salary.toLocaleString()}/mo</p>
                      <div className="flex gap-1 mt-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7 cursor-pointer" onClick={() => openEditEmp(emp)}><Pencil className="w-3.5 h-3.5" /></Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive cursor-pointer" onClick={() => { deleteEmployee(emp.id); }}><Trash2 className="w-3.5 h-3.5" /></Button>
                      </div>
                    </div>
                  </div>
                </CardContent></Card>
              ))}
          </div>
        </>
      )}
      {activeTab === "salary" && (
        <div className="space-y-3">
          {employees.map((emp) => {
            const empRecords = salaryRecords.filter((r) => r.employeeId === emp.id).sort((a, b) => b.year - a.year || b.month - a.month);
            return (
              <Card key={emp.id} className="shadow-sm"><CardContent className="pt-3 pb-3">
                <div className="flex items-center justify-between mb-2">
                  <div><p className="font-semibold text-sm">{emp.name}</p><p className="text-xs text-muted-foreground">{emp.role} • ₹{emp.salary.toLocaleString()}/mo</p></div>
                  <Button size="sm" variant="secondary" onClick={() => openAddSalary(emp.id)} className="cursor-pointer text-xs"><Plus className="w-3 h-3 mr-1" /> {t("btn.record")}</Button>
                </div>
                {empRecords.length === 0 ? <p className="text-xs text-muted-foreground">{t("msg.no_salary_records")}</p> : (
                  <div className="space-y-1">{empRecords.slice(0, 6).map((r) => (
                    <div key={r.id} className="flex items-center justify-between text-xs py-1 border-b border-border last:border-0">
                      <span>{MONTHS[r.month - 1]} {r.year}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">₹{r.amount.toLocaleString()}</span>
                        <span className={cn("px-1.5 py-0.5 rounded-full text-[10px]", r.paid ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700")}>{r.paid ? t("label.paid") : t("label.unpaid")}</span>
                        {!r.paid && <Button size="sm" variant="ghost" className="cursor-pointer text-[10px] h-5" onClick={() => updateSalaryRecord(r.id, { paid: true })}>{t("btn.mark_paid")}</Button>}
                      </div>
                    </div>
                  ))}</div>
                )}
              </CardContent></Card>
            );
          })}
        </div>
      )}
      <Dialog open={empDialogOpen} onOpenChange={setEmpDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editingId ? t("btn.edit") : t("btn.add")} {t("label.employee")}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><Label>{t("label.name")} *</Label><Input value={empForm.name} onChange={(e) => setEmpForm({ ...empForm, name: e.target.value })} /></div>
              <div className="space-y-1"><Label>{t("label.phone")}</Label><Input value={empForm.phone} onChange={(e) => setEmpForm({ ...empForm, phone: e.target.value })} /></div>
            </div>
            <div className="space-y-1"><Label>{t("label.email")}</Label><Input type="email" value={empForm.email} onChange={(e) => setEmpForm({ ...empForm, email: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><Label>{t("label.role")}</Label><Select value={empForm.role} onValueChange={(v) => setEmpForm({ ...empForm, role: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{ROLES.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent></Select></div>
              <div className="space-y-1"><Label>{t("label.shift")}</Label><Select value={empForm.shift} onValueChange={(v) => setEmpForm({ ...empForm, shift: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{SHIFTS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><Label>{t("label.join_date")}</Label><Input type="date" value={empForm.joinDate} onChange={(e) => setEmpForm({ ...empForm, joinDate: e.target.value })} /></div>
              <div className="space-y-1"><Label>{t("label.monthly_salary")}</Label><Input type="number" min={0} value={empForm.salary} onChange={(e) => setEmpForm({ ...empForm, salary: Number(e.target.value) })} /></div>
            </div>
            <div className="flex items-center gap-2"><Switch checked={empForm.active} onCheckedChange={(v) => setEmpForm({ ...empForm, active: v })} id="active" /><Label htmlFor="active">{t("label.active")}</Label></div>
            <div className="space-y-1"><Label>{t("label.notes")}</Label><Textarea rows={2} value={empForm.notes} onChange={(e) => setEmpForm({ ...empForm, notes: e.target.value })} /></div>
            <div className="flex gap-2 justify-end pt-2">
              <Button variant="secondary" onClick={() => setEmpDialogOpen(false)} className="cursor-pointer">{t("btn.cancel")}</Button>
              <Button onClick={handleSaveEmp} className="cursor-pointer">{t("btn.save")}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      <Dialog open={salaryDialogOpen} onOpenChange={setSalaryDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>{t("btn.record")} {t("label.salary")}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1"><Label>{t("label.employee")}</Label><Select value={salaryForm.employeeId} onValueChange={(v) => { const emp = employees.find((e) => e.id === v); setSalaryForm({ ...salaryForm, employeeId: v, amount: emp?.salary ?? 0 }); }}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{employees.filter((e) => e.active).map((e) => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}</SelectContent></Select></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><Label>{t("label.month")}</Label><Select value={String(salaryForm.month)} onValueChange={(v) => setSalaryForm({ ...salaryForm, month: Number(v) })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{MONTHS.map((m, i) => <SelectItem key={i + 1} value={String(i + 1)}>{m}</SelectItem>)}</SelectContent></Select></div>
              <div className="space-y-1"><Label>{t("label.year")}</Label><Input type="number" min={2020} value={salaryForm.year} onChange={(e) => setSalaryForm({ ...salaryForm, year: Number(e.target.value) })} /></div>
            </div>
            <div className="space-y-1"><Label>{t("label.amount")}</Label><Input type="number" min={0} value={salaryForm.amount} onChange={(e) => setSalaryForm({ ...salaryForm, amount: Number(e.target.value) })} /></div>
            <div className="flex items-center gap-2"><Switch checked={salaryForm.paid} onCheckedChange={(v) => setSalaryForm({ ...salaryForm, paid: v })} id="paid" /><Label htmlFor="paid">{t("label.paid")}</Label></div>
            <div className="space-y-1"><Label>{t("label.notes")}</Label><Input value={salaryForm.notes} onChange={(e) => setSalaryForm({ ...salaryForm, notes: e.target.value })} /></div>
            <div className="flex gap-2 justify-end pt-2">
              <Button variant="secondary" onClick={() => setSalaryDialogOpen(false)} className="cursor-pointer">{t("btn.cancel")}</Button>
              <Button onClick={handleSaveSalary} className="cursor-pointer">{t("btn.save")}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
