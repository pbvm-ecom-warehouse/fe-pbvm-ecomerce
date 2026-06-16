"use client";

import NextImage from "next/image";
import { Suspense, useEffect, useRef, useState } from "react";
import {
  ContactShadows,
  Environment,
  OrbitControls,
  Text,
  useTexture,
} from "@react-three/drei";
import { Canvas } from "@react-three/fiber";

import type { CupDesignConfig, DesignArtwork } from "@/types/api";

/* ------------------------------------------------------------------ */
/*  Types & constants                                                  */
/* ------------------------------------------------------------------ */

type CupPreview3dProps = {
  artwork: DesignArtwork;
  previewDataUrl?: string;
  canvasTextureUrl?: string;
  /** 0.4 – 1.0, how much of the cup height the print covers */
  printHeightRatio?: number;
};

const DEFAULT_CONFIG: CupDesignConfig = {
  cupColor: "#f8fafc",
  materialType: "frosted",
  size: "M",
  style: "u_shape",
};

const sizeMap: Record<CupDesignConfig["size"], [number, number, number]> = {
  S: [0.82, 0.64, 1.85],
  M: [0.95, 0.72, 2.2],
  L: [1.08, 0.78, 2.55],
  XL: [1.18, 0.86, 2.85],
};

function canUseWebGl() {
  if (typeof document === "undefined") return false;
  const canvas = document.createElement("canvas");
  return Boolean(
    canvas.getContext("webgl") ?? canvas.getContext("experimental-webgl"),
  );
}

/* ------------------------------------------------------------------ */
/*  Sleeve component – wraps a texture around the cup via useTexture   */
/* ------------------------------------------------------------------ */

function ArtworkSleeve({
  textureUrl,
  topRadius,
  effectiveBottom,
  height,
  printHeightRatio,
}: {
  textureUrl: string;
  topRadius: number;
  effectiveBottom: number;
  height: number;
  printHeightRatio: number;
}) {
  const texture = useTexture(textureUrl);

  const gapFrac = (1 - printHeightRatio) / 2;
  const sleeveTopR =
    topRadius + (effectiveBottom - topRadius) * gapFrac + 0.006;
  const sleeveBtmR =
    topRadius + (effectiveBottom - topRadius) * (1 - gapFrac) + 0.006;
  const sleeveH = height * printHeightRatio;

  return (
    <mesh>
      <cylinderGeometry
        args={[sleeveTopR, sleeveBtmR, sleeveH, 80, 1, true]}
      />
      <meshStandardMaterial
        map={texture}
        transparent
        polygonOffset
        polygonOffsetFactor={-1}
        depthWrite={false}
      />
    </mesh>
  );
}

/* ------------------------------------------------------------------ */
/*  Cup material                                                       */
/* ------------------------------------------------------------------ */

function CupMaterial({ config }: { config: CupDesignConfig }) {
  if (config.materialType === "metal") {
    return (
      <meshStandardMaterial
        color={config.cupColor}
        roughness={0.15}
        metalness={0.9}
      />
    );
  }

  if (config.materialType === "paper") {
    return (
      <meshStandardMaterial
        color={config.cupColor}
        roughness={0.9}
        metalness={0}
      />
    );
  }

  return (
    <meshPhysicalMaterial
      color={config.cupColor}
      roughness={config.materialType === "frosted" ? 0.42 : 0.08}
      metalness={0.02}
      transmission={config.materialType === "glass" ? 0.82 : 0.5}
      thickness={1.2}
      transparent
      opacity={config.materialType === "clear" ? 0.68 : 0.88}
    />
  );
}

/* ------------------------------------------------------------------ */
/*  3D cup model                                                       */
/* ------------------------------------------------------------------ */

