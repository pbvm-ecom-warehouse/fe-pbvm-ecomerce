"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import {
  ContactShadows,
  Environment,
  OrbitControls,
  useTexture,
} from "@react-three/drei";
import type { Group } from "three";

import type { CupMaterialType, CupSize, CupStyle } from "@/types/api";

type CupPreview3DProps = {
  size: CupSize;
  style: CupStyle;
  materialType: CupMaterialType;
  cupColor: string;
  artworkTextureUrl: string;
  printHeightPercent: number;
};

const CUP_GEOMETRY: Record<
  CupSize,
  { height: number; topRadius: number; bottomRadius: number }
> = {
  S: { height: 2.7, topRadius: 0.86, bottomRadius: 0.55 },
  M: { height: 3.05, topRadius: 0.98, bottomRadius: 0.62 },
  L: { height: 3.38, topRadius: 1.1, bottomRadius: 0.69 },
  XL: { height: 3.72, topRadius: 1.2, bottomRadius: 0.76 },
};

function getRadiusAtY({
  y,
  height,
  topRadius,
  bottomRadius,
}: {
  y: number;
  height: number;
  topRadius: number;
  bottomRadius: number;
}) {
  const normalized = (y + height / 2) / height;
  return bottomRadius + (topRadius - bottomRadius) * normalized;
}

function ArtworkSleeve({
  textureUrl,
  size,
  printHeightPercent,
}: {
  textureUrl: string;
  size: CupSize;
  printHeightPercent: number;
}) {
  const texture = useTexture(textureUrl);
  const cup = CUP_GEOMETRY[size];
  const sleeveHeight = cup.height * (printHeightPercent / 100);
  const topY = sleeveHeight / 2;
  const bottomY = -sleeveHeight / 2;
  const topRadius = getRadiusAtY({ y: topY, ...cup }) + 0.012;
  const bottomRadius = getRadiusAtY({ y: bottomY, ...cup }) + 0.012;

  return (
    <mesh position={[0, 0, 0]} rotation={[0, Math.PI / 2 + 0.9, 0]}>
      <cylinderGeometry
        args={[topRadius, bottomRadius, sleeveHeight, 128, 1, true]}
      />
      <meshStandardMaterial
        map={texture}
        transparent
        opacity={0.96}
        roughness={0.46}
      />
    </mesh>
  );
}

function HeartLidDecoration({
  topRadius,
  height,
}: {
  topRadius: number;
  height: number;
}) {
  return (
    <group position={[0, height / 2 + 0.11, 0]}>
      <mesh position={[-0.055, 0.02, 0]}>
        <sphereGeometry args={[0.07, 18, 18]} />
        <meshStandardMaterial color="#D9A7A0" roughness={0.35} />
      </mesh>
      <mesh position={[0.055, 0.02, 0]}>
        <sphereGeometry args={[0.07, 18, 18]} />
        <meshStandardMaterial color="#D9A7A0" roughness={0.35} />
      </mesh>
      <mesh rotation={[0, 0, Math.PI / 4]} position={[0, -0.045, 0]}>
        <boxGeometry args={[0.11, 0.11, 0.045]} />
        <meshStandardMaterial color="#D9A7A0" roughness={0.35} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[topRadius * 0.72, 0.018, 18, 96]} />
        <meshStandardMaterial color="#E9DFD3" roughness={0.28} />
      </mesh>
    </group>
  );
}

