"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { User, Palette, Trash2, Pencil } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuthStore } from "@/stores/auth-store";
import { useCartStore } from "@/stores/cart-store";
import { createCustomCupProduct } from "@/features/cup-designer/utils/artwork";
import { listMyDesigns, deleteDesign } from "@/features/cup-designer/services/design.service";

const SAVED_DESIGNS_KEY = "cup_designer_saved_designs_v1";

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

function mergeDesigns(local: any[], remote: any[]): any[] {
  const remoteIds = new Set(remote.map((d) => d.id));
  const localOnly = local.filter((d) => !remoteIds.has(d.id));
  return [...remote, ...localOnly];
}

export default function AccountDesignsPage() {
  const user = useAuthStore((state) => state.user);

  // Saved designs state
  const [designs, setDesigns] = useState<any[]>(() => loadSavedDesigns());
  const [loadingDesigns, setLoadingDesigns] = useState(false);
  const addCustomPrintItem = useCartStore((state) => state.addCustomPrintItem);

  const fetchDesigns = async () => {
    setLoadingDesigns(true);
    const local = loadSavedDesigns();
    setDesigns(local);

    if (user && user.type !== "admin") {
      try {
        const data = await listMyDesigns();
        const merged = mergeDesigns(local, data || []);
        setDesigns(merged);
        persistSavedDesigns(merged);
      } catch (err) {
        console.error("Failed to fetch designs from API:", err);
      } finally {
        setLoadingDesigns(false);
      }
    } else {
      setLoadingDesigns(false);
    }
  };

  useEffect(() => {
    fetchDesigns();
  }, [user]);

  // Delete confirmation modal state
  const [designToDelete, setDesignToDelete] = useState<any | null>(null);

  const handleConfirmDelete = async () => {
    if (!designToDelete) return;
    const id = designToDelete.id;
    try {
      if (user && id && !String(id).startsWith("auto_")) {
        await deleteDesign(id).catch((e) => console.warn("Delete design API error:", e));
      }
      setDesigns((current) => {
        const updated = current.filter((d) => d.id !== id);
        persistSavedDesigns(updated);
        return updated;
      });
      toast.success("Xóa thiết kế thành công!");
    } catch (err: any) {
      console.error(err);
      toast.error("Xóa thiết kế thất bại.");
    } finally {
      setDesignToDelete(null);
    }
  };


  if (!user) {
    return (
      <main className="mx-auto w-full max-w-3xl px-4 py-16">
        <Card className="border border-slate-200 rounded-2xl shadow-sm bg-white overflow-hidden text-center p-8">
          <div className="mx-auto size-16 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 mb-4">
            <User size={30} />
          </div>
          <CardTitle className="text-xl font-bold text-[#253D4E] mb-2">Chưa đăng nhập tài khoản</CardTitle>
          <CardDescription className="text-sm font-medium text-slate-500 mb-6 max-w-md mx-auto">
            Vui lòng đăng nhập để xem danh sách các ly đã thiết kế.
          </CardDescription>
          <div className="flex justify-center gap-3">
            <Button asChild className="bg-[#3BB77E] hover:bg-[#34a370] rounded-xl px-5 font-bold text-xs h-10 shadow-sm cursor-pointer border-0 text-white">
              <Link href="/login">Đăng nhập</Link>
            </Button>
            <Button asChild variant="outline" className="border-slate-200 hover:bg-slate-50 rounded-xl px-5 font-bold text-xs h-10 shadow-sm text-slate-600 cursor-pointer">
              <Link href="/register">Tạo tài khoản</Link>
            </Button>
          </div>
        </Card>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-10">
      <Card className="border border-slate-200 rounded-2xl shadow-sm bg-white overflow-hidden w-full">
        {/* Card Header */}
        <CardHeader className="border-b border-slate-100 bg-slate-50/50 p-6">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-100 rounded-lg text-primary">
                <Palette size={20} />
              </div>
              <div>
                <CardTitle className="text-base font-bold text-[#253D4E] uppercase tracking-wider">
                  Thiết kế của tôi
                </CardTitle>
              </div>
            </div>
            {/* Counter X/15 */}
            {!loadingDesigns && (
              <span className={cn(
                "text-[11px] font-black px-3 py-1 rounded-xl",
                designs.length >= 15
                  ? "bg-rose-100 text-rose-700"
                  : designs.length >= 12
                    ? "bg-amber-100 text-amber-700"
                    : "bg-slate-100 text-slate-600"
              )}>
                {designs.length} / 15 mẫu
              </span>
            )}
          </div>
          {/* Banner đầy 15 mẫu */}
          {!loadingDesigns && designs.length >= 15 && (
            <div className="mt-3 flex items-center gap-2 px-3 py-2 rounded-xl bg-rose-50 border border-rose-200">
              <span className="text-rose-600">🚫</span>
              <p className="text-[11px] font-bold text-rose-700">
                Bạn đã đạt 15 mẫu thiết kế. Xóa mẫu cũ để tạo thiết kế mới tại trang Thiết kế Ly.
              </p>
            </div>
          )}
        </CardHeader>

        <CardContent className="p-6">
          {loadingDesigns ? (
            <div className="flex h-64 items-center justify-center bg-slate-50/50 rounded-xl border border-slate-100">
              <div className="flex flex-col items-center gap-2">
                <div className="size-8 rounded-full border-2 border-emerald-200 border-t-emerald-600 animate-spin" />
                <div className="text-xs text-slate-400 font-bold">Đang tải các mẫu thiết kế của bạn...</div>
              </div>
            </div>
          ) : designs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4 border border-dashed border-slate-200 rounded-xl bg-slate-50/30 text-center">
              <div className="p-3 bg-slate-100 rounded-full text-slate-400 mb-3">
                <Palette size={24} />
              </div>
              <span className="text-xs text-slate-500 font-bold">Bạn chưa lưu mẫu thiết kế nào.</span>
              <p className="text-[11px] text-slate-400 font-medium max-w-xs mt-1">
                Hãy bắt đầu tạo những thiết kế độc đáo của riêng bạn ngay bây giờ.
              </p>
              <Button asChild size="sm" className="mt-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs h-9 font-bold border-0 shadow-sm cursor-pointer">
                <Link href="/design-cup">Thiết kế ngay</Link>
              </Button>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {designs.map((design) => {
                const handleAddToCart = () => {
                  const product = createCustomCupProduct({ size: "500ml", price: 3500 });
                  addCustomPrintItem({
                    product,
                    quantity: 100, // minimum custom print order quantity
                    designId: design.id,
                    designFile: {
                      snapshotVersion: 1,
                      designId: `design_${design.id}`,
                      name: design.name,
                      previewDataUrl: design.thumbnail || design.file,
                      artwork: {
                        artboard: { width: 400, height: 250, printHeightPercent: 60 },
                        cup: { size: "500ml" as const, style: "straight" as const, materialType: "clear" as const, cupColor: "#ffffff" },
                        layers: []
                      },
                      exportedAt: new Date().toISOString(),
                    },
                  });
                  toast.success(`Đã thêm mẫu "${design.name}" vào giỏ hàng với số lượng mặc định (100 ly).`);
                };

                const handleEditDesign = () => {
                  let snapshot: any = null;
                  if (typeof design.file === "string" && design.file.trimStart().startsWith("{")) {
                    try {
                      snapshot = JSON.parse(design.file);
                    } catch {}
                  }

                  if (snapshot?.artwork) {
                    const draft = {
                      materialType: snapshot.artwork.cup?.materialType || "clear",
                      style: snapshot.artwork.cup?.style || "straight",
                      size: snapshot.artwork.cup?.size || "500ml",
                      printHeightPercent: snapshot.artwork.artboard?.printHeightPercent || 60,
                      layers: snapshot.artwork.layers || [],
                      quantity: 100,
                    };
                    try {
                      localStorage.setItem("cup_designer_draft_v1", JSON.stringify(draft));
                    } catch {}
                  }
                };

                return (
                  <div key={design.id} className="group relative flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs transition-all hover:shadow-md">
                    {/* Preview Image Container */}
                    <div className="aspect-[4/3] w-full bg-slate-50 relative flex items-center justify-center overflow-hidden border-b border-slate-100">
                      {design.thumbnail || design.file ? (
                        <img
                          src={design.thumbnail || design.file}
                          alt={design.name}
                          className="h-full w-full object-contain p-2 transition-transform duration-300 group-hover:scale-105"
                        />
                      ) : (
                        <span className="text-[10px] text-slate-400 font-bold">Không có hình ảnh</span>
                      )}
                    </div>

                    {/* Card Info */}
                    <div className="p-4 flex-1 flex flex-col justify-between gap-3">
                      <div>
                        <h4 className="text-xs font-bold text-slate-700 truncate" title={design.name}>
                          {design.name}
                        </h4>
                        <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                          Lưu ngày: {design.createdAt ? new Date(design.createdAt).toLocaleDateString("vi-VN") : new Date().toLocaleDateString("vi-VN")}
                        </p>
                      </div>

                      <div className="flex gap-1.5 w-full">
                        <Button
                          onClick={handleAddToCart}
                          className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[11px] h-8 font-bold border-0 shadow-xs active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-1 px-2"
                        >
                          Đặt in
                        </Button>
                        <Button
                          asChild
                          variant="outline"
                          className="flex-1 border-emerald-300 bg-emerald-50/60 hover:bg-emerald-100/80 text-emerald-800 rounded-xl text-[11px] h-8 font-bold shadow-2xs active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-1 px-2"
                        >
                          <Link href={`/design-cup?loadDesignId=${design.id}`} onClick={handleEditDesign}>
                            <Pencil size={11} className="text-emerald-700 shrink-0" />
                            Thiết kế
                          </Link>
                        </Button>
                        <Button
                          onClick={() => setDesignToDelete(design)}
                          variant="outline"
                          className="size-8 p-0 border-rose-100 hover:border-rose-200 hover:bg-rose-50 text-rose-500 rounded-xl shrink-0 cursor-pointer flex items-center justify-center"
                          title="Xóa thiết kế"
                        >
                          <Trash2 size={13} />
                        </Button>
                      </div>
                    </div>
                  </div>
                );

              })}
            </div>
          )}
        </CardContent>
      </Card>

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
              onClick={handleConfirmDelete}
              className="rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white h-9 px-4 cursor-pointer shadow-xs border-0"
            >
              Xác nhận xóa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
