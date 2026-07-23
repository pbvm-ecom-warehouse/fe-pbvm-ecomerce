"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  FolderOpen,
  History,
  Loader2,
  Bot,
  PackagePlus,
  Paintbrush,
  Send,
  ShoppingCart,
  Sparkles,
  Trash2,
  User,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/ui/logo";
import { cn } from "@/lib/utils";
import { useCartStore } from "@/stores/cart-store";
import { useAuthStore } from "@/stores/auth-store";
import {
  createDesign,
  listMyDesigns,
  deleteDesign,
  uploadDesignImage,
} from "../services/design.service";
import { sendChatMessageToAi } from "../services/ai-chat.service";
import { publicApiFetch } from "@/lib/public-api";
import {
  fetchAllCupVariantsFromApi,
} from "@/features/catalog/services/catalog.service";
import type {
  CupMaterialType,
  CupSize,
  CupStyle,
  DesignArtwork,
  DesignArtworkLayer,
  DesignImageLayer,
  DesignFileSnapshot,
} from "@/types/api";
import { formatCurrency } from "@/utils/format-currency";
import {
  CUP_MATERIAL_LABELS,
  CUP_SIZE_LABELS,
  CUP_SIZE_SPECS,
  CUP_STYLE_LABELS,
  DEFAULT_CUP_CONFIG,
  createCustomCupProduct,
  createDesignSnapshot,
  getArtboardDimensions,
} from "../utils/artwork";

/* ─── DYNAMIC IMPORTS ─── */
const ArtworkEditor2D = dynamic(
  () => import("./artwork-editor-2d").then((m) => m.ArtworkEditor2D),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-[500px] rounded-2xl border border-slate-200 bg-white animate-pulse flex items-center justify-center">
        <div className="flex flex-col items-center gap-2 text-slate-400">
          <Loader2 className="size-6 animate-spin text-primary" />
          <span className="text-xs font-semibold">Đang tải trình thiết kế 2D...</span>
        </div>
      </div>
    ),
  },
);

const CupPreview3D = dynamic(
  () => import("./cup-preview-3d").then((module) => module.CupPreview3D),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-[420px] rounded-2xl border border-slate-200 bg-slate-50 animate-pulse flex items-center justify-center">
        <div className="flex flex-col items-center gap-2 text-slate-400">
          <Loader2 className="size-6 animate-spin text-primary" />
          <span className="text-xs font-semibold">Đang tải mô phỏng 3D...</span>
        </div>
      </div>
    ),
  },
);

/* ─── ALL POSSIBLE TYPES ─── */
interface InStockVariant {
  materialType: CupMaterialType;
  style: CupStyle;
  size: CupSize;
  stockSnapshot: number;
  /** true nếu combo này còn hàng trong kho */
  inStock: boolean;
}

const ALL_MATERIALS: CupMaterialType[] = ["clear", "frosted", "paper", "glass"];
const ALL_STYLES: CupStyle[] = ["straight", "u_shape", "heart", "mug"];
const ALL_SIZES: CupSize[] = ["350ml", "500ml", "700ml", "1000ml"];

/** Số mẫu thiết kế tối đa mỗi khách hàng */
const MAX_DESIGNS = 15;

const MATERIAL_DESCRIPTIONS: Record<CupMaterialType, string> = {
  clear: "Trong suốt 100%, nổi bật màu sắc đồ uống",
  frosted: "Bề mặt nhám cao cấp, mịn tay & sang trọng",
  paper: "Kraft 2 lớp giữ nhiệt, thân thiện môi trường",
  glass: "Thủy tinh cao cấp, độ bền cao & tái sử dụng",
  metal: "Kim loại giữ nhiệt lâu",
};

const STYLE_DESCRIPTIONS: Record<CupStyle, string> = {
  straight: "Dáng thẳng truyền thống, phù hợp mọi món nước",
  u_shape: "Đáy bầu cong quyến rũ, tôn dáng trà sữa",
  heart: "Nắp nốt tim dễ thương, thu hút giới trẻ",
  mug: "Có quai cầm tiện lợi, chống nóng lạnh hiệu quả",
};

const SIZE_DESCRIPTIONS: Record<CupSize, string> = {
  "350ml": "Size nhỏ vừa vặn (350ml)",
  "500ml": "Size vừa phổ biến nhất (500ml)",
  "700ml": "Size lớn uống thỏa thích (700ml)",
  "1000ml": "Size khổng lồ (1000ml)",
};

const DESIGN_DRAFT_KEY = "cup_designer_draft_v1";
const SAVED_DESIGNS_KEY = "cup_designer_saved_designs_v1";

interface DesignDraft {
  materialType: CupMaterialType;
  style: CupStyle;
  size: CupSize;
  printHeightPercent: number;
  layers: DesignArtworkLayer[];
  quantity: number;
}

function loadDraft(): DesignDraft | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(DESIGN_DRAFT_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as DesignDraft;
  } catch {
    return null;
  }
}

function loadSavedDesigns(): any[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(SAVED_DESIGNS_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as any[];
  } catch {
    return [];
  }
}

function persistSavedDesigns(designs: any[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(SAVED_DESIGNS_KEY, JSON.stringify(designs));
  } catch {
    // localStorage full
  }
}

/** Merge local designs với API designs theo id, ưu tiên API data, local-only giữ nguyên */
function mergeDesigns(local: any[], remote: any[]): any[] {
  const remoteIds = new Set(remote.map((d) => d.id));
  const localOnly = local.filter((d) => !remoteIds.has(d.id));
  return [...remote, ...localOnly];
}

interface InStockVariant {
  materialType: CupMaterialType;
  style: CupStyle;
  size: CupSize;
  stockSnapshot: number;
  inStock: boolean;
  sku?: string;
  price?: number;
}

