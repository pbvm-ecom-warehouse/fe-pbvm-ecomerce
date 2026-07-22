"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Download,
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type {
  CupSize,
  DesignArtworkLayer,
  DesignBrushLayer,
  DesignImageLayer,
  DesignTextLayer,
} from "@/types/api";

import { generateArtworkDataUrl } from "../services/artwork-generator.service";
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
      img.crossOrigin = "anonymous";
      img.onload = () => {
        if (!cancelled) setImages((cur) => ({ ...cur, [layer.id]: img }));
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
}: ArtworkEditor2DProps) {
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
    function updateWidth() {
      if (containerRef.current) {
        const w = containerRef.current.clientWidth - 20;
        if (w > 0) setContainerWidth(w);
      }
    }
    updateWidth();
    window.addEventListener("resize", updateWidth);
    return () => window.removeEventListener("resize", updateWidth);
  }, []);

  const effectiveWidth = useMemo(() => {
    return Math.max(dimensions.width, containerWidth);
  }, [dimensions.width, containerWidth]);

  const effectivePrintArea = useMemo(() => {
    return {
      x: 32,
      y: dimensions.printArea.y,
      width: effectiveWidth - 64,
      height: dimensions.printArea.height,
    };
  }, [effectiveWidth, dimensions.printArea.y, dimensions.printArea.height]);

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
        pixelRatio: 1,
      });
      onTextureChange(dataUrl);
    }, 300);
    return () => window.clearTimeout(id);
  }, [effectivePrintArea, layers, activeStroke, onTextureChange]);

  /* ── Helpers ── */
  function getPointer() {
    const pointer = stageRef.current?.getPointerPosition();
    return pointer ? [pointer.x, pointer.y] : null;
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
    if (imageLayerCount >= MAX_IMAGE_LAYERS) return;
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
    if (!file || imageLayerCount >= MAX_IMAGE_LAYERS || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") addImageLayer(reader.result, "upload");
    };
    reader.readAsDataURL(file);
  }

  function handleGenerateArtwork() {
    if (imageLayerCount >= MAX_IMAGE_LAYERS) return;
    addImageLayer(generateArtworkDataUrl(aiPrompt), "ai", aiPrompt);
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
    <section className="flex flex-col overflow-hidden rounded-xl border border-border bg-white shadow-sm">
      {/* ── UNIFIED FULL-WIDTH STRETCHED TOOLBAR ── */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 border-b border-border bg-white px-3 py-2 text-xs w-full">
        {/* LEFT GROUP: Title, Mode Toggles & Brush Controls */}
        <div className="flex items-center gap-2 flex-wrap shrink-0">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-black uppercase tracking-wide text-[#253D4E]">2D Print Artboard</span>
            <span className="text-[9px] text-slate-500 font-bold bg-slate-100 px-1.5 py-0.5 rounded">
              {effectiveWidth}×{effectivePrintArea.height}px
            </span>
          </div>

          <div className="h-4 w-px bg-border mx-0.5 hidden sm:block" />

          {/* Mode Toggles */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              className={cn(
                "flex h-7 items-center gap-1 rounded-md border px-2.5 text-[10.5px] font-bold transition-all cursor-pointer",
                tool === "select"
                  ? "border-primary bg-primary text-primary-foreground shadow-2xs"
                  : "border-border bg-muted/30 text-[#253D4E] hover:bg-muted",
              )}
              onClick={() => setTool("select")}
            >
              <MousePointer2 className="size-3" /> Chọn
            </button>
            <button
              type="button"
              className={cn(
                "flex h-7 items-center gap-1 rounded-md border px-2.5 text-[10.5px] font-bold transition-all cursor-pointer",
                tool === "brush"
                  ? "border-primary bg-primary text-primary-foreground shadow-2xs"
                  : "border-border bg-muted/30 text-[#253D4E] hover:bg-muted",
              )}
              onClick={() => setTool("brush")}
            >
              <Paintbrush className="size-3" /> Vẽ tay
            </button>
            <button
              type="button"
              disabled={imageLayerCount >= MAX_IMAGE_LAYERS}
              className="flex h-7 items-center gap-1 rounded-md border border-border bg-muted/30 px-2.5 text-[10.5px] font-bold text-[#253D4E] hover:bg-muted transition disabled:opacity-40 cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              <ImagePlus className="size-3" />
              Hình ({imageLayerCount}/{MAX_IMAGE_LAYERS})
            </button>
          </div>

          <div className="h-4 w-px bg-border mx-0.5 hidden md:block" />

          {/* Brush Color & Size */}
          <div className={cn("flex items-center gap-1.5 transition-opacity", tool !== "brush" && "opacity-50")}>
            <input
              type="color"
              aria-label="Màu nét vẽ"
              value={brushColor}
              onChange={(e) => setBrushColor(e.target.value)}
              className="h-7 w-7 cursor-pointer rounded-md border border-border bg-white p-0.5"
            />
            <div className="flex items-center gap-1">
              {BRUSH_SIZES.map((bs) => (
                <button
                  key={bs}
                  type="button"
                  aria-label={`Brush size ${bs}`}
                  className={cn(
                    "h-7 w-7 rounded-md border text-[10px] font-black transition-all cursor-pointer",
                    brushSize === bs
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-white text-[#253D4E] hover:bg-muted",
                  )}
                  onClick={() => setBrushSize(bs)}
                >
                  {bs}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* MIDDLE-RIGHT GROUP: STRETCHED INPUTS & ACTIONS (FILLS REMAINING SPACE) */}
        <div className="flex items-center gap-2 flex-1 min-w-[300px] justify-end">
          {/* Text Input (flex-1 to stretch) */}
          <div className="flex items-center gap-1 flex-1 min-w-[120px] max-w-[220px]">
            <Input
              id="editor-text"
              value={textValue}
              onChange={(e) => setTextValue(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addTextLayer()}
              placeholder="Nhập chữ..."
              className="h-7 rounded-md bg-white text-[11px] px-2.5 flex-1"
            />
            <Button
              type="button"
              aria-label="Thêm text layer"
              size="icon"
              variant="outline"
              className="h-7 w-7 rounded-md shrink-0 cursor-pointer"
              onClick={addTextLayer}
            >
              <Type className="size-3.5" />
            </Button>
          </div>

          {/* AI Input (flex-1 to stretch) */}
          <div className="flex items-center gap-1 flex-1 min-w-[140px] max-w-[240px]">
            <Input
              id="editor-ai"
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleGenerateArtwork()}
              disabled={imageLayerCount >= MAX_IMAGE_LAYERS}
              placeholder="Prompt AI..."
              className="h-7 rounded-md bg-white text-[11px] px-2.5 flex-1"
            />
            <Button
              type="button"
              aria-label="Generate hình AI"
              size="icon"
              variant="outline"
              className="h-7 w-7 rounded-md shrink-0 cursor-pointer"
              disabled={imageLayerCount >= MAX_IMAGE_LAYERS}
              onClick={handleGenerateArtwork}
            >
              <Sparkles className="size-3.5" />
            </Button>
          </div>

          <div className="h-4 w-px bg-border mx-0.5 shrink-0" />

          {/* Actions */}
          <div className="flex items-center gap-1 shrink-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7 gap-1 rounded-md px-2.5 text-[10.5px] font-bold cursor-pointer"
              onClick={undoLastStroke}
            >
              <RotateCcw className="size-3" /> Undo
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7 gap-1 rounded-md px-2.5 text-[10.5px] font-bold text-rose-600 border-rose-200 hover:bg-rose-50 cursor-pointer"
              disabled={!selectedLayerId}
              onClick={deleteSelectedLayer}
            >
              <Trash2 className="size-3" /> Xóa
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7 gap-1 rounded-md border-slate-200 bg-slate-50 px-2.5 text-[10.5px] font-bold text-[#253D4E] hover:bg-slate-100 cursor-pointer"
              onClick={exportPng}
            >
              <Download className="size-3" /> Export PNG
            </Button>
          </div>
        </div>
      </div>

      {/* ── Canvas ── */}
      <div ref={containerRef} className="overflow-hidden bg-[linear-gradient(#e5e5e5_1px,transparent_1px),linear-gradient(90deg,#e5e5e5_1px,transparent_1px)] bg-[size:20px_20px] p-2.5">
        <Stage
          ref={stageRef}
          width={effectiveWidth}
          height={dimensions.height}
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
              width={effectiveWidth - 40}
              height={dimensions.height - 40}
              cornerRadius={24}
              fill={cupColor}
              stroke="#D7C4B7"
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
    </section>
  );
}
