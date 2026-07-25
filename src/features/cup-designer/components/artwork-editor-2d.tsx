"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Download,
  FilePlus,
  ImagePlus,
  MousePointer2,
  Paintbrush,
  RotateCcw,
  Sparkles,
  Trash2,
  Type,
} from "lucide-react";

import {
  Image as KonvaImage,
  Layer,
  Line,
  Rect,
  Stage,
  Text,
  Transformer,
} from "react-konva";
import type Konva from "konva";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type {
  CupSize,
  DesignArtworkLayer,
  DesignBrushLayer,
  DesignImageLayer,
  DesignTextLayer,
} from "@/types/api";

import { generateBananaLogoArtworkAsync } from "../services/artwork-generator.service";
import { getArtboardDimensions } from "../utils/artwork";

type ToolMode = "select" | "brush";

type ArtworkEditor2DProps = {
  size: CupSize;
  cupColor: string;
  printHeightPercent: number;
  layers: DesignArtworkLayer[];
  selectedLayerId: string | null;
  onLayersChange: (layers: DesignArtworkLayer[]) => void;
  onSelectedLayerChange: (layerId: string | null) => void;
  onTextureChange: (dataUrl: string) => void;
  savedDesignsNode?: React.ReactNode;
};

const BRUSH_SIZES = [3, 5, 8, 12] as const;
const MAX_IMAGE_LAYERS = 2;

