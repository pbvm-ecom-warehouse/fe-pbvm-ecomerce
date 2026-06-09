"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Decal } from "@react-three/drei";
import { TextureLoader, Texture, DoubleSide, Shape, ExtrudeGeometry } from "three";
import { Loader2 } from "lucide-react";

// Định nghĩa kiểu dữ liệu cho CupVisualizer3D
interface CupVisualizer3DProps {
  size: "S" | "M" | "L" | "XL";
  style: "straight" | "u_shape" | "heart" | "mug";
  materialType: "clear" | "frosted" | "paper" | "glass" | "metal";
  cupColor: string;
  logoUrl: string | null;
  isScanning: boolean;
}

// Thiết lập kích thước ly dựa trên size (S, M, L, XL)
const CUP_SIZES = {
  S: { radiusTop: 1.3, radiusBottom: 0.95, height: 3.6 },
  M: { radiusTop: 1.4, radiusBottom: 1.0, height: 4.4 },
  L: { radiusTop: 1.5, radiusBottom: 1.05, height: 5.2 },
  XL: { radiusTop: 1.65, radiusBottom: 1.15, height: 6.2 },
};

// Hàm định nghĩa chất liệu 3D cho thân cốc nền
const renderBaseCupMaterial = (type: string, color: string) => {
  if (type === "paper") {
    return (
      <meshStandardMaterial
        color={color}
        roughness={0.95}
        metalness={0.05}
        side={DoubleSide}
      />
    );
  }
  if (type === "metal") {
    return (
      <meshStandardMaterial
        color={color}
        roughness={0.25}
        metalness={0.95}
        side={DoubleSide}
      />
    );
  }
  
  // Nhựa PP trong suốt, Nhựa mờ cát PET, Thủy tinh Glass
  const isGlass = type === "glass";
  const isFrosted = type === "frosted";
  
  return (
    <meshPhysicalMaterial
      color={color}
      roughness={isFrosted ? 0.45 : isGlass ? 0.03 : 0.08}
      metalness={isGlass ? 0.02 : 0.1}
      transmission={isFrosted ? 0.72 : isGlass ? 0.96 : 0.88}
      thickness={isGlass ? 1.6 : 0.8}
      ior={isGlass ? 1.52 : 1.46}
      clearcoat={isGlass || type === "clear" ? 1.0 : 0.0}
      clearcoatRoughness={isGlass ? 0.05 : 0.1}
      side={DoubleSide}
      transparent
      opacity={1}
    />
  );
};

// Tạo hình trái tim 2D làm nắp cốc tim
const createHeartShape = () => {
  const heartShape = new Shape();
  heartShape.moveTo(0, 0);
  heartShape.bezierCurveTo(0, 0, -0.05, 0.12, -0.18, 0.12);
  heartShape.bezierCurveTo(-0.35, 0.12, -0.35, -0.12, -0.35, -0.12);
  heartShape.bezierCurveTo(-0.35, -0.28, -0.18, -0.45, 0, -0.62);
  heartShape.bezierCurveTo(0.18, -0.45, 0.35, -0.28, 0.35, -0.12);
  heartShape.bezierCurveTo(0.35, -0.12, 0.35, 0.12, 0.18, 0.12);
  heartShape.bezierCurveTo(0.05, 0.12, 0, 0, 0, 0);
  return heartShape;
};

