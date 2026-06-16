"use client";

import type Konva from "konva";
import {
  type ChangeEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  Image as KonvaImage,
  Layer,
  Line,
  Rect,
  Stage,
  Text,
  Transformer,
} from "react-konva";
import {
  Download,
  ImagePlus,
  MousePointer2,
  PenTool,
  Trash2,
  Undo2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import type { DesignArtwork } from "@/types/api";

/* ------------------------------------------------------------------ */
/*  Exported types                                                     */
/* ------------------------------------------------------------------ */

export type BrushStrokeData = {
  id: string;
  points: number[];
  color: string;
  strokeWidth: number;
};

export type ImportedImageData = {
  id: string;
  dataUrl: string;
  x: number;
  y: number;
  width: number;
  height: number;
};

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

type EditorTool = "select" | "brush";

const BRUSH_SIZES = [3, 5, 8, 12];
const MAX_IMPORTED_IMAGES = 2;
const PRINT_PADDING = 20;

/* ------------------------------------------------------------------ */
/*  Props                                                              */
/* ------------------------------------------------------------------ */

type CupArtworkEditorProps = {
  artwork: DesignArtwork;
  onArtworkChange: (artwork: DesignArtwork) => void;
  brushStrokes: BrushStrokeData[];
  onBrushStrokesChange: (strokes: BrushStrokeData[]) => void;
  importedImages: ImportedImageData[];
  onImportedImagesChange: (images: ImportedImageData[]) => void;
  artboardWidth: number;
  artboardHeight: number;
  /** 40–100, controls how much of the cup height the print covers */
  printHeightPct: number;
  onPrintHeightChange: (pct: number) => void;
  onCanvasCapture?: (dataUrl: string) => void;
};

/* ------------------------------------------------------------------ */
/*  Sub-component: imported image layer                                */
/* ------------------------------------------------------------------ */

function ImportedImageLayer({
  data,
  isSelected,
  selectable,
  onSelect,
  onChange,
}: {
  data: ImportedImageData;
  isSelected: boolean;
  selectable: boolean;
  onSelect: () => void;
  onChange: (updated: ImportedImageData) => void;
}) {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const shapeRef = useRef<Konva.Image>(null);
  const trRef = useRef<Konva.Transformer>(null);

  useEffect(() => {
    let active = true;
    const img = new window.Image();
    img.onload = () => {
      if (active) setImage(img);
    };
    img.src = data.dataUrl;
    return () => {
      active = false;
    };
  }, [data.dataUrl]);

  useEffect(() => {
    if (isSelected && trRef.current && shapeRef.current) {
      trRef.current.nodes([shapeRef.current]);
      trRef.current.getLayer()?.batchDraw();
    }
  }, [isSelected]);

  if (!image) return null;

  return (
    <>
      <KonvaImage
        ref={shapeRef}
        image={image}
        x={data.x}
        y={data.y}
        width={data.width}
        height={data.height}
        draggable={selectable}
        listening={selectable}
        onClick={selectable ? onSelect : undefined}
        onTap={selectable ? onSelect : undefined}
        onDragEnd={(e) =>
          onChange({ ...data, x: e.target.x(), y: e.target.y() })
        }
        onTransformEnd={() => {
          const node = shapeRef.current;
          if (!node) return;
          const sx = node.scaleX();
          const sy = node.scaleY();
          node.scaleX(1);
          node.scaleY(1);
          onChange({
            ...data,
            x: node.x(),
            y: node.y(),
            width: Math.max(20, node.width() * sx),
            height: Math.max(20, node.height() * sy),
          });
        }}
      />
      {isSelected && (
        <Transformer
          ref={trRef}
          rotateEnabled={false}
          boundBoxFunc={(_old, next) => {
            if (next.width < 20 || next.height < 20) return _old;
            return next;
          }}
        />
      )}
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */

export function CupArtworkEditor({
  artwork,
  onArtworkChange,
  brushStrokes,
  onBrushStrokesChange,
  importedImages,
  onImportedImagesChange,
  artboardWidth,
  artboardHeight,
  printHeightPct,
  onPrintHeightChange,
  onCanvasCapture,
}: CupArtworkEditorProps) {
  const stageRef = useRef<Konva.Stage>(null);
  const contentLayerRef = useRef<Konva.Layer>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const [tool, setTool] = useState<EditorTool>("select");
  const [brushSize, setBrushSize] = useState(5);
  const [brushColor, setBrushColor] = useState(artwork.fill || "#5C3D2E");
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);

  const isDrawingRef = useRef(false);
  const [currentStroke, setCurrentStroke] = useState<number[]>([]);

  const cupColor = artwork.cupConfig?.cupColor ?? "#f8fafc";
  const PA = PRINT_PADDING;
  const printW = artboardWidth - PA * 2;
  const printH = artboardHeight - PA * 2;
  const textCenterX = artboardWidth / 2;
  const textCenterY = artboardHeight / 2;

  /* ---- Canvas capture: export CONTENT layer only (transparent bg) ---- */
  const captureRef = useRef(onCanvasCapture);
  captureRef.current = onCanvasCapture;

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!contentLayerRef.current || !captureRef.current) return;
      const url = contentLayerRef.current.toDataURL({
        pixelRatio: 1,
        x: PA,
        y: PA,
        width: printW,
        height: printH,
      });
      captureRef.current(url);
    }, 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [brushStrokes, importedImages, artwork, artboardWidth, artboardHeight]);

  useEffect(() => {
    isDrawingRef.current = false;
    setCurrentStroke([]);
    if (tool === "brush") setSelectedImageId(null);
  }, [tool]);

  /* ---------- brush ---------- */

  const saveStroke = useCallback(
    (points: number[]) => {
      if (points.length < 4) return;
      onBrushStrokesChange([
        ...brushStrokes,
        {
          id: `brush-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          points,
          color: brushColor,
          strokeWidth: brushSize,
        },
      ]);
    },
    [brushColor, brushSize, brushStrokes, onBrushStrokesChange],
  );

  const handlePointerDown = useCallback(() => {
    if (tool !== "brush" || !stageRef.current) return;
    isDrawingRef.current = true;
    const pos = stageRef.current.getPointerPosition();
    if (pos) setCurrentStroke([pos.x, pos.y]);
  }, [tool]);

  const handlePointerMove = useCallback(() => {
    if (!isDrawingRef.current || tool !== "brush" || !stageRef.current) return;
    const pos = stageRef.current.getPointerPosition();
    if (pos) setCurrentStroke((prev) => [...prev, pos.x, pos.y]);
  }, [tool]);

  const handlePointerUp = useCallback(() => {
    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;
    saveStroke(currentStroke);
    setCurrentStroke([]);
  }, [currentStroke, saveStroke]);

  const handleUndoStroke = useCallback(() => {
    if (brushStrokes.length > 0)
      onBrushStrokesChange(brushStrokes.slice(0, -1));
  }, [brushStrokes, onBrushStrokesChange]);

  const handleStageClick = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (e: any) => {
      if (tool === "select" && e.target === e.target.getStage())
        setSelectedImageId(null);
    },
    [tool],
  );

  /* ---------- image import ---------- */

  const handleImageImport = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file || importedImages.length >= MAX_IMPORTED_IMAGES) return;
      const reader = new FileReader();
      reader.onload = () => {
        const img = new window.Image();
        img.onload = () => {
          let w = img.width;
          let h = img.height;
          const maxDim = Math.min(printW * 0.5, printH * 0.5);
          if (w > maxDim || h > maxDim) {
            const r = Math.min(maxDim / w, maxDim / h);
            w = Math.round(w * r);
            h = Math.round(h * r);
          }
          onImportedImagesChange([
            ...importedImages,
            {
              id: `img-${Date.now()}`,
              dataUrl: String(reader.result),
              x: textCenterX - w / 2,
              y: textCenterY - h / 2,
              width: w,
              height: h,
            },
          ]);
        };
        img.src = String(reader.result);
      };
      reader.readAsDataURL(file);
      e.target.value = "";
    },
    [importedImages, onImportedImagesChange, printW, printH, textCenterX, textCenterY],
  );

  const handleDeleteImage = useCallback(
    (id: string) => {
      onImportedImagesChange(importedImages.filter((i) => i.id !== id));
      if (selectedImageId === id) setSelectedImageId(null);
    },
    [importedImages, onImportedImagesChange, selectedImageId],
  );

  /* ---------- export PNG (full stage with background) ---------- */

  const handleExportPng = useCallback(() => {
    if (!stageRef.current) return;
    const dataUrl = stageRef.current.toDataURL({
      pixelRatio: 2,
      x: PA,
      y: PA,
      width: printW,
      height: printH,
    });
    const link = document.createElement("a");
    link.download = `cup-design-${Date.now()}.png`;
    link.href = dataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [printW, printH]);

  return (
    <div className="grid gap-3 rounded-2xl border border-[#E6DFD9] bg-white p-4 shadow-sm">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="text-sm font-black uppercase tracking-[0.14em] text-primary">
            2D print artboard
          </div>
          <div className="mt-1 text-xs text-[#7A6F68]">
            Vùng in = ly xé phẳng. Kéo text/logo để căn vị trí.
          </div>
        </div>
        <div className="rounded-full border border-[#E6DFD9] bg-[#FAF8F6] px-3 py-1 text-xs font-bold text-[#7A6F68]">
          {artboardWidth} × {artboardHeight}
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-[#E6DFD9] bg-[#FAF8F6] p-2">
        <div className="flex gap-1">
          <Button
            type="button"
            variant={tool === "select" ? "default" : "outline"}
            size="sm"
            className="h-8 gap-1.5 rounded-lg px-3 text-xs"
            onClick={() => setTool("select")}
          >
            <MousePointer2 className="size-3.5" />
            Chọn
          </Button>
          <Button
            type="button"
            variant={tool === "brush" ? "default" : "outline"}
            size="sm"
            className="h-8 gap-1.5 rounded-lg px-3 text-xs"
            onClick={() => setTool("brush")}
          >
            <PenTool className="size-3.5" />
            Vẽ tay
          </Button>
        </div>

        <div className="h-6 w-px bg-[#E6DFD9]" />

        {tool === "brush" && (
          <>
            <div className="flex items-center gap-1.5">
              <Label className="text-xs text-[#7A6F68]">Size:</Label>
              <div className="flex gap-1">
                {BRUSH_SIZES.map((s) => (
                  <button
                    key={s}
                    type="button"
                    className={`grid size-7 place-items-center rounded-md border text-xs font-bold transition-colors ${
                      brushSize === s
                        ? "border-primary bg-primary text-white"
                        : "border-[#E6DFD9] bg-white text-[#7A6F68] hover:border-primary"
                    }`}
                    onClick={() => setBrushSize(s)}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <Label className="text-xs text-[#7A6F68]">Màu:</Label>
              <input
                type="color"
                value={brushColor}
                onChange={(e) => setBrushColor(e.target.value)}
                className="size-7 cursor-pointer rounded-md border border-[#E6DFD9] p-0.5"
              />
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 gap-1.5 rounded-lg px-2.5 text-xs"
              onClick={handleUndoStroke}
              disabled={brushStrokes.length === 0}
            >
              <Undo2 className="size-3.5" />
              Hoàn tác
            </Button>
            <div className="h-6 w-px bg-[#E6DFD9]" />
          </>
        )}

        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 gap-1.5 rounded-lg px-3 text-xs"
          onClick={() => imageInputRef.current?.click()}
          disabled={importedImages.length >= MAX_IMPORTED_IMAGES}
        >
          <ImagePlus className="size-3.5" />
          Import ({importedImages.length}/{MAX_IMPORTED_IMAGES})
        </Button>
        <input
          ref={imageInputRef}
          type="file"
          accept="image/png,image/jpeg,image/svg+xml"
          className="hidden"
          onChange={handleImageImport}
        />

        {selectedImageId && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 gap-1.5 rounded-lg border-red-300 px-2.5 text-xs text-red-600 hover:bg-red-50"
            onClick={() => handleDeleteImage(selectedImageId)}
          >
            <Trash2 className="size-3.5" />
            Xoá ảnh
          </Button>
        )}

        <div className="flex-1" />

        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 gap-1.5 rounded-lg px-3 text-xs"
          onClick={handleExportPng}
        >
          <Download className="size-3.5" />
          Export PNG
        </Button>
      </div>

      {/* Print‑height slider */}
      <div className="flex items-center gap-3">
        <Label className="shrink-0 text-xs font-bold text-[#7A6F68]">
          Vùng in (cao):
        </Label>
        <input
          type="range"
          min={40}
          max={100}
          step={5}
          value={printHeightPct}
          onChange={(e) => onPrintHeightChange(Number(e.target.value))}
          className="h-1.5 flex-1 cursor-pointer appearance-none rounded-full bg-[#E6DFD9] accent-[#5C3D2E]"
        />
        <span className="min-w-14 text-right text-xs font-bold text-[#7A6F68]">
          {printHeightPct}%
          <span className="ml-1 text-[10px] font-normal">
            {printHeightPct >= 80 ? "(sát miệng)" : printHeightPct <= 50 ? "(xa miệng)" : ""}
          </span>
        </span>
      </div>

      {/* Canvas – two layers: bg (decoration) + content (captured for 3D) */}
      <div
        className="overflow-auto rounded-xl border border-[#E6DFD9] bg-[linear-gradient(90deg,#E6DFD9_1px,transparent_1px),linear-gradient(180deg,#E6DFD9_1px,transparent_1px)] bg-[size:24px_24px] p-3"
        style={{ cursor: tool === "brush" ? "crosshair" : "default" }}
      >
        <Stage
          ref={stageRef}
          width={artboardWidth}
          height={artboardHeight}
          className="mx-auto block"
          onMouseDown={(e) => {
            handleStageClick(e);
            handlePointerDown();
          }}
          onMouseMove={handlePointerMove}
          onMouseUp={handlePointerUp}
          onTouchStart={handlePointerDown}
          onTouchMove={handlePointerMove}
          onTouchEnd={handlePointerUp}
        >
          {/* Background layer – NOT captured for 3D (cup color + border) */}
          <Layer listening={false}>
            <Rect
              x={0}
              y={0}
              width={artboardWidth}
              height={artboardHeight}
              fill={cupColor}
              cornerRadius={8}
            />
            <Rect
              x={PA}
              y={PA}
              width={printW}
              height={printH}
              cornerRadius={6}
              fill="transparent"
              stroke="#5C3D2E"
              strokeWidth={2}
              dash={[8, 6]}
            />
            <Text
              x={PA + 10}
              y={PA + 8}
              text="PRINT AREA"
              fontSize={11}
              fontStyle="bold"
              fill="#5C3D2E"
              opacity={0.5}
            />
          </Layer>

          {/* Content layer – captured with transparent background for 3D wrap */}
          <Layer ref={contentLayerRef}>
            {/* Brush strokes */}
            {brushStrokes.map((stroke) => (
              <Line
                key={stroke.id}
                points={stroke.points}
                stroke={stroke.color}
                strokeWidth={stroke.strokeWidth}
                tension={0.5}
                lineCap="round"
                lineJoin="round"
                globalCompositeOperation="source-over"
                listening={false}
              />
            ))}

            {/* Live stroke */}
            {currentStroke.length >= 2 && (
              <Line
                points={currentStroke}
                stroke={brushColor}
                strokeWidth={brushSize}
                tension={0.5}
                lineCap="round"
                lineJoin="round"
                globalCompositeOperation="source-over"
                listening={false}
              />
            )}

            {/* Imported images */}
            {importedImages.map((img) => (
              <ImportedImageLayer
                key={img.id}
                data={img}
                isSelected={tool === "select" && selectedImageId === img.id}
                selectable={tool === "select"}
                onSelect={() => setSelectedImageId(img.id)}
                onChange={(updated) => {
                  onImportedImagesChange(
                    importedImages.map((i) =>
                      i.id === updated.id ? updated : i,
                    ),
                  );
                }}
              />
            ))}

            {/* Main text */}
            <Text
              x={textCenterX + artwork.offsetX}
              y={textCenterY + artwork.offsetY}
              text={artwork.text}
              fontSize={Math.round(32 * artwork.scale)}
              fontStyle="bold"
              fill={artwork.fill}
              rotation={artwork.rotation}
              draggable={tool === "select"}
              align="center"
              offsetX={artwork.text.length * 8}
              onDragEnd={(event) => {
                onArtworkChange({
                  ...artwork,
                  offsetX: Math.round(event.target.x() - textCenterX),
                  offsetY: Math.round(event.target.y() - textCenterY),
                });
              }}
            />
          </Layer>
        </Stage>
      </div>

      {/* Footer */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-semibold text-[#7A6F68]">
        <span>
          Offset X/Y: {artwork.offsetX}, {artwork.offsetY}
        </span>
        <div className="flex items-center gap-3">
          {brushStrokes.length > 0 && (
            <span>{brushStrokes.length} nét vẽ</span>
          )}
          {importedImages.length > 0 && (
            <span>{importedImages.length} ảnh import</span>
          )}
        </div>
      </div>
    </div>
  );
}