function createLayerId(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

function getImageLayerCount(layers: DesignArtworkLayer[]) {
  return layers.filter((l) => l.type === "image").length;
}

function useLoadedImages(layers: DesignArtworkLayer[]) {
  const [images, setImages] = useState<Record<string, HTMLImageElement>>({});
  const signature = useMemo(
    () =>
      layers
        .filter((l): l is DesignImageLayer => l.type === "image")
        .map((l) => `${l.id}:${l.src}`)
        .join("|"),
    [layers],
  );

  useEffect(() => {
    let cancelled = false;
    const imageLayers = layers.filter(
      (l): l is DesignImageLayer => l.type === "image",
    );
    imageLayers.forEach((layer) => {
      const img = new window.Image();
      if (!layer.src.startsWith("data:")) {
        img.crossOrigin = "anonymous";
      }
      img.onload = () => {
        if (!cancelled) setImages((cur) => ({ ...cur, [layer.id]: img }));
      };
      img.onerror = (err) => {
        console.error("Failed to load layer image:", layer.id, err);
      };
      img.src = layer.src;
    });
    return () => { cancelled = true; };
  }, [layers, signature]);

  return images;
}

export function ArtworkEditor2D({
  size,
  cupColor,
  printHeightPercent,
  layers,
  selectedLayerId,
  onLayersChange,
  onSelectedLayerChange,
  onTextureChange,
  savedDesignsNode,
}: ArtworkEditor2DProps) {
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const [tool, setTool] = useState<ToolMode>("select");
  const [brushColor, setBrushColor] = useState("#3BB77E");
  const [brushSize, setBrushSize] = useState<(typeof BRUSH_SIZES)[number]>(5);
  const [activeStroke, setActiveStroke] = useState<number[] | null>(null);
  const [textValue, setTextValue] = useState("TEA HOUSE");
  const [aiPrompt, setAiPrompt] = useState("Tea House Classic");

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const stageRef = useRef<Konva.Stage | null>(null);
  const contentLayerRef = useRef<Konva.Layer | null>(null);
  const transformerRef = useRef<Konva.Transformer | null>(null);
  const images = useLoadedImages(layers);
  const dimensions = getArtboardDimensions(size, printHeightPercent);
  const imageLayerCount = getImageLayerCount(layers);

  const [containerWidth, setContainerWidth] = useState<number>(0);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = Math.floor(entry.contentRect.width - 24);
        if (w > 0) setContainerWidth(w);
      }
    });

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const baseWidth = dimensions.width;
  const baseHeight = dimensions.height;

  const scaleRatio = useMemo(() => {
    if (!containerWidth || containerWidth <= 0) return 0.65;
    return containerWidth / baseWidth;
  }, [containerWidth, baseWidth]);

  const stageWidth = Math.round(baseWidth * scaleRatio);
  const stageHeight = Math.round(baseHeight * scaleRatio);

  const effectivePrintArea = useMemo(() => {
    return dimensions.printArea;
  }, [dimensions.printArea]);

  // Sync transformer to selected layer
  useEffect(() => {
    const transformer = transformerRef.current;
    const stage = stageRef.current;
    if (!transformer || !stage) return;
    const selectedNode = selectedLayerId ? stage.findOne(`#${selectedLayerId}`) : null;
    transformer.nodes(selectedNode ? [selectedNode] : []);
    transformer.getLayer()?.batchDraw();
  }, [selectedLayerId, layers]);

  // Export texture on every layer change (debounced)
  useEffect(() => {
    const id = window.setTimeout(() => {
      const layer = contentLayerRef.current;
      if (!layer) return;
      const dataUrl = layer.toDataURL({
        x: effectivePrintArea.x,
        y: effectivePrintArea.y,
        width: effectivePrintArea.width,
        height: effectivePrintArea.height,
        pixelRatio: 2,
      });
      onTextureChange(dataUrl);
    }, 300);
    return () => window.clearTimeout(id);
  }, [effectivePrintArea, layers, activeStroke, onTextureChange]);

  /* ── Helpers ── */
  function getPointer() {
    const stage = stageRef.current;
    if (!stage) return null;
    const pointer = stage.getPointerPosition();
    if (!pointer) return null;
    return [pointer.x / scaleRatio, pointer.y / scaleRatio];
  }

  function updateLayer(layerId: string, patch: Partial<DesignArtworkLayer>) {
    onLayersChange(
      layers.map((l) =>
        l.id === layerId ? ({ ...l, ...patch } as DesignArtworkLayer) : l,
      ),
    );
  }

  /* ── Stage events ── */
  function handleStagePointerDown(event: Konva.KonvaEventObject<MouseEvent | TouchEvent>) {
    if (tool === "select") {
      if (event.target === event.target.getStage()) onSelectedLayerChange(null);
      return;
    }
    const pointer = getPointer();
    if (pointer) setActiveStroke(pointer);
  }

  function handleStagePointerMove() {
    if (tool !== "brush" || !activeStroke) return;
    const pointer = getPointer();
    if (pointer) setActiveStroke((cur) => (cur ? [...cur, ...pointer] : cur));
  }

  function handleStagePointerUp() {
    if (!activeStroke || activeStroke.length < 4) { setActiveStroke(null); return; }
    const brushLayer: DesignBrushLayer = {
      id: createLayerId("brush"),
      type: "brush",
      points: activeStroke,
      color: brushColor,
      size: brushSize,
    };
    onLayersChange([...layers, brushLayer]);
    setActiveStroke(null);
  }

  /* ── Layer add helpers ── */
  function addTextLayer() {
    const text = textValue.trim();
    if (!text) return;
    const textLayer: DesignTextLayer = {
      id: createLayerId("text"),
      type: "text",
      text,
      x: dimensions.printArea.x + dimensions.printArea.width / 2 - 90,
      y: dimensions.printArea.y + dimensions.printArea.height / 2 - 24,
      color: brushColor,
      fontSize: 38,
      rotation: 0,
    };
    onLayersChange([...layers, textLayer]);
    onSelectedLayerChange(textLayer.id);
    setTool("select");
  }

  function addImageLayer(src: string, source: DesignImageLayer["source"], prompt?: string) {
    const imageLayer: DesignImageLayer = {
      id: createLayerId(source),
      type: "image",
      src,
      x: dimensions.printArea.x + dimensions.printArea.width / 2 - 95,
      y: dimensions.printArea.y + dimensions.printArea.height / 2 - 55,
      width: 190,
      height: 110,
      rotation: 0,
      source,
      prompt,
    };
    onLayersChange([...layers, imageLayer]);
    onSelectedLayerChange(imageLayer.id);
    setTool("select");
  }

  function handleImport(file: File | undefined) {
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") addImageLayer(reader.result, "upload");
    };
    reader.readAsDataURL(file);
  }

  async function handleGenerateArtwork() {
    if (imageLayerCount >= MAX_IMAGE_LAYERS) return;
    try {
      const src = await generateBananaLogoArtworkAsync({ brandName: aiPrompt }, aiPrompt);
      addImageLayer(src, "ai", aiPrompt);
    } catch (e) {
      console.error("AI Artwork Generation Error:", e);
    }
  }

  function undoLastStroke() {
    const idx = [...layers]
      .map((l, i) => ({ l, i }))
      .reverse()
      .find(({ l }) => l.type === "brush")?.i;
    if (idx !== undefined) onLayersChange(layers.filter((_, i) => i !== idx));
  }

  function deleteSelectedLayer() {
    if (!selectedLayerId) return;
    onLayersChange(layers.filter((l) => l.id !== selectedLayerId));
    onSelectedLayerChange(null);
  }

  function clearAllLayers() {
    if (layers.length === 0) return;
    setShowClearConfirm(true);
  }



  function exportPng() {
    const layer = contentLayerRef.current;
    if (!layer) return;
    const dataUrl = layer.toDataURL({
      x: dimensions.printArea.x,
      y: dimensions.printArea.y,
      width: dimensions.printArea.width,
      height: dimensions.printArea.height,
      pixelRatio: 2,
    });
    const link = document.createElement("a");
    link.download = `pbvm-cup-design-${size.toLowerCase()}@2x.png`;
    link.href = dataUrl;
    link.click();
  }

  /* ─── Render ─── */
  return (
    <TooltipProvider>
      <section className="flex flex-col overflow-hidden rounded-xl border border-border bg-white shadow-sm">
        {/* ── HIGH-END CANVA/FIGMA STYLE EDITOR TOOLBAR ── */}
        <div className="border-b border-slate-200 bg-white text-xs w-full">
          {/* ROW 1: HEADER & DOCUMENT ACTIONS */}
          <div className="flex items-center justify-between gap-2 px-3.5 py-2.5 bg-slate-50/80 border-b border-slate-200/80">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-wider text-[#253D4E]">2D Print Artboard</span>
              <span className="text-[9.5px] font-bold text-slate-500 bg-white border border-slate-200 px-2 py-0.5 rounded-md shadow-2xs">
                {baseWidth}×{effectivePrintArea.height}px
              </span>
            </div>

            <div className="flex items-center gap-2">
              {savedDesignsNode}

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-7 text-[10.5px] font-bold text-amber-800 border-amber-200/90 bg-amber-50/60 hover:bg-amber-100/80 px-2.5 rounded-lg cursor-pointer disabled:opacity-50 gap-1"
                    disabled={layers.length === 0}
                    onClick={clearAllLayers}
                  >
                    <FilePlus className="size-3.5 text-amber-600" />
                    <span className="hidden sm:inline">Bảng trắng</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-[11px] font-medium">
                  Xóa tất cả các layer để vẽ lại từ đầu
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-7 text-[10.5px] font-bold text-slate-700 border-slate-200 bg-white hover:bg-slate-100 px-2.5 rounded-lg cursor-pointer gap-1 shadow-2xs"
                    onClick={exportPng}
                  >
                    <Download className="size-3.5 text-slate-500" />
                    <span>Export PNG</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-[11px] font-medium">
                  Tải file thiết kế 2D phẳng dạng hình PNG
                </TooltipContent>
              </Tooltip>
            </div>
          </div>

        {/* ROW 2: EDITOR CONTROL BAR (STREAMLINED TOOLKIT) */}
        <div className="flex flex-wrap items-center justify-between gap-1.5 px-3 py-1.5 bg-white border-t border-slate-100">
          {/* Left: Tool modes & Brush controls */}
          <div className="flex items-center gap-1.5 flex-wrap shrink-0">
            <div className="flex items-center gap-1">
              <button
                type="button"
                className={cn(
                  "flex h-6.5 items-center gap-1 rounded-lg border px-2 text-[11px] font-bold transition-all cursor-pointer shadow-2xs",
                  tool === "select"
                    ? "border-emerald-600 bg-emerald-600 text-white"
                    : "border-slate-200 bg-slate-50 text-[#253D4E] hover:bg-slate-100",
                )}
                onClick={() => setTool("select")}
              >
                <MousePointer2 className="size-3" /> Chọn
              </button>
              <button
                type="button"
                className={cn(
                  "flex h-6.5 items-center gap-1 rounded-lg border px-2 text-[11px] font-bold transition-all cursor-pointer shadow-2xs",
                  tool === "brush"
                    ? "border-emerald-600 bg-emerald-600 text-white"
                    : "border-slate-200 bg-slate-50 text-[#253D4E] hover:bg-slate-100",
                )}
                onClick={() => setTool("brush")}
              >
                <Paintbrush className="size-3" /> Vẽ tay
              </button>
              <button
                type="button"
                className="flex h-6.5 items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2 text-[11px] font-bold text-[#253D4E] hover:bg-slate-100 transition cursor-pointer shadow-2xs"
                onClick={() => fileInputRef.current?.click()}
              >
                <ImagePlus className="size-3 text-slate-500" />
                Hình ({imageLayerCount})
              </button>
            </div>

            <div className="h-3.5 w-px bg-slate-200 mx-0.5" />

            {/* Brush Color & Sizes */}
            <div className={cn("flex items-center gap-1 transition-opacity", tool !== "brush" && "opacity-50")}>
              <input
                type="color"
                aria-label="Màu nét vẽ"
                value={brushColor}
                onChange={(e) => setBrushColor(e.target.value)}
                className="h-6.5 w-6.5 cursor-pointer rounded-lg border border-slate-200 bg-white p-0.5 shadow-2xs"
              />
              <div className="flex items-center gap-0.5">
                {BRUSH_SIZES.map((bs) => (
                  <button
                    key={bs}
                    type="button"
                    aria-label={`Brush size ${bs}`}
                    className={cn(
                      "h-6.5 w-6.5 rounded-lg border text-[10px] font-black transition-all cursor-pointer shadow-2xs",
                      brushSize === bs
                        ? "border-emerald-600 bg-emerald-600 text-white"
                        : "border-slate-200 bg-white text-[#253D4E] hover:bg-slate-100",
                    )}
                    onClick={() => setBrushSize(bs)}
                  >
                    {bs}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Text Input, Undo & Delete */}
          <div className="flex items-center gap-1.5 flex-wrap shrink-0 justify-end">
            <div className="flex items-center gap-1">
              <Input
                id="editor-text"
                value={textValue}
                onChange={(e) => setTextValue(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addTextLayer()}
                placeholder="Nhập chữ..."
                className="h-6.5 rounded-lg bg-white text-[11px] px-2 w-[100px] sm:w-[130px] border-slate-200"
              />
              <Button
                type="button"
                aria-label="Thêm text layer"
                size="icon"
                variant="outline"
                className="h-6.5 w-6.5 rounded-lg shrink-0 cursor-pointer border-slate-200 hover:bg-slate-50"
                onClick={addTextLayer}
              >
                <Type className="size-3 text-slate-600" />
              </Button>
            </div>

            <div className="h-3.5 w-px bg-slate-200 mx-0.5" />

            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-6.5 text-[11px] font-bold px-2 rounded-lg border-slate-200 text-slate-700 hover:bg-slate-100 cursor-pointer gap-1"
              onClick={undoLastStroke}
            >
              <RotateCcw className="size-3 text-slate-500" /> Undo
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-6.5 text-[11px] font-bold px-2 rounded-lg text-rose-600 border-rose-200 hover:bg-rose-50 cursor-pointer gap-1"
              disabled={!selectedLayerId}
              onClick={deleteSelectedLayer}
            >
              <Trash2 className="size-3" /> Xóa
            </Button>
          </div>
        </div>
      </div>

      {/* ── Canvas ── */}
      <div ref={containerRef} className="overflow-hidden bg-[linear-gradient(#e5e5e5_1px,transparent_1px),linear-gradient(90deg,#e5e5e5_1px,transparent_1px)] bg-[size:20px_20px] p-3 sm:p-4 flex items-center justify-center rounded-b-2xl w-full flex-1 min-h-[360px]">
        <Stage
          ref={stageRef}
          width={stageWidth}
          height={stageHeight}
          scaleX={scaleRatio}
          scaleY={scaleRatio}
          className="mx-auto rounded-xl bg-white shadow-md"
          onMouseDown={handleStagePointerDown}
          onMouseMove={handleStagePointerMove}
          onMouseUp={handleStagePointerUp}
          onTouchStart={handleStagePointerDown}
          onTouchMove={handleStagePointerMove}
          onTouchEnd={handleStagePointerUp}
        >
          {/* Background layer: cup silhouette + print area dashes */}
          <Layer>
            <Rect
              x={20}
              y={20}
              width={baseWidth - 40}
              height={baseHeight - 40}
              cornerRadius={24}
              fill="#FFFFFF"
              stroke="#E2E8F0"
              strokeWidth={1}
            />
            <Rect
              x={effectivePrintArea.x}
              y={effectivePrintArea.y}
              width={effectivePrintArea.width}
              height={effectivePrintArea.height}
              cornerRadius={14}
              fill="rgba(255,255,255,0.55)"
              stroke="#253D4E"
              strokeWidth={2}
              dash={[8, 7]}
            />
            <Text
              x={effectivePrintArea.x + 16}
              y={effectivePrintArea.y + 16}
              text="PRINT AREA"
              fill="#253D4E"
              fontSize={13}
              fontStyle="bold"
            />
          </Layer>

          {/* Content layer: user artwork */}
          <Layer ref={contentLayerRef}>
            {layers.map((layer) => {
              if (layer.type === "brush") {
                return (
                  <Line
                    key={layer.id}
                    points={layer.points}
                    stroke={layer.color}
                    strokeWidth={layer.size}
                    lineCap="round"
                    lineJoin="round"
                    tension={0.45}
                  />
                );
              }

              if (layer.type === "text") {
                return (
                  <Text
                    key={layer.id}
                    id={layer.id}
                    draggable={tool === "select"}
                    x={layer.x}
                    y={layer.y}
                    text={layer.text}
                    fill={layer.color}
                    fontSize={layer.fontSize}
                    fontStyle="800"
                    rotation={layer.rotation ?? 0}
                    onClick={() => onSelectedLayerChange(layer.id)}
                    onTap={() => onSelectedLayerChange(layer.id)}
                    onDragEnd={(e) =>
                      updateLayer(layer.id, { x: e.target.x(), y: e.target.y() })
                    }
                    onTransformEnd={(e) => {
                      const node = e.target;
                      updateLayer(layer.id, {
                        x: node.x(),
                        y: node.y(),
                        rotation: node.rotation(),
                        fontSize: Math.max(14, Math.round(layer.fontSize * node.scaleX())),
                      });
                      node.scaleX(1);
                      node.scaleY(1);
                    }}
                  />
                );
              }

              const img = images[layer.id];
              return img ? (
                <KonvaImage
                  key={layer.id}
                  id={layer.id}
                  image={img}
                  draggable={tool === "select"}
                  x={layer.x}
                  y={layer.y}
                  width={layer.width}
                  height={layer.height}
                  rotation={layer.rotation ?? 0}
                  onClick={() => onSelectedLayerChange(layer.id)}
                  onTap={() => onSelectedLayerChange(layer.id)}
                  onDragEnd={(e) =>
                    updateLayer(layer.id, { x: e.target.x(), y: e.target.y() })
                  }
                  onTransformEnd={(e) => {
                    const node = e.target;
                    updateLayer(layer.id, {
                      x: node.x(),
                      y: node.y(),
                      rotation: node.rotation(),
                      width: Math.max(36, node.width() * node.scaleX()),
                      height: Math.max(36, node.height() * node.scaleY()),
                    });
                    node.scaleX(1);
                    node.scaleY(1);
                  }}
                />
              ) : null;
            })}

            {/* Live brush stroke */}
            {activeStroke ? (
              <Line
                points={activeStroke}
                stroke={brushColor}
                strokeWidth={brushSize}
                lineCap="round"
                lineJoin="round"
                tension={0.45}
              />
            ) : null}

            <Transformer
              ref={transformerRef}
              rotateEnabled
              anchorSize={8}
              borderStroke="#3BB77E"
              anchorFill="#FFFFFF"
              anchorStroke="#3BB77E"
            />
          </Layer>
        </Stage>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          handleImport(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
      {/* MODAL XÁC NHẬN TẠO MỚI BẢNG TRẮNG */}
      <Dialog open={showClearConfirm} onOpenChange={setShowClearConfirm}>
        <DialogContent className="sm:max-w-md rounded-2xl bg-white border border-slate-200 p-6">
          <DialogHeader className="items-center text-center sm:items-start sm:text-left gap-1.5">
            <DialogTitle className="text-base font-bold text-slate-800">
              Tạo mới bảng trắng
            </DialogTitle>
            <DialogDescription className="text-xs font-medium text-slate-500">
              Bạn có chắc chắn muốn xóa toàn bộ logo và hình vẽ hiện tại trên ly để bắt đầu bảng trắng mới không?
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="gap-2 sm:gap-0 mt-4 flex items-center justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowClearConfirm(false)}
              className="rounded-xl text-xs font-semibold h-9 px-4 cursor-pointer"
            >
              Hủy bỏ
            </Button>
            <Button
              type="button"
              onClick={() => {
                onLayersChange([]);
                onSelectedLayerChange(null);
                setShowClearConfirm(false);
              }}
              className="rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white h-9 px-4 cursor-pointer shadow-xs border-0"
            >
              Xác nhận tạo mới
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
    </TooltipProvider>
  );
}
