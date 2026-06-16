"use client";

import NextImage from "next/image";
import { Suspense, useEffect, useState } from "react";
import { Image as DreiImage, OrbitControls, Text } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";

import type { CupDesignConfig, DesignArtwork } from "@/types/api";

type CupPreview3dProps = {
  artwork: DesignArtwork;
  previewDataUrl?: string;
};

const sizeMap: Record<CupDesignConfig["size"], [number, number, number]> = {
  S: [0.82, 0.64, 1.85],
  M: [0.95, 0.72, 2.2],
  L: [1.08, 0.78, 2.55],
  XL: [1.18, 0.86, 2.85],
};

function canUseWebGl() {
  if (typeof document === "undefined") {
    return false;
  }

  const canvas = document.createElement("canvas");
  return Boolean(
    canvas.getContext("webgl") ?? canvas.getContext("experimental-webgl"),
  );
}

function ArtworkTexturePlane({
  previewDataUrl,
  scale,
}: {
  previewDataUrl: string;
  scale: number;
}) {
  return (
    <DreiImage
      url={previewDataUrl}
      position={[0, 0, 1.025]}
      scale={[1.08 * scale, 0.68 * scale]}
      transparent
    />
  );
}

function CupMaterial({ config }: { config: CupDesignConfig }) {
  if (config.materialType === "metal") {
    return (
      <meshStandardMaterial
        color={config.cupColor}
        roughness={0.2}
        metalness={0.85}
      />
    );
  }

  if (config.materialType === "paper") {
    return (
      <meshStandardMaterial
        color={config.cupColor}
        roughness={0.85}
        metalness={0}
      />
    );
  }

  return (
    <meshPhysicalMaterial
      color={config.cupColor}
      roughness={config.materialType === "frosted" ? 0.42 : 0.12}
      metalness={0.02}
      transmission={config.materialType === "glass" ? 0.75 : 0.45}
      thickness={0.8}
      transparent
      opacity={config.materialType === "clear" ? 0.72 : 0.86}
    />
  );
}

function CupModel({
  artwork,
  previewDataUrl,
}: {
  artwork: DesignArtwork;
  previewDataUrl?: string;
}) {
  const config =
    artwork.cupConfig ??
    ({
      cupColor: "#f8fafc",
      materialType: "frosted",
      size: "M",
      style: "u_shape",
    } satisfies CupDesignConfig);
  const [topRadius, bottomRadius, height] = sizeMap[config.size];
  const isMug = config.style === "mug";

  return (
    <group rotation={[0, -0.35, 0]}>
      <mesh castShadow receiveShadow>
        <cylinderGeometry
          args={[
            topRadius,
            config.style === "u_shape" ? bottomRadius * 0.82 : bottomRadius,
            height,
            80,
            1,
            false,
          ]}
        />
        <CupMaterial config={config} />
      </mesh>

      <mesh position={[0, height * 0.03, topRadius + 0.03]}>
        <boxGeometry args={[topRadius * 1.35, height * 0.34, 0.025]} />
        <meshStandardMaterial color="#FDFBF7" roughness={0.6} />
      </mesh>

      {previewDataUrl ? (
        <ArtworkTexturePlane previewDataUrl={previewDataUrl} scale={topRadius} />
      ) : (
        <Text
          position={[
            artwork.offsetX / 180,
            -artwork.offsetY / 180,
            topRadius + 0.08,
          ]}
          rotation={[0, 0, (artwork.rotation * Math.PI) / 180]}
          fontSize={0.16 * artwork.scale}
          color={artwork.fill}
          anchorX="center"
          anchorY="middle"
        >
          {artwork.text}
        </Text>
      )}

      {isMug ? (
        <mesh position={[-topRadius - 0.1, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <torusGeometry args={[height * 0.18, 0.055, 16, 36, Math.PI]} />
          <CupMaterial config={config} />
        </mesh>
      ) : null}
    </group>
  );
}

function CupFallbackPreview({ artwork, previewDataUrl }: CupPreview3dProps) {
  const config = artwork.cupConfig;
  const cupColor = config?.cupColor ?? "#f8fafc";

  return (
    <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-[#E6DFD9] bg-[#E5E2DD] p-5 shadow-inner">
      <div
        className="absolute inset-x-8 bottom-6 top-6 rounded-[32px_32px_52px_52px] border border-[#5C3D2E]/30 shadow-sm"
        style={{ backgroundColor: cupColor }}
      />
      <div className="absolute inset-x-14 bottom-14 top-14 overflow-hidden rounded-[24px_24px_38px_38px] border border-dashed border-primary/55 bg-white/70">
        {previewDataUrl ? (
          <NextImage
            src={previewDataUrl}
            alt={artwork.text || "Artwork upload"}
            fill
            unoptimized
            className="object-contain p-6"
          />
        ) : null}
      </div>
      <div
        className="absolute left-1/2 top-1/2 max-w-44 text-center font-black"
        style={{
          color: artwork.fill,
          fontSize: `${Math.max(16, Math.round(24 * artwork.scale))}px`,
          transform: `translate(calc(-50% + ${artwork.offsetX / 3}px), calc(-50% + ${artwork.offsetY / 3}px)) rotate(${artwork.rotation}deg)`,
        }}
      >
        {artwork.text}
      </div>
      <div className="absolute bottom-3 left-3 rounded-full border border-[#E6DFD9] bg-white px-2.5 py-1 text-xs font-bold text-[#7A6F68]">
        2D fallback preview
      </div>
    </div>
  );
}

export function CupPreview3d({ artwork, previewDataUrl }: CupPreview3dProps) {
  const [webGlReady, setWebGlReady] = useState<boolean | null>(null);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setWebGlReady(canUseWebGl());
    });

    return () => window.cancelAnimationFrame(frame);
  }, []);

  if (webGlReady === null) {
    return (
      <div className="grid aspect-[4/3] place-items-center rounded-2xl border border-[#E6DFD9] bg-[#FAF8F6] p-6 text-center text-sm font-semibold text-[#7A6F68]">
        Đang kiểm tra WebGL preview...
      </div>
    );
  }

  if (!webGlReady) {
    return (
      <CupFallbackPreview artwork={artwork} previewDataUrl={previewDataUrl} />
    );
  }

  return (
    <div className="aspect-[4/3] overflow-hidden rounded-2xl border border-[#E6DFD9] bg-[#E5E2DD] shadow-inner">
      <Canvas
        camera={{ position: [0, 0.2, 4.6], fov: 42 }}
        gl={{ antialias: true, preserveDrawingBuffer: true }}
        shadows
      >
        <ambientLight intensity={0.85} />
        <directionalLight position={[3, 4, 5]} intensity={1.25} castShadow />
        <directionalLight position={[-4, 2, -3]} intensity={0.45} />
        <Suspense fallback={null}>
          <CupModel artwork={artwork} previewDataUrl={previewDataUrl} />
          <OrbitControls enablePan={false} minDistance={2.8} maxDistance={5.4} />
        </Suspense>
      </Canvas>
    </div>
  );
}
