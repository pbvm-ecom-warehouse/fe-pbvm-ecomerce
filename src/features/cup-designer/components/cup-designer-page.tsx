"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
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
import { useAuthStore } from "@/stores/auth-store";
import {
  createDesign,
  listMyDesigns,
  deleteDesign,
  updateDesign,
  uploadDesignImage,
} from "../services/design.service";
import { sendChatMessageToAi } from "../services/ai-chat.service";
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
  createDesignSnapshot,
  getArtboardDimensions,
} from "../utils/artwork";
import { resolveCupColorFromVariant } from "../utils/cup-color";

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

/** Số mẫu thiết kế tối đa mỗi khách hàng */
const MAX_DESIGNS = 15;
const DIRECT_PRINT_CHECKOUT_KEY = "directPrintCheckoutItem";

const DESIGN_DRAFT_KEY = "cup_designer_draft_v1";
/** Tăng/Giảm độ đậm nhạt của màu Hex (-50% đến +50%) */
function adjustColorBrightness(hex: string, percent: number): string {
  if (!hex || !hex.startsWith("#")) return hex;
  let cleanHex = hex.replace("#", "");
  if (cleanHex.length === 3) {
    cleanHex = cleanHex.split("").map((c) => c + c).join("");
  }
  let num = parseInt(cleanHex, 16);
  if (isNaN(num)) return hex;

  let amt = Math.round(2.55 * percent);
  let R = (num >> 16) + amt;
  let G = ((num >> 8) & 0x00ff) + amt;
  let B = (num & 0x0000ff) + amt;

  R = Math.min(255, Math.max(0, R));
  G = Math.min(255, Math.max(0, G));
  B = Math.min(255, Math.max(0, B));

  return "#" + ((1 << 24) + (R << 16) + (G << 8) + B).toString(16).slice(1);
}

const CUP_COLORS = [
  { label: "Trong suốt / Tự nhiên", value: "#FAF9F6", bg: "#FAF9F6" },
  { label: "Đen Nhám", value: "#1E293B", bg: "#1E293B" },
  { label: "Trắng Kem", value: "#F5EFE6", bg: "#F5EFE6" },
  { label: "Hồng Pastel", value: "#FCE7F3", bg: "#FCE7F3" },
  { label: "Xanh Mint", value: "#D1FAE5", bg: "#D1FAE5" },
  { label: "Xanh Pastel", value: "#E0F2FE", bg: "#E0F2FE" },
  { label: "Vàng Nhạt", value: "#FEF3C7", bg: "#FEF3C7" },
];

interface DesignDraft {
  materialType: CupMaterialType;
  style: CupStyle;
  size: CupSize;
  cupColor?: string;
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

function normalizeApiDesigns(remote: any[]): any[] {
  return remote
    .filter((d) => d?.id)
    .map((d) => ({ ...d, __source: "api" }));
}


function looksLikeObjectId(value?: string | null) {
  return Boolean(value && /^[a-f\d]{24}$/i.test(value));
}

interface InStockVariant {
  materialType: CupMaterialType;
  style: CupStyle;
  size: CupSize;
  stockSnapshot: number;
  inStock: boolean;
  sku?: string;
  price?: number;
  productId?: string;
  variantId?: string;
  productName?: string;
  color?: string;
  attributes?: Record<string, string>;
}

function getInitialAiMessages() {
  return [
    {
      id: "msg_welcome",
      sender: "ai" as const,
      text: "Xin chĂ o! TĂ´i lĂ  Trá»£ lĂ½ AI. HĂ£y gá»­i tin nháº¯n mĂ´ táº£ logo hoáº·c há»a tiáº¿t báº¡n muá»‘n váº½ lĂªn ly nhĂ©!",
      timestamp: "Vá»«a xong",
    },
  ];
}

export function CupDesignerPage() {

  const [isMounted, setIsMounted] = useState(false);
  const [currentStep, setCurrentStep] = useState<1 | 2>(1);

  // All variants (kể cả hết hàng) fetched from DB API
  const [inStockVariants, setInStockVariants] = useState<InStockVariant[]>([]);
  const [isLoadingDb, setIsLoadingDb] = useState(true);

  // Số mẫu thiết kế hiện tại của khách
  const [designsCount, setDesignsCount] = useState(0);
  const [selectedBlankVariantId, setSelectedBlankVariantId] = useState<string>("");
  const [isBlankDropdownOpen, setIsBlankDropdownOpen] = useState(false);
  const [blankSearchQuery, setBlankSearchQuery] = useState("");

  // Cup config state — khôi phục từ localStorage nếu có
  const [materialType, setMaterialType] = useState<CupMaterialType>(() => loadDraft()?.materialType ?? DEFAULT_CUP_CONFIG.materialType);
  const [style, setStyle] = useState<CupStyle>(() => loadDraft()?.style ?? DEFAULT_CUP_CONFIG.style);
  const [size, setSize] = useState<CupSize>(() => loadDraft()?.size ?? DEFAULT_CUP_CONFIG.size);
  const [baseCupColor, setBaseCupColor] = useState<string>(() => loadDraft()?.cupColor ?? DEFAULT_CUP_CONFIG.cupColor);
  const [colorShadePercent, setColorShadePercent] = useState<number>(0);

  const cupColor = useMemo(() => {
    if (colorShadePercent === 0) return baseCupColor;
    return adjustColorBrightness(baseCupColor, colorShadePercent);
  }, [baseCupColor, colorShadePercent]);

  function handleSetCupColor(newColor: string) {
    setBaseCupColor(newColor);
    setColorShadePercent(0);
  }

  function applyVariantCupColor(variant: InStockVariant) {
    const resolvedColor = resolveCupColorFromVariant(variant);
    if (resolvedColor) {
      handleSetCupColor(resolvedColor);
    }
  }

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
  >(getInitialAiMessages);

  const [aiHistoryLogos, setAiHistoryLogos] = useState<
    Array<{ id: string; src: string; prompt: string; timestamp: string }>
  >([]);
  const user = useAuthStore((s) => s.user);

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
              src: (l as DesignImageLayer).src,
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

          // Nếu có brandName cụ thể trong prompt, tự động tạo Text Layer độc lập giúp khách hàng dễ tùy chỉnh chữ/màu chữ
          let brandTextLayer: DesignArtworkLayer | null = null;
          if (logoPromptInfo && logoPromptInfo.toUpperCase() !== "LOGO" && logoPromptInfo.trim().length > 0 && logoPromptInfo.trim().length <= 35) {
            brandTextLayer = {
              id: `txt_ai_${Date.now()}`,
              type: "text",
              text: logoPromptInfo.trim(),
              x: dims.printArea.x + dims.printArea.width / 2 - 120,
              y: dims.printArea.y + dims.printArea.height / 2 + 115,
              color: "#059669",
              fontSize: 28,
              rotation: 0,
            };
          }

          setLayers((prev) => {
            const existingImageIndex = prev.findIndex(
              (l): l is DesignImageLayer => l.type === "image",
            );
            let nextLayers = [...prev];
            if (existingImageIndex >= 0) {
              const oldLayer = prev[existingImageIndex] as DesignImageLayer;
              const updatedLayer: DesignImageLayer = {
                ...oldLayer,
                id: newId,
                src,
                prompt: promptLabel,
              };
              nextLayers[existingImageIndex] = updatedLayer;
            } else {
              nextLayers.push(imageLayer);
            }

            if (brandTextLayer) {
              const existingTextIdx = nextLayers.findIndex((l) => l.type === "text" && (l as any).id?.startsWith("txt_ai_"));
              if (existingTextIdx >= 0) {
                nextLayers[existingTextIdx] = brandTextLayer;
              } else {
                nextLayers.push(brandTextLayer);
              }
            }

            return nextLayers;
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
              layers: brandTextLayer ? [imageLayer, brandTextLayer] : [imageLayer],
            },
          });

