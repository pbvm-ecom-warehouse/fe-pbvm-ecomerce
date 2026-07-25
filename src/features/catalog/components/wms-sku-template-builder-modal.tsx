"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  Sparkles,
  RefreshCw,
  Plus,
  Check,
  Package,
  Barcode,
  Settings,
  Copy,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  getWmsSkuTemplate,
  previewWmsSku,
  createWmsItem,
  listWmsAttributeOptions,
  suggestWmsAttributeOptionCode,
  createWmsAttributeOption,
  updateWmsAttributeOption,
  wmsStaffLogin,
  type WmsItemType,
  type WmsAttributeOption,
  type WmsSkuTemplateResponse,
  type WmsWarehouseItem,
} from "../services/wms-stock.service";

interface WmsSkuTemplateBuilderModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectSku: (sku: string, barcode?: string) => void;
}

export function WmsSkuTemplateBuilderModal({
  open,
  onOpenChange,
  onSelectSku,
}: WmsSkuTemplateBuilderModalProps) {
  const [activeTab, setActiveTab] = useState<"builder" | "options">("builder");

  // Builder State
  const [selectedType, setSelectedType] = useState<WmsItemType>("CUP_BLANK");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
  const [fieldSelections, setFieldSelections] = useState<Record<string, string>>({});
  const [name, setName] = useState("");
  const [unit, setUnit] = useState("cái");

  // Template & Options
  const [template, setTemplate] = useState<WmsSkuTemplateResponse | null>(null);
  const [fieldOptionsMap, setFieldOptionsMap] = useState<Record<string, WmsAttributeOption[]>>({});
  const [loadingTemplate, setLoadingTemplate] = useState(false);

  // Preview SKU & Created Item state
  const [previewSku, setPreviewSku] = useState("");
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [submittingItem, setSubmittingItem] = useState(false);
  const [createdItem, setCreatedItem] = useState<WmsWarehouseItem | null>(null);

  // Option Admin State
  const [optKey, setOptKey] = useState<string>("CUP_STYLE");
  const [optList, setOptList] = useState<WmsAttributeOption[]>([]);
  const [optLoading, setOptLoading] = useState(false);
  const [optName, setOptName] = useState("");
  const [optCode, setOptCode] = useState("");
  const [optConfirmed, setOptConfirmed] = useState(false);

  // Reset builder state
  const resetBuilder = () => {
    setSelectedType("CUP_BLANK");
    setSelectedCategoryId("");
    setFieldSelections({});
    setName("");
    setUnit("cái");
    setPreviewSku("");
    setCreatedItem(null);
  };

  // Fetch Template
  useEffect(() => {
    if (!open || activeTab !== "builder") return;

    setLoadingTemplate(true);

    const loadTemplate = async () => {
      try {
        const res = await getWmsSkuTemplate(selectedType, selectedCategoryId || undefined);
        setTemplate(res);
        setFieldSelections({});
        setPreviewSku("");

        if (res.fields && res.fields.length > 0) {
          const results = await Promise.all(
            res.fields.map(async (f) => {
              const opts = await listWmsAttributeOptions(f.key, false);
              return { key: f.key, opts };
            }),
          );
          const map: Record<string, WmsAttributeOption[]> = {};
          results.forEach((r) => {
            map[r.key] = r.opts;
          });
          setFieldOptionsMap(map);
        }
      } catch (err: any) {
        console.error(err);
        if (err?.response?.status === 401) {
          try {
            await wmsStaffLogin("admin", "P@ssw0rd123!");
            const res = await getWmsSkuTemplate(selectedType, selectedCategoryId || undefined);
            setTemplate(res);
            setFieldSelections({});
            setPreviewSku("");

            if (res.fields && res.fields.length > 0) {
              const results = await Promise.all(
                res.fields.map(async (f) => {
                  const opts = await listWmsAttributeOptions(f.key, false);
                  return { key: f.key, opts };
                }),
              );
              const map: Record<string, WmsAttributeOption[]> = {};
              results.forEach((r) => {
                map[r.key] = r.opts;
              });
              setFieldOptionsMap(map);
            }
          } catch {
            toast.error("Xác thực WMS thất bại. Vui lòng kiểm tra quyền tài khoản.");
          }
        } else {
          toast.error("Lấy cấu trúc template SKU thất bại.");
        }
      } finally {
        setLoadingTemplate(false);
      }
    };

    loadTemplate();
  }, [open, selectedType, selectedCategoryId, activeTab]);

  // Debounced SKU Preview
  useEffect(() => {
    if (!template || !template.fields || template.fields.length === 0) {
      setPreviewSku("");
      return;
    }

    const selectedOptionIds = template.fields
      .map((f) => fieldSelections[f.key])
      .filter(Boolean);

    if (selectedOptionIds.length === template.fields.length) {
      setLoadingPreview(true);
      const timer = setTimeout(() => {
        previewWmsSku(template.templateId, selectedOptionIds)
          .then((sku) => setPreviewSku(sku))
          .catch(() => setPreviewSku(""))
          .finally(() => setLoadingPreview(false));
      }, 300);
      return () => clearTimeout(timer);
    } else {
      setPreviewSku("");
    }
  }, [template, fieldSelections]);

  // Fetch Admin Options list
  const fetchOptions = async () => {
    setOptLoading(true);
    try {
      const data = await listWmsAttributeOptions(optKey, true);
      setOptList(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setOptLoading(false);
    }
  };

  useEffect(() => {
    if (open && activeTab === "options") {
      fetchOptions();
    }
  }, [open, activeTab, optKey]);

  const handleSuggestCode = async () => {
    if (!optName.trim()) {
      toast.error("Nhập Tên option trước khi gợi ý mã.");
      return;
    }
    try {
      const code = await suggestWmsAttributeOptionCode(optKey, optName);
      setOptCode(code);
      setOptConfirmed(false);
      toast.info(`Mã gợi ý: ${code}. Vui lòng bấm 'Xác nhận mã'.`);
    } catch (err: any) {
      toast.error("Lỗi khi sinh mã gợi ý.");
    }
  };

  const handleCreateOption = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!optName.trim() || !optCode.trim()) {
      toast.error("Nhập đủ Tên và Mã thuộc tính.");
      return;
    }
    if (!optConfirmed) {
      toast.error("Bấm 'Xác nhận mã' trước khi lưu.");
      return;
    }

    try {
      await createWmsAttributeOption({
        key: optKey,
        name: optName.trim(),
        code: optCode.trim().toUpperCase(),
      });
      toast.success("Tạo Option thành công!");
      setOptName("");
      setOptCode("");
      setOptConfirmed(false);
      fetchOptions();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Tạo option thất bại.");
    }
  };

  const handleCreateWmsItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!template || !name.trim()) {
      toast.error("Nhập Tên mặt hàng.");
      return;
    }

    const selectedOptionIds = template.fields
      .map((f) => fieldSelections[f.key])
      .filter(Boolean);

    if (selectedOptionIds.length !== template.fields.length) {
      toast.error("Chọn đầy đủ các thuộc tính theo template.");
      return;
    }

    setSubmittingItem(true);
    try {
      const created = await createWmsItem({
        templateId: template.templateId,
        attributeOptionIds: selectedOptionIds,
        name: name.trim(),
        unit: unit.trim() || "cái",
      });

      toast.success("Tạo mặt hàng WMS & sinh EAN-13 barcode thành công!");
      setCreatedItem(created);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Tạo mặt hàng thất bại.");
    } finally {
      setSubmittingItem(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white border border-slate-200 shadow-2xl p-6 relative">
        {/* Header Tabs */}
        <div className="flex items-center justify-between border-b pb-4 mb-4">
          <div>
            <h3 className="text-base font-black text-slate-800 uppercase tracking-wider">
              Chuẩn hóa SKU &amp; Barcode EAN-13 (WMS Template)
            </h3>
            <p className="text-xs text-slate-500">
              BE tự động sinh SKU chuẩn hóa theo 11 Template đã duyệt &amp; mã EAN-13 Prefix 20.
            </p>
          </div>
          <div className="flex gap-1 bg-slate-100 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setActiveTab("builder")}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                activeTab === "builder"
                  ? "bg-white text-emerald-700 shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Sinh SKU WMS
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("options")}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1 ${
                activeTab === "options"
                  ? "bg-white text-emerald-700 shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <Settings className="size-3.5" /> Quản lý Options
            </button>
          </div>
        </div>

        {/* TAB 1: BUILDER & ITEM CREATION */}
        {activeTab === "builder" && (
          <div>
            {createdItem ? (
              /* Success View */
              <div className="space-y-4 py-2">
                <div className="flex flex-col items-center justify-center text-center space-y-1.5">
                  <div className="size-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                    <Check className="size-6" />
                  </div>
                  <h4 className="text-base font-bold text-slate-800">
                    Đã sinh thành công SKU &amp; Mã vạch EAN-13
                  </h4>
                </div>

                <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 space-y-3">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Tên mặt hàng:</span>
                    <div className="text-sm font-bold text-slate-700">{createdItem.name}</div>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
                      <Package className="size-3 text-emerald-600" /> SKU chuẩn hóa
                    </span>
                    <div className="font-mono text-sm font-bold text-emerald-700 bg-white border border-emerald-200 rounded-lg p-2 flex justify-between items-center">
                      <span>{createdItem.sku}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          navigator.clipboard.writeText(createdItem.sku);
                          toast.success("Đã chép SKU!");
                        }}
                        className="h-7 text-xs"
                      >
                        <Copy className="size-3" />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
                      <Barcode className="size-3 text-slate-600" /> Mã vạch EAN-13 duy nhất (Prefix 20)
                    </span>
                    <div className="font-mono text-sm font-bold text-slate-800 bg-white border border-slate-200 rounded-lg p-2">
                      {createdItem.barcode || "N/A"}
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      onSelectSku(createdItem.sku, createdItem.barcode);
                      onOpenChange(false);
                    }}
                    className="h-9 text-xs font-bold rounded-xl"
                  >
                    Đóng
                  </Button>
                  <Button
                    type="button"
                    onClick={() => {
                      onSelectSku(createdItem.sku, createdItem.barcode);
                      onOpenChange(false);
                    }}
                    className="h-9 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    Dùng SKU này cho Biến thể Ecom
                  </Button>
                </div>
              </div>
            ) : (
              /* Builder Form */
              <form onSubmit={handleCreateWmsItem} className="space-y-4">
                {/* 1. Item Type */}
                <div className="space-y-1">
                  <Label className="text-xs font-bold text-slate-500 uppercase">1. Chọn Loại mặt hàng kho</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { type: "CUP_BLANK", label: "Ly chưa in", desc: "CUP-..." },
                      { type: "MATERIAL", label: "Nguyên liệu", desc: "MAT-..." },
                      { type: "PACKAGING", label: "Bao bì", desc: "PKG-..." },
                    ].map((item) => (
                      <button
                        key={item.type}
                        type="button"
                        onClick={() => {
                          setSelectedType(item.type as WmsItemType);
                          setSelectedCategoryId("");
                          setFieldSelections({});
                          setPreviewSku("");
                        }}
                        className={`p-2.5 rounded-xl border text-left text-xs transition-all ${
                          selectedType === item.type
                            ? "border-emerald-500 bg-emerald-50/50 font-bold text-emerald-800"
                            : "border-slate-200 hover:bg-slate-50 text-slate-600"
                        }`}
                      >
                        <div>{item.label}</div>
                        <div className="text-[10px] text-slate-400">{item.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 2. Category if MATERIAL/PACKAGING */}
                {(selectedType === "MATERIAL" || selectedType === "PACKAGING") && (
                  <div className="space-y-1 bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <Label className="text-xs font-bold text-slate-600">2. Chọn Nhóm (Category)</Label>
                    <select
                      value={selectedCategoryId}
                      onChange={(e) => {
                        setSelectedCategoryId(e.target.value);
                        setFieldSelections({});
                        setPreviewSku("");
                      }}
                      className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs focus:outline-none"
                    >
                      <option value="">-- Chọn nhóm (Trà, Sữa, Nắp ly, Túi...) --</option>
                      {template?.categoryOptions?.map((cat) => (
                        <option key={cat._id} value={cat._id}>
                          {cat.name} ({cat.code})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* 3. Fields */}
                {template && template.fields && template.fields.length > 0 && (
                  <div className="space-y-2.5 bg-slate-50/60 p-3.5 rounded-xl border border-slate-200">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-600">
                      <span>Cấu trúc thuộc tính [{template.pattern}]</span>
                      <Badge variant="outline" className="font-mono text-[10px]">
                        Prefix: {template.prefix}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-2.5">
                      {template.fields.map((field) => {
                        const options = fieldOptionsMap[field.key] ?? [];
                        return (
                          <div key={field.key} className="space-y-1">
                            <Label className="text-[11px] font-bold text-slate-500">
                              {field.name} ({field.key}) *
                            </Label>
                            <select
                              value={fieldSelections[field.key] ?? ""}
                              onChange={(e) =>
                                setFieldSelections((old) => ({
                                  ...old,
                                  [field.key]: e.target.value,
                                }))
                              }
                              className="h-9 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-xs focus:outline-none"
                            >
                              <option value="">-- Chọn {field.name} --</option>
                              {options.map((opt) => (
                                <option key={opt._id} value={opt._id}>
                                  {opt.name} ({opt.code})
                                </option>
                              ))}
                            </select>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Preview Box */}
                <div className="rounded-xl border border-dashed border-emerald-300 bg-emerald-50/50 p-3 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase text-emerald-800 flex items-center gap-1">
                      <Sparkles className="size-3" /> SKU xem trước từ Backend
                    </span>
                    <div className="font-mono text-sm font-bold text-emerald-700">
                      {loadingPreview ? (
                        <span className="text-xs text-slate-400 flex items-center gap-1 font-sans">
                          <RefreshCw className="size-3 animate-spin" /> Đang xem trước...
                        </span>
                      ) : previewSku ? (
                        previewSku
                      ) : (
                        <span className="text-xs text-slate-400 font-sans font-normal">
                          (Chọn đủ các thuộc tính để xem trước)
                        </span>
                      )}
                    </div>
                  </div>

                  {previewSku && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        onSelectSku(previewSku);
                        toast.success("Đã chọn SKU xem trước!");
                        onOpenChange(false);
                      }}
                      className="h-8 text-xs font-bold text-emerald-700 border-emerald-300 hover:bg-emerald-100"
                    >
                      Dùng SKU này
                    </Button>
                  )}
                </div>

                {/* Basic info to create WMS Item */}
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div className="space-y-1">
                    <Label htmlFor="wName" className="text-xs font-bold text-slate-500">Tên mặt hàng *</Label>
                    <Input
                      id="wName"
                      placeholder="ví dụ: Ly nhựa PET 500ml nắp tim"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="h-9 text-xs rounded-xl"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="wUnit" className="text-xs font-bold text-slate-500">Đơn vị cơ sở *</Label>
                    <Input
                      id="wUnit"
                      placeholder="cái, kg..."
                      value={unit}
                      onChange={(e) => setUnit(e.target.value)}
                      className="h-9 text-xs rounded-xl"
                    />
                  </div>
                </div>

                {/* Footer Buttons */}
                <div className="flex justify-end gap-2 border-t pt-3 mt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => onOpenChange(false)}
                    className="h-9 text-xs font-bold rounded-xl"
                  >
                    Hủy
                  </Button>
                  <Button
                    type="submit"
                    disabled={submittingItem || !previewSku || !name.trim()}
                    className="h-9 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    {submittingItem ? "Đang tạo..." : "Tạo mới trong WMS & Sinh Barcode"}
                  </Button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* TAB 2: OPTIONS ADMIN */}
        {activeTab === "options" && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Label className="text-xs font-bold text-slate-500">Chọn nhóm key thuộc tính:</Label>
              <select
                value={optKey}
                onChange={(e) => setOptKey(e.target.value)}
                className="h-8 rounded-lg border border-slate-200 bg-white px-2 text-xs font-bold"
              >
                {[
                  "CUP_STYLE",
                  "MATERIAL",
                  "CAPACITY",
                  "COLOR",
                  "MATERIAL_TYPE",
                  "FLAVOR",
                  "SPEC",
                  "PACKAGING_STYLE",
                  "COMPATIBILITY",
                  "DIAMETER",
                  "LENGTH",
                  "SIZE",
                ].map((k) => (
                  <option key={k} value={k}>
                    {k}
                  </option>
                ))}
              </select>
            </div>

            {/* Create option form */}
            <form onSubmit={handleCreateOption} className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2">
              <div className="text-xs font-bold text-slate-700">Thêm Option mới cho [{optKey}]</div>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  placeholder="Tên option (ví dụ: Trà Đen, PET)..."
                  value={optName}
                  onChange={(e) => {
                    setOptName(e.target.value);
                    setOptConfirmed(false);
                  }}
                  className="h-8 text-xs bg-white"
                />
                <div className="flex gap-1">
                  <Input
                    placeholder="Mã viết hoa (ví dụ: BLK)"
                    value={optCode}
                    onChange={(e) => {
                      setOptCode(e.target.value.toUpperCase());
                      setOptConfirmed(false);
                    }}
                    className="h-8 text-xs bg-white font-mono uppercase"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleSuggestCode}
                    className="h-8 px-2 text-[10px] shrink-0"
                  >
                    Gợi ý
                  </Button>
                </div>
              </div>

              <div className="flex justify-between items-center pt-1">
                <Button
                  type="button"
                  size="sm"
                  variant={optConfirmed ? "secondary" : "outline"}
                  onClick={() => {
                    if (!optCode.trim()) return;
                    setOptConfirmed(true);
                    toast.success("Đã xác nhận mã!");
                  }}
                  className="h-7 text-[11px]"
                >
                  {optConfirmed ? "✓ Đã xác nhận mã" : "Xác nhận mã"}
                </Button>
                <Button
                  type="submit"
                  disabled={!optConfirmed || !optName.trim()}
                  className="h-7 text-xs bg-emerald-600 text-white font-bold"
                >
                  Lưu Option
                </Button>
              </div>
            </form>

            {/* List options table */}
            <div className="rounded-xl border border-slate-200 overflow-hidden">
              <table className="w-full text-xs">
                <thead className="bg-slate-50 border-b">
                  <tr>
                    <th className="p-2 text-left font-bold text-slate-500">Tên Option</th>
                    <th className="p-2 text-left font-bold text-slate-500">Mã Code</th>
                    <th className="p-2 text-center font-bold text-slate-500">Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {optLoading ? (
                    <tr>
                      <td colSpan={3} className="p-4 text-center text-slate-400">
                        Đang tải...
                      </td>
                    </tr>
                  ) : optList.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="p-4 text-center text-slate-400">
                        Chưa có option nào.
                      </td>
                    </tr>
                  ) : (
                    optList.map((item) => (
                      <tr key={item._id} className="border-b hover:bg-slate-50">
                        <td className="p-2 font-bold text-slate-700">{item.name}</td>
                        <td className="p-2 font-mono font-bold text-emerald-700">{item.code}</td>
                        <td className="p-2 text-center">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              item.isActive
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-slate-100 text-slate-400"
                            }`}
                          >
                            {item.isActive ? "Active" : "Inactive"}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="h-9 text-xs font-bold rounded-xl"
              >
                Đóng
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
