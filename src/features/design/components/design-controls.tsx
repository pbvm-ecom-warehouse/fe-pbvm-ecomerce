"use client";

import React, { useState } from "react";
import { Sparkles, Info, ShoppingBag, RotateCcw, ArrowRight, ArrowLeft, Palette, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCartStore } from "@/stores/cart-store";
import { toast } from "sonner";
import { DesignCanvas2D } from "./design-canvas-2d";

// Định nghĩa props đã tinh giản cho DesignControls
interface DesignControlsProps {
  size: "S" | "M" | "L" | "XL";
  setSize: (size: "S" | "M" | "L" | "XL") => void;
  style: "straight" | "u_shape" | "heart" | "mug";
  setStyle: (style: "straight" | "u_shape" | "heart" | "mug") => void;
  materialType: "clear" | "frosted" | "paper" | "glass" | "metal";
  setMaterialType: (mat: "clear" | "frosted" | "paper" | "glass" | "metal") => void;
  cupColor: string;
  setCupColor: (color: string) => void;
  logoUrl: string | null;
  setLogoUrl: (url: string | null) => void;
  isScanning: boolean;
  setIsScanning: (scanning: boolean) => void;
  setTriggerDrawImg: (url: string | null) => void;
  triggerDrawImg: string | null;
}



// Giá cốc phẳng tương ứng với size (Không đổi)
const SIZE_PRICES = {
  S: 42000,
  M: 45000,
  L: 49000,
  XL: 55000,
};

