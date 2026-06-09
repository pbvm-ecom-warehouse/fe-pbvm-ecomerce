"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import { Paintbrush, Eraser, Trash2, CheckCircle2, MousePointer2, Upload, X } from "lucide-react";

// Một object/sticker được đặt trên canvas
interface PlacedObject {
  id: string;
  imageUrl: string;       // base64 data URL
  x: number;             // tọa độ góc trái trên (theo pixel canvas)
  y: number;
  w: number;             // kích thước
  h: number;
}

interface DesignCanvas2DProps {
  onCanvasChange: (dataUrl: string | null) => void;
  triggerDrawImg: string | null;
  setTriggerDrawImg: (url: string | null) => void;
}

// Kích thước logic của canvas
const CANVAS_W = 512;
const CANVAS_H = 512;

// Kích thước mặc định khi thả sticker (% canvas)
const DEFAULT_OBJ_SIZE = CANVAS_W * 0.45;

export function DesignCanvas2D({
  onCanvasChange,
  triggerDrawImg,
  setTriggerDrawImg,
}: DesignCanvas2DProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // ----- Trạng thái vẽ nét (brush layer) -----
  const [tool, setTool] = useState<"brush" | "eraser" | "select">("select");
  const [brushColor, setBrushColor] = useState("#000000");
  const [brushSize, setBrushSize] = useState(6);
  const [isDrawing, setIsDrawing] = useState(false);

  // ----- Trạng thái các object đã đặt -----
  const [placedObjects, setPlacedObjects] = useState<PlacedObject[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const dragOffset = useRef<{ dx: number; dy: number }>({ dx: 0, dy: 0 });
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // ----- Canvas có nội dung không? -----
  const hasContent = placedObjects.length > 0;

  // --------------------------------------------------------------------------
  // Vẽ lại toàn bộ canvas mỗi khi objects thay đổi
  // --------------------------------------------------------------------------
  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Xóa vùng trong suốt
    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

    // Vẽ tất cả placed objects
    placedObjects.forEach((obj) => {
      const img = new Image();
      img.src = obj.imageUrl;
      // Vì image đã loaded (data URL), dùng onload để đảm bảo
      img.onload = () => {
        ctx.drawImage(img, obj.x, obj.y, obj.w, obj.h);

        // Viền highlight khi được chọn
        if (obj.id === selectedId) {
          ctx.save();
          ctx.strokeStyle = "#5C3D2E";
          ctx.lineWidth = 3;
          ctx.setLineDash([6, 3]);
          ctx.strokeRect(obj.x - 2, obj.y - 2, obj.w + 4, obj.h + 4);
          // Handle góc kéo resize (chỉ visual)
          ctx.fillStyle = "#5C3D2E";
          ctx.fillRect(obj.x + obj.w - 6, obj.y + obj.h - 6, 10, 10);
          ctx.restore();
        }
      };
      // Nếu ảnh đã cache, gọi lại luôn
      if (img.complete) {
        ctx.drawImage(img, obj.x, obj.y, obj.w, obj.h);
        if (obj.id === selectedId) {
          ctx.save();
          ctx.strokeStyle = "#5C3D2E";
          ctx.lineWidth = 3;
          ctx.setLineDash([6, 3]);
          ctx.strokeRect(obj.x - 2, obj.y - 2, obj.w + 4, obj.h + 4);
          ctx.fillStyle = "#5C3D2E";
          ctx.fillRect(obj.x + obj.w - 6, obj.y + obj.h - 6, 10, 10);
          ctx.restore();
        }
      }
    });
  }, [placedObjects, selectedId]);

  // Gọi redraw mỗi khi state thay đổi và thông báo cho component cha
  useEffect(() => {
    redraw();
    // Thông báo kết quả canvas lên cha sau khi vẽ xong
    const timeout = setTimeout(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      if (placedObjects.length === 0) {
        onCanvasChange(null);
      } else {
        onCanvasChange(canvas.toDataURL());
      }
    }, 80);
    return () => clearTimeout(timeout);
  }, [placedObjects, selectedId, redraw, onCanvasChange]);

  // --------------------------------------------------------------------------
  // Nhận sticker từ triggerDrawImg (khi chọn từ modal hoặc AI generate)
  // --------------------------------------------------------------------------
  useEffect(() => {
    if (!triggerDrawImg) return;

    const newObj: PlacedObject = {
      id: `obj-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      imageUrl: triggerDrawImg,
      x: (CANVAS_W - DEFAULT_OBJ_SIZE) / 2,
      y: (CANVAS_H - DEFAULT_OBJ_SIZE) / 2,
      w: DEFAULT_OBJ_SIZE,
      h: DEFAULT_OBJ_SIZE,
    };
    setPlacedObjects((prev) => [...prev, newObj]);
    setSelectedId(newObj.id);
    setTriggerDrawImg(null);
  }, [triggerDrawImg, setTriggerDrawImg]);

  // --------------------------------------------------------------------------
  // Lấy tọa độ canvas từ MouseEvent
  // --------------------------------------------------------------------------
  const getCanvasCoords = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * CANVAS_W,
      y: ((e.clientY - rect.top) / rect.height) * CANVAS_H,
    };
  };

  // --------------------------------------------------------------------------
  // Tìm object tại tọa độ (x, y)
  // --------------------------------------------------------------------------
  const findObjectAt = (x: number, y: number): PlacedObject | null => {
    // Tìm từ trên xuống (object trên cùng trước)
    for (let i = placedObjects.length - 1; i >= 0; i--) {
      const o = placedObjects[i];
      if (x >= o.x && x <= o.x + o.w && y >= o.y && y <= o.y + o.h) {
        return o;
      }
    }
    return null;
  };

  // --------------------------------------------------------------------------
  // Mouse events (Select/Move mode)
  // --------------------------------------------------------------------------
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const { x, y } = getCanvasCoords(e);

    if (tool === "select") {
      const found = findObjectAt(x, y);
      if (found) {
        setSelectedId(found.id);
        setDraggingId(found.id);
        dragOffset.current = { dx: x - found.x, dy: y - found.y };
      } else {
        setSelectedId(null);
        setDraggingId(null);
      }
    } else {
      // Brush / Eraser
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.beginPath();
      ctx.moveTo(x, y);
      setIsDrawing(true);

      if (tool === "eraser") {
        ctx.globalCompositeOperation = "destination-out";
        ctx.lineWidth = brushSize * 3;
      } else {
        ctx.globalCompositeOperation = "source-over";
        ctx.strokeStyle = brushColor;
        ctx.lineWidth = brushSize;
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const { x, y } = getCanvasCoords(e);

    if (draggingId) {
      const { dx, dy } = dragOffset.current;
      setPlacedObjects((prev) =>
        prev.map((o) =>
          o.id === draggingId
            ? {
                ...o,
                x: Math.max(0, Math.min(CANVAS_W - o.w, x - dx)),
                y: Math.max(0, Math.min(CANVAS_H - o.h, y - dy)),
              }
            : o
        )
      );
    } else if (isDrawing) {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.lineTo(x, y);
      ctx.stroke();
    }
  };

  const handleMouseUp = () => {
    setDraggingId(null);
    setIsDrawing(false);
  };

  // --------------------------------------------------------------------------
  // Kéo thả từ bên ngoài vào (HTML5 drag-and-drop)
  // --------------------------------------------------------------------------
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();

    // Tọa độ thả
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const dropX = ((e.clientX - rect.left) / rect.width) * CANVAS_W;
    const dropY = ((e.clientY - rect.top) / rect.height) * CANVAS_H;
    const objW = DEFAULT_OBJ_SIZE * 0.8;
    const objH = DEFAULT_OBJ_SIZE * 0.8;

    // Ưu tiên: dữ liệu sticker từ panel (text/plain = dataURL)
    const stickerData = e.dataTransfer.getData("text/plain");
    if (stickerData && stickerData.startsWith("data:")) {
      const newObj: PlacedObject = {
        id: `obj-${Date.now()}`,
        imageUrl: stickerData,
        x: Math.max(0, dropX - objW / 2),
        y: Math.max(0, dropY - objH / 2),
        w: objW,
        h: objH,
      };
      setPlacedObjects((prev) => [...prev, newObj]);
      setSelectedId(newObj.id);
      return;
    }

    // File ảnh từ máy tính
    const files = Array.from(e.dataTransfer.files);
    const imageFile = files.find((f) => f.type.startsWith("image/"));
    if (imageFile) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const url = ev.target?.result as string;
        if (!url) return;
        const newObj: PlacedObject = {
          id: `obj-${Date.now()}`,
          imageUrl: url,
          x: Math.max(0, dropX - objW / 2),
          y: Math.max(0, dropY - objH / 2),
          w: objW,
          h: objH,
        };
        setPlacedObjects((prev) => [...prev, newObj]);
        setSelectedId(newObj.id);
      };
      reader.readAsDataURL(imageFile);
    }
  };

  // --------------------------------------------------------------------------
  // Upload ảnh từ button
  // --------------------------------------------------------------------------
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const url = ev.target?.result as string;
      if (!url) return;
      const newObj: PlacedObject = {
        id: `obj-${Date.now()}`,
        imageUrl: url,
        x: (CANVAS_W - DEFAULT_OBJ_SIZE) / 2,
        y: (CANVAS_H - DEFAULT_OBJ_SIZE) / 2,
        w: DEFAULT_OBJ_SIZE,
        h: DEFAULT_OBJ_SIZE,
      };
      setPlacedObjects((prev) => [...prev, newObj]);
      setSelectedId(newObj.id);
    };
    reader.readAsDataURL(file);
    // Reset input để có thể upload lại cùng file
    e.target.value = "";
  };

  // --------------------------------------------------------------------------
  // Xóa object đang được chọn
  // --------------------------------------------------------------------------
  const deleteSelected = () => {
    if (!selectedId) return;
    setPlacedObjects((prev) => prev.filter((o) => o.id !== selectedId));
    setSelectedId(null);
  };

  // --------------------------------------------------------------------------
  // Resize object được chọn
  // --------------------------------------------------------------------------
  const resizeSelected = (delta: number) => {
    if (!selectedId) return;
    setPlacedObjects((prev) =>
      prev.map((o) => {
        if (o.id !== selectedId) return o;
        const newW = Math.max(40, o.w + delta);
        const newH = Math.max(40, o.h + delta);
        return { ...o, w: newW, h: newH };
      })
    );
  };

  // --------------------------------------------------------------------------
  // Reset toàn bộ canvas
  // --------------------------------------------------------------------------
  const clearCanvas = () => {
    setPlacedObjects([]);
    setSelectedId(null);
    setDraggingId(null);
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      ctx?.clearRect(0, 0, CANVAS_W, CANVAS_H);
    }
    onCanvasChange(null);
  };

  // --------------------------------------------------------------------------
  // Cursor style
  // --------------------------------------------------------------------------
  const cursorStyle =
    tool === "select"
      ? draggingId
        ? "grabbing"
        : "default"
      : tool === "eraser"
      ? "cell"
      : "crosshair";

  return (
    <div className="flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center justify-between px-1">
        <span className="text-xs font-bold text-[#5C3D2E] uppercase tracking-wider">
          Bảng thiết kế 2D
        </span>
        {hasContent ? (
          <span className="flex items-center gap-1 text-[10px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
            <CheckCircle2 className="h-3 w-3" /> Đang hiển thị trên ly 3D
          </span>
        ) : (
          <span className="text-[10px] text-[#7A6F68]">Kéo thả sticker / ảnh vào đây</span>
        )}
      </div>

      {/* Canvas area - hỗ trợ drop zone */}
      <div
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className="flex justify-center"
      >
        <div
          className="relative border-4 border-[#E6DFD9] rounded-2xl bg-white shadow-inner w-full max-w-[300px] sm:max-w-[320px] aspect-square overflow-hidden"
          style={{ borderStyle: hasContent ? "solid" : "dashed" }}
        >
          <canvas
            ref={canvasRef}
            width={CANVAS_W}
            height={CANVAS_H}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            className="w-full h-full bg-white"
            style={{ cursor: cursorStyle, touchAction: "none" }}
          />

          {/* Placeholder text khi trống */}
          {!hasContent && (
            <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center gap-2 text-center p-4">
              <div className="text-3xl opacity-30">🖼️</div>
              <span className="text-[11px] font-bold text-[#7A6F68]/60 leading-relaxed">
                Kéo thả sticker hoặc ảnh logo<br />
                vào đây để thiết kế
              </span>
            </div>
          )}

          {/* Badge "Kéo để di chuyển" khi có object được chọn */}
          {selectedId && (
            <div className="absolute top-2 left-1/2 -translate-x-1/2 pointer-events-none bg-[#5C3D2E]/80 text-white text-[9px] font-bold rounded-full px-2.5 py-0.5 backdrop-blur-sm whitespace-nowrap shadow">
              ✋ Kéo để di chuyển
            </div>
          )}
        </div>
      </div>

      {/* Thanh điều khiển */}
      <div className="rounded-xl bg-[#FAF8F6] p-3 border border-[#E6DFD9] flex flex-col gap-2.5">

        {/* Hàng 1: Công cụ chính */}
        <div className="flex items-center gap-2">
          {/* Nút Select/Move */}
          <button
            onClick={() => setTool("select")}
            className={`p-2 rounded-lg border transition-all ${
              tool === "select"
                ? "bg-primary text-white border-primary"
                : "bg-white text-[#7A6F68] border-[#E6DFD9] hover:border-[#D2B48C]"
            }`}
            title="Chế độ chọn và di chuyển"
          >
            <MousePointer2 className="h-4 w-4" />
          </button>

          {/* Nút Brush */}
          <button
            onClick={() => setTool("brush")}
            className={`p-2 rounded-lg border transition-all ${
              tool === "brush"
                ? "bg-primary text-white border-primary"
                : "bg-white text-[#7A6F68] border-[#E6DFD9] hover:border-[#D2B48C]"
            }`}
            title="Bút vẽ tự do"
          >
            <Paintbrush className="h-4 w-4" />
          </button>

          {/* Nút Eraser */}
          <button
            onClick={() => setTool("eraser")}
            className={`p-2 rounded-lg border transition-all ${
              tool === "eraser"
                ? "bg-primary text-white border-primary"
                : "bg-white text-[#7A6F68] border-[#E6DFD9] hover:border-[#D2B48C]"
            }`}
            title="Tẩy"
          >
            <Eraser className="h-4 w-4" />
          </button>

          {/* Upload ảnh */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-2 rounded-lg border border-[#E6DFD9] bg-white text-[#7A6F68] hover:border-[#D2B48C] transition-all"
            title="Tải ảnh/logo từ máy tính"
          >
            <Upload className="h-4 w-4" />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileUpload}
          />

          {/* Resize thu/phóng object được chọn */}
          {selectedId && (
            <>
              <button
                onClick={() => resizeSelected(20)}
                className="p-1.5 rounded-lg border border-[#E6DFD9] bg-white text-[#7A6F68] hover:border-primary hover:text-primary transition-all text-xs font-bold"
                title="Phóng to"
              >
                +
              </button>
              <button
                onClick={() => resizeSelected(-20)}
                className="p-1.5 rounded-lg border border-[#E6DFD9] bg-white text-[#7A6F68] hover:border-primary hover:text-primary transition-all text-xs font-bold"
                title="Thu nhỏ"
              >
                −
              </button>
              <button
                onClick={deleteSelected}
                className="p-1.5 rounded-lg border border-red-200 bg-white text-red-500 hover:bg-red-50 transition-all"
                title="Xóa phần tử này"
              >
                <X className="h-4 w-4" />
              </button>
            </>
          )}
        </div>

        {/* Hàng 2: Cỡ cọ (chỉ khi brush/eraser) */}
        {(tool === "brush" || tool === "eraser") && (
          <div className="flex-1">
            <div className="flex justify-between text-[9px] font-bold text-[#7A6F68] mb-0.5">
              <span>Cỡ cọ:</span>
              <span>{brushSize}px</span>
            </div>
            <input
              type="range"
              min="2"
              max="24"
              step="1"
              value={brushSize}
              onChange={(e) => setBrushSize(parseInt(e.target.value))}
              className="w-full h-1 bg-[#E6DFD9] rounded-lg appearance-none cursor-pointer accent-primary"
            />
          </div>
        )}

        {/* Hàng 3: Màu cọ + Reset */}
        <div className="flex items-center justify-between gap-2 border-t border-[#E6DFD9]/50 pt-2.5">
          {tool === "brush" && (
            <div className="flex items-center gap-2 flex-1">
              <span className="text-[10px] font-bold text-[#7A6F68] uppercase shrink-0">Màu cọ:</span>
              <div className="relative h-6 w-6 rounded-md overflow-hidden border border-[#E6DFD9] cursor-pointer shrink-0">
                <input
                  type="color"
                  value={brushColor}
                  onChange={(e) => {
                    setBrushColor(e.target.value);
                    setTool("brush");
                  }}
                  className="absolute inset-0 w-full h-full cursor-pointer p-0 border-0"
                  style={{ transform: "scale(1.4)", transformOrigin: "center" }}
                  title="Chọn màu cọ"
                />
              </div>
              <span className="text-[10px] text-[#7A6F68] font-bold uppercase">{brushColor}</span>
            </div>
          )}

          {tool === "select" && (
            <div className="flex items-center gap-1.5 text-[10px] text-[#7A6F68] flex-1">
              <MousePointer2 className="h-3 w-3" />
              <span>Kéo thả sticker vào canvas hoặc kéo để di chuyển</span>
            </div>
          )}

          {tool === "eraser" && (
            <div className="flex items-center gap-1.5 text-[10px] text-[#7A6F68] flex-1">
              <Eraser className="h-3 w-3" />
              <span>Kéo để xóa nét vẽ tự do</span>
            </div>
          )}

          {/* Nút Reset */}
          <button
            onClick={clearCanvas}
            className="p-1.5 rounded-lg border border-red-200 bg-white hover:bg-red-50 text-red-500 hover:border-red-300 transition-all text-[10px] font-bold flex items-center gap-1 shrink-0 shadow-sm"
            title="Xóa toàn bộ thiết kế"
          >
            <Trash2 className="h-3 w-3" />
            Reset
          </button>
        </div>
      </div>
    </div>
  );
}
