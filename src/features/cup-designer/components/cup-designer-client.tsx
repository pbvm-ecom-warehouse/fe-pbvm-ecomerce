"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BadgeCheck,
  Box,
  CreditCard,
  ImageIcon,
  Layers,
  Paintbrush,
  Palette,
  Ruler,
  ShoppingCart,
  Upload,
} from "lucide-react";
import { useDropzone } from "react-dropzone";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CupArtworkEditor } from "@/features/cup-designer/components/cup-artwork-editor";
import { CupPreview3d } from "@/features/cup-designer/components/cup-preview-3d";
import {
  createCupDesignFileSnapshot,
  createLocalDesignId,
} from "@/features/cup-designer/utils/design-file";
import { useCartStore } from "@/stores/cart-store";
import type {
  CatalogProduct,
  CupDesignConfig,
  DesignArtwork,
  DesignArtworkLayer,
} from "@/types/api";

const customCupProduct: CatalogProduct = {
  id: "cup-blank-custom-500",
  productRefId: "CUP_BLANK_500_CUSTOM",
  slug: "ly-500ml-custom-print",
  name: "Ly 500ml in design riêng",
  category: "plain_cup",
  fulfillmentType: "CUSTOM_PRINT",
  price: 1_500,
  b2bPrice: 1_250,
  unit: "cai",
  stockSnapshot: 5_000,
  imageUrl: "/images/product-placeholder.svg",
  updatedAt: new Date().toISOString(),
};

const defaultCupConfig: CupDesignConfig = {
  cupColor: "#f8fafc",
  materialType: "frosted",
  size: "M",
  style: "u_shape",
};

const templateDesigns = [
  {
    id: "template-tea-house",
    name: "Tea House Classic",
    description: "Logo chữ gọn, hợp ly PP/PET trong.",
    cupConfig: defaultCupConfig,
    artwork: {
      text: "TEA HOUSE",
      fill: "#5c3d2e",
      scale: 1,
      rotation: 0,
      offsetX: 0,
      offsetY: 0,
    },
  },
  {
    id: "template-summer",
    name: "Summer Sticker",
    description: "Mẫu sticker nổi bật cho chiến dịch theo mùa.",
    cupConfig: {
      cupColor: "#fff7ed",
      materialType: "paper",
      size: "L",
      style: "straight",
    },
    artwork: {
      text: "SUMMER",
      fill: "#be123c",
      scale: 1.16,
      rotation: -4,
      offsetX: -6,
      offsetY: 2,
    },
  },
  {
    id: "template-premium",
    name: "Premium Brew",
    description: "Tone nâu đậm cho chuỗi đồ uống cao cấp.",
    cupConfig: {
      cupColor: "#f5efe7",
      materialType: "glass",
      size: "M",
      style: "mug",
    },
    artwork: {
      text: "PBVM BREW",
      fill: "#2f2525",
      scale: 0.95,
      rotation: 2,
      offsetX: 4,
      offsetY: -4,
    },
  },
] satisfies Array<{
  id: string;
  name: string;
  description: string;
  cupConfig: CupDesignConfig;
  artwork: DesignArtwork;
}>;

const cupSizes: Array<CupDesignConfig["size"]> = ["S", "M", "L", "XL"];

const cupStyles: Array<{
  value: CupDesignConfig["style"];
  label: string;
}> = [
  { value: "straight", label: "Ly thẳng" },
  { value: "u_shape", label: "Đáy U" },
  { value: "heart", label: "Nắp tim" },
  { value: "mug", label: "Mug" },
];

const materialTypes: Array<{
  value: CupDesignConfig["materialType"];
  label: string;
}> = [
  { value: "clear", label: "Nhựa trong" },
  { value: "frosted", label: "Nhựa mờ" },
  { value: "paper", label: "Giấy" },
  { value: "glass", label: "Glass" },
  { value: "metal", label: "Metal" },
];

const moneyFormatter = new Intl.NumberFormat("vi-VN", {
  currency: "VND",
  style: "currency",
});

