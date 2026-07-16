"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
import {
  ArrowLeft,
  BadgeCheck,
  CreditCard,
  Layers3,
  PackagePlus,
  Ruler,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useCartStore } from "@/stores/cart-store";
import { useAuthStore } from "@/stores/auth-store";
import { createDesign } from "../services/design.service";
import type {
  CupMaterialType,
  CupSize,
  CupStyle,
  DesignArtwork,
  DesignArtworkLayer,
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
  () => import("./artwork-editor-2d").then((module) => module.ArtworkEditor2D),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-[460px] rounded-lg border border-border bg-white" />
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

export function CupDesignerPage() {
  const [size, setSize] = useState<CupSize>(DEFAULT_CUP_CONFIG.size);
  const [style, setStyle] = useState<CupStyle>(DEFAULT_CUP_CONFIG.style);
  const [materialType, setMaterialType] = useState<CupMaterialType>(
    DEFAULT_CUP_CONFIG.materialType,
  );
  const [cupColor, setCupColor] = useState(DEFAULT_CUP_CONFIG.cupColor);
  const [printHeightPercent, setPrintHeightPercent] = useState(
    DEFAULT_CUP_CONFIG.printHeightPercent,
  );
  const [quantity, setQuantity] = useState(100);
  const [layers, setLayers] = useState<DesignArtworkLayer[]>([]);
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null);
  const [artworkTextureUrl, setArtworkTextureUrl] = useState("");
  const addCustomPrintItem = useCartStore((state) => state.addCustomPrintItem);
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
      cup: {
        size,
        style,
        materialType,
        cupColor,
      },
      layers,
    }),
    [
      cupColor,
      dimensions.height,
      dimensions.width,
      layers,
      materialType,
      printHeightPercent,
      size,
      style,
    ],
  );

  const handleTextureChange = useCallback((dataUrl: string) => {
    setArtworkTextureUrl((current) =>
      current === dataUrl ? current : dataUrl,
    );
  }, []);

  function handleSizeChange(nextSize: CupSize) {
    setSize(nextSize);
    setPrintHeightPercent(DEFAULT_CUP_CONFIG.printHeightPercent);
    setSelectedLayerId(null);
  }

  const [isSavingDesign, setIsSavingDesign] = useState(false);
  const user = useAuthStore((state) => state.user);

  async function addToCart() {
    if (!user) {
      toast.error("Vui lòng đăng nhập để lưu thiết kế ly in và thêm vào giỏ.");
      return;
    }
    if (layers.length === 0) {
      toast.error(
        "Hãy thêm text, import logo hoặc generate hình trước khi đặt in.",
      );
      return;
    }

    setIsSavingDesign(true);
    try {
      const designFile = createDesignSnapshot({
        name: `PBVM custom cup ${size}`,
        previewDataUrl: artworkTextureUrl,
        artwork,
      });

      const savedDesign = await createDesign({
        name: designFile.name,
        // BE lưu URL/data URL — gửi preview image làm artwork file
        file: designFile.previewDataUrl || "data:image/png;base64,",
        thumbnail: designFile.previewDataUrl,
      });

      const product = createCustomCupProduct({ size, price });

      addCustomPrintItem({
        product,
        quantity,
        designId: savedDesign.id,
        designFile: {
          ...designFile,
          designId: savedDesign.id,
        },
      });

      toast.success("Đã thêm ly in vào giỏ hàng. COD sẽ bị tắt cho đơn này.");
    } catch (err: any) {
      console.error(err);
      toast.error("Không thể lưu bản thiết kế lên máy chủ.");
    } finally {
      setIsSavingDesign(false);
    }
  }

  return (
    <main className="min-h-screen bg-background px-4 py-6 text-foreground lg:px-8">
      <div className="mx-auto flex max-w-[1500px] flex-col gap-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Button
              asChild
              variant="outline"
              size="icon"
              className="h-9 w-9 rounded-md"
            >
              <Link href="/" aria-label="Về trang chủ">
                <ArrowLeft className="size-4" />
              </Link>
            </Button>
            <div>
              <h1 className="text-xl font-black uppercase tracking-normal text-[#253D4E]">
                Design-cup studio
              </h1>
              <p className="text-xs font-medium text-[#7A6F68]">
                Artwork 2D là file sản xuất. 3D chỉ dùng để xác nhận vị trí.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold text-[#253D4E]">
            <span className="inline-flex items-center gap-1 rounded-md border border-border bg-white px-3 py-2">
              <BadgeCheck className="size-3.5 text-primary" />
              CUSTOM_PRINT
            </span>
            <span className="inline-flex items-center gap-1 rounded-md border border-border bg-white px-3 py-2">
              <CreditCard className="size-3.5 text-primary" />
              Online only
            </span>
          </div>
        </div>

        <div className="grid gap-5 lg:grid-cols-[280px_minmax(0,1fr)] 2xl:grid-cols-[280px_minmax(0,1fr)_340px]">
          <aside className="space-y-4">
            <section className="rounded-lg border border-border bg-white p-4">
              <div className="mb-3 flex items-center gap-2 text-sm font-black uppercase text-[#253D4E]">
                <Ruler className="size-4" />
                Cấu hình ly
              </div>

              <div className="space-y-4">
                <div>
                  <Label className="text-[11px] font-bold text-[#253D4E]">
                    Size
                  </Label>
                  <div className="mt-2 grid grid-cols-4 gap-2">
                    {SIZES.map((sizeOption) => (
                      <button
                        key={sizeOption}
                        type="button"
                        className={cn(
                          "h-9 rounded-md border text-xs font-black transition",
                          size === sizeOption
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border bg-muted/40 text-[#253D4E] hover:bg-muted",
                        )}
                        onClick={() => handleSizeChange(sizeOption)}
                      >
                        {sizeOption}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <Label className="text-[11px] font-bold text-[#253D4E]">
                    Kiểu dáng
                  </Label>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    {STYLES.map((styleOption) => (
                      <button
                        key={styleOption}
                        type="button"
                        className={cn(
                          "h-9 rounded-md border px-2 text-xs font-bold transition",
                          style === styleOption
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border bg-muted/40 text-[#253D4E] hover:bg-muted",
                        )}
                        onClick={() => setStyle(styleOption)}
                      >
                        {CUP_STYLE_LABELS[styleOption]}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <Label className="text-[11px] font-bold text-[#253D4E]">
                    Chất liệu
                  </Label>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    {MATERIALS.map((materialOption) => (
                      <button
                        key={materialOption}
                        type="button"
                        className={cn(
                          "h-9 rounded-md border px-2 text-xs font-bold transition",
                          materialType === materialOption
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border bg-muted/40 text-[#253D4E] hover:bg-muted",
                        )}
                        onClick={() => setMaterialType(materialOption)}
                      >
                        {CUP_MATERIAL_LABELS[materialOption]}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <Label
                    htmlFor="cup-color"
                    className="text-[11px] font-bold text-[#253D4E]"
                  >
                    Màu ly
                  </Label>
                  <input
                    id="cup-color"
                    type="color"
                    value={cupColor}
                    onChange={(event) => setCupColor(event.target.value)}
                    className="mt-2 h-10 w-full rounded-md border border-border bg-white p-1"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <Label
                      htmlFor="print-height"
                      className="text-[11px] font-bold text-[#253D4E]"
                    >
                      Chiều cao vùng in
                    </Label>
                    <span className="text-xs font-black text-[#253D4E]">
                      {printHeightPercent}%
                    </span>
                  </div>
                  <input
                    id="print-height"
                    type="range"
                    min={40}
                    max={100}
                    step={5}
                    value={printHeightPercent}
                    onChange={(event) =>
                      setPrintHeightPercent(Number(event.target.value))
                    }
                    className="mt-3 w-full accent-primary"
                  />
                  <p className="mt-2 text-[10px] font-medium text-muted-foreground">
                    100% in sát miệng và đáy ly. 70% chừa khoảng cách trên dưới.
                  </p>
                </div>
              </div>
            </section>

            <section className="rounded-lg border border-border bg-white p-4">
              <div className="mb-3 flex items-center gap-2 text-sm font-black uppercase text-[#253D4E]">
                <Layers3 className="size-4" />
                Snapshot
              </div>
              <div className="space-y-2 text-[11px] font-semibold text-muted-foreground">
                <div className="flex justify-between">
                  <span>Artboard</span>
                  <span className="font-black text-foreground">
                    {dimensions.width} x {dimensions.printArea.height}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Layers</span>
                  <span className="font-black text-foreground">
                    {layers.length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Texture</span>
                  <span className="font-black text-foreground">
                    {artworkTextureUrl ? "ready" : "empty"}
                  </span>
                </div>
              </div>
            </section>
          </aside>

          <ArtworkEditor2D
            size={size}
            cupColor={cupColor}
            printHeightPercent={printHeightPercent}
            layers={layers}
            selectedLayerId={selectedLayerId}
            onLayersChange={setLayers}
            onSelectedLayerChange={setSelectedLayerId}
            onTextureChange={handleTextureChange}
          />

          <aside className="space-y-4 lg:col-start-2 2xl:col-start-auto">
            <CupPreview3D
              size={size}
              style={style}
              materialType={materialType}
              cupColor={cupColor}
              artworkTextureUrl={artworkTextureUrl}
              printHeightPercent={printHeightPercent}
            />

            <section className="rounded-lg border border-border bg-white p-4">
              <div className="mb-3 flex items-center gap-2 text-sm font-black uppercase text-[#253D4E]">
                <PackagePlus className="size-4" />
                Đặt in
              </div>
              <div className="space-y-3">
                <div>
                  <Label
                    htmlFor="quantity"
                    className="text-[11px] font-bold text-[#253D4E]"
                  >
                    Số lượng
                  </Label>
                  <Input
                    id="quantity"
                    type="number"
                    min={1}
                    value={quantity}
                    onChange={(event) =>
                      setQuantity(Math.max(1, Number(event.target.value) || 1))
                    }
                    className="mt-2 h-10 rounded-md"
                  />
                </div>
                <div className="rounded-lg border border-border bg-muted/40 p-3 text-sm">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Đơn giá</span>
                    <span className="font-black text-foreground">
                      {formatCurrency(price)}
                    </span>
                  </div>
                  <div className="mt-2 flex justify-between text-[#253D4E]">
                    <span className="font-bold">Tạm tính</span>
                    <span className="font-black">
                      {formatCurrency(subtotal)}
                    </span>
                  </div>
                </div>
                <Button
                  type="button"
                  className="h-11 w-full rounded-md bg-primary font-black text-white hover:bg-[#2FA36E]"
                  onClick={addToCart}
                  disabled={isSavingDesign}
                >
                  {isSavingDesign ? "Đang lưu..." : "Thêm vào giỏ hàng"}
                </Button>
                <p className="text-[10px] font-medium text-muted-foreground">
                  Đơn ly in không áp dụng COD. File 2D snapshot sẽ đi theo
                  checkout.
                </p>
              </div>
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}