function CupModel({
  artwork,
  canvasTextureUrl,
  printHeightRatio = 0.7,
}: {
  artwork: DesignArtwork;
  canvasTextureUrl?: string;
  printHeightRatio?: number;
}) {
  const config = artwork.cupConfig ?? DEFAULT_CONFIG;
  const [topRadius, bottomRadius, height] = sizeMap[config.size];
  const isMug = config.style === "mug";
  const effectiveBottom =
    config.style === "u_shape" ? bottomRadius * 0.82 : bottomRadius;

  return (
    <group rotation={[0, -0.35, 0]}>
      {/* Cup body */}
      <mesh castShadow receiveShadow>
        <cylinderGeometry
          args={[topRadius, effectiveBottom, height, 80, 1, false]}
        />
        <CupMaterial config={config} />
      </mesh>

      {/* Rim – torus lying flat around the top edge */}
      <mesh
        position={[0, height / 2, 0]}
        rotation={[Math.PI / 2, 0, 0]}
        castShadow
      >
        <torusGeometry args={[topRadius, 0.035, 16, 80]} />
        <meshStandardMaterial
          color={config.cupColor}
          roughness={0.25}
          metalness={config.materialType === "metal" ? 0.9 : 0.05}
        />
      </mesh>

      {/* Bottom ring – torus lying flat */}
      <mesh position={[0, -height / 2, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[effectiveBottom, 0.022, 12, 60]} />
        <meshStandardMaterial
          color={config.cupColor}
          roughness={0.4}
          metalness={0.05}
        />
      </mesh>

      {/* Artwork: sleeve wrapping the texture around the cup */}
      {canvasTextureUrl ? (
        <ArtworkSleeve
          textureUrl={canvasTextureUrl}
          topRadius={topRadius}
          effectiveBottom={effectiveBottom}
          height={height}
          printHeightRatio={printHeightRatio}
        />
      ) : (
        <Text
          position={[
            artwork.offsetX / 200,
            -artwork.offsetY / 200,
            topRadius + 0.01,
          ]}
          rotation={[0, 0, (artwork.rotation * Math.PI) / 180]}
          fontSize={0.18 * artwork.scale}
          color={artwork.fill}
          anchorX="center"
          anchorY="middle"
        >
          {artwork.text}
        </Text>
      )}

      {/* Mug handle */}
      {isMug && (
        <mesh
          position={[-topRadius - 0.1, 0, 0]}
          rotation={[0, 0, Math.PI / 2]}
          castShadow
        >
          <torusGeometry args={[height * 0.18, 0.055, 16, 36, Math.PI]} />
          <CupMaterial config={config} />
        </mesh>
      )}

      {/* Heart lid */}
      {config.style === "heart" && (
        <mesh position={[0, height / 2 + 0.18, 0]}>
          <sphereGeometry
            args={[topRadius * 0.38, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2]}
          />
          <meshStandardMaterial
            color="#f472b6"
            roughness={0.4}
            metalness={0.05}
          />
        </mesh>
      )}
    </group>
  );
}

/* ------------------------------------------------------------------ */
/*  Fallback 2D preview                                                */
/* ------------------------------------------------------------------ */

function CupFallbackPreview({ artwork, previewDataUrl }: CupPreview3dProps) {
  const cupColor = artwork.cupConfig?.cupColor ?? "#f8fafc";

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

/* ------------------------------------------------------------------ */
/*  Main export                                                        */
/* ------------------------------------------------------------------ */

export function CupPreview3d({
  artwork,
  previewDataUrl,
  canvasTextureUrl,
  printHeightRatio = 0.7,
}: CupPreview3dProps) {
  const [webGlReady, setWebGlReady] = useState<boolean | null>(null);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setWebGlReady(canUseWebGl());
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  const config = artwork.cupConfig ?? DEFAULT_CONFIG;
  const [, , height] = sizeMap[config.size];

  if (webGlReady === null) {
    return (
      <div className="grid aspect-[4/3] place-items-center rounded-2xl border border-[#E6DFD9] bg-[#FAF8F6] p-6 text-center text-sm font-semibold text-[#7A6F68]">
        Đang kiểm tra WebGL preview…
      </div>
    );
  }

  if (!webGlReady) {
    return (
      <CupFallbackPreview artwork={artwork} previewDataUrl={previewDataUrl} />
    );
  }

  return (
    <div
      className="aspect-[4/3] overflow-hidden rounded-2xl border border-[#E6DFD9] shadow-inner"
      style={{
        background:
          "radial-gradient(ellipse at 50% 40%, #F5F0EB 0%, #DDD6CF 60%, #C4BCB4 100%)",
      }}
    >
      <Canvas
        camera={{ position: [0, 0.4, 4.2], fov: 38 }}
        gl={{ antialias: true, preserveDrawingBuffer: true }}
        shadows
      >
        <ambientLight intensity={0.55} color="#f5f0eb" />
        <directionalLight position={[4, 6, 5]} intensity={1.6} castShadow />
        <directionalLight position={[-3, 3, -4]} intensity={0.35} />
        <spotLight
          position={[0, 6, 2]}
          intensity={0.5}
          angle={0.4}
          penumbra={0.8}
        />

        <Suspense fallback={null}>
          <CupModel
            artwork={artwork}
            canvasTextureUrl={canvasTextureUrl}
            printHeightRatio={printHeightRatio}
          />

          <ContactShadows
            position={[0, -height / 2 - 0.02, 0]}
            opacity={0.35}
            scale={6}
            blur={2.5}
            far={4}
          />

          <Environment preset="studio" background={false} />

          <OrbitControls
            enablePan={false}
            minDistance={2.8}
            maxDistance={5.4}
            minPolarAngle={Math.PI / 6}
            maxPolarAngle={Math.PI / 1.8}
          />
        </Suspense>
      </Canvas>
    </div>
  );
}
