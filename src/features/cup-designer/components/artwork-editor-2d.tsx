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
  const stageRef = useRef<Konva.Stage | null>(null);
  const contentLayerRef = useRef<Konva.Layer | null>(null);
  const transformerRef = useRef<Konva.Transformer | null>(null);
  const images = useLoadedImages(layers);
  const dimensions = getArtboardDimensions(size, printHeightPercent);
  const imageLayerCount = getImageLayerCount(layers);

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
        x: dimensions.printArea.x,
        y: dimensions.printArea.y,
        width: dimensions.printArea.width,
        height: dimensions.printArea.height,
        pixelRatio: 1,
      });
      onTextureChange(dataUrl);
    }, 300);
    return () => window.clearTimeout(id);
  }, [dimensions.printArea, layers, activeStroke, onTextureChange]);

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

      {/* ── Primary toolbar ── */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-white px-4 py-2.5">
        <div>
          <h2 className="text-[11px] font-black uppercase tracking-wide text-[#253D4E]">2D Print Artboard</h2>
          <p className="text-[10px] text-muted-foreground font-medium">
            {dimensions.width} × {dimensions.printArea.height}px content area
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {/* Mode toggles */}
          <button
            type="button"
            className={cn(
              "flex h-8 items-center gap-1.5 rounded-md border px-2.5 text-xs font-bold transition-all",
              tool === "select"
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-muted/40 text-[#253D4E] hover:bg-muted",
            )}
            onClick={() => setTool("select")}
          >
            <MousePointer2 className="size-3.5" /> Chọn
          </button>
          <button
            type="button"
            className={cn(
              "flex h-8 items-center gap-1.5 rounded-md border px-2.5 text-xs font-bold transition-all",
              tool === "brush"
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-muted/40 text-[#253D4E] hover:bg-muted",
            )}
            onClick={() => setTool("brush")}
          >
            <Paintbrush className="size-3.5" /> Vẽ tay
          </button>

          <div className="h-5 w-px bg-border mx-1" />

          {/* Import image */}
          <button
            type="button"
            disabled={imageLayerCount >= MAX_IMAGE_LAYERS}
            className="flex h-8 items-center gap-1.5 rounded-md border border-border bg-muted/40 px-2.5 text-xs font-bold text-[#253D4E] hover:bg-muted transition disabled:opacity-40"
            onClick={() => fileInputRef.current?.click()}
          >
            <ImagePlus className="size-3.5" />
            Hình ({imageLayerCount}/{MAX_IMAGE_LAYERS})
          </button>

          {/* Export PNG */}
          <button
            type="button"
            className="flex h-8 items-center gap-1.5 rounded-md border border-border bg-muted/40 px-2.5 text-xs font-bold text-[#253D4E] hover:bg-muted transition"
            onClick={exportPng}
          >
            <Download className="size-3.5" /> Export PNG
          </button>
        </div>
      </div>

      {/* ── Contextual secondary toolbar ── */}
      <div className="flex flex-wrap items-end gap-4 border-b border-border bg-muted/20 px-4 py-2.5">
        {/* Brush controls (always visible, slightly dimmed when not in brush mode) */}
        <div className={cn("flex items-center gap-2 transition-opacity", tool !== "brush" && "opacity-50")}>
          <Paintbrush className="size-3.5 text-primary shrink-0" />
          <Label className="text-[10px] font-bold text-muted-foreground shrink-0">Vẽ tay</Label>
          <input
            type="color"
            aria-label="Màu nét vẽ"
            value={brushColor}
            onChange={(e) => setBrushColor(e.target.value)}
            className="h-6 w-9 cursor-pointer rounded border border-border bg-white p-0.5"
          />
          <div className="flex items-center gap-1">
            {BRUSH_SIZES.map((bs) => (
              <button
                key={bs}
                type="button"
                aria-label={`Brush size ${bs}`}
                className={cn(
                  "h-7 w-8 rounded border text-[10px] font-black transition-all",
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

        <div className="h-5 w-px bg-border hidden sm:block" />

        {/* Text tool */}
        <div className="flex items-center gap-2">
          <Type className="size-3.5 text-primary shrink-0" />
          <Label htmlFor="editor-text" className="text-[10px] font-bold text-muted-foreground shrink-0">
            Text
          </Label>
          <div className="flex gap-1">
            <Input
              id="editor-text"
              value={textValue}
              onChange={(e) => setTextValue(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addTextLayer()}
              className="h-7 w-32 rounded-md bg-white text-[10px]"
            />
            <Button
              type="button"
              aria-label="Thêm text layer"
              size="icon"
              variant="outline"
              className="h-7 w-7 rounded-md"
              onClick={addTextLayer}
            >
              <Type className="size-3.5" />
            </Button>
          </div>
        </div>

        <div className="h-5 w-px bg-border hidden sm:block" />

        {/* AI Generate */}
        <div className="flex items-center gap-2">
          <Sparkles className="size-3.5 text-primary shrink-0" />
          <Label htmlFor="editor-ai" className="text-[10px] font-bold text-muted-foreground shrink-0">
            AI
          </Label>
          <div className="flex gap-1">
            <Input
              id="editor-ai"
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleGenerateArtwork()}
              disabled={imageLayerCount >= MAX_IMAGE_LAYERS}
              className="h-7 w-36 rounded-md bg-white text-[10px]"
            />
            <Button
              type="button"
              aria-label="Generate hình AI"
              size="icon"
              variant="outline"
              className="h-7 w-7 rounded-md"
              disabled={imageLayerCount >= MAX_IMAGE_LAYERS}
              onClick={handleGenerateArtwork}
            >
              <Sparkles className="size-3.5" />
            </Button>
          </div>
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Actions */}
        <div className="flex items-center gap-1.5">
          <Button
            type="button"
            variant="outline"
            className="h-7 gap-1 rounded-md px-2.5 text-[10px] font-bold"
            onClick={undoLastStroke}
          >
            <RotateCcw className="size-3" /> Undo
          </Button>
          <Button
            type="button"
            variant="outline"
            className="h-7 gap-1 rounded-md px-2.5 text-[10px] font-bold text-rose-600 border-rose-200 hover:bg-rose-50"
            disabled={!selectedLayerId}
            onClick={deleteSelectedLayer}
          >
            <Trash2 className="size-3" /> Xóa layer
          </Button>
        </div>
      </div>

      {/* ── Canvas ── */}
      <div className="overflow-auto bg-[linear-gradient(#e5e5e5_1px,transparent_1px),linear-gradient(90deg,#e5e5e5_1px,transparent_1px)] bg-[size:20px_20px] p-4">
        <Stage
          ref={stageRef}
          width={dimensions.width}
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
              x={24}
              y={24}
              width={dimensions.width - 48}
              height={dimensions.height - 48}
              cornerRadius={28}
              fill={cupColor}
              stroke="#D7C4B7"
              strokeWidth={1}
            />
            <Rect
              x={dimensions.printArea.x}
              y={dimensions.printArea.y}
              width={dimensions.printArea.width}
              height={dimensions.printArea.height}
              cornerRadius={14}
              fill="rgba(255,255,255,0.55)"
              stroke="#253D4E"
              strokeWidth={2}
              dash={[8, 7]}
            />
            <Text
              x={dimensions.printArea.x + 16}
              y={dimensions.printArea.y + 16}
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
