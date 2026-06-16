"use client";

import { useEffect, useState } from "react";
import { Image as KonvaImage, Layer, Rect, Stage, Text } from "react-konva";

import type { DesignArtwork } from "@/types/api";

type CupArtworkEditorProps = {
  artwork: DesignArtwork;
  onArtworkChange: (artwork: DesignArtwork) => void;
  previewDataUrl?: string;
};

function ArtworkUploadLayer({ previewDataUrl }: { previewDataUrl: string }) {
  const [image, setImage] = useState<HTMLImageElement | null>(null);

  useEffect(() => {
    let active = true;
    const nextImage = new window.Image();
    nextImage.onload = () => {
      if (active) {
        setImage(nextImage);
      }
    };
    nextImage.src = previewDataUrl;

    return () => {
      active = false;
    };
  }, [previewDataUrl]);

  if (!image) {
    return null;
  }

  return (
    <KonvaImage
      image={image}
      x={174}
      y={118}
      width={212}
      height={148}
      opacity={0.9}
      listening={false}
    />
  );
}

export function CupArtworkEditor({
  artwork,
  onArtworkChange,
  previewDataUrl,
}: CupArtworkEditorProps) {
  const cupColor = artwork.cupConfig?.cupColor ?? "#f8fafc";

  return (
    <div className="grid gap-3 rounded-2xl border border-[#E6DFD9] bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="text-sm font-black uppercase tracking-[0.14em] text-primary">
            2D print artboard
          </div>
          <div className="mt-1 text-xs text-[#7A6F68]">
            Kéo text/logo trong vùng in để căn vị trí trên ly.
          </div>
        </div>
        <div className="rounded-full border border-[#E6DFD9] bg-[#FAF8F6] px-3 py-1 text-xs font-bold text-[#7A6F68]">
          560 x 390
        </div>
      </div>

      <div className="overflow-auto rounded-xl border border-[#E6DFD9] bg-[linear-gradient(90deg,#E6DFD9_1px,transparent_1px),linear-gradient(180deg,#E6DFD9_1px,transparent_1px)] bg-[size:24px_24px] p-3">
        <Stage width={560} height={390} className="mx-auto block">
          <Layer>
            <Rect
              x={74}
              y={36}
              width={412}
              height={324}
              cornerRadius={28}
              fill={cupColor}
              stroke="#5C3D2E"
              strokeWidth={2}
              opacity={0.9}
            />
            <Rect
              x={96}
              y={58}
              width={368}
              height={280}
              cornerRadius={22}
              fill="#ffffff"
              opacity={0.72}
              stroke="#D2B48C"
              strokeWidth={1}
            />
            <Rect
              x={142}
              y={92}
              width={276}
              height={202}
              cornerRadius={14}
              fill={previewDataUrl ? "#FDFBF7" : "#FFFFFF"}
              stroke="#5C3D2E"
              strokeWidth={2}
              dash={[8, 6]}
            />
            {previewDataUrl ? (
              <ArtworkUploadLayer previewDataUrl={previewDataUrl} />
            ) : null}
            <Text
              x={154}
              y={110}
              text="PRINT AREA"
              fontSize={12}
              fontStyle="bold"
              fill="#5C3D2E"
            />
            <Text
              x={280 + artwork.offsetX}
              y={188 + artwork.offsetY}
              text={artwork.text}
              fontSize={Math.round(32 * artwork.scale)}
              fontStyle="bold"
              fill={artwork.fill}
              rotation={artwork.rotation}
              draggable
              align="center"
              offsetX={artwork.text.length * 8}
              onDragEnd={(event) => {
                onArtworkChange({
                  ...artwork,
                  offsetX: Math.round(event.target.x() - 280),
                  offsetY: Math.round(event.target.y() - 188),
                });
              }}
            />
          </Layer>
        </Stage>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-semibold text-[#7A6F68]">
        <span>
          Offset X/Y: {artwork.offsetX}, {artwork.offsetY}
        </span>
        <span>
          {previewDataUrl ? "Artwork upload loaded" : "Template vector"}
        </span>
      </div>
    </div>
  );
}
