"use client";

import { Suspense, useEffect, useState } from "react";
import { OrbitControls, Text } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";

import type { DesignArtwork } from "@/types/api";

function canUseWebGl() {
  if (typeof document === "undefined") {
    return false;
  }

  const canvas = document.createElement("canvas");
  return Boolean(
    canvas.getContext("webgl") ?? canvas.getContext("experimental-webgl"),
  );
}

function CupModel({ artwork }: { artwork: DesignArtwork }) {
  return (
    <group rotation={[0, -0.35, 0]}>
      <mesh>
        <cylinderGeometry args={[0.95, 0.72, 2.2, 64]} />
        <meshStandardMaterial
          color="#f8fafc"
          roughness={0.42}
          metalness={0.05}
        />
      </mesh>
      <mesh position={[0, 0, 0.98]}>
        <boxGeometry args={[1.15, 0.62, 0.02]} />
        <meshStandardMaterial color="#ecfeff" roughness={0.6} />
      </mesh>
      <Text
        position={[artwork.offsetX / 180, -artwork.offsetY / 180, 1.02]}
        rotation={[0, 0, (artwork.rotation * Math.PI) / 180]}
        fontSize={0.16 * artwork.scale}
        color={artwork.fill}
        anchorX="center"
        anchorY="middle"
      >
        {artwork.text}
      </Text>
    </group>
  );
}

function CupFallbackPreview({ artwork }: { artwork: DesignArtwork }) {
  return (
    <div className="relative aspect-[4/3] overflow-hidden rounded-lg border bg-muted/25 p-5">
      <div className="absolute inset-x-8 bottom-6 top-6 rounded-[32px_32px_52px_52px] border bg-card shadow-sm" />
      <div className="absolute inset-x-14 bottom-14 top-14 rounded-[24px_24px_38px_38px] border border-dashed border-primary/55 bg-background" />
      <div
        className="absolute left-1/2 top-1/2 max-w-44 -translate-x-1/2 -translate-y-1/2 text-center font-bold"
        style={{
          color: artwork.fill,
          fontSize: `${Math.max(16, Math.round(24 * artwork.scale))}px`,
          transform: `translate(calc(-50% + ${artwork.offsetX / 3}px), calc(-50% + ${artwork.offsetY / 3}px)) rotate(${artwork.rotation}deg)`,
        }}
      >
        {artwork.text}
      </div>
      <div className="absolute bottom-3 left-3 rounded-full border bg-background px-2.5 py-1 text-xs font-medium text-muted-foreground">
        2D fallback preview
      </div>
    </div>
  );
}

export function CupPreview3d({ artwork }: { artwork: DesignArtwork }) {
  const [webGlReady, setWebGlReady] = useState<boolean | null>(null);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setWebGlReady(canUseWebGl());
    });

    return () => window.cancelAnimationFrame(frame);
  }, []);

  if (webGlReady === null) {
    return (
      <div className="grid aspect-[4/3] place-items-center rounded-lg border bg-muted/35 p-6 text-center text-sm text-muted-foreground">
        Đang kiểm tra WebGL preview...
      </div>
    );
  }

  if (!webGlReady) {
    return <CupFallbackPreview artwork={artwork} />;
  }

  return (
    <div className="aspect-[4/3] overflow-hidden rounded-lg border bg-slate-950 shadow-sm">
      <Canvas camera={{ position: [0, 0.2, 4], fov: 42 }}>
        <ambientLight intensity={0.9} />
        <directionalLight position={[3, 4, 5]} intensity={1.2} />
        <Suspense fallback={null}>
          <CupModel artwork={artwork} />
          <OrbitControls enablePan={false} minDistance={2.8} maxDistance={5} />
        </Suspense>
      </Canvas>
    </div>
  );
}
