"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  FolderOpen,
  History,
  Loader2,
  PackagePlus,
  Palette,
  Ruler,
  ShoppingCart,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useCartStore } from "@/stores/cart-store";
import { useAuthStore } from "@/stores/auth-store";
import { createDesign, listMyDesigns } from "../services/design.service";
import type {
  CupMaterialType,
  CupSize,
  CupStyle,
  DesignArtwork,
  DesignArtworkLayer,
  DesignFileSnapshot,
} from "@/types/api";
import { formatCurrency } from "@/utils/format-currency";
import {
  CUP_MATERIAL_LABELS,
  CUP_SIZE_SPECS,
  CUP_STYLE_LABELS,
  DEFAULT_CUP_CONFIG,
  createCustomCupProduct,
  createDesignSnapshot,
  getArtboardDimensions,
} from "../utils/artwork";

const ArtworkEditor2D = dynamic(
  () => import("./artwork-editor-2d").then((m) => m.ArtworkEditor2D),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-[500px] rounded-xl border border-border bg-white animate-pulse" />
    ),
  },
);

const CupPreview3D = dynamic(
  () => import("./cup-preview-3d").then((module) => module.CupPreview3D),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-[520px] rounded-lg border border-border bg-muted/30" />
    ),
  },
);

const MATERIALS: CupMaterialType[] = ["clear", "frosted", "paper", "glass"];
const STYLES: CupStyle[] = ["straight", "u_shape", "heart", "mug"];
const SIZES: CupSize[] = ["S", "M", "L", "XL"];

/* ─── Reusable sub-components ─── */

