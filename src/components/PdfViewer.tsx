import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, ZoomIn, ZoomOut, RotateCcw } from "lucide-react";
import * as pdfjsLib from "pdfjs-dist";

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;

interface PdfViewerProps {
  url: string;
}

const PdfViewer = ({ url }: PdfViewerProps) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [scale, setScale] = useState(1.0);
  const [numPages, setNumPages] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const pdfDocRef = useRef<pdfjsLib.PDFDocumentProxy | null>(null);

  const renderPages = useCallback(async (pdf: pdfjsLib.PDFDocumentProxy, currentScale: number) => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;

    wrapper.innerHTML = "";

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const viewport = page.getViewport({ scale: currentScale });

      const canvas = document.createElement("canvas");
      canvas.className = "mx-auto mb-4 shadow-md rounded";
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      canvas.style.width = `${viewport.width}px`;
      canvas.style.height = `${viewport.height}px`;

      wrapper.appendChild(canvas);

      const ctx = canvas.getContext("2d");
      if (ctx) {
        await page.render({ canvasContext: ctx, viewport }).promise;
      }
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadPdf = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(url);
        if (!response.ok) throw new Error("Erro ao baixar o PDF");
        const arrayBuffer = await response.arrayBuffer();

        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        if (cancelled) return;

        pdfDocRef.current = pdf;
        setNumPages(pdf.numPages);
        await renderPages(pdf, scale);
      } catch (err: any) {
        if (!cancelled) setError(err.message || "Erro ao carregar PDF");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadPdf();
    return () => { cancelled = true; };
  }, [url]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (pdfDocRef.current && !loading) {
      renderPages(pdfDocRef.current, scale);
    }
  }, [scale, renderPages, loading]);

  const handleZoom = (delta: number) => {
    setScale((prev) => Math.max(0.5, Math.min(3, prev + delta)));
  };

  if (error) {
    return (
      <div className="flex items-center justify-center h-full text-destructive">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-2 px-1">
        <span className="text-sm text-muted-foreground">
          {loading ? "Carregando..." : `${numPages} página(s)`}
        </span>
        <div className="flex items-center gap-1">
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handleZoom(-0.25)} disabled={scale <= 0.5}>
            <ZoomOut className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" className="h-8 px-2 text-sm" onClick={() => setScale(1.0)}>
            {Math.round(scale * 100)}%
          </Button>
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handleZoom(0.25)} disabled={scale >= 3}>
            <ZoomIn className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center flex-1">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}

      <div
        ref={containerRef}
        className="flex-1 overflow-auto bg-muted/30 rounded-lg"
        style={{ display: loading ? "none" : "block", touchAction: "pan-x pan-y" }}
      >
        <div ref={wrapperRef} className="p-4" style={{ minWidth: "fit-content" }} />
      </div>
    </div>
  );
};

export default PdfViewer;
