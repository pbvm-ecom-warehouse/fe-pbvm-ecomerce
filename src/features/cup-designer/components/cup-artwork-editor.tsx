"use client";

import { Layer, Rect, Stage, Text } from "react-konva";

import type { DesignArtwork } from "@/types/api";

type CupArtworkEditorProps = {
  artwork: DesignArtwork;
  onArtworkChange: (artwork: DesignArtwork) => void;
  previewDataUrl?: string;
};

export function CupArtworkEditor({
  artwork,
  onArtworkChange,
  previewDataUrl,
}: CupArtworkEditorProps) {
  return (
    <div className="grid gap-3 rounded-lg border bg-muted/25 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="font-semibold">2D print artboard</div>
          <div className="text-xs text-muted-foreground">
            Kéo text/logo trong vùng in để cập nhật offset của designFile.
          </div>
        </div>
        <div className="rounded-full border bg-background px-2.5 py-1 text-xs font-medium">
          560 x 390
        </div>
      </div>
      <div className="overflow-auto rounded-lg border bg-[linear-gradient(90deg,var(--border)_1px,transparent_1px),linear-gradient(180deg,var(--border)_1px,transparent_1px)] bg-[size:24px_24px] p-3">
        <Stage width={560} height={390} className="mx-auto block">
          <Layer>
            <Rect
              x={74}
              y={36}
              width={412}
              height={324}
              cornerRadius={26}
              fill="#f8fafc"
              stroke="#64748b"
              strokeWidth={2}
            />
            <Rect
              x={96}
              y={58}
              width={368}
              height={280}
              cornerRadius={20}
              fill="#ffffff"
              stroke="#e2e8f0"
              strokeWidth={1}
            />
            <Rect
              x={142}
              y={92}
              width={276}
              height={202}
              cornerRadius={12}
              fill={previewDataUrl ? "#ecfeff" : "#ffffff"}
              stroke="#0f766e"
              strokeWidth={2}
              dash={[8, 6]}
            />
            <Text
              x={154}
              y={110}
              text="PRINT AREA"
              fontSize={12}
              fontStyle="bold"
              fill="#0f766e"
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
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
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
