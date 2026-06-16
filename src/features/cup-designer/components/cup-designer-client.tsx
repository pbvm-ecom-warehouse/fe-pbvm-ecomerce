"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BadgeCheck,
  CreditCard,
  ImageIcon,
  Paintbrush,
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
import { Separator } from "@/components/ui/separator";
import { CupArtworkEditor } from "@/features/cup-designer/components/cup-artwork-editor";
import { CupPreview3d } from "@/features/cup-designer/components/cup-preview-3d";
import {
  createDesignFileSnapshot,
  createLocalDesignId,
} from "@/features/cup-designer/utils/design-file";
import { useCartStore } from "@/stores/cart-store";
import type { CatalogProduct, DesignArtwork } from "@/types/api";

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

const savedDesigns = [
  {
    id: "sample-logo-tea",
    name: "Logo Tea House",
    artwork: {
      text: "Tea House",
      fill: "#0f766e",
      scale: 1,
      rotation: 0,
      offsetX: 0,
      offsetY: 0,
    },
  },
  {
    id: "sample-summer",
    name: "Summer Cup",
    artwork: {
      text: "SUMMER",
      fill: "#be123c",
      scale: 1.15,
      rotation: -4,
      offsetX: -8,
      offsetY: 0,
    },
  },
] satisfies Array<{ id: string; name: string; artwork: DesignArtwork }>;

const moneyFormatter = new Intl.NumberFormat("vi-VN", {
  currency: "VND",
  style: "currency",
});

