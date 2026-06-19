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
  return layers.filter((layer) => layer.type === "image").length;
}

function useLoadedImages(layers: DesignArtworkLayer[]) {
  const [images, setImages] = useState<Record<string, HTMLImageElement>>({});
  const signature = useMemo(
    () =>
      layers
        .filter((layer): layer is DesignImageLayer => layer.type === "image")
        .map((layer) => `${layer.id}:${layer.src}`)
        .join("|"),
    [layers],
  );

  useEffect(() => {
    let cancelled = false;
    const imageLayers = layers.filter(
      (layer): layer is DesignImageLayer => layer.type === "image",
    );

    imageLayers.forEach((layer) => {
      const image = new window.Image();
      image.crossOrigin = "anonymous";
      image.onload = () => {
        if (cancelled) {
          return;
        }

        setImages((current) => ({ ...current, [layer.id]: image }));
      };
      image.src = layer.src;
    });

    return () => {
      cancelled = true;
    };
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
  const [brushColor, setBrushColor] = useState("#5C3D2E");
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

  useEffect(() => {
    const transformer = transformerRef.current;
    const stage = stageRef.current;

    if (!transformer || !stage) {
      return;
    }

    const selectedNode = selectedLayerId
      ? stage.findOne(`#${selectedLayerId}`)
      : null;
    transformer.nodes(selectedNode ? [selectedNode] : []);
    transformer.getLayer()?.batchDraw();
  }, [selectedLayerId, layers]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      const layer = contentLayerRef.current;

      if (!layer) {
        return;
      }

      const dataUrl = layer.toDataURL({
        x: dimensions.printArea.x,
        y: dimensions.printArea.y,
        width: dimensions.printArea.width,
        height: dimensions.printArea.height,
        pixelRatio: 2,
      });

      onTextureChange(dataUrl);
    }, 300);

    return () => window.clearTimeout(timeoutId);
  }, [dimensions.printArea, layers, activeStroke, onTextureChange]);

  function getPointer() {
    const stage = stageRef.current;
    const pointer = stage?.getPointerPosition();

    if (!pointer) {
      return null;
    }

    return [pointer.x, pointer.y];
  }

  function updateLayer(layerId: string, patch: Partial<DesignArtworkLayer>) {
    onLayersChange(
      layers.map((layer) =>
        layer.id === layerId
          ? ({ ...layer, ...patch } as DesignArtworkLayer)
          : layer,
      ),
    );
  }

  function handleStagePointerDown(
    event: Konva.KonvaEventObject<MouseEvent | TouchEvent>,
  ) {
    const clickedStage = event.target === event.target.getStage();

    if (tool === "select") {
      if (clickedStage) {
        onSelectedLayerChange(null);
      }
      return;
    }

    const pointer = getPointer();
    if (!pointer) {
      return;
    }

    setActiveStroke(pointer);
  }

  function handleStagePointerMove() {
    if (tool !== "brush" || !activeStroke) {
      return;
    }

    const pointer = getPointer();
    if (!pointer) {
      return;
    }

    setActiveStroke((current) =>
      current ? [...current, ...pointer] : current,
    );
  }

  function handleStagePointerUp() {
    if (!activeStroke || activeStroke.length < 4) {
      setActiveStroke(null);
      return;
    }

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

  function addTextLayer() {
    const text = textValue.trim();

    if (!text) {
      return;
    }

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

  function addImageLayer(
    src: string,
    source: DesignImageLayer["source"],
    prompt?: string,
  ) {
    if (imageLayerCount >= MAX_IMAGE_LAYERS) {
      return;
    }

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
    if (!file || imageLayerCount >= MAX_IMAGE_LAYERS) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        addImageLayer(reader.result, "upload");
      }
    };
    reader.readAsDataURL(file);
  }

  function handleGenerateArtwork() {
    if (imageLayerCount >= MAX_IMAGE_LAYERS) {
      return;
    }

    const dataUrl = generateArtworkDataUrl(aiPrompt);
    addImageLayer(dataUrl, "ai", aiPrompt);
  }

  function undoLastStroke() {
    const lastBrushIndex = [...layers]
      .map((layer, index) => ({ layer, index }))
      .reverse()
      .find(({ layer }) => layer.type === "brush")?.index;

    if (lastBrushIndex === undefined) {
      return;
    }

    onLayersChange(layers.filter((_, index) => index !== lastBrushIndex));
  }

  function deleteSelectedLayer() {
    if (!selectedLayerId) {
      return;
    }

    onLayersChange(layers.filter((layer) => layer.id !== selectedLayerId));
    onSelectedLayerChange(null);
  }

  function exportPng() {
    const layer = contentLayerRef.current;
    if (!layer) {
      return;
    }

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

  return (
    <section className="rounded-lg border border-[#E6DFD9] bg-white">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E6DFD9] px-4 py-3">
        <div>
          <h2 className="text-sm font-black uppercase text-[#5C3D2E]">
            2D print artboard
          </h2>
          <p className="text-[11px] font-medium text-[#7A6F68]">
            {dimensions.width} x {dimensions.printArea.height}px content
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            size="sm"
            variant={tool === "select" ? "default" : "outline"}
            className="h-9 gap-1.5 rounded-md text-xs"
            onClick={() => setTool("select")}
          >
            <MousePointer2 className="size-3.5" />
            Chọn
          </Button>
          <Button
            type="button"
            size="sm"
            variant={tool === "brush" ? "default" : "outline"}
            className="h-9 gap-1.5 rounded-md text-xs"
            onClick={() => setTool("brush")}
          >
            <Paintbrush className="size-3.5" />
            Vẽ tay
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-9 gap-1.5 rounded-md text-xs"
            disabled={imageLayerCount >= MAX_IMAGE_LAYERS}
            onClick={() => fileInputRef.current?.click()}
          >
            <ImagePlus className="size-3.5" />
            Import ({imageLayerCount}/2)
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-9 gap-1.5 rounded-md text-xs"
            onClick={exportPng}
          >
            <Download className="size-3.5" />
            Export PNG
          </Button>
        </div>
      </div>

      <div className="grid gap-4 p-4 min-[2200px]:grid-cols-[minmax(0,1fr)_260px]">
        <div className="overflow-auto rounded-lg border border-[#E6DFD9] bg-[linear-gradient(#eee_1px,transparent_1px),linear-gradient(90deg,#eee_1px,transparent_1px)] bg-[size:24px_24px] p-4">
          <Stage
            ref={stageRef}
            width={dimensions.width}
            height={dimensions.height}
            className="mx-auto rounded-lg bg-white shadow-sm"
            onMouseDown={handleStagePointerDown}
            onMouseMove={handleStagePointerMove}
            onMouseUp={handleStagePointerUp}
            onTouchStart={handleStagePointerDown}
            onTouchMove={handleStagePointerMove}
            onTouchEnd={handleStagePointerUp}
          >
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
                stroke="#5C3D2E"
                strokeWidth={2}
                dash={[8, 7]}
              />
              <Text
                x={dimensions.printArea.x + 16}
                y={dimensions.printArea.y + 16}
                text="PRINT AREA"
                fill="#5C3D2E"
                fontSize={14}
                fontStyle="bold"
              />
            </Layer>

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
                      onDragEnd={(event) =>
                        updateLayer(layer.id, {
                          x: event.target.x(),
                          y: event.target.y(),
                        })
                      }
                      onTransformEnd={(event) => {
                        const node = event.target;
                        updateLayer(layer.id, {
                          x: node.x(),
                          y: node.y(),
                          rotation: node.rotation(),
                          fontSize: Math.max(
                            14,
                            Math.round(layer.fontSize * node.scaleX()),
                          ),
                        });
                        node.scaleX(1);
                        node.scaleY(1);
                      }}
                    />
                  );
                }

                const image = images[layer.id];

                return image ? (
                  <KonvaImage
                    key={layer.id}
                    id={layer.id}
                    image={image}
                    draggable={tool === "select"}
                    x={layer.x}
                    y={layer.y}
                    width={layer.width}
                    height={layer.height}
                    rotation={layer.rotation ?? 0}
                    onClick={() => onSelectedLayerChange(layer.id)}
                    onTap={() => onSelectedLayerChange(layer.id)}
                    onDragEnd={(event) =>
                      updateLayer(layer.id, {
                        x: event.target.x(),
                        y: event.target.y(),
                      })
                    }
                    onTransformEnd={(event) => {
                      const node = event.target;
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
                borderStroke="#5C3D2E"
                anchorFill="#FFFFFF"
                anchorStroke="#5C3D2E"
              />
            </Layer>
          </Stage>
        </div>

        <aside className="overflow-hidden rounded-lg border border-[#E6DFD9] bg-white">
          <div className="flex items-center justify-between border-b border-[#E6DFD9] bg-[#FAF8F6] px-3 py-2">
            <h3 className="text-xs font-black uppercase text-[#5C3D2E]">
              Công cụ thiết kế
            </h3>
            <span className="rounded-md border border-[#E6DFD9] bg-white px-2 py-1 text-[10px] font-black text-[#5C3D2E]">
              {layers.length} layer
            </span>
          </div>

          <div className="grid xl:grid-cols-[230px_minmax(0,1fr)_minmax(0,1fr)_146px]">
            <div className="border-b border-[#E6DFD9] p-3 xl:border-r xl:border-b-0">
              <div className="mb-2 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Paintbrush className="size-3.5 text-[#5C3D2E]" />
                  <Label className="text-[11px] font-bold text-[#5C3D2E]">
                    Vẽ tay
                  </Label>
                </div>
                <input
                  id="brush-color"
                  type="color"
                  aria-label="Màu nét vẽ"
                  value={brushColor}
                  onChange={(event) => setBrushColor(event.target.value)}
                  className="h-7 w-12 rounded-md border border-[#E6DFD9] bg-white p-1"
                />
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {BRUSH_SIZES.map((sizeOption) => (
                  <button
                    key={sizeOption}
                    type="button"
                    aria-label={`Brush size ${sizeOption}`}
                    className={cn(
                      "h-8 w-9 rounded-md border text-xs font-bold transition",
                      brushSize === sizeOption
                        ? "border-[#5C3D2E] bg-[#5C3D2E] text-white"
                        : "border-[#E6DFD9] bg-[#FAF8F6] text-[#5C3D2E] hover:bg-[#F1ECE7]",
                    )}
                    onClick={() => setBrushSize(sizeOption)}
                  >
                    {sizeOption}
                  </button>
                ))}
              </div>
            </div>

            <div className="min-w-0 border-b border-[#E6DFD9] p-3 xl:border-r xl:border-b-0">
              <div className="mb-2 flex items-center gap-2">
                <Type className="size-3.5 text-[#5C3D2E]" />
                <Label
                  htmlFor="design-text"
                  className="text-[11px] font-bold text-[#5C3D2E]"
                >
                  Text/logo
                </Label>
              </div>
              <div className="flex gap-2">
                <Input
                  id="design-text"
                  value={textValue}
                  onChange={(event) => setTextValue(event.target.value)}
                  className="h-9 min-w-0 rounded-md bg-[#FAF8F6] text-xs"
                />
                <Button
                  type="button"
                  aria-label="Thêm text"
                  size="icon"
                  variant="outline"
                  className="h-9 w-9 rounded-md"
                  onClick={addTextLayer}
                >
                  <Type className="size-4" />
                </Button>
              </div>
            </div>

            <div className="min-w-0 border-b border-[#E6DFD9] p-3 xl:border-r xl:border-b-0">
              <div className="mb-2 flex items-center gap-2">
                <Sparkles className="size-3.5 text-[#5C3D2E]" />
                <Label
                  htmlFor="ai-prompt"
                  className="text-[11px] font-bold text-[#5C3D2E]"
                >
                  Generate hình
                </Label>
              </div>
              <div className="flex gap-2">
                <Input
                  id="ai-prompt"
                  value={aiPrompt}
                  onChange={(event) => setAiPrompt(event.target.value)}
                  className="h-9 min-w-0 rounded-md bg-[#FAF8F6] text-xs"
                />
                <Button
                  type="button"
                  aria-label="Generate hình"
                  size="icon"
                  variant="outline"
                  className="h-9 w-9 rounded-md"
                  disabled={imageLayerCount >= MAX_IMAGE_LAYERS}
                  onClick={handleGenerateArtwork}
                >
                  <Sparkles className="size-4" />
                </Button>
              </div>
            </div>

            <div className="grid gap-2 bg-[#FAF8F6] p-3">
              <Button
                type="button"
                variant="outline"
                className="h-9 gap-1.5 rounded-md text-xs"
                onClick={undoLastStroke}
              >
                <RotateCcw className="size-3.5" />
                Undo
              </Button>
              <Button
                type="button"
                variant="outline"
                className="h-9 gap-1.5 rounded-md text-xs"
                disabled={!selectedLayerId}
                onClick={deleteSelectedLayer}
              >
                <Trash2 className="size-3.5" />
                Xóa layer
              </Button>
            </div>
          </div>
        </aside>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(event) => {
          handleImport(event.target.files?.[0]);
          event.target.value = "";
        }}
      />
    </section>
  );
}