function PanelLabel({ icon: Icon, label }: { icon: React.FC<{ className?: string }>; label: string }) {
  return (
    <div className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wide text-[#253D4E]">
      <Icon className="size-3.5 text-primary" />
      {label}
    </div>
  );
}

function OptionBtn({
  active,
  onClick,
  children,
  className,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      className={cn(
        "h-8 rounded-md border px-2 text-xs font-bold transition-all active:scale-95",
        active
          ? "border-primary bg-primary text-primary-foreground shadow-sm"
          : "border-border bg-muted/40 text-[#253D4E] hover:bg-muted hover:border-primary/30",
        className,
      )}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

/* ─── Main Page ─── */

export function CupDesignerPage() {
  // Cup config state
  const [size, setSize] = useState<CupSize>(DEFAULT_CUP_CONFIG.size);
  const [style, setStyle] = useState<CupStyle>(DEFAULT_CUP_CONFIG.style);
  const [materialType, setMaterialType] = useState<CupMaterialType>(DEFAULT_CUP_CONFIG.materialType);
  const [cupColor, setCupColor] = useState(DEFAULT_CUP_CONFIG.cupColor);
  const [printHeightPercent, setPrintHeightPercent] = useState(DEFAULT_CUP_CONFIG.printHeightPercent);

  // Editor state
  const [quantity, setQuantity] = useState(100);
  const [layers, setLayers] = useState<DesignArtworkLayer[]>([]);
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null);
  const [artworkTextureUrl, setArtworkTextureUrl] = useState("");
  const [editorKey, setEditorKey] = useState(0); // force re-mount on design load
  const [isSavingDesign, setIsSavingDesign] = useState(false);

  // Saved designs panel
  const [savedDesigns, setSavedDesigns] = useState<any[]>([]);
  const [loadingDesigns, setLoadingDesigns] = useState(false);
  const [showSavedPanel, setShowSavedPanel] = useState(true);

  const addCustomPrintItem = useCartStore((s) => s.addCustomPrintItem);
  const user = useAuthStore((s) => s.user);

  const dimensions = getArtboardDimensions(size, printHeightPercent);
  const price = CUP_SIZE_SPECS[size].price;
  const subtotal = price * quantity;

  const artwork = useMemo<DesignArtwork>(
    () => ({
      artboard: {
        width: dimensions.width,
        height: dimensions.height,
        printHeightPercent,
      },
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

  /* ── Fetch saved designs ── */
  function refreshSavedDesigns() {
    if (!user || user.type === "admin") return;
    listMyDesigns()
      .then((data) => setSavedDesigns(data || []))
      .catch(console.error);
  }

  useEffect(() => {
    if (!user || user.type === "admin") return;
    setLoadingDesigns(true);
    listMyDesigns()
      .then((data) => setSavedDesigns(data || []))
      .catch(console.error)
      .finally(() => setLoadingDesigns(false));
  }, [user]);

  /* ── Load / restore a saved design into editor ── */
  function handleLoadDesign(design: any) {
    let snapshot: DesignFileSnapshot | null = null;

    // The `file` field stores a JSON-encoded DesignFileSnapshot (without previewDataUrl)
    if (typeof design.file === "string" && design.file.trimStart().startsWith("{")) {
      try {
        snapshot = JSON.parse(design.file) as DesignFileSnapshot;
      } catch {
        // old design — file is not JSON
      }
    }

    if (!snapshot?.artwork) {
      toast.error("Thiết kế cũ không có dữ liệu layers để khôi phục. Chỉ có thể xem ảnh thumbnail.");
      return;
    }

    const { cup, artboard, layers: savedLayers } = snapshot.artwork;
    setSize(cup.size);
    setStyle(cup.style);
    setMaterialType(cup.materialType);
    setCupColor(cup.cupColor);
    setPrintHeightPercent(artboard.printHeightPercent);
    setLayers(savedLayers ?? []);
    setSelectedLayerId(null);
    setEditorKey((k) => k + 1); // remount Konva stage cleanly
    toast.success(`Đã tải thiết kế "${design.name}" — tiếp tục chỉnh sửa nhé!`);
  }

  /* ── Add to cart ── */
  async function addToCart() {
    if (!user) {
      toast.error("Vui lòng đăng nhập để lưu và thêm thiết kế vào giỏ.");
      return;
    }
    if (layers.length === 0) {
      toast.error("Hãy thêm ít nhất một layer thiết kế trước khi đặt in.");
      return;
    }

    setIsSavingDesign(true);
    try {
      const designFile = createDesignSnapshot({
        name: `PBVM custom cup ${size}`,
        previewDataUrl: artworkTextureUrl,
        artwork,
      });

      // Store artwork JSON in `file` so we can restore layers later
      const artworkPayload = JSON.stringify({
        snapshotVersion: designFile.snapshotVersion,
        designId: designFile.designId,
        name: designFile.name,
        artwork: designFile.artwork,
        exportedAt: designFile.exportedAt,
      });

      const savedDesign = await createDesign({
        name: designFile.name,
        file: artworkPayload,
        thumbnail: designFile.previewDataUrl,
      });

      addCustomPrintItem({
        product: createCustomCupProduct({ size, price }),
        quantity,
        designId: savedDesign.id,
        designFile: { ...designFile, designId: savedDesign.id },
      });

      toast.success("Đã thêm ly in vào giỏ hàng. COD sẽ bị tắt cho đơn này.");
      refreshSavedDesigns();
    } catch (err: any) {
      console.error(err);
      toast.error("Không thể lưu bản thiết kế lên máy chủ.");
    } finally {
      setIsSavingDesign(false);
    }
  }

  /* ─── Render ─── */
  return (
    <div className="flex min-h-screen flex-col bg-[#F2F3F5]">
      {/* ── Top Header Bar ── */}
      <header className="sticky top-0 z-20 flex items-center justify-between gap-4 border-b border-border bg-white px-4 py-2.5 shadow-sm">
        <div className="flex items-center gap-2 min-w-0">
          <Link
            href="/products"
            className="shrink-0 text-[11px] font-bold text-muted-foreground hover:text-foreground transition"
          >
            ← Sản phẩm
          </Link>
          <span className="text-border">·</span>
          <div className="flex items-center gap-1.5 min-w-0">
            <Palette className="size-4 shrink-0 text-primary" />
            <span className="text-sm font-black text-[#253D4E] truncate">Thiết kế ly in</span>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="hidden sm:flex items-center gap-2 text-[11px] text-muted-foreground font-medium">
            <span className="rounded-md bg-muted/50 border border-border px-2 py-0.5 font-black text-[#253D4E]">
              {layers.length} layer
            </span>
            <span>·</span>
            <span className="font-bold">Size {size}</span>
            <span>·</span>
            <span className="font-black text-primary">{formatCurrency(subtotal)}</span>
          </div>
          <Button
            type="button"
            className="h-8 gap-1.5 rounded-md bg-primary px-4 text-[11px] font-black text-white hover:bg-[#2FA36E] active:scale-95 transition-all"
            onClick={addToCart}
            disabled={isSavingDesign}
          >
            {isSavingDesign ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <ShoppingCart className="size-3.5" />
            )}
            {isSavingDesign ? "Đang lưu..." : "Thêm vào giỏ"}
          </Button>
        </div>
      </header>

      {/* ── Main 3-column layout ── */}
      <div className="mx-auto grid w-full max-w-[1600px] flex-1 gap-3 p-3 lg:grid-cols-[240px_minmax(0,1fr)_300px]">

        {/* ═══ LEFT PANEL ═══ */}
        <aside className="flex flex-col gap-3 lg:sticky lg:top-[49px] lg:pb-4">

          {/* Cup config card */}
          <div className="rounded-xl border border-border bg-white p-4 shadow-sm">
            <PanelLabel icon={Ruler} label="Cấu hình ly" />

            <div className="mt-3 space-y-3.5">
              {/* Size */}
              <div>
                <Label className="text-[10px] font-black tracking-wider text-muted-foreground">SIZE</Label>
                <div className="mt-1.5 grid grid-cols-4 gap-1.5">
                  {SIZES.map((s) => (
                    <OptionBtn key={s} active={size === s} onClick={() => handleSizeChange(s)}>
                      {s}
                    </OptionBtn>
                  ))}
                </div>
              </div>

              {/* Print height */}
              <div>
                <div className="flex items-center justify-between">
                  <Label className="text-[10px] font-black tracking-wider text-muted-foreground">
                    CHIỀU CAO IN
                  </Label>
                  <span className="text-[11px] font-black text-primary">{printHeightPercent}%</span>
                </div>
                <input
                  type="range"
                  min={40}
                  max={100}
                  step={5}
                  value={printHeightPercent}
                  onChange={(e) => setPrintHeightPercent(Number(e.target.value))}
                  className="mt-2 w-full accent-primary"
                />
                <p className="mt-1 text-[9px] text-muted-foreground font-medium">
                  100% = sát miệng &amp; đáy · 70% = chừa viền
                </p>
              </div>

              {/* Artboard info */}
              <div className="rounded-lg border border-border bg-muted/30 px-3 py-2 text-[10px] font-medium text-muted-foreground">
                <div className="flex justify-between">
                  <span>Artboard</span>
                  <span className="font-black text-foreground">{dimensions.width} × {dimensions.printArea.height}px</span>
                </div>
                <div className="flex justify-between mt-0.5">
                  <span>Layers</span>
                  <span className="font-black text-foreground">{layers.length}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Saved designs panel (logged-in users only) */}
          {user && user.type !== "admin" && (
            <div className="rounded-xl border border-border bg-white shadow-sm overflow-hidden">
              <button
                type="button"
                className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-muted/20 transition"
                onClick={() => setShowSavedPanel((v) => !v)}
              >
                <PanelLabel icon={History} label="Thiết kế đã lưu" />
                {showSavedPanel
                  ? <ChevronUp className="size-3.5 text-muted-foreground" />
                  : <ChevronDown className="size-3.5 text-muted-foreground" />
                }
              </button>

              {showSavedPanel && (
                <div className="border-t border-border">
                  {loadingDesigns ? (
                    <div className="flex h-20 items-center justify-center gap-2">
                      <Loader2 className="size-4 animate-spin text-primary" />
                      <span className="text-[10px] text-muted-foreground font-medium">Đang tải...</span>
                    </div>
                  ) : savedDesigns.length === 0 ? (
                    <div className="px-4 py-6 text-center">
                      <Palette className="mx-auto size-7 text-muted-foreground/40 mb-2" />
                      <p className="text-[10px] text-muted-foreground font-bold">Chưa có thiết kế nào.</p>
                      <p className="text-[9px] text-muted-foreground mt-0.5">
                        Thiết kế &amp; thêm vào giỏ để lưu.
                      </p>
                    </div>
                  ) : (
                    <div className="max-h-[320px] divide-y divide-border overflow-y-auto">
                      {savedDesigns.map((d) => (
                        <div
                          key={d.id}
                          className="flex items-center gap-2.5 px-3 py-2.5 hover:bg-muted/20 transition"
                        >
                          {/* Thumbnail */}
                          <div className="size-10 shrink-0 overflow-hidden rounded-lg border border-border bg-muted/30">
                            {d.thumbnail ? (
                              <img
                                src={d.thumbnail}
                                alt={d.name}
                                className="size-full object-contain"
                              />
                            ) : (
                              <div className="flex size-full items-center justify-center">
                                <Palette className="size-4 text-muted-foreground" />
                              </div>
                            )}
                          </div>

                          {/* Info */}
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-[10px] font-bold text-[#253D4E]">{d.name}</p>
                            <p className="text-[9px] text-muted-foreground">
                              {d.createdAt
                                ? new Date(d.createdAt).toLocaleDateString("vi-VN")
                                : ""}
                            </p>
                          </div>

                          {/* Load button */}
                          <Button
                            type="button"
                            size="icon"
                            variant="outline"
                            title={`Tải thiết kế "${d.name}" vào editor`}
                            className="size-7 shrink-0 rounded-lg border-primary/30 text-primary hover:bg-primary/10 hover:border-primary/50 transition-all"
                            onClick={() => handleLoadDesign(d)}
                          >
                            <FolderOpen className="size-3.5" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </aside>

        {/* ═══ CENTER: 2D Editor ═══ */}
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

        {/* ═══ RIGHT PANEL ═══ */}
        <aside className="flex flex-col gap-3 lg:sticky lg:top-[49px] lg:pb-4">

          {/* Style + Material + Color */}
          <div className="rounded-xl border border-border bg-white p-4 shadow-sm">
            <PanelLabel icon={Palette} label="Ngoại hình" />

            <div className="mt-3 space-y-3.5">
              {/* Style */}
              <div>
                <Label className="text-[10px] font-black tracking-wider text-muted-foreground">KIỂU DÁNG</Label>
                <div className="mt-1.5 grid grid-cols-2 gap-1.5">
                  {STYLES.map((s) => (
                    <OptionBtn key={s} active={style === s} onClick={() => setStyle(s)}>
                      {CUP_STYLE_LABELS[s]}
                    </OptionBtn>
                  ))}
                </div>
              </div>

              {/* Material */}
              <div>
                <Label className="text-[10px] font-black tracking-wider text-muted-foreground">CHẤT LIỆU</Label>
                <div className="mt-1.5 grid grid-cols-2 gap-1.5">
                  {MATERIALS.map((m) => (
                    <OptionBtn key={m} active={materialType === m} onClick={() => setMaterialType(m)}>
                      {CUP_MATERIAL_LABELS[m]}
                    </OptionBtn>
                  ))}
                </div>
              </div>

              {/* Color */}
              <div>
                <Label htmlFor="cup-color-picker" className="text-[10px] font-black tracking-wider text-muted-foreground">
                  MÀU LY
                </Label>
                <div className="mt-1.5 flex items-center gap-2">
                  <input
                    id="cup-color-picker"
                    type="color"
                    value={cupColor}
                    onChange={(e) => setCupColor(e.target.value)}
                    className="h-8 w-12 cursor-pointer rounded-md border border-border bg-white p-0.5"
                  />
                  <span className="text-[10px] font-black text-[#253D4E] uppercase tracking-wider">
                    {cupColor}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 3D Preview */}
          <CupPreview3D
            size={size}
            style={style}
            materialType={materialType}
            cupColor={cupColor}
            artworkTextureUrl={artworkTextureUrl}
            printHeightPercent={printHeightPercent}
          />

          {/* Order card */}
          <div className="rounded-xl border border-border bg-white p-4 shadow-sm">
            <PanelLabel icon={PackagePlus} label="Đặt in" />

            <div className="mt-3 space-y-3">
              <div>
                <Label htmlFor="order-quantity" className="text-[10px] font-black tracking-wider text-muted-foreground">
                  SỐ LƯỢNG
                </Label>
                <Input
                  id="order-quantity"
                  type="number"
                  min={1}
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, Number(e.target.value) || 1))}
                  className="mt-1.5 h-9 rounded-lg text-xs"
                />
              </div>

              <div className="space-y-1.5 rounded-lg border border-border bg-muted/30 p-3 text-xs">
                <div className="flex justify-between text-muted-foreground">
                  <span>Đơn giá / cái</span>
                  <span className="font-black text-foreground">{formatCurrency(price)}</span>
                </div>
                <div className="flex justify-between border-t border-border pt-1.5 text-[#253D4E]">
                  <span className="font-bold">Tạm tính</span>
                  <span className="font-black text-primary">{formatCurrency(subtotal)}</span>
                </div>
              </div>

              <Button
                type="button"
                className="h-10 w-full gap-2 rounded-lg bg-primary text-xs font-black text-white hover:bg-[#2FA36E] active:scale-[0.98] transition-all"
                onClick={addToCart}
                disabled={isSavingDesign}
              >
                {isSavingDesign ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin" />
                    Đang lưu...
                  </>
                ) : (
                  <>
                    <ShoppingCart className="size-3.5" />
                    Thêm vào giỏ hàng
                  </>
                )}
              </Button>

              <p className="text-[9px] font-medium leading-relaxed text-muted-foreground">
                Đơn ly in không áp dụng COD. File thiết kế sẽ đính kèm đơn hàng.
              </p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