function CupModel({
  size,
  style,
  materialType,
  cupColor,
  artworkTextureUrl,
  printHeightPercent,
}: CupPreview3DProps) {
  const groupRef = useRef<Group>(null);
  const cup = CUP_GEOMETRY[size];
  const material = useMemo(() => {
    if (materialType === "clear") {
      return { opacity: 0.36, roughness: 0.08, metalness: 0.02 };
    }

    if (materialType === "glass") {
      return { opacity: 0.42, roughness: 0.03, metalness: 0 };
    }

    if (materialType === "metal") {
      return { opacity: 0.86, roughness: 0.2, metalness: 0.45 };
    }

    return { opacity: 0.78, roughness: 0.38, metalness: 0.02 };
  }, [materialType]);

  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.03;
    }
  });

  return (
    <group ref={groupRef} rotation={[0.04, 0.18, 0]}>
      <mesh>
        <cylinderGeometry
          args={[cup.topRadius, cup.bottomRadius, cup.height, 128, 1, true]}
        />
        <meshPhysicalMaterial
          color={cupColor}
          transparent
          opacity={material.opacity}
          roughness={material.roughness}
          metalness={material.metalness}
          clearcoat={0.35}
          clearcoatRoughness={0.22}
        />
      </mesh>

      {artworkTextureUrl ? (
        <Suspense fallback={null}>
          <ArtworkSleeve
            textureUrl={artworkTextureUrl}
            size={size}
            printHeightPercent={printHeightPercent}
          />
        </Suspense>
      ) : null}

      <mesh
        position={[0, cup.height / 2 + 0.015, 0]}
        rotation={[Math.PI / 2, 0, 0]}
      >
        <torusGeometry args={[cup.topRadius, 0.025, 20, 128]} />
        <meshStandardMaterial color="#F7F0E8" roughness={0.2} />
      </mesh>
      <mesh
        position={[0, -cup.height / 2 + 0.035, 0]}
        rotation={[Math.PI / 2, 0, 0]}
      >
        <torusGeometry args={[cup.bottomRadius, 0.024, 20, 128]} />
        <meshStandardMaterial color="#F7F0E8" roughness={0.25} />
      </mesh>

      {style === "heart" ? (
        <HeartLidDecoration topRadius={cup.topRadius} height={cup.height} />
      ) : null}

      {style === "mug" ? (
        <mesh
          position={[cup.topRadius + 0.08, 0, 0]}
          rotation={[0, 0, Math.PI / 2]}
        >
          <torusGeometry args={[0.42, 0.045, 20, 72]} />
          <meshStandardMaterial color={cupColor} roughness={0.38} />
        </mesh>
      ) : null}
    </group>
  );
}

function hasWebGlSupport() {
  const canvas = document.createElement("canvas");
  return Boolean(
    canvas.getContext("webgl") || canvas.getContext("experimental-webgl"),
  );
}

export function CupPreview3D(props: CupPreview3DProps) {
  const [webglSupported, setWebglSupported] = useState(true);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setWebglSupported(hasWebGlSupport());
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, []);

  if (!webglSupported) {
    return (
      <div className="flex min-h-[420px] items-center justify-center rounded-lg border border-[#E6DFD9] bg-[#F2ECE5] p-6">
        {props.artworkTextureUrl ? (
          <img
            src={props.artworkTextureUrl}
            alt="Bản in xem trước"
            className="max-h-[300px] max-w-full rounded-md border border-[#E6DFD9] bg-white object-contain p-4"
          />
        ) : (
          <p className="text-sm font-semibold text-[#7A6F68]">
            Trình duyệt không hỗ trợ WebGL.
          </p>
        )}
      </div>
    );
  }

  return (
    <section className="relative h-[520px] overflow-hidden rounded-lg border border-[#E6DFD9] bg-[radial-gradient(circle_at_50%_25%,#FFFFFF_0%,#E9DFD3_42%,#CFC3B8_100%)]">
      <Canvas
        camera={{ position: [0, 0.55, 5.8], fov: 38 }}
        dpr={[1, 2]}
        gl={{ antialias: true, preserveDrawingBuffer: true }}
      >
        <ambientLight intensity={0.72} />
        <directionalLight position={[3, 4, 5]} intensity={2.2} />
        <pointLight position={[-3, 2, 3]} intensity={0.7} color="#F2D8C2" />
        <Suspense fallback={null}>
          <CupModel {...props} />
          <Environment preset="studio" />
          <ContactShadows
            position={[0, -2.05, 0]}
            opacity={0.36}
            scale={5}
            blur={2.4}
            far={4}
          />
          <OrbitControls
            enablePan={false}
            minDistance={4.6}
            maxDistance={7}
            minPolarAngle={Math.PI / 3.1}
            maxPolarAngle={Math.PI / 1.72}
          />
        </Suspense>
      </Canvas>
    </section>
  );
}