function CupMesh({
  size,
  style,
  materialType,
  cupColor,
  logoUrl,
  isScanning,
}: CupVisualizer3DProps) {
  const meshRef = useRef<any>(null);
  const scannerRef = useRef<any>(null);
  const [texture, setTexture] = useState<Texture | null>(null);

  const { radiusTop, radiusBottom, height } = CUP_SIZES[size];
  const halfHeight = height / 2;

  // Tính toán vùng in Decal phẳng cố định mặt trước cốc
  const avgRadius = (radiusTop + radiusBottom) / 2;
  const decalWidth = radiusTop * 1.55; // Chiều rộng bằng đúng mặt trước
  const decalHeight = height * 0.72; // Chiều cao chiếm 72% thân ly

  // Tải texture vẽ tay 2D Canvas
  useEffect(() => {
    if (!logoUrl) {
      setTexture(null);
      return;
    }
    const loader = new TextureLoader();
    loader.load(
      logoUrl,
      (loadedTexture) => {
        loadedTexture.flipY = true;
        setTexture(loadedTexture);
      },
      undefined,
      (err) => {
        console.error("Error loading texture:", err);
      }
    );
  }, [logoUrl]);

  // Hoạt cảnh quét laser AI
  useFrame(({ clock }) => {
    if (isScanning && scannerRef.current) {
      const time = clock.getElapsedTime();
      scannerRef.current.position.y = Math.sin(time * 6) * halfHeight;
      scannerRef.current.visible = true;
    } else if (scannerRef.current) {
      scannerRef.current.visible = false;
    }
  });

  return (
    <group>
      {/* 1. THÂN LY NỀN (Hiển thị chất liệu và màu ly) */}
      <mesh ref={meshRef} castShadow receiveShadow>
        <cylinderGeometry args={[radiusTop, radiusBottom, height, 32, 1, true]} />
        {renderBaseCupMaterial(materialType, cupColor)}

        {/* 2. KHUÔN CHIẾU DECAL MẶT TRƯỚC CỐ ĐỊNH (Không bị quấn chu vi hay nhiễm màu cốc) */}
        {texture && (
          <Decal
            position={[0, 0, avgRadius]}
            rotation={[0, 0, 0]}
            scale={[decalWidth, decalHeight, 2.0]} // Độ dày projector đủ sâu để chiếu lên bề mặt cong
          >
            {/* Sử dụng vật liệu màu trắng tuyệt đối để giữ nguyên màu gốc Sticker */}
            <meshStandardMaterial
              map={texture}
              transparent
              polygonOffset
              polygonOffsetFactor={-10}
              roughness={materialType === "paper" ? 0.95 : 0.25}
              metalness={0.0}
              side={DoubleSide}
              depthWrite={true}
            />
          </Decal>
        )}
      </mesh>

      {/* 3. Đáy cốc */}
      {style === "u_shape" ? (
        <mesh position={[0, -halfHeight, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <sphereGeometry args={[radiusBottom, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
          {renderBaseCupMaterial(materialType, cupColor)}
        </mesh>
      ) : (
        <mesh position={[0, -halfHeight, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[radiusBottom, 32]} />
          {renderBaseCupMaterial(materialType, cupColor)}
        </mesh>
      )}

      {/* 4. Vành miệng cốc */}
      <mesh position={[0, halfHeight, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[radiusTop - 0.05, radiusTop + 0.05, 32]} />
        {renderBaseCupMaterial(materialType, cupColor)}
      </mesh>

      {/* 5. Quai cầm (Mug) */}
      {style === "mug" && (
        <mesh
          position={[-radiusBottom - 0.28, 0, 0]}
          rotation={[0, 0, Math.PI / 2]}
          castShadow
        >
          <torusGeometry args={[height * 0.22, 0.16, 12, 32, Math.PI]} />
          {renderBaseCupMaterial(materialType, cupColor)}
        </mesh>
      )}

      {/* 6. Nắp tim đỏ (Heart) */}
      {style === "heart" && (
        <group position={[0, halfHeight + 0.02, 0]}>
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[radiusTop + 0.02, 32]} />
            <meshStandardMaterial color="#FFFFFF" roughness={0.5} side={DoubleSide} />
          </mesh>
          <mesh 
            position={[0, 0.25, radiusTop - 0.4]} 
            scale={0.5} 
            rotation={[Math.PI / 2, 0, 0]}
            castShadow
          >
            <extrudeGeometry 
              args={[
                createHeartShape(), 
                { 
                  depth: 0.18, 
                  bevelEnabled: true, 
                  bevelSegments: 3, 
                  steps: 1, 
                  bevelSize: 0.02, 
                  bevelThickness: 0.03 
                }
              ]} 
            />
            <meshStandardMaterial color="#FF3B30" emissive="#550000" roughness={0.3} />
          </mesh>
        </group>
      )}

      {/* 7. Vòng laser AI quét */}
      <mesh ref={scannerRef} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[radiusTop + 0.1, radiusTop + 0.16, 32]} />
        <meshBasicMaterial
          color="#D2B48C"
          side={DoubleSide}
          transparent
          opacity={0.8}
        />
      </mesh>
    </group>
  );
}

export function CupVisualizer3D(props: CupVisualizer3DProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="flex h-[450px] w-full items-center justify-center rounded-2xl border border-[#E6DFD9] bg-[#FAF8F6] shadow-inner">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-sm font-semibold text-[#7A6F68]">Đang khởi tạo không gian 3D...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-[480px] w-full overflow-hidden rounded-2xl border border-[#E6DFD9] bg-[#E5E2DD] shadow-inner">
      <div className="absolute top-4 left-4 z-10 rounded-lg bg-white/80 backdrop-blur-md px-3 py-1.5 text-[11px] font-bold text-[#5C3D2E] border border-[#E6DFD9] shadow-sm">
        🖱️ Kéo chuột trái để xoay 360° | Cuộn chuột để phóng to thu nhỏ
      </div>

      {props.isScanning && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#5C3D2E]/10 backdrop-blur-[1px] transition-all duration-300">
          <div className="flex flex-col items-center gap-2 rounded-xl bg-white/95 border border-[#D2B48C] px-5 py-3 shadow-lg">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <p className="text-xs font-bold text-primary animate-pulse">Trợ lý AI đang phác thảo thiết kế...</p>
          </div>
        </div>
      )}

      {/* R3F Canvas */}
      <Canvas
        shadows
        camera={{ position: [0, 0.8, 8.2], fov: 45 }}
        gl={{ preserveDrawingBuffer: true, antialias: true }}
      >
        <color attach="background" args={["#E5E2DD"]} />
        
        <ambientLight intensity={0.75} />
        <directionalLight
          position={[6, 9, 6]}
          intensity={1.2}
          castShadow
          shadow-mapSize={1024}
        />
        <directionalLight
          position={[-6, 6, -6]}
          intensity={1.7}
          color="#ffffff"
        />
        
        <pointLight position={[0, -5, 6]} intensity={0.4} />

        <Suspense fallback={null}>
          <CupMesh {...props} />
        </Suspense>

        <OrbitControls
          enablePan={false}
          enableZoom={true}
          minDistance={4.5}
          maxDistance={12}
          makeDefault
          minPolarAngle={0.1}
          maxPolarAngle={Math.PI / 2 + 0.1}
        />
      </Canvas>
    </div>
  );
}