export function CupDesignerClient() {
  const router = useRouter();
  const addProduct = useCartStore((state) => state.addProduct);
  const [quantity, setQuantity] = useState(100);
  const [designId, setDesignId] = useState(savedDesigns[0].id);
  const [designName, setDesignName] = useState(savedDesigns[0].name);
  const [previewDataUrl, setPreviewDataUrl] = useState<string | undefined>();
  const [uploadedMeta, setUploadedMeta] = useState({
    mimeType: "application/json",
    size: 0,
  });
  const [artwork, setArtwork] = useState<DesignArtwork>(
    savedDesigns[0].artwork,
  );

  const designFile = useMemo(
    () =>
      createDesignFileSnapshot({
        designId,
        name: designName,
        previewDataUrl,
        mimeType: uploadedMeta.mimeType,
        size: uploadedMeta.size,
        artwork,
      }),
    [artwork, designId, designName, previewDataUrl, uploadedMeta],
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
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
      <div className="space-y-4">
        <Card className="shadow-sm">
          <CardHeader className="border-b bg-muted/25">
            <CardTitle className="flex items-center gap-2 text-xl">
              <Paintbrush className="size-5 text-primary" />
              Artwork workspace
            </CardTitle>
            <CardDescription>
              Artboard 2D là nguồn dữ liệu xuất ra designFile, preview ly chỉ
              dùng để kiểm tra trực quan.
            </CardDescription>
            <CardAction>
              <Badge variant="secondary">
                <BadgeCheck data-icon="inline-start" />
                Snapshot v{designFile.snapshotVersion}
              </Badge>
            </CardAction>
          </CardHeader>
          <CardContent className="grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
            <div className="space-y-3">
              <div
                {...getRootProps()}
                className="grid min-h-32 cursor-pointer gap-2 rounded-lg border border-dashed bg-muted/35 p-4 text-sm transition hover:border-primary/50 hover:bg-muted/60"
              >
                <input {...getInputProps()} />
                <div className="flex size-10 items-center justify-center rounded-lg bg-background ring-1 ring-border">
                  <Upload className="size-5 text-primary" />
                </div>
                <div className="font-semibold">
                  {isDragActive ? "Thả file design" : "Upload artwork"}
                </div>
                <div className="text-xs text-muted-foreground">
                  PNG, JPG hoặc SVG dưới 5MB. File upload sẽ được giữ trong
                  snapshot local cho giỏ hàng.
                </div>
              </div>

              <div className="grid gap-2">
                <Label>Mẫu đã lưu</Label>
                <div className="grid gap-2">
                  {savedDesigns.map((design) => (
                    <Button
                      key={design.id}
                      type="button"
                      variant={design.id === designId ? "secondary" : "outline"}
                      className="h-auto min-h-11 justify-start px-3 py-2"
                      onClick={() => {
                        setDesignId(design.id);
                        setDesignName(design.name);
                        setArtwork(design.artwork);
                        setPreviewDataUrl(undefined);
                        setUploadedMeta({
                          mimeType: "application/json",
                          size: 0,
                        });
                      }}
                    >
                      <ImageIcon data-icon="inline-start" />
                      <span className="truncate">{design.name}</span>
                    </Button>
                  ))}
                </div>
              </div>

              <Separator />

              <div className="grid gap-2 rounded-lg border bg-background p-3">
                <Label htmlFor="designText">Text/logo</Label>
                <Input
                  id="designText"
                  value={artwork.text}
                  onChange={(event) =>
                    setArtwork({ ...artwork, text: event.target.value })
                  }
                />
              </div>
              <div className="grid grid-cols-[1fr_64px] gap-2 rounded-lg border bg-background p-3">
                <div className="grid gap-1">
                  <Label htmlFor="designColor">Màu artwork</Label>
                  <div className="text-xs text-muted-foreground">
                    {artwork.fill.toUpperCase()}
                  </div>
                </div>
                <Input
                  id="designColor"
                  type="color"
                  value={artwork.fill}
                  className="h-10 p-1"
                  onChange={(event) =>
                    setArtwork({ ...artwork, fill: event.target.value })
                  }
                />
              </div>
              <div className="grid gap-2 rounded-lg border bg-background p-3">
                <div className="flex items-center justify-between gap-3">
                  <Label htmlFor="designScale">Kích thước</Label>
                  <span className="text-xs font-medium">
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

              <div className="rounded-lg border bg-muted/25 p-3 text-xs">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <span className="font-semibold">Design snapshot</span>
                  <Badge variant="outline">{designId}</Badge>
                </div>
                <div className="grid gap-1 text-muted-foreground">
                  <div className="flex justify-between gap-3">
                    <span>Tên</span>
                    <span className="truncate text-foreground">
                      {designName}
                    </span>
                  </div>
                  <div className="flex justify-between gap-3">
                    <span>MIME</span>
                    <span className="truncate text-foreground">
                      {uploadedMeta.mimeType}
                    </span>
                  </div>
                  <div className="flex justify-between gap-3">
                    <span>Dung lượng</span>
                    <span className="text-foreground">
                      {uploadedSizeKb > 0 ? `${uploadedSizeKb}KB` : "template"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <CupArtworkEditor
              artwork={artwork}
              onArtworkChange={setArtwork}
              previewDataUrl={previewDataUrl}
            />
          </CardContent>
        </Card>
      </div>

      <aside className="space-y-4">
        <Card className="shadow-sm xl:sticky xl:top-4">
          <CardHeader className="border-b bg-muted/25">
            <CardTitle className="text-lg">Preview và giỏ hàng</CardTitle>
            <CardDescription>
              CUSTOM_PRINT cần thanh toán online, không áp dụng COD.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <CupPreview3d artwork={artwork} />
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="rounded-lg border bg-background p-3">
                <div className="text-muted-foreground">Sản phẩm</div>
                <div className="mt-1 font-semibold">
                  {customCupProduct.name}
                </div>
              </div>
              <div className="rounded-lg border bg-background p-3">
                <div className="text-muted-foreground">Thanh toán</div>
                <div className="mt-1 flex items-center gap-1 font-semibold">
                  <CreditCard className="size-3.5 text-primary" />
                  Online
                </div>
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="quantity">Số lượng</Label>
              <Input
                id="quantity"
                type="number"
                min={1}
                value={quantity}
                onChange={(event) =>
                  setQuantity(Math.max(Number(event.target.value), 1))
                }
              />
            </div>
            <div className="rounded-lg border bg-primary/5 p-3 text-sm">
              <div className="flex justify-between gap-3">
                <span className="text-muted-foreground">Đơn giá</span>
                <span className="font-medium">
                  {moneyFormatter.format(customCupProduct.price)}
                </span>
              </div>
              <div className="mt-2 flex justify-between gap-3 text-base">
                <span className="font-semibold">Tạm tính</span>
                <span className="font-semibold text-primary">{totalPrice}</span>
              </div>
            </div>
            <Button
              className="h-11 w-full"
              onClick={() => {
                addProduct(customCupProduct, quantity, {
                  cartItemId: `${customCupProduct.id}:${designFile.designId}`,
                  designId: designFile.designId,
                  designFile,
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
