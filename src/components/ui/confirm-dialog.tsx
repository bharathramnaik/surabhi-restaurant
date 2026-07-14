import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";

export default function ConfirmDialog({
  open, onOpenChange, onConfirm, title, description, confirmText, cancelText,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  title?: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
}) {
  const { t } = useTranslation("common");
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{title || t("msg.confirm_delete")}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <div className="flex gap-2 justify-end pt-2">
          <Button variant="secondary" onClick={() => onOpenChange(false)} className="cursor-pointer">{cancelText || t("btn.cancel")}</Button>
          <Button variant="destructive" onClick={() => { onConfirm(); onOpenChange(false); }} className="cursor-pointer">{confirmText || t("btn.delete")}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