          const autoDesignPayload = {
            name: designName,
            thumbnail: src,
            file: JSON.stringify({
              snapshotVersion: autoSnapshot.snapshotVersion,
              designId: autoSnapshot.designId,
              name: autoSnapshot.name,
              artwork: autoSnapshot.artwork,
              exportedAt: autoSnapshot.exportedAt,
            }),
          };

          if (user) {
            try {
              const remoteItem = await createDesign(autoDesignPayload);
              if (remoteItem && remoteItem.id) {
                const apiItem = { ...remoteItem, __source: "api" };
                setEditingDesignId(String(remoteItem.id));
                setEditingDesignSource("api");
                setHasLoadedSavedDesign(false);
                setSavedDesigns((prev) => [
                  apiItem,
                  ...prev.filter((d) => String(d.id) !== String(apiItem.id)),
                ]);
                setShowSavedPanel(true);
              }
            } catch (e) {
              console.warn("Auto save design API error:", e);
              toast.error("Không thể tự lưu mẫu AI lên máy chủ. Vui lòng thử lưu lại sau.");
            }
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
    [aiPrompt, aiMessages, materialType, style, size, layers, printHeightPercent, cupColor, user],
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

  const handleReuseHistoryLogoForEdit = useCallback((promptText: string, src?: string) => {
    if (src) {
      handleApplyHistoryLogo(src, promptText);
    }
    setAiPrompt(`Sửa logo ${promptText}: `);
    const inputEl = document.getElementById("ai-chat-input") as HTMLInputElement | null;
    if (inputEl) {
      inputEl.focus();
    }
  }, [handleApplyHistoryLogo]);

  // Saved designs panel — khởi tạo từ localStorage
  const [savedDesigns, setSavedDesigns] = useState<any[]>([]);
  const [editingDesignId, setEditingDesignId] = useState<string | null>(null);
  const [editingDesignSource, setEditingDesignSource] = useState<"api" | "local" | null>(null);
  const [hasLoadedSavedDesign, setHasLoadedSavedDesign] = useState(false);
  const [loadingDesigns, setLoadingDesigns] = useState(false);
  const [showSavedPanel, setShowSavedPanel] = useState(true);
  const [designToDelete, setDesignToDelete] = useState<any | null>(null);

  const router = useRouter();
  const searchParams = useSearchParams();
  /** productId truyền vào từ trang sản phẩm — có nghĩa là "Product-based mode" */
  const productIdFromUrl = searchParams?.get("productId") ?? null;
  const productSlugFromUrl = searchParams?.get("productSlug") ?? null;
  const variantIdFromUrl = searchParams?.get("variantId") ?? null;
  const skuFromUrl = searchParams?.get("sku") ?? null;

  /* ── 0. AUTO-SAVE DRAFT VÀO LOCALSTORAGE ── */
  useEffect(() => {
    if (!isMounted) return;
    const draft: DesignDraft = { materialType, style, size, cupColor, printHeightPercent, layers, quantity };
    try {
      localStorage.setItem(DESIGN_DRAFT_KEY, JSON.stringify(draft));
    } catch {
      // Bỏ qua nếu localStorage đầy
    }
  }, [isMounted, materialType, style, size, cupColor, printHeightPercent, layers, quantity]);

  /* ── 0b. AUTO-SAVE SAVED DESIGNS VÀO LOCALSTORAGE ── */
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
          productId: v.productId,
          variantId: v.variantId,
          productName: v.productName,
          color: v.color,
          attributes: v.attributes,
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
    const sameCombo = (v: InStockVariant) =>
      v.materialType === materialType && v.style === style && v.size === size;

    if (selectedBlankVariantId) {
      const exact = inStockVariants.find(
        (v) => String(v.variantId || v.sku || "") === selectedBlankVariantId,
      );
      if (exact) return exact;
    }

    if (variantIdFromUrl) {
      const exact = inStockVariants.find(
        (v) => String(v.variantId) === variantIdFromUrl,
      );
      if (exact) return exact;
    }

    if (skuFromUrl) {
      const exact = inStockVariants.find(
        (v) => String(v.sku) === skuFromUrl,
      );
      if (exact) return exact;
    }

    return inStockVariants.find(sameCombo);
  }, [inStockVariants, materialType, style, size, selectedBlankVariantId, variantIdFromUrl, skuFromUrl]);

  useEffect(() => {
    if (inStockVariants.length === 0) return;
    const currentStillExists = inStockVariants.some(
      (variant) => String(variant.variantId || variant.sku || "") === selectedBlankVariantId,
    );
    if (selectedBlankVariantId && currentStillExists) return;

    const preferred =
      inStockVariants.find((variant) => variantIdFromUrl && String(variant.variantId) === variantIdFromUrl) ||
      inStockVariants.find((variant) => skuFromUrl && String(variant.sku) === skuFromUrl) ||
      inStockVariants.find((variant) => productIdFromUrl && String(variant.productId) === productIdFromUrl) ||
      inStockVariants[0];

    setSelectedBlankVariantId(String(preferred.variantId || preferred.sku || ""));
    setMaterialType(preferred.materialType);
    setStyle(preferred.style);
    setSize(preferred.size);
    applyVariantCupColor(preferred);
  }, [inStockVariants, selectedBlankVariantId, productIdFromUrl, variantIdFromUrl, skuFromUrl]);

  const currentCupSku = useMemo(() => {
    if (selectedVariantInfo?.sku) return selectedVariantInfo.sku;
    return "-";
  }, [selectedVariantInfo, materialType, size, style]);

  function handleSelectBlankVariant(variantKey: string) {
    const variant = inStockVariants.find(
      (item) => String(item.variantId || item.sku || "") === variantKey,
    );
    if (!variant) return;
    setSelectedBlankVariantId(variantKey);
    setMaterialType(variant.materialType);
    setStyle(variant.style);
    setSize(variant.size);
    applyVariantCupColor(variant);
    setPrintHeightPercent(DEFAULT_CUP_CONFIG.printHeightPercent);
  }

  function getVariantDisplayAttr(
    variant: InStockVariant | undefined,
    key: "capacity" | "style" | "material" | "color",
  ) {
    if (!variant) return "-";
    const attrs = variant.attributes ?? {};
    if (key === "capacity") {
      return attrs.capacity || attrs.size || attrs["dung tích"] || attrs["dung tich"] || variant.size || "-";
    }
    if (key === "style") {
      return attrs.style || attrs["kiểu dáng"] || attrs["kieu dang"] || attrs["dáng"] || "-";
    }
    if (key === "material") {
      return attrs.material || attrs["chất liệu"] || attrs["chat lieu"] || attrs.materialtype || "-";
    }
    return variant.color || attrs.color || attrs["màu sắc"] || attrs["mau sac"] || "-";
  }

  function getBlankVariantStatusLabel(variant: InStockVariant) {
    return variant.stockSnapshot > 0 ? "Còn hàng" : "Hết hàng";
  }

  function getBlankVariantLabel(variant: InStockVariant) {
    return [
      variant.sku || "Không có SKU",
      getVariantDisplayAttr(variant, "capacity"),
      getVariantDisplayAttr(variant, "style"),
      getVariantDisplayAttr(variant, "material"),
      getVariantDisplayAttr(variant, "color"),
      getBlankVariantStatusLabel(variant),
    ].join(" - ");
  }

  const filteredBlankVariants = useMemo(() => {
    const query = blankSearchQuery.trim().toLowerCase();
    if (!query) return inStockVariants;
    return inStockVariants.filter((variant) =>
      getBlankVariantLabel(variant).toLowerCase().includes(query),
    );
  }, [blankSearchQuery, inStockVariants]);


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

  useEffect(() => {
    if (
      inStockVariants.length === 0 ||
      (!productIdFromUrl && !productSlugFromUrl && !variantIdFromUrl && !skuFromUrl)
    ) {
      return;
    }

    const match = inStockVariants.find((variant) => {
      if (variantIdFromUrl && String(variant.variantId) === variantIdFromUrl) return true;
      if (skuFromUrl && String(variant.sku) === skuFromUrl) return true;
      if (productIdFromUrl && String(variant.productId) === productIdFromUrl) return true;
      return false;
    });

    if (!match) return;
    setMaterialType(match.materialType);
    setStyle(match.style);
    setSize(match.size);
    applyVariantCupColor(match);
  }, [inStockVariants, productIdFromUrl, productSlugFromUrl, variantIdFromUrl, skuFromUrl]);

  /** Combo hiện tại có hàng trong kho không? */
  const isCurrentComboOutOfStock = useMemo(() => {
    if (inStockVariants.length === 0) return true;
    return selectedVariantInfo
      ? !selectedVariantInfo.inStock || (selectedVariantInfo.stockSnapshot ?? 0) <= 0
      : true;
  }, [inStockVariants.length, selectedVariantInfo]);

  const matchingVariant = useMemo(() => {
    return selectedVariantInfo;
  }, [selectedVariantInfo]);

  const maxOrderQty = matchingVariant?.stockSnapshot ?? 0;

  useEffect(() => {
    if (maxOrderQty > 0 && quantity > maxOrderQty) {
      setQuantity(maxOrderQty);
    }
  }, [maxOrderQty, quantity]);

  const dimensions = getArtboardDimensions(size, printHeightPercent);
  const price = (matchingVariant as any)?.price && (matchingVariant as any).price > 0
    ? (matchingVariant as any).price
    : 0;
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

  function goToStep(step: 1 | 2) {
    setCurrentStep(step);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  /** Chuyển sang Giai đoạn 2 sau khi chọn phôi ly -> Luôn tạo bảng vẽ mới (empty layers) */
  function handleProceedToStep2() {
    setEditingDesignId(null);
    setEditingDesignSource(null);
    setHasLoadedSavedDesign(false);
    setLayers([]);
    setAiPrompt("");
    setAiMessages(getInitialAiMessages());
    setSelectedLayerId(null);
    setEditorKey((k) => k + 1);
    goToStep(2);
  }


  function refreshSavedDesigns() {
    if (!user || user.type === "admin") return;
    listMyDesigns()
      .then((data) => {
        setSavedDesigns(normalizeApiDesigns(data || []));
      })
      .catch(() => setSavedDesigns([]));
  }

  useEffect(() => {
    if (!user || user.type === "admin") return;
    setLoadingDesigns(true);
    listMyDesigns()
      .then((data) => {
        setSavedDesigns(normalizeApiDesigns(data || []));
      })
      .catch(() => setSavedDesigns([]))
      .finally(() => setLoadingDesigns(false));
  }, [user]);

  function confirmDeleteDesign(design: any) {
    setSavedDesigns((prev) => prev.filter((d) => d.id !== design.id));
    if (user && design.id) {
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
    if (cup.cupColor) {
      handleSetCupColor(cup.cupColor);
    }
    setPrintHeightPercent(artboard.printHeightPercent);
    setLayers(savedLayers ?? []);
    setEditingDesignId(design.id ? String(design.id) : null);
    setEditingDesignSource(design.__source === "api" ? "api" : "local");
    setHasLoadedSavedDesign(true);
    setSelectedLayerId(null);
    setEditorKey((k) => k + 1);
    const shortName = design.name && design.name.length > 25 ? `${design.name.slice(0, 25)}...` : design.name;

    // Báo cho Trợ lý AI nhận diện mẫu vừa tải để sẵn sàng chỉnh sửa theo yêu cầu
    setAiMessages((prev) => [
      ...prev,
      {
        id: `ai_load_${Date.now()}`,
        sender: "ai",
        text: `Đã tải mẫu "${shortName}". Tôi đã nhận diện toàn bộ hình ảnh và chữ trên ly! Bạn có thể nhập yêu cầu chỉnh sửa ngay (ví dụ: "đổi màu logo sang đỏ", "bỏ nền", "đổi thành hình tròn" hoặc "sửa chữ").`,
        timestamp: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }),
      },
    ]);

    toast.success(`Đã tải mẫu "${shortName}" thành công!`);
    goToStep(2);
  }


  async function addToCart(mode: "save" | "checkout" = "checkout") {
    if (!user) {
      toast.error("Vui lòng đăng nhập để lưu thiết kế và thanh toán.");
      return;
    }
    if (layers.length === 0) {
      toast.error("Hãy thêm ít nhất một layer thiết kế (logo, chữ hoặc họa tiết) ở Giai đoạn 2 trước khi đặt in.");
      goToStep(2);
      return;
    }
    const isUpdatingExistingDesign =
      editingDesignSource === "api" && looksLikeObjectId(editingDesignId);

    if (hasLoadedSavedDesign && !isUpdatingExistingDesign) {
      toast.error("Mẫu đã lưu này chưa có ID hợp lệ từ máy chủ. Vui lòng làm mới danh sách mẫu rồi dùng lại mẫu đó.");
      refreshSavedDesigns();
      return;
    }

    if (!isUpdatingExistingDesign && designsCount >= MAX_DESIGNS) {
      toast.error(`Bạn đã đạt ${MAX_DESIGNS} mẫu thiết kế. Vui lòng xóa mẫu cũ tại trang "Thiết kế của tôi" trước khi tạo mới.`);
      return;
    }
    if (!selectedVariantInfo) {
      toast.error("Chưa chọn được phôi ly từ DB catalog.");
      return;
    }

    setIsSavingDesign(true);
    try {
      const designFile = createDesignSnapshot({
        name: `Ly in theo thiết kế ${selectedVariantInfo?.sku || getVariantDisplayAttr(selectedVariantInfo, "capacity")}`,
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

      const designPayload = {
        name: designFile.name,
        file: artworkPayload,
        thumbnail: uploadedThumbnail,
      };

      const savedDesign = isUpdatingExistingDesign
        ? await updateDesign(editingDesignId!, designPayload)
        : await createDesign(designPayload);

      // Tăng số mẫu sau khi lưu thành công
      if (!isUpdatingExistingDesign) {
        setDesignsCount((c) => c + 1);
      }
      if (savedDesign?.id) {
        setEditingDesignId(String(savedDesign.id));
        setEditingDesignSource("api");
      }

      if (mode === "save") {
        toast.success("Đã lưu thiết kế thành công.");
        refreshSavedDesigns();
        return;
      }

      if (isCurrentComboOutOfStock) {
        // Hết hàng: chỉ lưu design, không add vào giỏ
        toast.success(`Đã lưu thiết kế thành công! Combo này hiện hết hàng, bạn có thể đặt khi kho có lại.`);
      } else {
        const cartDesignFile = {
          ...designFile,
          designId: savedDesign.id,
          fileUrl: savedDesign.file,
          thumbnailUrl: savedDesign.thumbnail || uploadedThumbnail,
        };
        const variantAttributes = {
          ...(selectedVariantInfo.attributes ?? {}),
          capacity: getVariantDisplayAttr(selectedVariantInfo, "capacity"),
          style: getVariantDisplayAttr(selectedVariantInfo, "style"),
          material: getVariantDisplayAttr(selectedVariantInfo, "material"),
          color: getVariantDisplayAttr(selectedVariantInfo, "color"),
        };
        sessionStorage.setItem(
          DIRECT_PRINT_CHECKOUT_KEY,
          JSON.stringify({
            cartItemId: `direct-print:${selectedVariantInfo.sku || savedDesign.id}:${savedDesign.id}`,
            productId: selectedVariantInfo.productId || selectedVariantInfo.variantId || selectedVariantInfo.sku || "",
            productRefId: selectedVariantInfo.sku || "",
            name: `Ly in theo thiết kế ${selectedVariantInfo.sku || ""}`,
            slug: selectedVariantInfo.sku || "",
            price,
            quantity,
            unit: "cái",
            imageUrl: cartDesignFile.previewDataUrl || cartDesignFile.thumbnailUrl || "",
            fulfillmentType: "CUSTOM_PRINT",
            designId: savedDesign.id,
            designFile: cartDesignFile,
            selectedSize: variantAttributes.capacity,
            selectedMaterial: variantAttributes.material,
            selectedStyle: variantAttributes.style,
            attributes: variantAttributes,
          }),
        );

        toast.success("Đã lưu thiết kế. Đang chuyển sang thông tin đặt hàng và thanh toán...");
        router.push("/checkout?mode=direct-print");
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
                Đã chọn: <strong className="text-primary">{getVariantDisplayAttr(selectedVariantInfo, "material")} · {getVariantDisplayAttr(selectedVariantInfo, "style")} ({getVariantDisplayAttr(selectedVariantInfo, "capacity")})</strong>
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
                {!isLoadingDb && inStockVariants.length === 0 && (
                  <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-bold text-amber-800">
                    Chưa có sản phẩm
                  </div>
                )}

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

                {/* CHỌN PHÔI LY TỪ CATALOG */}
                {inStockVariants.length > 0 && (
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h3 className="text-xs font-black text-[#253D4E] uppercase tracking-wider flex items-center gap-2">
                        <span className="size-2 rounded-full bg-primary" />
                        Chọn phôi ly từ kho
                      </h3>
                      <span className="text-[10px] font-black text-emerald-700 bg-white border border-emerald-200 px-2.5 py-0.5 rounded-full">
                        {inStockVariants.length} phôi ly
                      </span>
                    </div>

                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setIsBlankDropdownOpen((open) => !open)}
                        className="flex h-11 w-full items-center justify-between gap-3 rounded-xl border border-emerald-300 bg-white px-3 text-left text-xs font-bold text-[#253D4E] outline-none transition focus:border-primary focus:ring-2 focus:ring-emerald-100"
                      >
                        <span className="min-w-0 truncate">
                          {selectedVariantInfo ? getBlankVariantLabel(selectedVariantInfo) : "Chọn phôi ly"}
                        </span>
                        <ChevronDown className="size-4 shrink-0 text-slate-500" />
                      </button>

                      {isBlankDropdownOpen && (
                        <div className="absolute left-0 right-0 top-full z-30 mt-2 rounded-2xl border border-emerald-200 bg-white p-2 shadow-xl">
                          <Input
                            value={blankSearchQuery}
                            onChange={(event) => setBlankSearchQuery(event.target.value)}
                            placeholder="Tìm SKU, dung tích, kiểu dáng, chất liệu, màu sắc..."
                            className="h-9 rounded-xl border-emerald-200 text-xs font-semibold focus-visible:ring-emerald-500"
                            autoFocus
                          />
                          <div className="mt-2 max-h-64 overflow-y-auto pr-1">
                            {filteredBlankVariants.length === 0 ? (
                              <div className="px-3 py-4 text-center text-xs font-bold text-slate-400">
                                Không tìm thấy phôi ly phù hợp.
                              </div>
                            ) : (
                              filteredBlankVariants.map((variant) => {
                                const key = String(variant.variantId || variant.sku || "");
                                const isSelected = key === selectedBlankVariantId;
                                const isOutOfStock = variant.stockSnapshot <= 0;
                                return (
                                  <button
                                    key={key}
                                    type="button"
                                    onClick={() => {
                                      handleSelectBlankVariant(key);
                                      setIsBlankDropdownOpen(false);
                                      setBlankSearchQuery("");
                                    }}
                                    className={cn(
                                      "flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2 text-left text-xs font-bold transition",
                                      isSelected
                                        ? "bg-emerald-50 text-primary"
                                        : "text-[#253D4E] hover:bg-slate-50",
                                    )}
                                  >
                                    <span className="min-w-0 truncate">
                                      {variant.sku || "Không có SKU"} - {getVariantDisplayAttr(variant, "capacity")} - {getVariantDisplayAttr(variant, "style")} - {getVariantDisplayAttr(variant, "material")} - {getVariantDisplayAttr(variant, "color")}
                                    </span>
                                    <span
                                      className={cn(
                                        "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-black",
                                        isOutOfStock
                                          ? "bg-rose-50 text-rose-600"
                                          : "bg-emerald-50 text-emerald-700",
                                      )}
                                    >
                                      {getBlankVariantStatusLabel(variant)}
                                    </span>
                                  </button>
                                );
                              })
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {selectedVariantInfo && (
                      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                        <div className="rounded-xl border border-emerald-100 bg-white px-3 py-2">
                          <div className="text-[10px] font-black uppercase text-slate-400">Dung tích</div>
                          <div className="text-xs font-black text-[#253D4E]">{getVariantDisplayAttr(selectedVariantInfo, "capacity")}</div>
                        </div>
                        <div className="rounded-xl border border-emerald-100 bg-white px-3 py-2">
                          <div className="text-[10px] font-black uppercase text-slate-400">Kiểu dáng</div>
                          <div className="text-xs font-black text-[#253D4E]">{getVariantDisplayAttr(selectedVariantInfo, "style")}</div>
                        </div>
                        <div className="rounded-xl border border-emerald-100 bg-white px-3 py-2">
                          <div className="text-[10px] font-black uppercase text-slate-400">Chất liệu</div>
                          <div className="text-xs font-black text-[#253D4E]">{getVariantDisplayAttr(selectedVariantInfo, "material")}</div>
                        </div>
                        <div className="rounded-xl border border-emerald-100 bg-white px-3 py-2">
                          <div className="text-[10px] font-black uppercase text-slate-400">Màu sắc</div>
                          <div className="text-xs font-black text-[#253D4E]">{getVariantDisplayAttr(selectedVariantInfo, "color")}</div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

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
                        {getVariantDisplayAttr(selectedVariantInfo, "material")} · {getVariantDisplayAttr(selectedVariantInfo, "style")} ({getVariantDisplayAttr(selectedVariantInfo, "capacity")})
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
                        max={maxOrderQty || undefined}
                        disabled={isCurrentComboOutOfStock}
                        value={quantity}
                        onChange={(e) => {
                          const next = Math.max(1, Number(e.target.value) || 1);
                          setQuantity(maxOrderQty > 0 ? Math.min(maxOrderQty, next) : next);
                        }}
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
          <div className="bg-white rounded-2xl border border-slate-200 p-2.5 sm:p-4 shadow-xs overflow-hidden">
            <div className="grid gap-3 xl:gap-4.5 grid-cols-1 lg:grid-cols-[290px_1fr_290px] xl:grid-cols-[320px_1fr_340px] items-stretch min-w-0">
              {/* LEFT PANEL: THÔNG SỐ LY, BẢNG MÀU & TRỢ LÝ AI THIẾT KẾ */}
              <div className="flex flex-col justify-between h-full space-y-2">
                <div className="space-y-2">
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
                  <div className="grid grid-cols-2 gap-1.5 text-[10.5px] font-semibold text-slate-600 bg-slate-50 p-2 rounded-xl border border-slate-100">
                    <div>Dung tích: <strong className="text-foreground">{getVariantDisplayAttr(selectedVariantInfo, "capacity")}</strong></div>
                    <div>Chất liệu: <strong className="text-foreground">{getVariantDisplayAttr(selectedVariantInfo, "material")}</strong></div>
                    <div>Kiểu dáng: <strong className="text-foreground">{getVariantDisplayAttr(selectedVariantInfo, "style")}</strong></div>
                    <div>Vùng in: <strong className="text-primary">{printHeightPercent}%</strong></div>
                  </div>

                  {/* BẢNG MÀU TỔNG HỢP IN NỀN LY TRONG GIAI ĐOẠN 2 */}
                  <div className="pt-1.5 space-y-1.5 border-t border-slate-100">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-[#253D4E] text-[10.5px] font-black uppercase tracking-wider flex items-center gap-1">
                        <Paintbrush className="size-3 text-primary" />
                        Màu in nền ly
                      </span>
                      <span className="text-primary text-[9.5px] font-mono font-black bg-emerald-50 px-1.5 py-0.5 rounded-md flex items-center gap-1">
                        <span
                          className="size-2 rounded-full border border-slate-300 inline-block shrink-0"
                          style={{ backgroundColor: cupColor }}
                        />
                        {cupColor.toUpperCase()}
                      </span>
                    </div>

                    {/* MẪU MÀU CHUẨN + NÚT CHỌN BẢNG MÀU TÙY CHỈNH (VÙNG MÀU) */}
                    <div className="grid grid-cols-4 sm:grid-cols-8 gap-1 items-center">
                      {CUP_COLORS.map((c) => (
                        <button
                          key={c.value}
                          type="button"
                          onClick={() => handleSetCupColor(c.value)}
                          title={c.label}
                          className={cn(
                            "h-6 rounded-md border transition-all cursor-pointer select-none flex items-center justify-center relative",
                            baseCupColor === c.value
                              ? "ring-2 ring-primary ring-offset-1 scale-105 border-primary shadow-xs font-bold"
                              : "border-slate-300 opacity-85 hover:opacity-100 hover:scale-105"
                          )}
                          style={{ backgroundColor: c.bg }}
                        >
                          {baseCupColor === c.value && (
                            <CheckCircle2 className={cn("size-3", c.value === "#1E293B" ? "text-white" : "text-primary")} />
                          )}
                        </button>
                      ))}

                      {/* CHỌN MÀU TÙY CHỈNH THEO VÙNG MÀU (FULL SPECTRUM COLOR PICKER) */}
                      <label
                        title="Bảng màu tùy chỉnh (Chọn vùng màu)"
                        className="h-6 rounded-md border border-dashed border-slate-300 hover:border-primary transition-all cursor-pointer flex items-center justify-center relative bg-gradient-to-tr from-rose-400 via-emerald-400 to-sky-400 shadow-2xs hover:scale-105"
                      >
                        <input
                          type="color"
                          value={baseCupColor}
                          onChange={(e) => handleSetCupColor(e.target.value)}
                          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                        />
                        <span className="text-[9px] font-black text-white drop-shadow-md">+</span>
                      </label>
                    </div>

                    {/* THANH TRƯỢT KÉO TĂNG GIẢM ĐỘ ĐẬM NHẠT (SHADE / BRIGHTNESS SLIDER) */}
                    <div className="space-y-1 bg-slate-50 p-1.5 rounded-lg border border-slate-200/60">
                      <div className="flex items-center justify-between text-[10px] font-bold text-slate-600">
                        <span>Tăng / Giảm độ đậm nhạt</span>
                        <span className="text-primary font-black">
                          {colorShadePercent > 0 ? `+${colorShadePercent}%` : colorShadePercent < 0 ? `${colorShadePercent}%` : "0%"}
                        </span>
                      </div>
                      <input
                        type="range"
                        min={-50}
                        max={50}
                        step={2}
                        value={colorShadePercent}
                        onChange={(e) => setColorShadePercent(Number(e.target.value))}
                        className="w-full accent-primary cursor-pointer h-1.5"
                      />
                    </div>
                  </div>

                  {/* SLIDER CHIỀU CAO VÙNG IN TRONG GIAI ĐOẠN 2 */}
                  <div className="pt-1 space-y-1 border-t border-slate-100">
                    <div className="flex items-center justify-between text-[10.5px] font-bold">
                      <span className="text-slate-600">Chiều cao vùng in</span>
                      <span className="text-primary font-black">{printHeightPercent}%</span>
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
                  </div>
                </div>

                {/* AI DESIGN CHAT ASSISTANT PANEL */}
                <div className="pt-1.5 border-t border-slate-100 flex-1 flex flex-col min-h-0 overflow-hidden">
                  <div className="flex-1 min-h-0 max-h-[430px] flex flex-col rounded-2xl border border-emerald-200/90 bg-gradient-to-b from-white via-emerald-50/30 to-emerald-50/60 p-3 space-y-2 shadow-2xs overflow-hidden">
                    {/* Header */}
                    <div className="flex items-center justify-between border-b border-emerald-100 pb-2 shrink-0">
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
                        {imageLayerCount} hình
                      </span>
                    </div>

                    {/* Chat Messages Stream (Flex grow to fill available height) */}
                    <div className="flex-1 min-h-[110px] max-h-[270px] overflow-y-auto overscroll-contain space-y-2 pr-1 text-xs my-1">
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
                              "max-w-[85%] min-w-0 rounded-xl px-2.5 py-1.5 text-[11px] leading-relaxed shadow-2xs space-y-1 break-words overflow-hidden",
                              msg.sender === "user"
                                ? "bg-emerald-600 text-white font-medium rounded-tr-none"
                                : "bg-white text-slate-700 border border-emerald-100 font-medium rounded-tl-none",
                            )}
                          >
                            <p className="whitespace-pre-wrap break-words">{msg.text}</p>

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
                          <div className="bg-white border border-emerald-100 rounded-xl px-2.5 py-1 text-[10px] font-medium text-emerald-700 flex items-center gap-1.5 shadow-2xs">
                            <Loader2 className="size-3 animate-spin text-emerald-600" />
                            <span>AI đang vẽ họa tiết...</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Quick Tag Pills (1-Line Horizontal Scroll) */}
                    <div className="flex items-center gap-1 overflow-x-auto scrollbar-none py-1 border-t border-emerald-100 shrink-0">
                      <span className="text-[9px] text-slate-400 font-bold shrink-0 mr-0.5">Gợi ý:</span>
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
                          className="text-[9px] font-bold text-emerald-800 bg-white border border-emerald-200/90 hover:bg-emerald-100 px-2 py-0.5 rounded-md transition-all cursor-pointer disabled:opacity-50 shrink-0 whitespace-nowrap"
                        >
                          + {tag}
                        </button>
                      ))}
                    </div>

                    {/* Chat Input Bar */}
                    <div className="flex items-center gap-1.5 pt-1 shrink-0">
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
                        className="h-8 w-8 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs p-0 shrink-0 cursor-pointer shadow-xs disabled:opacity-50 border-0"
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
              </div>

              {/* CENTER: 2D CANVAS EDITOR WITH INTEGRATED SAVED DESIGNS BUTTON IN TOOLBAR */}
              <div className="min-w-0 w-full flex flex-col justify-between h-full">
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
                  savedDesignsNode={
                    <div className="relative z-30">
                      <button
                        type="button"
                        className="flex h-7 items-center gap-1 rounded-md border border-emerald-300 bg-emerald-50 px-2.5 text-[10.5px] font-bold text-emerald-800 hover:bg-emerald-100 transition cursor-pointer shadow-2xs"
                        onClick={() => setShowSavedPanel((v) => !v)}
                      >
                        <History className="size-3 text-emerald-600" />
                        <span>Mẫu đã lưu ({savedDesigns.length})</span>
                        {showSavedPanel ? <ChevronUp className="size-3 text-emerald-600" /> : <ChevronDown className="size-3 text-emerald-600" />}
                      </button>

                      {/* FLOATING DROPDOWN POPUP ATTACHED TO TOOLBAR BUTTON */}
                      {showSavedPanel && (
                        <div className="absolute top-full left-0 mt-1.5 w-[290px] sm:w-[320px] max-w-[90vw] z-50 bg-white border border-slate-200 rounded-2xl p-3 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
                          <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-slate-100">
                            <span className="text-xs font-bold text-slate-800">Mẫu đã lưu ({savedDesigns.length})</span>
                            <button
                              type="button"
                              onClick={() => setShowSavedPanel(false)}
                              className="text-[10px] font-bold text-slate-400 hover:text-slate-700 cursor-pointer"
                            >
                              Đóng [✕]
                            </button>
                          </div>

                          {loadingDesigns ? (
                            <div className="flex h-20 items-center justify-center gap-2">
                              <Loader2 className="size-4 animate-spin text-primary" />
                              <span className="text-xs text-slate-400 font-medium">Đang tải thiết kế...</span>
                            </div>
                          ) : savedDesigns.length === 0 ? (
                            <div className="py-4 text-center text-xs text-slate-400 font-medium">
                              Chưa có thiết kế nào được lưu.
                            </div>
                          ) : (
                            <div className="max-h-[260px] overflow-y-auto pr-1 flex flex-col gap-1.5">
                              {savedDesigns.map((d) => (
                                <div
                                  key={d.id}
                                  className="flex items-center justify-between gap-2 bg-slate-50/90 hover:bg-emerald-50/80 border border-slate-200 hover:border-emerald-300 p-2 rounded-xl transition-all shadow-2xs group"
                                >
                                  <div className="size-9 shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-white p-0.5">
                                    {d.thumbnail ? (
                                      <img src={d.thumbnail} alt={d.name} className="size-full object-contain" />
                                    ) : (
                                      <div className="flex size-full items-center justify-center">
                                        <Paintbrush className="size-3 text-slate-300" />
                                      </div>
                                    )}
                                  </div>

                                  <div className="min-w-0 flex-1">
                                    <p className="truncate text-[11px] font-black text-[#253D4E] group-hover:text-primary transition-colors">{d.name}</p>
                                    <p className="text-[9px] text-slate-400 font-medium mt-0.5">
                                      {d.createdAt ? new Date(d.createdAt).toLocaleDateString("vi-VN") : "Hôm nay"}
                                    </p>
                                  </div>

                                  <div className="flex items-center gap-1 shrink-0">
                                    <Button
                                      type="button"
                                      size="sm"
                                      variant="default"
                                      title={`Dùng mẫu "${d.name}"`}
                                      className="h-6.5 text-[10.5px] font-bold px-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer transition-all gap-1 border-0 shadow-2xs"
                                      onClick={() => {
                                        handleLoadDesign(d);
                                        setShowSavedPanel(false);
                                      }}
                                    >
                                      <FolderOpen className="size-3" />
                                      Dùng
                                    </Button>
                                    <Button
                                      type="button"
                                      size="icon"
                                      variant="outline"
                                      title={`Xóa "${d.name}"`}
                                      className="size-6.5 shrink-0 rounded-lg border-rose-200 text-rose-500 hover:bg-rose-50 hover:border-rose-400 cursor-pointer"
                                      onClick={() => setDesignToDelete(d)}
                                    >
                                      <Trash2 className="size-3" />
                                    </Button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  }
                />
              </div>

              {/* RIGHT PANEL: MÔ PHỎNG LY 3D THỰC TẾ (STRETCHED TO MATCH ARTBOARD HEIGHT) */}
              <div className="flex flex-col justify-between h-full space-y-2">
                {/* 3D Preview */}
                <div className="flex-1 flex flex-col justify-between space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-black text-[#253D4E] uppercase tracking-wider shrink-0">
                    <span>Mô phỏng ly 3D thực tế</span>
                    <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">Xoay 360°</span>
                  </div>
                  <div className="flex-1 flex items-center justify-center min-h-[380px] sm:min-h-[440px]">
                    <CupPreview3D
                      size={size}
                      style={style}
                      materialType={materialType}
                      cupColor={cupColor}
                      artworkTextureUrl={artworkTextureUrl}
                      printHeightPercent={printHeightPercent}
                      heightClassName="h-full min-h-[380px] sm:min-h-[440px] w-full"
                    />
                  </div>
                </div>
              </div>

              {/* FULL-WIDTH BOTTOM BAR */}
              <div className="lg:col-span-3 pt-3 border-t border-slate-100 space-y-2.5">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-xs font-black uppercase tracking-wider text-[#253D4E] flex items-center gap-1.5">
                    <PackagePlus className="size-4 text-primary" />
                    Đặt in &amp; Thanh toán ngay
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
                      max={maxOrderQty || undefined}
                      disabled={isCurrentComboOutOfStock}
                      value={quantity}
                      onChange={(e) => {
                        const next = Math.max(1, Number(e.target.value) || 1);
                        setQuantity(maxOrderQty > 0 ? Math.min(maxOrderQty, next) : next);
                      }}
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

                  <div className={cn("grid gap-2", !isCurrentComboOutOfStock && "sm:grid-cols-[0.42fr_0.58fr]")}>
                    {!isCurrentComboOutOfStock && (
                      <Button
                        type="button"
                        variant="outline"
                        className="h-10 w-full gap-2 rounded-xl border-emerald-200 bg-white text-xs font-black text-emerald-700 hover:bg-emerald-50 active:scale-[0.98] transition-all cursor-pointer shadow-sm select-none"
                        onClick={() => addToCart("save")}
                        disabled={isSavingDesign || designsCount >= MAX_DESIGNS}
                      >
                        {isSavingDesign ? <Loader2 className="size-4 animate-spin" /> : <PackagePlus className="size-4" />}
                        Lưu mẫu
                      </Button>
                    )}

                    <Button
                      type="button"
                      className={cn(
                        "h-10 w-full gap-2 rounded-xl text-xs font-black text-white active:scale-[0.98] transition-all cursor-pointer shadow-sm select-none",
                        isCurrentComboOutOfStock
                          ? "bg-slate-500 hover:bg-slate-600"
                          : "bg-primary hover:bg-[#2FA36E]",
                        designsCount >= MAX_DESIGNS && "opacity-50 cursor-not-allowed",
                      )}
                      onClick={() => addToCart(isCurrentComboOutOfStock ? "save" : "checkout")}
                      disabled={isSavingDesign || designsCount >= MAX_DESIGNS}
                    >
                      {isSavingDesign ? (
                        <>
                          <Loader2 className="size-4 animate-spin" />
                          Đang lưu...
                        </>
                      ) : designsCount >= MAX_DESIGNS ? (
                        <>Đã đạt {MAX_DESIGNS} mẫu</>
                      ) : isCurrentComboOutOfStock ? (
                        <>
                          <PackagePlus className="size-4" />
                          Lưu thiết kế
                        </>
                      ) : (
                        <>
                          <ShoppingCart className="size-4" />
                          Thanh toán ngay
                        </>
                      )}
                    </Button>
                  </div>
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
