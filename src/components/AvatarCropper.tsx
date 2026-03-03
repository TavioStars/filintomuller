import { useState, useRef, useCallback, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";

interface AvatarCropperProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imageFile: File | null;
  onCropComplete: (blob: Blob) => void;
}

const AvatarCropper = ({ open, onOpenChange, imageFile, onCropComplete }: AvatarCropperProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [scale, setScale] = useState([1]);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (!imageFile) return;
    const img = new Image();
    img.onload = () => {
      setImage(img);
      setScale([1]);
      setOffset({ x: 0, y: 0 });
    };
    img.src = URL.createObjectURL(imageFile);
    return () => URL.revokeObjectURL(img.src);
  }, [imageFile]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !image) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const size = 280;
    canvas.width = size;
    canvas.height = size;

    ctx.clearRect(0, 0, size, size);
    ctx.save();
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
    ctx.clip();

    const s = scale[0];
    const aspect = image.width / image.height;
    let drawW: number, drawH: number;
    if (aspect > 1) {
      drawH = size * s;
      drawW = drawH * aspect;
    } else {
      drawW = size * s;
      drawH = drawW / aspect;
    }

    const x = (size - drawW) / 2 + offset.x;
    const y = (size - drawH) / 2 + offset.y;
    ctx.drawImage(image, x, y, drawW, drawH);
    ctx.restore();

    // Draw circle border
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2 - 1, 0, Math.PI * 2);
    ctx.strokeStyle = "hsl(var(--border))";
    ctx.lineWidth = 2;
    ctx.stroke();
  }, [image, scale, offset]);

  useEffect(() => { draw(); }, [draw]);

  const handlePointerDown = (e: React.PointerEvent) => {
    setDragging(true);
    dragStart.current = { x: e.clientX - offset.x, y: e.clientY - offset.y };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragging) return;
    setOffset({ x: e.clientX - dragStart.current.x, y: e.clientY - dragStart.current.y });
  };

  const handlePointerUp = () => setDragging(false);

  const handleCrop = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Create output canvas at 256x256
    const out = document.createElement("canvas");
    out.width = 256;
    out.height = 256;
    const ctx = out.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(canvas, 0, 0, 256, 256);
    out.toBlob((blob) => {
      if (blob) onCropComplete(blob);
    }, "image/jpeg", 0.85);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Recortar foto</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center gap-4 py-2">
          <canvas
            ref={canvasRef}
            className="rounded-full cursor-grab active:cursor-grabbing touch-none"
            style={{ width: 280, height: 280 }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
          />
          <div className="w-full px-4">
            <p className="text-xs text-muted-foreground mb-1">Zoom</p>
            <Slider value={scale} onValueChange={setScale} min={1} max={3} step={0.05} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleCrop}>Salvar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AvatarCropper;
