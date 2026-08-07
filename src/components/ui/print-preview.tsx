import { useEffect, useRef, useState } from "react";
import { Printer, X } from "lucide-react";
import { Button } from "@/components/ui/button";

type PreviewState = { title: string; html: string } | null;

export function usePrintPreview() {
  const [preview, setPreview] = useState<PreviewState>(null);
  const openRef = useRef(false);

  useEffect(() => {
    const onPop = () => {
      if (openRef.current) {
        openRef.current = false;
        setPreview(null);
      }
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  const open = (title: string, html: string) => {
    if (openRef.current) window.history.back();
    openRef.current = true;
    setPreview({ title, html });
    window.history.pushState({ printPreview: true }, "");
  };

  const close = () => {
    if (!openRef.current) return;
    openRef.current = false;
    setPreview(null);
    if (window.history.state?.printPreview) window.history.back();
  };

  const Preview = preview ? (
    <PrintPreviewOverlay title={preview.title} html={preview.html} onClose={close} />
  ) : null;

  return { preview, setPreview: open, close, Preview };
}

function PrintPreviewOverlay({ title, html, onClose }: { title: string; html: string; onClose: () => void }) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const handlePrint = () => {
    const win = iframeRef.current?.contentWindow;
    if (win) win.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      <div className="flex items-center justify-between px-3 py-2 border-b border-border flex-shrink-0">
        <Button variant="ghost" size="icon" onClick={onClose} className="cursor-pointer" aria-label="Close preview">
          <X className="w-5 h-5" />
        </Button>
        <span className="text-sm font-semibold truncate px-2">{title}</span>
        <Button variant="secondary" size="sm" onClick={handlePrint} className="cursor-pointer">
          <Printer className="w-4 h-4 mr-1" /> Print
        </Button>
      </div>
      <iframe ref={iframeRef} title={title} srcDoc={html} className="flex-1 w-full border-0 bg-white" />
    </div>
  );
}

export default PrintPreviewOverlay;