// Hàm vẽ Sticker mẫu 2D độ nét cao bằng Canvas (Hỗ trợ 8 mẫu)
const generateStickerDataUrl = (type: string): string => {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";

  ctx.clearRect(0, 0, 256, 256);
  ctx.save();

  if (type === "cat") {
    // 1. Sticker Mèo Boba
    ctx.fillStyle = "#FFE4E1";
    ctx.beginPath(); ctx.arc(128, 128, 110, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#FFFFFF";
    ctx.beginPath(); ctx.arc(128, 135, 65, 0, Math.PI * 2); ctx.fill();
    // Tai mèo
    ctx.beginPath(); ctx.moveTo(75, 100); ctx.lineTo(60, 45); ctx.lineTo(100, 80); ctx.fill();
    ctx.beginPath(); ctx.moveTo(181, 100); ctx.lineTo(196, 45); ctx.lineTo(156, 80); ctx.fill();
    // Mắt ngủ
    ctx.strokeStyle = "#5C3D2E"; ctx.lineWidth = 4; ctx.lineCap = "round";
    ctx.beginPath(); ctx.arc(102, 130, 8, 0, Math.PI, false); ctx.stroke();
    ctx.beginPath(); ctx.arc(154, 130, 8, 0, Math.PI, false); ctx.stroke();
    // Râu mèo
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(60, 135); ctx.lineTo(40, 132);
    ctx.moveTo(60, 143); ctx.lineTo(35, 143);
    ctx.moveTo(196, 135); ctx.lineTo(216, 132);
    ctx.moveTo(196, 143); ctx.lineTo(221, 143);
    ctx.stroke();
    // Boba cup
    ctx.fillStyle = "#F5C2C2";
    ctx.beginPath(); ctx.moveTo(113, 148); ctx.lineTo(143, 148); ctx.lineTo(138, 192); ctx.lineTo(118, 192); ctx.closePath(); ctx.fill();
    ctx.fillStyle = "#1C1917";
    ctx.beginPath(); ctx.arc(123, 180, 4, 0, Math.PI * 2); ctx.arc(133, 180, 4, 0, Math.PI * 2); ctx.arc(128, 172, 4, 0, Math.PI * 2); ctx.fill();

  } else if (type === "coffee") {
    // 2. Retro Coffee Stamp
    ctx.strokeStyle = "#5C3D2E"; ctx.lineWidth = 6;
    ctx.beginPath(); ctx.arc(128, 128, 110, 0, Math.PI * 2); ctx.stroke();
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(128, 128, 98, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = "#5C3D2E";
    ctx.beginPath(); ctx.ellipse(128, 128, 25, 16, Math.PI / 4, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = "#FFFFFF"; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(110, 135); ctx.lineTo(146, 110); ctx.stroke();
    ctx.fillStyle = "#5C3D2E"; ctx.font = "bold 17px Arial"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText("PREMIUM", 128, 75); ctx.fillText("COFFEE", 128, 180);

  } else if (type === "sakura") {
    // 3. Hoa anh đào Sakura
    ctx.fillStyle = "#FFB7C5";
    const drawPetal = (cx: number, cy: number, r: number, angle: number) => {
      ctx.save(); ctx.translate(cx, cy); ctx.rotate(angle); ctx.beginPath(); ctx.moveTo(0, 0);
      ctx.bezierCurveTo(-r/3, -r/2, -r/6, -r, 0, -r*0.9);
      ctx.bezierCurveTo(r/6, -r, r/3, -r/2, 0, 0); ctx.fill(); ctx.restore();
    };
    for (let j = 0; j < 5; j++) { drawPetal(128, 128, 50, (j * 2 * Math.PI) / 5); }
    ctx.fillStyle = "#FF8093";
    ctx.beginPath(); ctx.arc(128, 128, 8, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "rgba(255, 183, 197, 0.8)";
    for (let p = 0; p < 3; p++) { drawPetal(75 + p*40, 70 - p*10, 25, p * 0.8); }

  } else if (type === "lemon") {
    // 4. Lát chanh vàng
    ctx.fillStyle = "#FFD700";
    ctx.beginPath(); ctx.arc(128, 128, 105, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#FFFACD";
    ctx.beginPath(); ctx.arc(128, 128, 94, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#FFD700"; ctx.strokeStyle = "#FFFACD"; ctx.lineWidth = 5;
    for (let i = 0; i < 8; i++) {
      const angle = (i * Math.PI) / 4;
      ctx.beginPath(); ctx.moveTo(128, 128); ctx.lineTo(128 + Math.cos(angle) * 94, 128 + Math.sin(angle) * 94); ctx.stroke();
    }

  } else if (type === "panda") {
    // 5. Sticker Gấu trúc Boba
    ctx.fillStyle = "#E2F0D9";
    ctx.beginPath(); ctx.arc(128, 128, 110, 0, Math.PI * 2); ctx.fill();
    // Đầu gấu trúc
    ctx.fillStyle = "#FFFFFF";
    ctx.beginPath(); ctx.arc(128, 135, 60, 0, Math.PI * 2); ctx.fill();
    // Tai đen
    ctx.fillStyle = "#2D3748";
    ctx.beginPath(); ctx.arc(80, 90, 22, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(176, 90, 22, 0, Math.PI * 2); ctx.fill();
    // Mắt đen
    ctx.beginPath(); ctx.ellipse(108, 130, 12, 16, Math.PI/12, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(148, 130, 12, 16, -Math.PI/12, 0, Math.PI * 2); ctx.fill();
    // Tròng mắt trắng
    ctx.fillStyle = "#FFFFFF";
    ctx.beginPath(); ctx.arc(110, 128, 4, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(146, 128, 4, 0, Math.PI * 2); ctx.fill();
    // Mũi miệng
    ctx.fillStyle = "#2D3748";
    ctx.beginPath(); ctx.arc(128, 146, 6, 0, Math.PI * 2); ctx.fill();

  } else if (type === "strawberry") {
    // 6. Sticker Quả dâu tây đỏ mọng
    ctx.fillStyle = "#FFF0F2";
    ctx.beginPath(); ctx.arc(128, 128, 110, 0, Math.PI * 2); ctx.fill();
    // Quả dâu hình trái tim úp ngược
    ctx.fillStyle = "#FF4D4D";
    ctx.beginPath();
    ctx.moveTo(128, 195);
    ctx.bezierCurveTo(78, 175, 58, 115, 88, 85);
    ctx.bezierCurveTo(108, 65, 128, 90, 128, 90);
    ctx.bezierCurveTo(128, 90, 148, 65, 168, 85);
    ctx.bezierCurveTo(198, 115, 178, 175, 128, 195);
    ctx.closePath(); ctx.fill();
    // Cuống lá màu xanh
    ctx.fillStyle = "#4CD964";
    ctx.beginPath();
    ctx.moveTo(128, 90); ctx.lineTo(108, 65); ctx.lineTo(128, 75); ctx.lineTo(148, 65);
    ctx.closePath(); ctx.fill();
    // Chấm hạt trắng nhỏ
    ctx.fillStyle = "#FFFFFF";
    for (let s = 0; s < 6; s++) {
      ctx.beginPath(); ctx.arc(108 + s*10, 115 + (s%2)*20, 2.5, 0, Math.PI * 2); ctx.fill();
    }

  } else if (type === "pineapple") {
    // 7. Quả dứa đeo kính râm cool ngầu
    ctx.fillStyle = "#FFFDE7";
    ctx.beginPath(); ctx.arc(128, 128, 110, 0, Math.PI * 2); ctx.fill();
    // Quả dứa
    ctx.fillStyle = "#FFA726";
    ctx.beginPath(); ctx.ellipse(128, 145, 50, 65, 0, 0, Math.PI * 2); ctx.fill();
    // Vân dứa đường chéo
    ctx.strokeStyle = "#FB8C00"; ctx.lineWidth = 3;
    for (let d = -40; d <= 40; d += 20) {
      ctx.beginPath(); ctx.moveTo(128 + d - 25, 80); ctx.lineTo(128 + d + 25, 210); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(128 + d + 25, 80); ctx.lineTo(128 + d - 25, 210); ctx.stroke();
    }
    // Lá dứa
    ctx.fillStyle = "#26A69A";
    ctx.beginPath();
    ctx.moveTo(128, 85); ctx.lineTo(108, 45); ctx.lineTo(128, 65); ctx.lineTo(148, 45);
    ctx.closePath(); ctx.fill();
    // Kính râm cực ngầu
    ctx.fillStyle = "#263238";
    ctx.fillRect(98, 115, 60, 15);
    ctx.beginPath(); ctx.arc(108, 130, 12, 0, Math.PI); ctx.arc(148, 130, 12, 0, Math.PI); ctx.fill();

  } else if (type === "clover") {
    // 8. Cỏ 4 lá may mắn
    ctx.fillStyle = "#E8F8F5";
    ctx.beginPath(); ctx.arc(128, 128, 110, 0, Math.PI * 2); ctx.fill();

    ctx.fillStyle = "#2ECC71";
    const drawLeaf = (cx: number, cy: number, rot: number) => {
      ctx.save(); ctx.translate(cx, cy); ctx.rotate(rot);
      ctx.beginPath(); ctx.moveTo(0, 0);
      ctx.bezierCurveTo(-15, -20, -25, -5, 0, -32);
      ctx.bezierCurveTo(25, -5, 15, -20, 0, 0);
      ctx.fill(); ctx.restore();
    };
    for (let l = 0; l < 4; l++) {
      drawLeaf(128, 128, (l * Math.PI) / 2);
    }
    // Thân cỏ
    ctx.strokeStyle = "#27AE60"; ctx.lineWidth = 6; ctx.lineCap = "round";
    ctx.beginPath(); ctx.moveTo(128, 128); ctx.quadraticCurveTo(115, 185, 100, 205); ctx.stroke();
  }

  ctx.restore();
  return canvas.toDataURL();
};

// Hàm sinh ảnh thiết kế Vector AI bằng Canvas (Client-side)
const generateAICanvasTexture = (prompt: string): string => {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";

  ctx.clearRect(0, 0, 512, 512);

  const cleanPrompt = prompt.toLowerCase().trim();
  let theme: "cat" | "coffee" | "flower" | "abstract" = "abstract";
  if (cleanPrompt.includes("mèo") || cleanPrompt.includes("cat") || cleanPrompt.includes("kitten")) {
    theme = "cat";
  } else if (cleanPrompt.includes("cà phê") || cleanPrompt.includes("coffee") || cleanPrompt.includes("caffe")) {
    theme = "coffee";
  } else if (cleanPrompt.includes("hoa") || cleanPrompt.includes("sakura") || cleanPrompt.includes("flower") || cleanPrompt.includes("đào")) {
    theme = "flower";
  }

  let hash = 0;
  for (let i = 0; i < prompt.length; i++) {
    hash = prompt.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue1 = Math.abs(hash) % 360;
  const hue2 = (hue1 + 140) % 360;
  const color1 = `hsl(${hue1}, 80%, 55%)`;
  const color2 = `hsl(${hue2}, 85%, 40%)`;

  ctx.save();
  ctx.beginPath();
  ctx.arc(256, 256, 200, 0, Math.PI * 2);
  const grad = ctx.createLinearGradient(80, 80, 432, 432);
  grad.addColorStop(0, color1);
  grad.addColorStop(1, color2);
  ctx.fillStyle = grad;
  ctx.fill();

  ctx.strokeStyle = "rgba(255, 255, 255, 0.9)";
  ctx.lineWidth = 8;
  ctx.beginPath(); ctx.arc(256, 256, 185, 0, Math.PI * 2); ctx.stroke();

  ctx.fillStyle = "#FFFFFF";
  ctx.strokeStyle = "#FFFFFF";
  ctx.lineWidth = 4;

  if (theme === "cat") {
    ctx.beginPath(); ctx.arc(256, 250, 75, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.moveTo(190, 210); ctx.lineTo(170, 140); ctx.lineTo(220, 185); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(322, 210); ctx.lineTo(342, 140); ctx.lineTo(292, 185); ctx.closePath(); ctx.fill();

    ctx.strokeStyle = "#5C3D2E";
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(225, 240, 10, 0, Math.PI, false); ctx.stroke();
    ctx.beginPath(); ctx.arc(285, 240, 10, 0, Math.PI, false); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(256, 250); ctx.lineTo(256, 260); ctx.stroke();
    ctx.beginPath(); ctx.arc(250, 260, 6, 0, Math.PI, false); ctx.stroke();
    ctx.beginPath(); ctx.arc(262, 260, 6, 0, Math.PI, false); ctx.stroke();

    ctx.fillStyle = "rgba(255, 182, 193, 0.8)";
    ctx.beginPath(); ctx.arc(210, 258, 8, 0, Math.PI * 2); ctx.arc(302, 258, 8, 0, Math.PI * 2); ctx.fill();
  } else if (theme === "coffee") {
    ctx.fillStyle = "#FFFFFF";
    ctx.beginPath();
    ctx.moveTo(176, 220); ctx.lineTo(336, 220); ctx.lineTo(310, 310); ctx.lineTo(202, 310);
    ctx.closePath(); ctx.fill();

    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = 10;
    ctx.beginPath(); ctx.arc(336, 255, 25, -Math.PI / 2, Math.PI / 2); ctx.stroke();

    ctx.lineWidth = 6;
    ctx.beginPath(); ctx.ellipse(256, 325, 90, 12, 0, 0, Math.PI * 2); ctx.fill();

    ctx.strokeStyle = "rgba(255, 255, 255, 0.85)";
    ctx.lineWidth = 4;
    for (const xOffset of [-35, 0, 35]) {
      ctx.beginPath();
      ctx.moveTo(256 + xOffset, 200);
      ctx.bezierCurveTo(246 + xOffset, 175, 266 + xOffset, 165, 256 + xOffset, 140);
      ctx.stroke();
    }
  } else if (theme === "flower") {
    const drawPetal = (centerX: number, centerY: number, angle: number) => {
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(angle);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.bezierCurveTo(-30, -50, -15, -90, 0, -80);
      ctx.bezierCurveTo(15, -90, 30, -50, 0, 0);
      ctx.fillStyle = "#FFFFFF";
      ctx.fill();
      ctx.restore();
    };

    for (let i = 0; i < 5; i++) {
      drawPetal(256, 246, (i * 2 * Math.PI) / 5);
    }
    ctx.fillStyle = "#FFA07A";
    ctx.beginPath(); ctx.arc(256, 246, 12, 0, Math.PI * 2); ctx.fill();
  } else {
    // Abstract star
    ctx.fillStyle = "#FFFFFF";
    const drawStar = (cx: number, cy: number, spikes: number, outer: number, inner: number) => {
      let rot = (Math.PI / 2) * 3;
      let x = cx;
      let y = cy;
      const step = Math.PI / spikes;

      ctx.beginPath();
      ctx.moveTo(cx, cy - outer);
      for (let i = 0; i < spikes; i++) {
        x = cx + Math.cos(rot) * outer; y = cy + Math.sin(rot) * outer; ctx.lineTo(x, y); rot += step;
        x = cx + Math.cos(rot) * inner; y = cy + Math.sin(rot) * inner; ctx.lineTo(x, y); rot += step;
      }
      ctx.lineTo(cx, cy - outer); ctx.closePath(); ctx.fill();
    };
    drawStar(256, 240, 8, 70, 30);
    ctx.strokeStyle = "rgba(255, 255, 255, 0.7)";
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(256, 240, 100, 0, Math.PI * 2); ctx.stroke();
  }

  ctx.fillStyle = "#FFFFFF";
  ctx.font = "bold 26px Arial, Helvetica, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  let displayText = prompt.toUpperCase();
  if (displayText.length > 22) {
    displayText = displayText.substring(0, 20) + "...";
  }
  ctx.fillText(displayText, 256, 375);

  ctx.font = "italic 13px Arial";
  ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
  ctx.fillText("✨ AI CREATIVE LAB ✨", 256, 410);

  ctx.restore();
  return canvas.toDataURL();
};

export function DesignControls({
  size,
  setSize,
  style,
  setStyle,
  materialType,
  setMaterialType,
  cupColor,
  setCupColor,
  logoUrl,
  setLogoUrl,
  isScanning,
  setIsScanning,
  setTriggerDrawImg,
  triggerDrawImg,
}: DesignControlsProps) {
  const [activeStep, setActiveStep] = useState<1 | 2>(1);
  const [prompt, setPrompt] = useState("");
  const [isStickerModalOpen, setIsStickerModalOpen] = useState(false);
  const addProduct = useCartStore((state) => state.addProduct);

  // Danh mục dạng ly
  const CUP_STYLES = [
    { id: "straight", label: "Ly Thẳng", desc: "Dáng trụ classic" },
    { id: "u_shape", label: "Ly Bầu", desc: "Đáy bầu tròn tinh tế" },
    { id: "heart", label: "Ly Tim", desc: "Thon cao, nắp nút tim" },
    { id: "mug", label: "Ly Quai", desc: "Quai cầm tiện dụng" },
  ] as const;

  // Danh mục chất liệu ly
  const CUP_MATERIALS = [
    { id: "clear", label: "Nhựa trong suốt PP" },
    { id: "frosted", label: "Nhựa mờ cát PET" },
    { id: "paper", label: "Giấy Ivory bảo vệ MT" },
    { id: "glass", label: "Thủy tinh Glass" },
    { id: "metal", label: "Inox giữ nhiệt" },
  ] as const;

  // Xử lý sinh ảnh AI
  const handleAIGenerate = () => {
    if (!prompt.trim()) {
      toast.error("Vui lòng nhập ý tưởng thiết kế!");
      return;
    }

    setIsScanning(true);
    setTimeout(() => {
      const generated = generateAICanvasTexture(prompt);
      setTriggerDrawImg(generated);
      setIsScanning(false);
      toast.success("Trợ lý AI đã vẽ xong mẫu thiết kế lên bảng vẽ!");
    }, 1800);
  };

  // Danh mục nhãn dán trong Modal (8 Sticker phong phú)
  const STICKERS_PRESETS = [
    { type: "cat", label: "🐱 Mèo Boba", desc: "Mèo cute uống trà sữa" },
    { type: "coffee", label: "☕ Cafe Stamp", desc: "Mẫu dấu cafe vintage" },
    { type: "sakura", label: "🌸 Hoa Đào", desc: "Cành đào sakura nở rộ" },
    { type: "lemon", label: "🍋 Chanh Tươi", desc: "Lát chanh vàng giải nhiệt" },
    { type: "panda", label: "🐼 Gấu Trúc", desc: "Gấu trúc boba tre xanh" },
    { type: "strawberry", label: "🍓 Dâu Tây", desc: "Dâu tây đỏ ngọt ngào" },
    { type: "pineapple", label: "🍍 Dứa Cực Cool", desc: "Trái dứa đeo kính ngầu" },
    { type: "clover", label: "🍀 May Mắn", desc: "Cỏ bốn lá xanh lá cây" },
  ] as const;

  // Xử lý dán sticker từ Modal lên canvas
  const handleStickerClick = (stickerType: string) => {
    const stickerData = generateStickerDataUrl(stickerType);
    setTriggerDrawImg(stickerData);
    setIsStickerModalOpen(false); // Đóng modal tự động
    toast.success(`Đã chèn nhãn dán vào bảng thiết kế!`);
  };

  // Quick prompt gợi ý
  const QUICK_PROMPTS = [
    { text: "Mèo con uống trà sữa Matcha cute", label: "🐱 Mèo Matcha" },
    { text: "Cà phê pha phin truyền thống Hà Nội", label: "☕ Cà phê Hà Nội" },
    { text: "Hoa đào mùa xuân Nhật Bản rực rỡ", label: "🌸 Hoa Đào Nhật" },
    { text: "Họa tiết lập thể trừu tượng Art", label: "🎨 Lập thể Art" },
  ];

  // Thêm sản phẩm in tùy chỉnh vào Giỏ hàng
  const handleAddToCart = () => {
    const configStyle = CUP_STYLES.find(s => s.id === style)?.label || style;
    const configMaterial = CUP_MATERIALS.find(m => m.id === materialType)?.label || materialType;
    
    const customConfig = {
      isCustom: true,
      size,
      style,
      materialType: configMaterial,
      cupColor: cupColor,
      logoUrl,
      decalY: 0,
      decalScale: 1,
      decalRotation: 0,
      promptUsed: prompt ? prompt : undefined,
    };

    const mockCustomProduct = {
      id: `custom-cup-${size.toLowerCase()}-${style}-${Date.now()}`,
      productRefId: `custom-cup-${size.toLowerCase()}-${style}-${Date.now()}`,
      slug: `custom-cup-${size.toLowerCase()}-${style}`,
      name: `Cốc Custom: ${configStyle} (Size ${size})`,
      category: "printed_cup" as const,
      price: SIZE_PRICES[size],
      b2bPrice: SIZE_PRICES[size],
      unit: "cái",
      stockSnapshot: 99999,
      imageUrl: logoUrl || "",
      updatedAt: new Date().toISOString(),
      customConfig,
    };

    addProduct(mockCustomProduct, 1);
    toast.success("Đã thêm ly thiết kế riêng vào giỏ hàng!");
  };

  const handleResetDesign = () => {
    setLogoUrl(null);
    setPrompt("");
    setCupColor("#FFFFFF");
    setMaterialType("clear");
    setStyle("straight");
    setActiveStep(1);
    toast.info("Đã khôi phục bảng thiết kế!");
  };

  return (
    <div className="flex flex-col gap-6 rounded-2xl border border-[#E6DFD9] bg-white p-6 shadow-sm relative">
      
      {/* Chỉ mục bước */}
      <div className="flex rounded-xl bg-[#FAF8F6] p-1 border border-[#E6DFD9]/60">
        <button
          onClick={() => setActiveStep(1)}
          className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
            activeStep === 1 ? "bg-primary text-white shadow-sm" : "text-[#7A6F68] hover:text-[#5C3D2E]"
          }`}
        >
          Bước 1: Chọn Dáng Ly
        </button>
        <button
          onClick={() => setActiveStep(2)}
          className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
            activeStep === 2 ? "bg-primary text-white shadow-sm" : "text-[#7A6F68] hover:text-[#5C3D2E]"
          }`}
        >
          Bước 2: Thiết Kế In Ấn
        </button>
      </div>

      {/* ================= BƯỚC 1: CẤU HÌNH LY ================= */}
      {activeStep === 1 && (
        <div className="flex flex-col gap-5">
          {/* 1. Chọn Kích cỡ (Đã bỏ giá cả hiển thị) */}
          <div>
            <h3 className="text-xs font-bold text-[#5C3D2E] uppercase tracking-wider mb-2.5 flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-xs text-primary font-bold">1</span>
              Kích thước ly (Size)
            </h3>
            <div className="grid grid-cols-4 gap-2">
              {(["S", "M", "L", "XL"] as const).map((s) => {
                const isSelected = size === s;
                const sizeLabel = s === "S" ? "S (360ml)" : s === "M" ? "M (500ml)" : s === "L" ? "L (700ml)" : "XL (1000ml)";
                return (
                  <button
                    key={s}
                    onClick={() => setSize(s)}
                    className={`rounded-xl border-2 py-3 px-1 text-center font-bold transition-all duration-200 ${
                      isSelected
                        ? "border-primary bg-[#FAF8F6] text-primary shadow-sm"
                        : "border-[#E6DFD9] bg-white text-[#7A6F68] hover:border-[#D2B48C]"
                    }`}
                  >
                    <div className="text-xs font-bold">{s}</div>
                    <div className="text-[9px] text-[#7A6F68]/70 leading-none mt-1">{sizeLabel.split(" ")[1]}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Chọn Dạng Ly */}
          <div>
            <h3 className="text-xs font-bold text-[#5C3D2E] uppercase tracking-wider mb-2.5 flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-xs text-primary font-bold">2</span>
              Dạng ly (Kiểu dáng 3D)
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {CUP_STYLES.map((st) => {
                const isSelected = style === st.id;
                return (
                  <button
                    key={st.id}
                    onClick={() => setStyle(st.id)}
                    className={`rounded-xl border-2 p-2.5 text-left transition-all duration-200 ${
                      isSelected
                        ? "border-primary bg-[#FAF8F6] text-primary shadow-sm"
                        : "border-[#E6DFD9] bg-white text-[#7A6F68] hover:border-[#D2B48C]"
                    }`}
                  >
                    <div className="text-xs font-bold">{st.label}</div>
                    <div className="text-[9px] text-[#7A6F68] mt-0.5">{st.desc}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Chọn Chất Liệu */}
          <div>
            <h3 className="text-xs font-bold text-[#5C3D2E] uppercase tracking-wider mb-2.5 flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-xs text-primary font-bold">3</span>
              Chất liệu cốc
            </h3>
            <div className="grid grid-cols-2 gap-2.5">
              {CUP_MATERIALS.map((mat) => (
                <label
                  key={mat.id}
                  className={`flex items-center gap-2 p-2 rounded-lg border border-[#E6DFD9] bg-white text-xs font-bold text-[#1C1917] cursor-pointer hover:border-[#D2B48C] transition-all`}
                >
                  <input
                    type="radio"
                    name="material"
                    checked={materialType === mat.id}
                    onChange={() => setMaterialType(mat.id)}
                    className="accent-primary h-4 w-4 shrink-0"
                  />
                  {mat.label}
                </label>
              ))}
            </div>
          </div>

          {/* 4. Chọn Màu Sắc (Color Picker duy nhất) */}
          <div>
            <h3 className="text-xs font-bold text-[#5C3D2E] uppercase tracking-wider mb-2.5 flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-xs text-primary font-bold">4</span>
              Màu sắc ly (Tùy chỉnh màu)
            </h3>
            
            <div className="flex items-center gap-3 bg-[#FAF8F6] p-4 rounded-xl border border-[#E6DFD9]/50">
              <div className="relative h-10 w-10 rounded-lg overflow-hidden border border-[#E6DFD9] shadow-sm shrink-0">
                <input
                  type="color"
                  value={cupColor}
                  onChange={(e) => setCupColor(e.target.value)}
                  className="absolute inset-0 w-full h-full cursor-pointer p-0 border-0"
                  style={{ transform: "scale(1.4)", transformOrigin: "center" }}
                />
              </div>
              <div>
                <div className="text-xs font-bold text-[#5C3D2E]">Nhấp vào ô vuông màu để tự chọn màu</div>
                <div className="text-[10px] text-[#7A6F68] mt-0.5 font-medium uppercase tracking-wider">Mã màu đang chọn: {cupColor}</div>
              </div>
            </div>
          </div>

          <Button
            onClick={() => setActiveStep(2)}
            className="w-full bg-primary hover:bg-[#4A2E22] text-white py-6 rounded-xl font-bold flex items-center justify-center gap-1.5 shadow-md mt-2"
          >
            Tiếp theo (Thiết kế in)
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* ================= BƯỚC 2: THIẾT KẾ IN ẤN ================= */}
      {activeStep === 2 && (
        <div className="flex flex-col gap-5">
          {/* Bảng vẽ 2D tích hợp */}
          <DesignCanvas2D
            onCanvasChange={setLogoUrl}
            triggerDrawImg={triggerDrawImg}
            setTriggerDrawImg={setTriggerDrawImg}
          />

          <hr className="border-[#E6DFD9]/60" />

          {/* Hộp chọn mẫu Sticker */}
          <div>
            <h3 className="text-xs font-bold text-[#5C3D2E] uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
              💡 Chèn mẫu hình in dán (Stickers)
            </h3>
            
            {/* Nút thêm sticker */}
            <Button
              onClick={() => setIsStickerModalOpen(true)}
              variant="outline"
              className="w-full border-2 border-dashed border-[#D2B48C] hover:border-primary text-primary hover:bg-[#FAF8F6] font-bold text-xs py-5 rounded-xl flex items-center justify-center gap-1.5"
            >
              <Plus className="h-4 w-4" />
              Thêm Sticker
            </Button>
          </div>

          {/* AI sinh mẫu */}
          <div>
            <h3 className="text-xs font-bold text-[#5C3D2E] uppercase tracking-wider mb-2 flex items-center gap-1.5">
              ✨ Trợ lý Thiết kế AI (Nhập ý tưởng)
            </h3>
            <div className="flex gap-2">
              <Input
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                disabled={isScanning}
                placeholder="Nhập ý tưởng (ví dụ: gấu trúc ăn trúc)..."
                className="text-xs focus-visible:ring-primary focus-visible:border-primary border-[#E6DFD9] bg-[#FAF8F6]"
              />
              <Button
                onClick={handleAIGenerate}
                disabled={isScanning}
                className="bg-primary hover:bg-[#4A2E22] text-white text-xs font-bold px-3 flex items-center gap-1 shrink-0"
              >
                <Sparkles className="h-3.5 w-3.5" />
                Tạo mẫu
              </Button>
            </div>

            {/* Quick prompts */}
            <div className="mt-2 flex flex-wrap gap-1.5">
              {QUICK_PROMPTS.map((qp, idx) => (
                <button
                  key={idx}
                  disabled={isScanning}
                  onClick={() => {
                    setPrompt(qp.text);
                    toast.info(`Đã chọn gợi ý: "${qp.text}"`);
                  }}
                  className="rounded-full border border-[#E6DFD9] bg-white px-2.5 py-0.5 text-[9px] font-bold text-[#7A6F68] hover:border-[#D2B48C] hover:text-[#5C3D2E] transition-colors"
                >
                  {qp.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tác vụ */}
          <div className="mt-1 flex flex-col gap-2">
            <div className="flex justify-between items-center bg-[#FAF8F6] p-3 rounded-xl border border-[#E6DFD9]">
              <span className="text-xs font-bold text-[#7A6F68]">Đơn giá cốc in tùy chỉnh:</span>
              <span className="text-base font-extrabold text-primary">{SIZE_PRICES[size].toLocaleString("vi-VN")} đ</span>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={() => setActiveStep(1)}
                variant="outline"
                className="border-[#E6DFD9] hover:bg-[#FAF8F6] text-[#7A6F68] hover:text-[#5C3D2E] text-xs font-bold px-3 py-5"
                title="Quay lại chọn cốc"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Quay lại
              </Button>

              <Button
                onClick={handleResetDesign}
                variant="outline"
                className="border-red-200 hover:bg-red-50 text-red-500 text-xs font-bold px-3 py-5"
                title="Đặt lại thiết kế"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
              
              <Button
                onClick={handleAddToCart}
                className="flex-1 bg-primary hover:bg-[#4A2E22] text-white font-bold text-xs py-5 rounded-xl flex items-center justify-center gap-1.5 shadow-md hover:shadow-lg transition-all"
              >
                <ShoppingBag className="h-4 w-4" />
                THÊM GIỎ HÀNG
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL NHÃN DÁN STICKERS ================= */}
      {isStickerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-white border border-[#E6DFD9] rounded-2xl p-6 shadow-2xl animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
            
            {/* Header Modal */}
            <div className="flex items-center justify-between border-b border-[#E6DFD9]/60 pb-3 mb-4">
              <div>
                <h3 className="text-sm font-bold text-[#5C3D2E] uppercase tracking-wider">Chọn nhãn dán (Sticker)</h3>
                <p className="text-[10px] text-[#7A6F68] mt-0.5">Click vào hình để chèn trực tiếp lên ô thiết kế của ly</p>
              </div>
              <button
                onClick={() => setIsStickerModalOpen(false)}
                className="p-1.5 rounded-lg border border-[#E6DFD9] hover:bg-red-50 text-[#7A6F68] hover:text-red-500 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Grid các nhãn dán */}
            <div className="grid grid-cols-2 gap-3 overflow-y-auto pr-1 flex-grow pb-1">
              {STICKERS_PRESETS.map((st) => {
                const stickerDataUrl = generateStickerDataUrl(st.type);
                return (
                  <button
                    key={st.type}
                    draggable
                    onDragStart={(e) => {
                      // Gắn data URL của sticker vào drag event để canvas nhận
                      e.dataTransfer.setData("text/plain", stickerDataUrl);
                      e.dataTransfer.effectAllowed = "copy";
                    }}
                    onClick={() => handleStickerClick(st.type)}
                    className="rounded-xl border border-[#E6DFD9] bg-white p-3 text-left hover:border-primary transition-all flex items-start gap-2.5 hover:bg-[#FAF8F6] group cursor-grab active:cursor-grabbing"
                  >
                    <div className="h-12 w-12 rounded-lg border border-[#E6DFD9] overflow-hidden shrink-0 flex items-center justify-center bg-white shadow-sm p-1 group-hover:scale-105 transition-transform duration-200">
                      <img
                        src={stickerDataUrl}
                        alt={st.label}
                        className="h-full w-full object-contain pointer-events-none"
                        draggable={false}
                      />
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-xs font-bold text-[#5C3D2E] group-hover:text-primary transition-colors">
                        {st.label}
                      </span>
                      <span className="text-[9px] text-[#7A6F68] leading-tight">
                        {st.desc}
                      </span>
                      <span className="text-[8px] text-[#D2B48C] mt-0.5 font-medium">
                        Click hoặc kéo thả vào canvas
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Footer Modal */}
            <div className="border-t border-[#E6DFD9]/60 pt-3 mt-4 text-right">
              <Button
                onClick={() => setIsStickerModalOpen(false)}
                variant="outline"
                className="border-[#E6DFD9] hover:bg-[#FAF8F6] text-[#7A6F68] text-xs font-bold"
              >
                Đóng
              </Button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
