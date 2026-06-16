import type { DesignArtwork, DesignFileSnapshot } from "@/types/api";

const DEFAULT_ARTWORK: DesignArtwork = {
  text: "PBVM",
  fill: "#0f766e",
  scale: 1,
  rotation: 0,
  offsetX: 0,
  offsetY: 0,
};

export type CreateDesignFileSnapshotInput = {
  designId: string;
  name: string;
  previewDataUrl?: string;
  mimeType?: string;
  size?: number;
  width?: number;
  height?: number;
  artwork?: Partial<DesignArtwork>;
};

export function createDesignFileSnapshot({
  designId,
  name,
  previewDataUrl,
  mimeType = "application/json",
  size = 0,
  width = 1024,
  height = 1024,
  artwork,
}: CreateDesignFileSnapshotInput): DesignFileSnapshot {
  const finalArtwork = {
    ...DEFAULT_ARTWORK,
    ...artwork,
  };

  return {
    snapshotVersion: 1,
    designId,
    name,
    url:
      previewDataUrl ??
      `local-design://${encodeURIComponent(designId)}/${encodeURIComponent(
        name,
      )}.json`,
    previewDataUrl,
    mimeType,
    size,
    width,
    height,
    artwork: finalArtwork,
    exportedAt: new Date().toISOString(),
  };
}

export function createLocalDesignId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `local-${crypto.randomUUID()}`;
  }

  return `local-${Date.now()}`;
}