export function CupDesignerPage() {

  const [isMounted, setIsMounted] = useState(false);
  const [currentStep, setCurrentStep] = useState<1 | 2>(1);

  // All variants (kể cả hết hàng) fetched from DB API
  const [inStockVariants, setInStockVariants] = useState<InStockVariant[]>([]);
  const [isLoadingDb, setIsLoadingDb] = useState(true);

  // Số mẫu thiết kế hiện tại của khách
  const [designsCount, setDesignsCount] = useState(0);
  // Product-based mode: khoá material + style
  const [isProductLocked, setIsProductLocked] = useState(false);

  // Cup config state — khôi phục từ localStorage nếu có
  const [materialType, setMaterialType] = useState<CupMaterialType>(() => loadDraft()?.materialType ?? DEFAULT_CUP_CONFIG.materialType);
  const [style, setStyle] = useState<CupStyle>(() => loadDraft()?.style ?? DEFAULT_CUP_CONFIG.style);
  const [size, setSize] = useState<CupSize>(() => loadDraft()?.size ?? DEFAULT_CUP_CONFIG.size);
  const [cupColor] = useState(DEFAULT_CUP_CONFIG.cupColor);
  const [printHeightPercent, setPrintHeightPercent] = useState(() => loadDraft()?.printHeightPercent ?? DEFAULT_CUP_CONFIG.printHeightPercent);


  // Editor state — khôi phục từ localStorage nếu có
  const [quantity, setQuantity] = useState(() => loadDraft()?.quantity ?? 100);
  const [layers, setLayers] = useState<DesignArtworkLayer[]>(() => loadDraft()?.layers ?? []);
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null);
  const [artworkTextureUrl, setArtworkTextureUrl] = useState("");
  const [editorKey, setEditorKey] = useState(0);
  const [isSavingDesign, setIsSavingDesign] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [isAiProcessing, setIsAiProcessing] = useState(false);
  const [aiMessages, setAiMessages] = useState<
    {
      id: string;
      sender: "user" | "ai";
      text: string;
      imageUrl?: string;
      timestamp: string;
    }[]
  >([
    {
      id: "msg_welcome",
      sender: "ai",
      text: "Xin chào! Tôi là Trợ lý AI. Hãy gửi tin nhắn mô tả logo hoặc họa tiết bạn muốn vẽ lên ly nhé!",
      timestamp: "Vừa xong",
    },
  ]);

  const [aiHistoryLogos, setAiHistoryLogos] = useState<
    Array<{ id: string; src: string; prompt: string; timestamp: string }>
  >([]);

  const imageLayerCount = useMemo(() => {
    return layers.filter((l) => l.type === "image").length;
  }, [layers]);

  const handleSendAiMessage = useCallback(
    async (customPrompt?: string) => {
      const textToSend = (customPrompt || aiPrompt).trim();
      if (!textToSend) return;

      const now = new Date().toLocaleTimeString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
      });

      const userMsg = {
        id: `user_${Date.now()}`,
        sender: "user" as const,
        text: textToSend,
        timestamp: now,
      };

      setAiMessages((prev) => [...prev, userMsg]);
      setAiPrompt("");
      setIsAiProcessing(true);

      try {
        const currentLayersSummary = layers.map((l) => {
          if (l.type === "image") {
            return {
              type: "image",
              prompt: (l as DesignImageLayer).prompt || "Logo/Họa tiết trên ly",
            };
          }
          return {
            type: "text",
            text: (l as any).text || "",
          };
        });

        const { text: aiReplyText, imageUrl: src, logoPromptInfo } = await sendChatMessageToAi(
          textToSend,
          aiMessages,
          {
            materialType,
            style,
            size,
            layersCount: layers.length,
            currentLayers: currentLayersSummary,
          },
        );

        if (src) {
          const dims = getArtboardDimensions(size, printHeightPercent);
          const newId = `img_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
          const promptLabel = logoPromptInfo || textToSend;

          setAiHistoryLogos((prev) => [
            {
              id: `hist_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
              src,
              prompt: promptLabel,
              timestamp: now,
            },
            ...prev.filter((item) => item.src !== src),
          ]);

          const imageLayer: DesignArtworkLayer = {
            id: newId,
            type: "image",
            src,
            x: dims.printArea.x + dims.printArea.width / 2 - 100,
            y: dims.printArea.y + dims.printArea.height / 2 - 100,
            width: 200,
            height: 200,
            rotation: 0,
            source: "ai",
            prompt: promptLabel,
          };

          setLayers((prev) => {
            const existingImageIndex = prev.findIndex(
              (l): l is DesignImageLayer => l.type === "image",
            );
            if (existingImageIndex >= 0) {
              const oldLayer = prev[existingImageIndex] as DesignImageLayer;
              const updatedLayer: DesignImageLayer = {
                ...oldLayer,
                id: newId,
                src,
                prompt: promptLabel,
              };
              const nextLayers = [...prev];
              nextLayers[existingImageIndex] = updatedLayer;
              return nextLayers;
            }
            return [...prev, imageLayer];
          });
          setSelectedLayerId(newId);


          // TỰ ĐỘNG LƯU VÀO PHẦN "THIẾT KẾ ĐÃ LƯU" (SAVED DESIGNS)
          const shortPrompt = promptLabel.length > 30 ? `${promptLabel.slice(0, 30)}...` : promptLabel;
          const designName = `Mẫu AI: ${shortPrompt}`;
          const autoSnapshot = createDesignSnapshot({
            name: designName,
            previewDataUrl: src,
            artwork: {
              cup: { size, style, materialType, cupColor },
              artboard: { width: dims.width, height: dims.height, printHeightPercent },
              layers: [imageLayer],
            },
          });

          const autoDesignItem = {
            id: `auto_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
            name: designName,
            thumbnail: src,
            file: JSON.stringify({
              snapshotVersion: autoSnapshot.snapshotVersion,
              designId: autoSnapshot.designId,
              name: autoSnapshot.name,
              artwork: autoSnapshot.artwork,
              exportedAt: autoSnapshot.exportedAt,
            }),
            createdAt: new Date().toISOString(),
          };

          setSavedDesigns((prev) => [autoDesignItem, ...prev.filter((d) => d.name !== designName)]);
          setShowSavedPanel(true);

          if (user) {
            createDesign({
              name: designName,
              file: autoDesignItem.file,
              thumbnail: src,
            }).catch((e) => console.warn("Auto save design API error:", e));
          }
        }

        const aiMsg = {
          id: `ai_${Date.now()}`,
          sender: "ai" as const,
          text: aiReplyText,
          timestamp: now,
        };

        setAiMessages((prev) => [...prev, aiMsg]);
      } catch (err) {
        console.error(err);
        toast.error("Trợ lý AI gặp gián đoạn lúc này.");
      } finally {
        setIsAiProcessing(false);
      }
    },
    [aiPrompt, aiMessages, materialType, style, size, layers, printHeightPercent],
  );

  const handleApplyHistoryLogo = useCallback(
    (src: string, promptText: string) => {
      const dims = getArtboardDimensions(size, printHeightPercent);
      const newId = `img_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

      const imageLayer: DesignArtworkLayer = {
        id: newId,
        type: "image",
        src,
        x: dims.printArea.x + dims.printArea.width / 2 - 100,
        y: dims.printArea.y + dims.printArea.height / 2 - 100,
        width: 200,
        height: 200,
        rotation: 0,
        source: "ai",
        prompt: promptText,
      };

      setLayers((prev) => {
        const existingAiIndex = prev.findIndex(
          (l): l is DesignImageLayer => l.type === "image" && l.source === "ai",
        );
        if (existingAiIndex >= 0) {
          const oldLayer = prev[existingAiIndex] as DesignImageLayer;
          const updatedLayer: DesignImageLayer = {
            ...oldLayer,
            id: newId,
            src,
            prompt: promptText,
          };
          const nextLayers = [...prev];
          nextLayers[existingAiIndex] = updatedLayer;
          return nextLayers;
        }
        return [...prev, imageLayer];
      });
      setSelectedLayerId(newId);
      toast.success("Đã áp dụng mẫu logo từ lịch sử lên ly!");
    },
    [size, printHeightPercent],
  );

  const handleReuseHistoryLogoForEdit = useCallback((promptText: string) => {
    setAiPrompt(`Sửa logo ${promptText}: `);
    const inputEl = document.getElementById("ai-chat-input") as HTMLInputElement | null;
    if (inputEl) {
      inputEl.focus();
    }
  }, []);

  // Saved designs panel — khởi tạo từ localStorage
  const [savedDesigns, setSavedDesigns] = useState<any[]>(() => loadSavedDesigns());
  const [loadingDesigns, setLoadingDesigns] = useState(false);
  const [showSavedPanel, setShowSavedPanel] = useState(true);
  const [designToDelete, setDesignToDelete] = useState<any | null>(null);


  const addCustomPrintItem = useCartStore((s) => s.addCustomPrintItem);
  const user = useAuthStore((s) => s.user);

  const searchParams = useSearchParams();
  /** productId truyền vào từ trang sản phẩm — có nghĩa là "Product-based mode" */
  const productIdFromUrl = searchParams?.get("productId") ?? null;

  /* ── 0. AUTO-SAVE DRAFT VÀO LOCALSTORAGE ── */
  useEffect(() => {
    if (!isMounted) return;
    const draft: DesignDraft = { materialType, style, size, printHeightPercent, layers, quantity };
    try {
      localStorage.setItem(DESIGN_DRAFT_KEY, JSON.stringify(draft));
    } catch {
      // Bỏ qua nếu localStorage đầy
    }
  }, [isMounted, materialType, style, size, printHeightPercent, layers, quantity]);

  /* ── 0b. AUTO-SAVE SAVED DESIGNS VÀO LOCALSTORAGE ── */
  useEffect(() => {
    if (!isMounted) return;
    persistSavedDesigns(savedDesigns);
  }, [isMounted, savedDesigns]);

  /* ── 1. FETCH TẤT CẢ VARIANTS LY TỪ DB (kể cả hết hàng) ── */
  useEffect(() => {
    setIsMounted(true);
    setIsLoadingDb(true);

    fetchAllCupVariantsFromApi()
      .then((apiVariants) => {
        const mapped = (apiVariants ?? []).map((v) => ({
          materialType: v.materialType,
          style: v.style,
          size: v.size,
          stockSnapshot: v.availableQty,
          inStock: v.inStock,
          sku: v.sku,
          price: v.price,
        }));
        setInStockVariants(mapped);
      })
      .catch((err) => {
        console.error("Failed to load catalog inventory from DB API:", err);
        setInStockVariants([]);
      })
      .finally(() => {
        setIsLoadingDb(false);
      });
  }, []);

  const selectedVariantInfo = useMemo(() => {
    return inStockVariants.find(
      (v) => v.materialType === materialType && v.style === style && v.size === size,
    );
  }, [inStockVariants, materialType, style, size]);

  const currentCupSku = useMemo(() => {
    if (selectedVariantInfo?.sku) return selectedVariantInfo.sku;
    const matCode = materialType === "clear" ? "PET" : materialType === "frosted" ? "PP" : materialType === "paper" ? "PAPER" : "GLASS";
    const styleCode = style === "u_shape" ? "-U" : style === "heart" ? "-HEART" : style === "mug" ? "-MUG" : "";
    return `CUP-${matCode}-${size.toUpperCase()}${styleCode}`;
  }, [selectedVariantInfo, materialType, size, style]);


  const loadDesignIdFromUrl = searchParams?.get("loadDesignId") ?? null;

  /* ── 1d. AUTO LOAD DESIGN TỪ URL PARAMS ── */
  useEffect(() => {
    if (!loadDesignIdFromUrl || !isMounted || savedDesigns.length === 0) return;
    const target = savedDesigns.find((d) => String(d.id) === String(loadDesignIdFromUrl));
    if (target) {
      handleLoadDesign(target);
    }
  }, [loadDesignIdFromUrl, savedDesigns, isMounted]);

  /* ── 1b. Đếm số design hiện tại của khách ── */
  useEffect(() => {
    if (!user || user.type === "admin") return;
    listMyDesigns()
      .then((designs) => setDesignsCount(Array.isArray(designs) ? designs.length : 0))
      .catch(() => setDesignsCount(0));
  }, [user]);


  /* ── 1c. PRODUCT-BASED MODE: Pre-fill từ productId trong URL ── */
  useEffect(() => {
    if (!productIdFromUrl) return;

    setIsProductLocked(true);

    // Fetch product detail hoặc parse từ list để pre-fill material, style, size
    publicApiFetch<any>(`/catalog/products/${encodeURIComponent(productIdFromUrl)}`)
      .then((p) => {
        if (!p) return;
        const attr = p.attributes ?? p.variants?.[0]?.attributes ?? {};
        const fullText = [
          p.name,
          p.slug,
          ...Object.values(attr).map(String),
        ]
          .join(" ")
          .toLowerCase();

        if (fullText.includes("pp") || fullText.includes("mờ")) {
          setMaterialType("frosted");
        } else if (fullText.includes("pet") || fullText.includes("trong")) {
          setMaterialType("clear");
        } else if (fullText.includes("giấy") || fullText.includes("paper")) {
          setMaterialType("paper");
        } else if (fullText.includes("thủy tinh") || fullText.includes("glass")) {
          setMaterialType("glass");
        }

        if (fullText.includes("bầu") || fullText.includes("u-shape") || fullText.includes("đáy u")) {
          setStyle("u_shape");
        } else if (fullText.includes("tim")) {
          setStyle("heart");
        } else if (fullText.includes("thẳng")) {
          setStyle("straight");
        } else if (fullText.includes("mug")) {
          setStyle("mug");
        }

        if (fullText.includes("700")) setSize("700ml");
        else if (fullText.includes("500")) setSize("500ml");
        else if (fullText.includes("350")) setSize("350ml");
        else if (fullText.includes("1000")) setSize("1000ml");
      })
      .catch((err) => {
        console.warn("Product detail pre-fill warning:", err);
      });
  }, [productIdFromUrl]);

  const sizeFromUrl = searchParams?.get("size") ?? null;

  useEffect(() => {
    if (!sizeFromUrl) return;
    const clean = sizeFromUrl.toLowerCase();
    if (clean.includes("1000")) setSize("1000ml");
    else if (clean.includes("700")) setSize("700ml");
    else if (clean.includes("500")) setSize("500ml");
    else if (clean.includes("350")) setSize("350ml");
  }, [sizeFromUrl]);

  /* ── 2. CASCADING RELATIONAL OPTION FILTERING (Chỉ hiển thị ly đã từng nhập trong DB) ── */
  // A. Available Materials (chỉ hiển thị chất liệu từng nhập trong DB)
  const availableMaterials = useMemo(() => {
    if (inStockVariants.length === 0) return ALL_MATERIALS;
    const mats = new Set<CupMaterialType>();
    inStockVariants.forEach((v) => mats.add(v.materialType));
    const filtered = ALL_MATERIALS.filter((m) => mats.has(m));
    return filtered.length > 0 ? filtered : ALL_MATERIALS;
  }, [inStockVariants]);

  // B. Available Styles FOR selected Material (chỉ hiển thị kiểu dáng của chất liệu đó trong DB)
  const availableStyles = useMemo(() => {
    if (inStockVariants.length === 0) return ALL_STYLES;
    const stys = new Set<CupStyle>();
    inStockVariants.forEach((v) => {
      if (v.materialType === materialType) stys.add(v.style);
    });
    const filtered = ALL_STYLES.filter((s) => stys.has(s));
    return filtered.length > 0 ? filtered : ALL_STYLES;
  }, [inStockVariants, materialType]);

  // C. Available Sizes FOR selected Material AND Style (chỉ hiển thị dung tích từng nhập của combo đó trong DB)
  const availableSizes = useMemo(() => {
    if (inStockVariants.length === 0) return ALL_SIZES;
    const szs = new Set<CupSize>();
    inStockVariants.forEach((v) => {
      if (v.materialType === materialType && v.style === style) szs.add(v.size);
    });
    const filtered = ALL_SIZES.filter((s) => szs.has(s));
    return filtered.length > 0 ? filtered : ALL_SIZES;
  }, [inStockVariants, materialType, style]);

  // Auto-correct selected Material if not available
  useEffect(() => {
    if (availableMaterials.length > 0 && !availableMaterials.includes(materialType)) {
      setMaterialType(availableMaterials[0]);
    }
  }, [availableMaterials, materialType]);

  // Auto-correct selected Style if not available for current Material
  useEffect(() => {
    if (availableStyles.length > 0 && !availableStyles.includes(style)) {
      setStyle(availableStyles[0]);
    }
  }, [availableStyles, style]);

  // Auto-correct selected Size if not available for current Material + Style
  useEffect(() => {
    if (availableSizes.length > 0 && !availableSizes.includes(size)) {
      setSize(availableSizes[0]);
    }
  }, [availableSizes, size]);

  /** Combo hiện tại có hàng trong kho không? */
  const isCurrentComboOutOfStock = useMemo(() => {
    if (inStockVariants.length === 0) return false;
    const match = inStockVariants.find(
      (v) => v.materialType === materialType && v.style === style && v.size === size,
    );
    return match ? !match.inStock || (match.stockSnapshot ?? 0) <= 0 : false;
  }, [inStockVariants, materialType, style, size]);

  const matchingVariant = useMemo(() => {
    return inStockVariants.find(
      (v) => v.materialType === materialType && v.style === style && v.size === size,
    );
  }, [inStockVariants, materialType, style, size]);

  const dimensions = getArtboardDimensions(size, printHeightPercent);
  const price = (matchingVariant as any)?.price && (matchingVariant as any).price > 0
    ? (matchingVariant as any).price
    : CUP_SIZE_SPECS[size].price;
  const subtotal = price * quantity;

  const artwork = useMemo<DesignArtwork>(
    () => ({
      artboard: { width: dimensions.width, height: dimensions.height, printHeightPercent },
      cup: { size, style, materialType, cupColor },
      layers,
    }),
    [cupColor, dimensions.height, dimensions.width, layers, materialType, printHeightPercent, size, style],
  );

  const handleTextureChange = useCallback((dataUrl: string) => {
    setArtworkTextureUrl((cur) => (cur === dataUrl ? cur : dataUrl));
  }, []);

  function handleSizeChange(nextSize: CupSize) {
    setSize(nextSize);
    setPrintHeightPercent(DEFAULT_CUP_CONFIG.printHeightPercent);
    setSelectedLayerId(null);
  }

  function goToStep(step: 1 | 2) {
    setCurrentStep(step);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  /** Chuyển sang Giai đoạn 2 sau khi chọn phôi ly -> Luôn tạo bảng vẽ mới (empty layers) */
  function handleProceedToStep2() {
    setLayers([]);
    setSelectedLayerId(null);
    setEditorKey((k) => k + 1);
    goToStep(2);
  }


  function refreshSavedDesigns() {
    if (!user || user.type === "admin") return;
    listMyDesigns()
      .then((data) => {
        const merged = mergeDesigns(loadSavedDesigns(), data || []);
        setSavedDesigns(merged);
      })
      .catch(() => {}); // giữ local khi API lỗi
  }

  useEffect(() => {
    if (!user || user.type === "admin") return;
    setLoadingDesigns(true);
    listMyDesigns()
      .then((data) => {
        const merged = mergeDesigns(loadSavedDesigns(), data || []);
        setSavedDesigns(merged);
      })
      .catch(() => {}) // giữ local khi API lỗi
      .finally(() => setLoadingDesigns(false));
  }, [user]);

  function confirmDeleteDesign(design: any) {
    setSavedDesigns((prev) => prev.filter((d) => d.id !== design.id));
    if (user && design.id && !String(design.id).startsWith("auto_")) {
      deleteDesign(design.id).catch((e) => console.warn("Delete design API:", e));
    }
    toast.success(`Đã xóa thiết kế "${design.name}"`);
  }


  function handleLoadDesign(design: any) {
    let snapshot: DesignFileSnapshot | null = null;
    if (typeof design.file === "string" && design.file.trimStart().startsWith("{")) {
      try {
        snapshot = JSON.parse(design.file) as DesignFileSnapshot;
      } catch {
        // old format
      }
    }

    if (!snapshot?.artwork) {
      toast.error("Thiết kế cũ không có dữ liệu layers để khôi phục.");
      return;
    }

    const { cup, artboard, layers: savedLayers } = snapshot.artwork;
    setSize(cup.size);
    setStyle(cup.style);
    setMaterialType(cup.materialType);
    setPrintHeightPercent(artboard.printHeightPercent);
    setLayers(savedLayers ?? []);
    setSelectedLayerId(null);
    setEditorKey((k) => k + 1);
    const shortName = design.name && design.name.length > 25 ? `${design.name.slice(0, 25)}...` : design.name;
    toast.success(`Đã tải mẫu "${shortName}" thành công!`);
    goToStep(2);
  }


  async function addToCart() {
    if (!user) {
      toast.error("Vui lòng đăng nhập để lưu và thêm thiết kế vào giỏ.");
      return;
    }
    if (layers.length === 0) {
      toast.error("Hãy thêm ít nhất một layer thiết kế (logo, chữ hoặc họa tiết) ở Giai đoạn 2 trước khi đặt in.");
      goToStep(2);
      return;
    }
    if (designsCount >= MAX_DESIGNS) {
      toast.error(`Bạn đã đạt ${MAX_DESIGNS} mẫu thiết kế. Vui lòng xóa mẫu cũ tại trang "Thiết kế của tôi" trước khi tạo mới.`);
      return;
    }

    setIsSavingDesign(true);
    try {
      const designFile = createDesignSnapshot({
        name: `Ly in PBVM ${CUP_SIZE_LABELS[size]}`,
        previewDataUrl: artworkTextureUrl,
        artwork,
      });

      const artworkPayload = JSON.stringify({
        snapshotVersion: designFile.snapshotVersion,
        designId: designFile.designId,
        name: designFile.name,
        artwork: designFile.artwork,
        exportedAt: designFile.exportedAt,
      });

      let uploadedThumbnail = artworkTextureUrl;
      if (artworkTextureUrl && artworkTextureUrl.startsWith("data:")) {
        try {
          const uploadRes = await uploadDesignImage(artworkTextureUrl);
          uploadedThumbnail = uploadRes.thumbnail || uploadRes.file || artworkTextureUrl;
        } catch (e) {
          console.warn("Upload thumbnail to Cloudinary error:", e);
        }
      }

      const savedDesign = await createDesign({
        name: designFile.name,
        file: artworkPayload,
        thumbnail: uploadedThumbnail,
      });

      // Tăng số mẫu sau khi lưu thành công
      setDesignsCount((c) => c + 1);

      if (isCurrentComboOutOfStock) {
        // Hết hàng: chỉ lưu design, không add vào giỏ
        toast.success(`Đã lưu thiết kế thành công! Combo này hiện hết hàng, bạn có thể đặt khi kho có lại.`);
      } else {
        addCustomPrintItem({
          product: {
            ...createCustomCupProduct({ size, price }),
            productRefId: currentCupSku,
            name: `Ly in theo thiết kế ${CUP_MATERIAL_LABELS[materialType]} ${size} (${currentCupSku})`,
          },
          quantity,
          designId: savedDesign.id,
          designFile: { ...designFile, designId: savedDesign.id },
        });

        toast.success("Đã lưu thiết kế và thêm ly in vào giỏ hàng thành công!");
      }

      refreshSavedDesigns();
    } catch (err: any) {
      console.error(err);
      toast.error("Không thể lưu bản thiết kế lên máy chủ.");
    } finally {
      setIsSavingDesign(false);
    }
  }

  if (!isMounted) {
    return (
      <div className="min-h-screen bg-[#FAF9F6] text-foreground flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-3 text-slate-400">
          <Loader2 className="size-8 animate-spin text-primary" />
          <span className="text-xs font-semibold">Đang tải trình thiết kế...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-foreground pb-8" suppressHydrationWarning>
      {/* COMPACT STUDIO TOP HEADER BAR (REPLACES GLOBAL NAVBAR) */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 px-3 sm:px-6 lg:px-8 py-2.5 shadow-2xs">
        <div className="mx-auto flex max-w-[1920px] items-center justify-between gap-4">
          {/* LEFT: BACK BUTTON */}
          <div className="flex items-center gap-3">
            {currentStep === 1 ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                asChild
                className="h-8 rounded-xl border-slate-200 font-bold text-xs text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                <Link href="/products">
                  <ArrowLeft className="size-3.5 mr-1.5" />
                  Quay lại
                </Link>
              </Button>
            ) : (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => goToStep(1)}
                className="h-8 rounded-xl border-slate-200 font-bold text-xs text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                <ArrowLeft className="size-3.5 mr-1.5" />
                Quay lại
              </Button>
            )}

            <div className="h-4 w-px bg-slate-200 hidden sm:block" />
            <Link href="/" className="hidden sm:flex items-center gap-2">
              <Logo className="h-6 w-auto" />
            </Link>
          </div>

          {/* CENTER: STEP INDICATOR */}
          <div className="flex items-center gap-2 text-xs font-bold">
            <button
              type="button"
              onClick={() => goToStep(1)}
              className={cn(
                "px-2.5 py-1 rounded-lg transition-all cursor-pointer select-none",
                currentStep === 1 ? "bg-primary text-white font-black shadow-xs" : "bg-slate-100 text-slate-500 hover:bg-slate-200",
              )}
            >
              1. Chọn phôi ly
            </button>
            <span className="text-slate-300">→</span>
            <button
              type="button"
              onClick={() => (currentStep === 1 ? handleProceedToStep2() : goToStep(2))}
              className={cn(
                "px-2.5 py-1 rounded-lg transition-all cursor-pointer select-none",
                currentStep === 2 ? "bg-primary text-white font-black shadow-xs" : "bg-slate-100 text-slate-500 hover:bg-slate-200",
              )}
            >
              2. In Logo &amp; Xem 3D
            </button>

          </div>

          {/* RIGHT: QUICK CONFIG SUMMARY */}
          <div className="flex items-center gap-3 text-xs">
            <span className="hidden md:inline-flex items-center gap-2 font-bold text-slate-500">
              <span>
                Đã chọn: <strong className="text-primary">{CUP_MATERIAL_LABELS[materialType]} · {CUP_STYLE_LABELS[style]} ({CUP_SIZE_LABELS[size]})</strong>
              </span>
              <span className="text-[10px] font-black tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-md">
                SKU: {currentCupSku}
              </span>
            </span>
          </div>

        </div>
      </header>

      {/* ════════════════════════════════════════════════════════════════ */}
      {/* STEP 1: CHỌN CẤU HÌNH & THÔNG SỐ LY                                */}
      {/* ════════════════════════════════════════════════════════════════ */}
      {currentStep === 1 && (
        <div className="mx-auto w-full max-w-[1920px] px-3 sm:px-6 lg:px-8 py-4 lg:py-6 animate-in fade-in duration-300">
          {/* SINGLE UNIFIED MASTER CONTAINER CARD */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-8">
            {/* TOP ROW: 2 COLUMNS (LEFT: OPTIONS, RIGHT: 3D PREVIEW) */}
            <div className="grid gap-6 xl:gap-8 grid-cols-1 lg:grid-cols-[minmax(0,1fr)_340px] xl:grid-cols-[minmax(0,1fr)_380px] items-start min-w-0">
              {/* LEFT CONFIGURATION SECTIONS */}
              <div className="space-y-6 lg:pr-6">

                {/* DB LOADING SKELETON */}
                {isLoadingDb && (
                  <div className="space-y-6 animate-pulse">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="space-y-2">
                        <div className="h-4 w-32 bg-slate-100 rounded-md" />
                        <div className="h-14 w-48 bg-slate-100 rounded-xl" />
                      </div>
                    ))}
                  </div>
                )}

                {/* BANNER NẾU ĐẠT TỐI ĐA 15 MAU THIET KE */}
                {user && designsCount >= MAX_DESIGNS && (
                  <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 flex flex-wrap items-center justify-between gap-3 shadow-xs">
                    <div className="flex items-center gap-3">
                      <span className="text-xl">⚠️</span>
                      <div className="text-xs">
                        <div className="font-extrabold text-amber-950 text-sm">Đã đạt giới hạn 15/15 mẫu thiết kế!</div>
                        <p className="font-medium text-amber-800">
                          Tài khoản của bạn đã có tối đa {MAX_DESIGNS} mẫu thiết kế. Vui lòng quản lý và xóa bớt mẫu cũ tại "Thiết kế của tôi" trước khi tạo hoặc đặt thêm mẫu mới.
                        </p>
                      </div>
                    </div>
                    <Button asChild size="sm" className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-none">
                      <Link href="/account/designs">
                        <FolderOpen className="size-3.5 mr-1.5" />
                        Quản lý &amp; Xóa mẫu cũ
                      </Link>
                    </Button>
                  </div>
                )}

                {/* WMS SKU PHÔI LY BANNER */}
                <div className="flex flex-wrap items-center justify-between bg-slate-50 border border-slate-200/80 rounded-xl p-3 gap-2">

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-600">Phôi ly Kho chuẩn hóa (WMS SKU):</span>
                    <span className="text-xs font-black tracking-wider bg-white text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-lg shadow-2xs">
                      {currentCupSku}
                    </span>
                  </div>
                  {selectedVariantInfo?.inStock === false ? (
                    <span className="text-[10px] font-black text-rose-600 bg-rose-50 border border-rose-200 px-2.5 py-0.5 rounded-full">
                      Hết hàng trong kho (Vẫn có thể thiết kế &amp; lưu mẫu)
                    </span>
                  ) : (
                    <span className="text-[10px] font-black text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                      Sẵn sàng in ấn ngay
                    </span>
                  )}
                </div>

                {/* SECTION 1: CHẤT LIỆU LY IN-STOCK */}
                <div className="space-y-2.5">

                  <div className="flex items-center justify-between pb-0.5">
                    <h3 className="text-xs font-black text-[#253D4E] uppercase tracking-wider flex items-center gap-2">
                      <span className="size-2 rounded-full bg-primary" />
                      1. Chất liệu ly
                    </h3>
                    <span className="text-xs font-bold text-primary bg-emerald-50 px-2.5 py-0.5 rounded-lg">
                      {CUP_MATERIAL_LABELS[materialType]}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {availableMaterials.map((m) => {
                      const isSelected = materialType === m;
                      const hasAnyStock = inStockVariants.some((v) => v.materialType === m && v.inStock);
                      const isLocked = isProductLocked;
                      return (
                        <button
                          key={m}
                          type="button"
                          onClick={() => !isLocked && setMaterialType(m)}
                          disabled={isLocked}
                          className={cn(
                            "px-3.5 py-2.5 rounded-xl border-2 transition-all text-left select-none relative h-[88px] flex flex-col justify-between w-full",
                            isLocked ? "cursor-not-allowed opacity-70" : "cursor-pointer",
                            isSelected
                              ? "border-primary bg-emerald-50/40 shadow-xs"
                              : "border-slate-100 hover:border-slate-200 bg-white hover:bg-slate-50"
                          )}
                        >
                          <div className="flex items-center justify-between gap-1 w-full">
                            <span className={cn("text-xs font-black truncate", isSelected ? "text-primary" : "text-[#253D4E]")}>
                              {CUP_MATERIAL_LABELS[m]}
                            </span>
                            <div className="flex items-center gap-1 shrink-0">
                              {!hasAnyStock && (
                                <span className="text-[9px] font-bold bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-md">Hết</span>
                              )}
                              {isSelected && <CheckCircle2 className="size-3.5 text-primary shrink-0" />}
                            </div>
                          </div>
                          <p className="text-[10px] text-slate-500 font-medium leading-normal line-clamp-2">
                            {MATERIAL_DESCRIPTIONS[m]}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* SECTION 2: KIỂU DÁNG LY */}
                <div className="pt-1 space-y-2.5">
                  <div className="flex items-center justify-between pb-0.5">
                    <h3 className="text-xs font-black text-[#253D4E] uppercase tracking-wider flex items-center gap-2">
                      <span className="size-2 rounded-full bg-primary" />
                      2. Kiểu dáng ly
                    </h3>
                    <span className="text-xs font-bold text-primary bg-emerald-50 px-2.5 py-0.5 rounded-lg">
                      {CUP_STYLE_LABELS[style]}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {availableStyles.map((s) => {
                      const isSelected = style === s;
                      const hasAnyStock = inStockVariants.some((v) => v.materialType === materialType && v.style === s && v.inStock);
                      const isLocked = isProductLocked;
                      return (
                        <button
                          key={s}
                          type="button"
                          onClick={() => !isLocked && setStyle(s)}
                          disabled={isLocked}
                          className={cn(
                            "px-3.5 py-2.5 rounded-xl border-2 transition-all text-left select-none relative h-[88px] flex flex-col justify-between w-full",
                            isLocked ? "cursor-not-allowed opacity-70" : "cursor-pointer",
                            isSelected
                              ? "border-primary bg-emerald-50/40 shadow-xs"
                              : "border-slate-100 hover:border-slate-200 bg-white hover:bg-slate-50"
                          )}
                        >
                          <div className="flex items-center justify-between gap-1 w-full">
                            <span className={cn("text-xs font-black truncate", isSelected ? "text-primary" : "text-[#253D4E]")}>
                              {CUP_STYLE_LABELS[s]}
                            </span>
                            <div className="flex items-center gap-1 shrink-0">
                              {!hasAnyStock && (
                                <span className="text-[9px] font-bold bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-md">Hết</span>
                              )}
                              {isSelected && <CheckCircle2 className="size-3.5 text-primary shrink-0" />}
                            </div>
                          </div>
                          <p className="text-[10px] text-slate-500 font-medium leading-normal line-clamp-2">
                            {STYLE_DESCRIPTIONS[s]}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* SECTION 3: DUNG TÍCH (SIZE) */}
                <div className="pt-1 space-y-2.5">
                  <div className="flex items-center justify-between pb-0.5">
                    <h3 className="text-xs font-black text-[#253D4E] uppercase tracking-wider flex items-center gap-2">
                      <span className="size-2 rounded-full bg-primary" />
                      3. Dung tích ly
                    </h3>
                    <span className="text-xs font-bold text-primary bg-emerald-50 px-2.5 py-0.5 rounded-lg">
                      {CUP_SIZE_LABELS[size]}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {availableSizes.map((s) => {
                      const isSelected = size === s;
                      const sizeInStock = inStockVariants.some(
                        (v) => v.materialType === materialType && v.style === style && v.size === s && v.inStock,
                      );
                      return (
                        <button
                          key={s}
                          type="button"
                          onClick={() => handleSizeChange(s)}
                          className={cn(
                            "px-3.5 py-2.5 rounded-xl border-2 transition-all cursor-pointer text-left select-none relative h-[88px] flex flex-col justify-between w-full",
                            isSelected
                              ? "border-primary bg-emerald-50/40 shadow-xs"
                              : "border-slate-100 hover:border-slate-200 bg-white hover:bg-slate-50"
                          )}
                        >
                          <div className="flex items-center justify-between gap-1 w-full">
                            <span className={cn("text-xs font-black truncate", isSelected ? "text-primary" : "text-[#253D4E]")}>
                              {CUP_SIZE_LABELS[s]}
                            </span>
                            <div className="flex items-center gap-1 shrink-0">
                              {!sizeInStock && (
                                <span className="text-[9px] font-bold bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-md">Hết</span>
                              )}
                              {isSelected && <CheckCircle2 className="size-3.5 text-primary shrink-0" />}
                            </div>
                          </div>
                          <p className="text-[10px] text-slate-500 font-medium leading-normal line-clamp-2">
                            {SIZE_DESCRIPTIONS[s]}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* SECTION 4: TÓM TẮT CẤU HÌNH & SỐ LƯỢNG (NẰM Ở GÓC BÊN TRÁI) */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3 pt-4 border-t border-slate-100">
                  <h3 className="text-xs font-black uppercase tracking-wider text-[#253D4E] flex items-center gap-1.5">
                    <PackagePlus className="size-4 text-primary" />
                    4. Tóm tắt cấu hình &amp; Số lượng
                  </h3>

                  {/* Banner hết hàng */}
                  {isCurrentComboOutOfStock && (
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200">
                      <span className="text-amber-600 text-sm">⚠️</span>
                      <p className="text-[10.5px] font-bold text-amber-700">Combo này hiện hết hàng trong kho</p>
                    </div>
                  )}

                  {/* Banner giới hạn 15 mẫu */}
                  {user && designsCount >= MAX_DESIGNS && (
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-rose-50 border border-rose-200">
                      <span className="text-rose-600 text-sm">🚫</span>
                      <p className="text-[10.5px] font-bold text-rose-700">
                        Đã đạt tối đa {MAX_DESIGNS} mẫu. <a href="/account/designs" className="underline font-bold">Xóa mẫu cũ</a>
                      </p>
                    </div>
                  )}

                  <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 text-xs">
                    <div className="p-2.5 rounded-xl bg-white border border-slate-200/60 space-y-0.5">
                      <span className="text-slate-500 font-semibold block text-[10px]">Cấu hình đã chọn:</span>
                      <span className="font-extrabold text-xs text-[#253D4E] block truncate">
                        {CUP_MATERIAL_LABELS[materialType]} · Dáng {CUP_STYLE_LABELS[style]} ({CUP_SIZE_LABELS[size]})
                      </span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-white border border-slate-200/60 flex items-center justify-between gap-2">
                      <Label htmlFor="step1-quantity" className="text-slate-500 font-semibold block text-[10px] shrink-0">
                        Số lượng ly đặt in:
                      </Label>
                      <Input
                        id="step1-quantity"
                        type="number"
                        min={1}
                        value={quantity}
                        onChange={(e) => setQuantity(Math.max(1, Number(e.target.value) || 1))}
                        className="h-7 w-20 rounded-md font-bold text-xs bg-white text-right border-slate-200"
                      />
                    </div>
                  </div>

                  <Button
                    type="button"
                    onClick={handleProceedToStep2}
                    className="w-full bg-primary hover:bg-[#2F9A68] text-white font-black text-xs h-10 px-4 rounded-xl shadow-xs cursor-pointer select-none flex items-center justify-center gap-2"
                  >
                    <span>Tiếp tục: In Logo &amp; Xem 3D</span>
                    <ArrowRight className="size-4" />
                  </Button>

                </div>
              </div>

              {/* RIGHT 3D PREVIEW PANEL */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between shrink-0">
                  <span className="text-xs font-black uppercase text-[#253D4E] tracking-wider">Xem trước kiểu dáng 3D</span>
                  <span className="text-[10px] font-bold bg-slate-100 text-slate-500 px-2 py-0.5 rounded-md">Xoay 360°</span>
                </div>

                <CupPreview3D
                  size={size}
                  style={style}
                  materialType={materialType}
                  cupColor={cupColor}
                  artworkTextureUrl=""
                  printHeightPercent={printHeightPercent}
                  heightClassName="h-[440px] sm:h-[480px] lg:h-[520px] w-full"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════ */}
      {/* STEP 2: TRÌNH THIẾT KẾ LOGO & XEM MÔ PHỎNG 3D                     */}
      {/* ════════════════════════════════════════════════════════════════ */}
      {currentStep === 2 && (
        <div className="mx-auto w-full max-w-[1920px] px-3 sm:px-6 lg:px-8 py-3 lg:py-4 animate-in fade-in duration-300">
          {/* SINGLE UNIFIED MASTER CONTAINER CARD FOR STEP 2 */}
          <div className="bg-white rounded-2xl border border-slate-200 p-3 sm:p-5 shadow-xs overflow-hidden">
            <div className="grid gap-3.5 xl:gap-5 grid-cols-1 lg:grid-cols-[220px_minmax(0,1fr)_280px] xl:grid-cols-[250px_minmax(0,1fr)_340px] items-stretch min-w-0">
              {/* LEFT PANEL: THÔNG SỐ LY & THIẾT KẾ ĐÃ LƯU */}
              <div className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs font-black uppercase tracking-wider text-[#253D4E]">
                    <span>Thông số ly</span>
                    <button
                      type="button"
                      onClick={() => goToStep(1)}
                      className="text-[10px] text-primary hover:underline font-bold cursor-pointer"
                    >
                      Sửa
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[11px] font-semibold text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <div>Dung tích: <strong className="text-foreground">{CUP_SIZE_LABELS[size]}</strong></div>
                    <div>Chất liệu: <strong className="text-foreground">{CUP_MATERIAL_LABELS[materialType]}</strong></div>
                    <div>Kiểu dáng: <strong className="text-foreground">{CUP_STYLE_LABELS[style]}</strong></div>
                    <div>Vùng in: <strong className="text-primary">{printHeightPercent}%</strong></div>
                  </div>

                  {/* SLIDER CHIỀU CAO VÙNG IN TRONG GIAI ĐOẠN 2 */}
                  <div className="pt-2 space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-slate-600 text-[11px]">Chiều cao vùng in</span>
                      <span className="text-primary text-xs font-black">{printHeightPercent}%</span>
                    </div>
                    <input
                      type="range"
                      min={40}
                      max={100}
                      step={5}
                      value={printHeightPercent}
                      onChange={(e) => setPrintHeightPercent(Number(e.target.value))}
                      className="w-full accent-primary cursor-pointer h-1.5"
                    />
                    <p className="text-[9px] text-slate-400 font-medium leading-tight">
                      100% = in tràn viền · 70% = chừa khoảng cách an toàn
                    </p>
                  </div>
                </div>

                {/* Saved designs section - Hiển thị mặc định cho mọi người dùng */}
                <div className="pt-3 space-y-2 border-t border-slate-100">
                  <button
                    type="button"
                    className="flex w-full items-center justify-between py-1 text-left hover:bg-slate-50 transition cursor-pointer"
                    onClick={() => setShowSavedPanel((v) => !v)}
                  >
                    <div className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wide text-[#253D4E]">
                      <History className="size-3.5 text-primary" />
                      <span>Thiết kế đã lưu</span>
                      {savedDesigns.length > 0 && (
                        <span className="text-[9.5px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded-full">
                          {savedDesigns.length}
                        </span>
                      )}
                    </div>
                    {showSavedPanel ? (
                      <ChevronUp className="size-3.5 text-slate-400" />
                    ) : (
                      <ChevronDown className="size-3.5 text-slate-400" />
                    )}
                  </button>

                  {showSavedPanel && (
                    <div className="pt-1">
                      {loadingDesigns ? (
                        <div className="flex h-16 items-center justify-center gap-2">
                          <Loader2 className="size-4 animate-spin text-primary" />
                          <span className="text-[10px] text-slate-400 font-medium">Đang tải...</span>
                        </div>
                      ) : savedDesigns.length === 0 ? (
                        <div className="py-3 text-center">
                          <Paintbrush className="mx-auto size-5 text-slate-300 mb-1" />
                          <p className="text-[10px] text-slate-400 font-bold">Chưa có thiết kế nào.</p>
                          <p className="text-[9px] text-slate-400 mt-0.5">
                            Các mẫu logo AI tạo ra sẽ tự động được lưu tại đây.
                          </p>
                        </div>
                      ) : (
                        <div className="max-h-[220px] overflow-y-auto pr-1 space-y-1.5 divide-y divide-slate-100">
                          {savedDesigns.map((d) => (
                            <div
                              key={d.id}
                              className="flex items-center gap-2 pt-1.5 first:pt-0 hover:bg-slate-50 p-1 rounded-lg transition"
                            >
                              <div className="size-8 shrink-0 overflow-hidden rounded-md border border-slate-200 bg-white">
                                {d.thumbnail ? (
                                  <img
                                    src={d.thumbnail}
                                    alt={d.name}
                                    className="size-full object-contain"
                                  />
                                ) : (
                                  <div className="flex size-full items-center justify-center">
                                    <Paintbrush className="size-3 text-slate-300" />
                                  </div>
                                )}
                              </div>

                              <div className="min-w-0 flex-1">
                                <p className="truncate text-[10px] font-bold text-[#253D4E]">{d.name}</p>
                                <p className="text-[8.5px] text-slate-400">
                                  {d.createdAt
                                    ? new Date(d.createdAt).toLocaleDateString("vi-VN")
                                    : ""}
                                </p>
                              </div>

                              <div className="flex items-center gap-1">
                                <Button
                                  type="button"
                                  size="icon"
                                  variant="outline"
                                  title={`Tải thiết kế "${d.name}" vào ly để sửa tiếp`}
                                  className="size-7 shrink-0 rounded-lg border-primary/30 text-primary hover:bg-emerald-50 cursor-pointer"
                                  onClick={() => handleLoadDesign(d)}
                                >
                                  <FolderOpen className="size-3.5" />
                                </Button>
                                <Button
                                  type="button"
                                  size="icon"
                                  variant="outline"
                                  title={`Xóa thiết kế "${d.name}"`}
                                  className="size-7 shrink-0 rounded-lg border-red-200 text-red-400 hover:bg-red-50 hover:border-red-400 cursor-pointer"
                                  onClick={() => setDesignToDelete(d)}
                                >
                                  <Trash2 className="size-3.5" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* CENTER: 2D Canvas Editor */}
              <div className="min-w-0">


                <ArtworkEditor2D
                  key={editorKey}
                  size={size}
                  cupColor={cupColor}
                  printHeightPercent={printHeightPercent}
                  layers={layers}
                  selectedLayerId={selectedLayerId}
                  onLayersChange={setLayers}
                  onSelectedLayerChange={setSelectedLayerId}
                  onTextureChange={handleTextureChange}
                />
              </div>


              {/* RIGHT PANEL: MÔ PHỎNG LY 3D THỰC TẾ & TẠO HÌNH AI */}
              <div className="space-y-3">
                {/* 3D Preview */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-black text-[#253D4E] uppercase tracking-wider">
                    <span>Mô phỏng ly 3D thực tế</span>
                    <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">Xoay 360°</span>
                  </div>
                  <CupPreview3D
                    size={size}
                    style={style}
                    materialType={materialType}
                    cupColor={cupColor}
                    artworkTextureUrl={artworkTextureUrl}
                    printHeightPercent={printHeightPercent}
                    heightClassName="h-[360px] sm:h-[400px] w-full"
                  />
                </div>

                {/* AI DESIGN CHAT ASSISTANT PANEL */}
                <div className="rounded-2xl border border-emerald-200/90 bg-gradient-to-b from-white via-emerald-50/30 to-emerald-50/60 p-3 space-y-2.5 shadow-2xs">
                  {/* Header */}
                  <div className="flex items-center justify-between border-b border-emerald-100 pb-2">
                    <div className="flex items-center gap-1.5">
                      <div className="flex size-6 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-2xs">
                        <Bot className="size-3.5" />
                      </div>
                      <div>
                        <h4 className="text-[11.5px] font-black text-[#253D4E] uppercase tracking-wide flex items-center gap-1">
                          Trợ lý AI Thiết kế
                          <Sparkles className="size-3 text-emerald-600 animate-pulse" />
                        </h4>
                        <p className="text-[9px] font-medium text-emerald-700">Trò chuyện để AI tự vẽ &amp; dán logo lên ly</p>
                      </div>
                    </div>
                    <span className="text-[9.5px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full shrink-0">
                      {imageLayerCount} hình trên ly
                    </span>
                  </div>

                  {/* Chat Messages Stream */}
                  <div className="max-h-[210px] min-h-[140px] overflow-y-auto space-y-2 pr-1 text-xs">
                    {aiMessages.map((msg) => (
                      <div
                        key={msg.id}
                        className={cn(
                          "flex gap-2 text-[11px]",
                          msg.sender === "user" ? "justify-end" : "justify-start",
                        )}
                      >
                        {msg.sender === "ai" && (
                          <div className="flex size-5 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white text-[9px]">
                            <Bot className="size-3" />
                          </div>
                        )}

                        <div
                          className={cn(
                            "max-w-[85%] rounded-xl px-2.5 py-1.5 text-[11px] leading-relaxed shadow-2xs space-y-1.5",
                            msg.sender === "user"
                              ? "bg-emerald-600 text-white font-medium rounded-tr-none"
                              : "bg-white text-slate-700 border border-emerald-100 font-medium rounded-tl-none",
                          )}
                        >
                          <p>{msg.text}</p>

                          <span
                            className={cn(
                              "block text-[8.5px] text-right font-medium",
                              msg.sender === "user" ? "text-emerald-100" : "text-slate-400",
                            )}
                          >
                            {msg.timestamp}
                          </span>
                        </div>

                        {msg.sender === "user" && (
                          <div className="flex size-5 shrink-0 items-center justify-center rounded-full bg-slate-200 text-slate-600 text-[9px]">
                            <User className="size-3" />
                          </div>
                        )}
                      </div>
                    ))}

                    {isAiProcessing && (
                      <div className="flex gap-2 text-[11px] justify-start items-center">
                        <div className="flex size-5 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white">
                          <Bot className="size-3" />
                        </div>
                        <div className="bg-white border border-emerald-100 rounded-xl px-3 py-1.5 text-[10.5px] font-medium text-emerald-700 flex items-center gap-2 shadow-2xs">
                          <Loader2 className="size-3.5 animate-spin text-emerald-600" />
                          <span>AI đang vẽ họa tiết theo yêu cầu...</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Quick Tag Pills */}
                  <div className="flex items-center gap-1 flex-wrap pt-1 border-t border-emerald-100">
                    <span className="text-[9px] text-slate-400 font-bold mr-0.5">Gợi ý prompt:</span>
                    {[
                      "Tạo logo Bông Búp Tea",
                      "Logo Cà Phê Mộc 1995",
                      "Logo Mascot chú gấu",
                      "Logo chữ M tối giản",
                    ].map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        disabled={isAiProcessing}
                        onClick={() => handleSendAiMessage(tag)}
                        className="text-[9px] font-bold text-emerald-800 bg-white border border-emerald-200/90 hover:bg-emerald-100 px-2 py-0.5 rounded-md transition-all cursor-pointer disabled:opacity-50"
                      >
                        + {tag}
                      </button>
                    ))}
                  </div>

                  {/* Chat Input Bar */}
                  <div className="flex items-center gap-1.5 pt-0.5">
                    <Input
                      id="ai-chat-input"
                      value={aiPrompt}
                      onChange={(e) => setAiPrompt(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSendAiMessage()}
                      disabled={isAiProcessing}
                      placeholder="Gửi yêu cầu thiết kế cho AI..."
                      className="h-8 rounded-xl bg-white text-xs px-3 flex-1 border-emerald-200 focus-visible:ring-emerald-500 font-medium"
                    />
                    <Button
                      type="button"
                      size="sm"
                      className="h-8 w-8 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs p-0 shrink-0 cursor-pointer shadow-xs disabled:opacity-50"
                      disabled={isAiProcessing || !aiPrompt.trim()}
                      onClick={() => handleSendAiMessage()}
                    >
                      {isAiProcessing ? (
                        <Loader2 className="size-3.5 animate-spin" />
                      ) : (
                        <Send className="size-3.5" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>

              {/* FULL-WIDTH BOTTOM BAR: ĐẶT IN & LƯU ĐƠN HÀNG (EXTENDS FROM LEFT TO RIGHT EDGE) */}
              <div className="lg:col-span-3 pt-3 border-t border-slate-100 space-y-2.5">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-xs font-black uppercase tracking-wider text-[#253D4E] flex items-center gap-1.5">
                    <PackagePlus className="size-4 text-primary" />
                    Đặt in &amp; Lưu đơn hàng
                  </h3>
                  <p className="text-[10px] font-medium text-slate-400 hidden sm:block">
                    File thiết kế logo 2D &amp; mô phỏng 3D sẽ tự động đính kèm theo đơn hàng.
                  </p>
                </div>

                {/* Banner hết hàng */}
                {isCurrentComboOutOfStock && (
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200">
                    <span className="text-amber-600 text-sm">⚠️</span>
                    <p className="text-[10.5px] font-bold text-amber-700">
                      Combo này hiện hết hàng trong kho. Bạn vẫn có thể lưu thiết kế và đặt hàng khi kho có lại.
                    </p>
                  </div>
                )}

                {/* Banner đạt 15 mẫu */}
                {user && designsCount >= MAX_DESIGNS && (
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-rose-50 border border-rose-200">
                    <span className="text-rose-600 text-sm">🚫</span>
                    <p className="text-[10.5px] font-bold text-rose-700">
                      Bạn đã đạt tối đa {MAX_DESIGNS} mẫu thiết kế. Vui lòng xóa mẫu cũ tại "Thiết kế của tôi" để tiếp tục.
                    </p>
                  </div>
                )}

                <div className="grid gap-3 grid-cols-1 sm:grid-cols-[180px_1fr_minmax(200px,260px)] items-center">
                  {/* Số lượng */}
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between gap-2">
                    <Label htmlFor="step2-order-quantity" className="text-[10px] font-black tracking-wider text-slate-500 uppercase shrink-0">
                      Số lượng ly:
                    </Label>
                    <Input
                      id="step2-order-quantity"
                      type="number"
                      min={1}
                      value={quantity}
                      onChange={(e) => setQuantity(Math.max(1, Number(e.target.value) || 1))}
                      className="h-7 w-20 rounded-md text-xs font-bold bg-white text-right"
                    />
                  </div>

                  {/* Đơn giá & Tạm tính */}
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between gap-4 text-xs">
                    <div className="flex items-center gap-1.5">
                      <span className="text-slate-500 font-semibold text-[11px]">Đơn giá:</span>
                      <span className="font-bold text-slate-800">{formatCurrency(price)}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-slate-500 font-semibold text-[11px]">Tạm tính ({quantity} ly):</span>
                      <span className="font-black text-primary text-sm">{formatCurrency(subtotal)}</span>
                    </div>
                  </div>

                  {/* Nút Đặt hàng / Thêm vào giỏ */}
                  <Button
                    type="button"
                    className={cn(
                      "h-10 w-full gap-2 rounded-xl text-xs font-black text-white active:scale-[0.98] transition-all cursor-pointer shadow-sm select-none",
                      isCurrentComboOutOfStock
                        ? "bg-slate-500 hover:bg-slate-600"
                        : "bg-primary hover:bg-[#2FA36E]",
                      designsCount >= MAX_DESIGNS && "opacity-50 cursor-not-allowed",
                    )}
                    onClick={addToCart}
                    disabled={isSavingDesign || designsCount >= MAX_DESIGNS}
                  >
                    {isSavingDesign ? (
                      <>
                        <Loader2 className="size-4 animate-spin" />
                        Đang lưu thiết kế...
                      </>
                    ) : designsCount >= MAX_DESIGNS ? (
                      <>
                        🚫 Đã đạt {MAX_DESIGNS} mẫu
                      </>
                    ) : isCurrentComboOutOfStock ? (
                      <>
                        <PackagePlus className="size-4" />
                        Lưu thiết kế (Hết hàng)
                      </>
                    ) : (
                      <>
                        <ShoppingCart className="size-4" />
                        Thêm vào giỏ hàng
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* MODAL XÁC NHẬN XÓA THIẾT KẾ */}
      <Dialog open={!!designToDelete} onOpenChange={(open) => !open && setDesignToDelete(null)}>
        <DialogContent className="sm:max-w-md rounded-2xl bg-white border border-slate-200 p-6">
          <DialogHeader className="items-center text-center sm:items-start sm:text-left gap-2">
            <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 border border-rose-100 sm:mx-0">
              <Trash2 className="size-6" />
            </div>
            <DialogTitle className="text-base font-bold text-slate-800">
              Xác nhận xóa mẫu thiết kế
            </DialogTitle>
            <DialogDescription className="text-xs font-medium text-slate-500">
              Bạn có chắc chắn muốn xóa mẫu thiết kế{" "}
              <strong className="text-slate-800 font-bold">"{designToDelete?.name}"</strong> khỏi thư viện không?
              Hành động này sẽ xóa vĩnh viễn và không thể khôi phục.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="gap-2 sm:gap-0 mt-4 flex items-center justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDesignToDelete(null)}
              className="rounded-xl text-xs font-semibold h-9 px-4 cursor-pointer"
            >
              Hủy bỏ
            </Button>
            <Button
              type="button"
              onClick={() => {
                if (designToDelete) {
                  confirmDeleteDesign(designToDelete);
                  setDesignToDelete(null);
                }
              }}
              className="rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white h-9 px-4 cursor-pointer shadow-xs border-0"
            >
              Xác nhận xóa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