function createTextLayer(artwork: DesignArtwork): DesignArtworkLayer {
  return {
    fill: artwork.fill,
    id: "layer-text-primary",
    kind: "text",
    rotation: artwork.rotation,
    scale: artwork.scale,
    text: artwork.text,
    x: artwork.offsetX,
    y: artwork.offsetY,
  };
}

export function CupDesignerClient() {
  const router = useRouter();
  const addProduct = useCartStore((state) => state.addProduct);
  const [quantity, setQuantity] = useState(100);
  const [designId, setDesignId] = useState(templateDesigns[0].id);
  const [designName, setDesignName] = useState(templateDesigns[0].name);
  const [previewDataUrl, setPreviewDataUrl] = useState<string | undefined>();
  const [uploadedMeta, setUploadedMeta] = useState({
    mimeType: "application/json",
    size: 0,
  });
  const [cupConfig, setCupConfig] = useState<CupDesignConfig>(
    templateDesigns[0].cupConfig,
  );
  const [artwork, setArtwork] = useState<DesignArtwork>(
    templateDesigns[0].artwork,
  );

  const layers = useMemo<DesignArtworkLayer[]>(() => {
    const nextLayers = [createTextLayer(artwork)];

    if (previewDataUrl) {
      nextLayers.push({
        id: "layer-upload-primary",
        imageUrl: previewDataUrl,
        kind: "image",
        rotation: 0,
        scale: 1,
        x: 0,
        y: 0,
      });
    }

    return nextLayers;
  }, [artwork, previewDataUrl]);

  const artworkSnapshot = useMemo<DesignArtwork>(
    () => ({
      ...artwork,
      cupConfig,
      layers,
    }),
    [artwork, cupConfig, layers],
  );

  const designFile = useMemo(
    () =>
      createCupDesignFileSnapshot({
        artwork,
        cupConfig,
        designId,
        layers,
        mimeType: uploadedMeta.mimeType,
        name: designName,
        previewDataUrl,
        size: uploadedMeta.size,
      }),
    [artwork, cupConfig, designId, designName, layers, previewDataUrl, uploadedMeta],
  );
  const totalPrice = moneyFormatter.format(customCupProduct.price * quantity);
  const uploadedSizeKb =
    uploadedMeta.size > 0 ? Math.ceil(uploadedMeta.size / 1024) : 0;

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];

    if (!file) {
      return;
    }

    const nextDesignId = createLocalDesignId();
    const reader = new FileReader();
    reader.onload = () => {
      setDesignId(nextDesignId);
      setDesignName(file.name.replace(/\.[^.]+$/, ""));
      setPreviewDataUrl(String(reader.result));
      setUploadedMeta({
        mimeType: file.type || "application/octet-stream",
        size: file.size,
      });
      setArtwork((current) => ({
        ...current,
        text: file.name.replace(/\.[^.]+$/, "").slice(0, 18),
      }));
    };
    reader.readAsDataURL(file);
  }, []);

  const { getInputProps, getRootProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/png": [".png"],
      "image/jpeg": [".jpg", ".jpeg"],
      "image/svg+xml": [".svg"],
    },
    maxFiles: 1,
    maxSize: 5 * 1024 * 1024,
  });

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_400px]">
      <div className="space-y-5">
        <Card className="overflow-hidden rounded-2xl border-[#E6DFD9] bg-white p-0 shadow-sm">
          <CardHeader className="border-b border-[#E6DFD9]/70 bg-[#FAF8F6] px-6 py-4">
            <CardTitle className="flex items-center gap-2 text-lg font-black tracking-normal text-[#1C1917]">
              <Paintbrush className="size-5 text-primary" />
              Artwork workspace
            </CardTitle>
            <CardDescription className="text-sm text-[#7A6F68]">
              Thiết kế trong vùng in, xem preview ly rồi thêm mẫu vào giỏ.
            </CardDescription>
            <CardAction>
              <Badge className="border-0 bg-primary text-white">
                <BadgeCheck data-icon="inline-start" />
                Bản lưu v{designFile.snapshotVersion}
              </Badge>
            </CardAction>
          </CardHeader>
          <CardContent className="grid gap-5 p-5 lg:grid-cols-[300px_minmax(0,1fr)]">
            <div className="space-y-4">
              <div
                {...getRootProps()}
                className="grid min-h-36 cursor-pointer gap-2 rounded-2xl border-2 border-dashed border-[#D2B48C] bg-[#FAF8F6] p-4 text-sm transition hover:border-primary hover:bg-white"
              >
                <input {...getInputProps()} />
                <div className="flex size-11 items-center justify-center rounded-xl border border-[#E6DFD9] bg-white text-primary shadow-sm">
                  <Upload className="size-5" />
                </div>
                <div className="font-black text-[#1C1917]">
                  {isDragActive ? "Thả file design" : "Upload artwork"}
                </div>
                <div className="text-xs leading-5 text-[#7A6F68]">
                  PNG, JPG hoặc SVG dưới 5MB. File upload được lưu trong
                  hồ sơ thiết kế local cho giỏ hàng.
                </div>
              </div>

              <div className="grid gap-2">
                <Label className="text-xs font-black uppercase tracking-[0.14em] text-primary">
                  Mẫu gợi ý / Sticker / Template
                </Label>
                <div className="grid gap-2">
                  {templateDesigns.map((design) => (
                    <button
                      key={design.id}
                      type="button"
                      className={`rounded-xl border p-3 text-left transition-colors ${
                        design.id === designId
                          ? "border-primary bg-[#FAF8F6]"
                          : "border-[#E6DFD9] bg-white hover:border-[#D2B48C]"
                      }`}
                      onClick={() => {
                        setDesignId(design.id);
                        setDesignName(design.name);
                        setArtwork(design.artwork);
                        setCupConfig(design.cupConfig);
                        setPreviewDataUrl(undefined);
                        setUploadedMeta({
                          mimeType: "application/json",
                          size: 0,
                        });
                      }}
                    >
                      <div className="flex items-center gap-2 text-sm font-black">
                        <ImageIcon className="size-4 text-primary" />
                        {design.name}
                      </div>
                      <p className="mt-1 text-xs leading-5 text-[#7A6F68]">
                        {design.description}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-[#E6DFD9] bg-white p-4">
                <div className="mb-3 flex items-center gap-2 text-xs font-black uppercase tracking-[0.14em] text-primary">
                  <Box className="size-4" />
                  Cấu hình ly
                </div>
                <div className="space-y-4">
                  <div className="grid gap-2">
                    <Label className="text-xs font-bold text-[#7A6F68]">
                      Size
                    </Label>
                    <div className="grid grid-cols-4 gap-2">
                      {cupSizes.map((size) => (
                        <Button
                          key={size}
                          type="button"
                          variant={cupConfig.size === size ? "default" : "outline"}
                          className="h-9 rounded-lg"
                          onClick={() =>
                            setCupConfig((current) => ({ ...current, size }))
                          }
                        >
                          {size}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <Label className="text-xs font-bold text-[#7A6F68]">
                      Kiểu dáng
                    </Label>
                    <div className="grid grid-cols-2 gap-2">
                      {cupStyles.map((style) => (
                        <Button
                          key={style.value}
                          type="button"
                          variant={
                            cupConfig.style === style.value
                              ? "default"
                              : "outline"
                          }
                          className="h-9 rounded-lg"
                          onClick={() =>
                            setCupConfig((current) => ({
                              ...current,
                              style: style.value,
                            }))
                          }
                        >
                          {style.label}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <Label className="text-xs font-bold text-[#7A6F68]">
                      Chất liệu
                    </Label>
                    <div className="grid grid-cols-2 gap-2">
                      {materialTypes.map((material) => (
                        <Button
                          key={material.value}
                          type="button"
                          variant={
                            cupConfig.materialType === material.value
                              ? "default"
                              : "outline"
                          }
                          className="h-9 rounded-lg"
                          onClick={() =>
                            setCupConfig((current) => ({
                              ...current,
                              materialType: material.value,
                            }))
                          }
                        >
                          {material.label}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-[1fr_64px] gap-2">
                    <div className="grid gap-1">
                      <Label
                        htmlFor="cupColor"
                        className="text-xs font-bold text-[#7A6F68]"
                      >
                        Màu nền ly
                      </Label>
                      <span className="font-mono text-xs text-[#7A6F68]">
                        {cupConfig.cupColor.toUpperCase()}
                      </span>
                    </div>
                    <Input
                      id="cupColor"
                      type="color"
                      value={cupConfig.cupColor}
                      className="h-10 rounded-lg p-1"
                      onChange={(event) =>
                        setCupConfig((current) => ({
                          ...current,
                          cupColor: event.target.value,
                        }))
                      }
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <CupArtworkEditor
                artwork={artworkSnapshot}
                onArtworkChange={(nextArtwork) => {
                  setArtwork({
                    fill: nextArtwork.fill,
                    offsetX: nextArtwork.offsetX,
                    offsetY: nextArtwork.offsetY,
                    rotation: nextArtwork.rotation,
                    scale: nextArtwork.scale,
                    text: nextArtwork.text,
                  });
                }}
                previewDataUrl={previewDataUrl}
              />

              <div className="grid gap-4 rounded-2xl border border-[#E6DFD9] bg-white p-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label
                    htmlFor="designText"
                    className="text-xs font-black text-primary"
                  >
                    Text/logo
                  </Label>
                  <Input
                    id="designText"
                    value={artwork.text}
                    className="h-11 rounded-xl border-[#E6DFD9] bg-white"
                    onChange={(event) =>
                      setArtwork({ ...artwork, text: event.target.value })
                    }
                  />
                </div>
                <div className="grid grid-cols-[1fr_64px] gap-2">
                  <div className="grid gap-1">
                    <Label
                      htmlFor="designColor"
                      className="text-xs font-black text-primary"
                    >
                      Màu artwork
                    </Label>
                    <span className="font-mono text-xs text-[#7A6F68]">
                      {artwork.fill.toUpperCase()}
                    </span>
                  </div>
                  <Input
                    id="designColor"
                    type="color"
                    value={artwork.fill}
                    className="h-11 rounded-xl p-1"
                    onChange={(event) =>
                      setArtwork({ ...artwork, fill: event.target.value })
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <div className="flex items-center justify-between gap-3">
                    <Label
                      htmlFor="designScale"
                      className="text-xs font-black text-primary"
                    >
                      Kích thước
                    </Label>
                    <span className="text-xs font-bold text-[#7A6F68]">
                      x{artwork.scale.toFixed(2)}
                    </span>
                  </div>
                  <Input
                    id="designScale"
                    type="range"
                    min="0.7"
                    max="1.5"
                    step="0.05"
                    value={artwork.scale}
                    onChange={(event) =>
                      setArtwork({
                        ...artwork,
                        scale: Number(event.target.value),
                      })
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <div className="flex items-center justify-between gap-3">
                    <Label
                      htmlFor="designRotation"
                      className="text-xs font-black text-primary"
                    >
                      Xoay
                    </Label>
                    <span className="text-xs font-bold text-[#7A6F68]">
                      {artwork.rotation}°
                    </span>
                  </div>
                  <Input
                    id="designRotation"
                    type="range"
                    min="-18"
                    max="18"
                    step="1"
                    value={artwork.rotation}
                    onChange={(event) =>
                      setArtwork({
                        ...artwork,
                        rotation: Number(event.target.value),
                      })
                    }
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <aside className="space-y-4">
        <Card className="overflow-hidden rounded-2xl border-[#E6DFD9] bg-white p-0 shadow-sm xl:sticky xl:top-36">
          <CardHeader className="border-b border-[#E6DFD9]/70 bg-[#FAF8F6] px-6 py-4">
            <CardTitle className="text-lg font-black tracking-normal">
              Preview và giỏ hàng
            </CardTitle>
            <CardDescription className="text-sm text-[#7A6F68]">
              Ly custom cần thanh toán online, không áp dụng COD.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 p-5">
            <CupPreview3d
              artwork={artworkSnapshot}
              previewDataUrl={previewDataUrl}
            />

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="rounded-xl border border-[#E6DFD9] bg-[#FAF8F6] p-3">
                <div className="flex items-center gap-1.5 text-[#7A6F68]">
                  <Ruler className="size-3.5 text-primary" />
                  Size
                </div>
                <div className="mt-1 font-black">{cupConfig.size}</div>
              </div>
              <div className="rounded-xl border border-[#E6DFD9] bg-[#FAF8F6] p-3">
                <div className="flex items-center gap-1.5 text-[#7A6F68]">
                  <Palette className="size-3.5 text-primary" />
                  Material
                </div>
                <div className="mt-1 font-black">{cupConfig.materialType}</div>
              </div>
              <div className="rounded-xl border border-[#E6DFD9] bg-[#FAF8F6] p-3">
                <div className="flex items-center gap-1.5 text-[#7A6F68]">
                  <Layers className="size-3.5 text-primary" />
                  Layers
                </div>
                <div className="mt-1 font-black">{layers.length}</div>
              </div>
              <div className="rounded-xl border border-[#E6DFD9] bg-[#FAF8F6] p-3">
                <div className="flex items-center gap-1.5 text-[#7A6F68]">
                  <CreditCard className="size-3.5 text-primary" />
                  Payment
                </div>
                <div className="mt-1 font-black">Online</div>
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="quantity" className="text-xs font-black text-primary">
                Số lượng
              </Label>
              <Input
                id="quantity"
                type="number"
                min={1}
                value={quantity}
                className="h-11 rounded-xl border-[#E6DFD9] bg-white"
                onChange={(event) => {
                  const value = Number(event.target.value);
                  setQuantity(Number.isFinite(value) ? Math.max(value, 1) : 1);
                }}
              />
            </div>

            <div className="rounded-xl border border-[#E6DFD9] bg-[#FAF8F6] p-4 text-sm">
              <div className="flex justify-between gap-3">
                <span className="text-[#7A6F68]">Đơn giá</span>
                <span className="font-bold">
                  {moneyFormatter.format(customCupProduct.price)}
                </span>
              </div>
              <div className="mt-2 flex justify-between gap-3 text-base">
                <span className="font-black">Tạm tính</span>
                <span className="font-black text-primary">{totalPrice}</span>
              </div>
            </div>

            <div className="rounded-xl border border-[#E6DFD9] bg-white p-3 text-xs">
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className="font-black text-primary">Bản thiết kế</span>
                <Badge variant="outline">{designId}</Badge>
              </div>
              <div className="grid gap-1 text-[#7A6F68]">
                <div className="flex justify-between gap-3">
                  <span>Tên</span>
                  <span className="truncate font-bold text-[#1C1917]">
                    {designName}
                  </span>
                </div>
                <div className="flex justify-between gap-3">
                  <span>MIME</span>
                  <span className="truncate font-bold text-[#1C1917]">
                    {uploadedMeta.mimeType}
                  </span>
                </div>
                <div className="flex justify-between gap-3">
                  <span>Dung lượng</span>
                  <span className="font-bold text-[#1C1917]">
                    {uploadedSizeKb > 0 ? `${uploadedSizeKb}KB` : "template"}
                  </span>
                </div>
              </div>
            </div>

            <Button
              className="h-12 w-full rounded-xl bg-primary font-bold text-white hover:bg-[#4A2E22]"
              onClick={() => {
                addProduct(customCupProduct, quantity, {
                  cartItemId: `${customCupProduct.id}:${designFile.designId}`,
                  designFile,
                  designId: designFile.designId,
                  isPrintItem: true,
                });
                toast.success("Đã thêm ly-in custom vào giỏ");
                router.push("/cart");
              }}
            >
              <ShoppingCart data-icon="inline-start" />
              Thêm vào giỏ
            </Button>
          </CardContent>
        </Card>
      </aside>
    </div>
  );
}
