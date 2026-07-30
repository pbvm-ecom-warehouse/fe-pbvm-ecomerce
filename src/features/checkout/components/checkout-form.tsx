"use client";

import Image from "next/image";
import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  CreditCard,
  Landmark,
  MapPin,
  Plus,
  ShoppingBag,
  Truck,
  Star,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import { useRouter } from "next/navigation";
import { toast } from "sonner";


import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCartStore } from "@/stores/cart-store";
import { CupConfigDetails } from "@/features/cart/components/cup-config-details";
import { useAuthStore } from "@/stores/auth-store";
import { calculateCartTotals, findPrintAndBlankSelectionConflict } from "@/features/cart/utils/cart";
import {
  cartRequiresOnlinePayment,
  getPaymentOptionsForCart,
  isPaymentAllowedForCart,
} from "@/features/payment/payment-options";
import { formatCurrency } from "@/utils/format-currency";
import { validatePromotion } from "@/features/promotion/promotion-rules";

import {
  checkoutSchema,
  type CheckoutInput,
} from "@/features/checkout/schemas/checkout.schema";
import {
  createOrder,
  getAddresses,
  addAddress,
  type AddressResponse,
} from "@/features/checkout/services/checkout.service";
import {
  getVietnamAdministrativeUnits,
  type VietnamDistrict,
  type VietnamProvince,
  type VietnamWard,
} from "@/features/checkout/services/vietnam-address.service";
import { cleanProductName } from "@/features/catalog/services/catalog.service";
import { getOrder, cancelOrder } from "@/features/order/services/order.service";
import { apiClient } from "@/lib/api-client";
import { unwrapApiData } from "@/lib/api-contract";
import type { CartItem } from "@/types/api";

const addressLabelOptions = ["Nhà riêng", "Văn phòng", "Cửa hàng", "Kho hàng", "Địa chỉ khác"];
const DIRECT_PRINT_CHECKOUT_KEY = "directPrintCheckoutItem";

export function CheckoutForm() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const rawItems = useCartStore((state) => state.items);
  const [directPrintItem, setDirectPrintItem] = useState<CartItem | null>(null);
  const items = directPrintItem ? [directPrintItem] : rawItems.filter((item) => item.selected !== false);
  const isDirectPrintCheckout = Boolean(directPrintItem);
  const clearSelectedItems = useCartStore((state) => state.clearSelectedItems);
  const user = useAuthStore((state) => state.user);
  const totals = calculateCartTotals(items);
  const availablePaymentOptions = getPaymentOptionsForCart(items);
  const requiresOnlinePayment = cartRequiresOnlinePayment(items);
  const hasCustomPrint = items.some((item) => item.fulfillmentType === "CUSTOM_PRINT");
  const printBlankConflictSku = findPrintAndBlankSelectionConflict(items);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = sessionStorage.getItem(DIRECT_PRINT_CHECKOUT_KEY);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw);
      if (parsed?.cartItemId && parsed?.productId && parsed?.quantity) {
        setDirectPrintItem(parsed);
      } else {
        sessionStorage.removeItem(DIRECT_PRINT_CHECKOUT_KEY);
      }
    } catch {
      sessionStorage.removeItem(DIRECT_PRINT_CHECKOUT_KEY);
    }
  }, []);

  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submittedOrder, setSubmittedOrder] = useState<{
    orderId: string;
    offline?: boolean;
    paymentProvider: string;
  } | null>(null);

  // Coupon state
  const [couponCode, setCouponCode] = useState("");
  const [discountAmount, setDiscountAmount] = useState(0);
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);

  // Address selection state
  const [savedAddresses, setSavedAddresses] = useState<AddressResponse[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | "new" | null>(null);
  const [isLoadingAddresses, setIsLoadingAddresses] = useState(true);
  const [isAddingAddress, setIsAddingAddress] = useState(false);
  const [isLoadingAdministrativeUnits, setIsLoadingAdministrativeUnits] = useState(false);
  const [administrativeUnitsError, setAdministrativeUnitsError] = useState("");
  const [provinces, setProvinces] = useState<VietnamProvince[]>([]);
  const [provinceSearch, setProvinceSearch] = useState("");
  const [districtSearch, setDistrictSearch] = useState("");
  const [wardSearch, setWardSearch] = useState("");
  const [newAddressForm, setNewAddressForm] = useState({
    label: "",
    recipientName: "",
    phone: "",
    line: "",
    ward: "",
    district: "",
    province: "",
  });

  const selectedProvince = provinces.find((province) => province.name === newAddressForm.province);
  const districts: VietnamDistrict[] = selectedProvince?.districts ?? [];
  const selectedDistrict = districts.find((district) => district.name === newAddressForm.district);
  const wards: VietnamWard[] = selectedDistrict?.wards ?? [];
  const filterAdministrativeUnits = <T extends { name: string }>(items: T[], keyword: string) => {
    const normalizedKeyword = keyword
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d")
      .replace(/Đ/g, "d")
      .toLowerCase()
      .trim();
    if (!normalizedKeyword) return items;
    return items.filter((item) =>
      item.name
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/đ/g, "d")
        .replace(/Đ/g, "d")
        .toLowerCase()
        .includes(normalizedKeyword),
    );
  };
  const filteredProvinces = filterAdministrativeUnits(provinces, provinceSearch);
  const filteredDistricts = filterAdministrativeUnits(districts, districtSearch);
  const filteredWards = filterAdministrativeUnits(wards, wardSearch);

  const syncCheckoutAddress = (next: Partial<typeof newAddressForm>) => {
    const merged = { ...newAddressForm, ...next };
    const full = [merged.line, merged.ward, merged.district, merged.province]
      .filter(Boolean)
      .join(", ");
    setValue("address", full);
  };

  // Pending order recovery states & actions
  const [pendingOrderId, setPendingOrderId] = useState<string | null>(null);
  const [pendingOrder, setPendingOrder] = useState<any | null>(null);
  const [isFetchingPendingOrder, setIsFetchingPendingOrder] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const restoreItems = useCartStore((state) => state.restoreItems);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedId = sessionStorage.getItem("lastCreatedOrderId");
      if (savedId) {
        if (/^[0-9a-fA-F]{24}$/.test(savedId)) {
          setPendingOrderId(savedId);
        } else {
          sessionStorage.removeItem("lastCreatedOrderId");
        }
      }
    }
  }, []);

  useEffect(() => {
    let active = true;
    setIsLoadingAdministrativeUnits(true);
    setAdministrativeUnitsError("");
    getVietnamAdministrativeUnits()
      .then((data) => {
        if (active) setProvinces(data);
      })
      .catch(() => {
        if (active) setAdministrativeUnitsError("Không tải được danh sách tỉnh/thành từ API.");
      })
      .finally(() => {
        if (active) setIsLoadingAdministrativeUnits(false);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (pendingOrderId) {
      const fetchPendingOrder = async () => {
        try {
          setIsFetchingPendingOrder(true);
          const order = (await getOrder(pendingOrderId)) as any;
          if (
            order &&
            order.paymentStatus === "UNPAID" &&
            order.paymentMethod === "ONLINE" &&
            order.orderStatus === "PLACED"
          ) {
            setPendingOrder(order);
          } else {
            sessionStorage.removeItem("lastCreatedOrderId");
            setPendingOrderId(null);
          }
        } catch (err) {
          console.error("Failed to fetch pending order:", err);
          sessionStorage.removeItem("lastCreatedOrderId");
          setPendingOrderId(null);
        } finally {
          setIsFetchingPendingOrder(false);
        }
      };
      fetchPendingOrder();
    }
  }, [pendingOrderId]);

  const handleRepay = async () => {
    if (!pendingOrderId) return;
    try {
      toast.success("Đang tạo link thanh toán mới...");
      const payUrlRes = await apiClient.get<any>(
        `/payment/payos/create-url/${pendingOrderId}`,
      );
      const payUrlData = unwrapApiData(payUrlRes.data);
      if (payUrlData.payUrl) {
        window.location.href = payUrlData.payUrl;
      } else {
        toast.error("Không tìm thấy link thanh toán");
      }
    } catch (err) {
      toast.error("Có lỗi xảy ra khi tạo link thanh toán");
    }
  };

  const router = useRouter();

  const handleRestoreCart = async () => {
    if (!pendingOrderId || !pendingOrder) return;
    try {
      setIsRestoring(true);
      toast.loading("Đang khôi phục giỏ hàng...");

      // Hủy đơn hàng cũ trên hệ thống
      await cancelOrder(pendingOrderId, "Khách hàng hủy thanh toán và quay lại chỉnh sửa giỏ hàng");

      if (pendingOrder.hasPrintItems || pendingOrder.items?.some((item: any) => item.isPrintItem || item.designId || item.designFile)) {
        sessionStorage.removeItem("lastCreatedOrderId");
        sessionStorage.removeItem("pendingDirectPrintCheckout");
        sessionStorage.removeItem("directPrintCheckoutItem");
        setPendingOrderId(null);
        setPendingOrder(null);
        toast.dismiss();
        toast.success("Đã hủy đơn ly in. Vui lòng vào thiết kế để chọn lại mẫu khi muốn đặt lại.");
        router.push("/design-cup");
        return;
      }

      // Khôi phục các item vào store giỏ hàng
      const cartItems = pendingOrder.items.filter((item: any) => !item.isPrintItem && !item.designId && !item.designFile).map((item: any) => {
        const isCustom = item.isPrintItem;
        let designFileSnapshot: any = undefined;
        if (item.designFile) {
          try {
            designFileSnapshot = typeof item.designFile === 'string'
              ? JSON.parse(item.designFile)
              : item.designFile;
          } catch {
            // ignore
          }
        }
        return {
          cartItemId: isCustom
            ? `custom:${item.sku}:${item.designId || ""}:${Date.now()}`
            : `standard:${item.sku}`,
          productId: item.sku,
          productRefId: item.sku,
          name: item.name || item.sku,
          slug: item.sku,
          price: item.unitPrice,
          quantity: item.quantity,
          unit: "cái",
          imageUrl: designFileSnapshot?.previewDataUrl || "/images/product-placeholder.svg",
          fulfillmentType: isCustom ? "CUSTOM_PRINT" : "STANDARD",
          designId: item.designId ?? undefined,
          designFile: designFileSnapshot,
          selectedSize: designFileSnapshot?.artwork?.cup?.size,
          selectedMaterial: designFileSnapshot?.artwork?.cup?.materialType,
          selectedStyle: designFileSnapshot?.artwork?.cup?.style,
        };
      });

      await restoreItems(cartItems);
      sessionStorage.removeItem("lastCreatedOrderId");
      setPendingOrderId(null);
      setPendingOrder(null);
      toast.dismiss();
      toast.success("Đã khôi phục giỏ hàng thành công!");
      router.push("/cart");
    } catch (err) {
      toast.dismiss();
      toast.error("Không thể khôi phục giỏ hàng");
    } finally {
      setIsRestoring(false);
    }
  };

  const handleSkipPending = () => {
    sessionStorage.removeItem("lastCreatedOrderId");
    setPendingOrderId(null);
    setPendingOrder(null);
  };

  useEffect(() => {
    if (mounted && !user) {
      toast.error("Vui lòng đăng nhập để thực hiện thanh toán!");
      router.push("/login?redirect=/checkout");
    }
  }, [mounted, user, router]);



  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CheckoutInput>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      customerName: user?.name,
      phone: user?.phone,
      customerType: user?.customerType,
      paymentProvider: "PAYOS",
      shippingMethod: "TRUCK",
    },
  });

  // Fetch saved addresses on mount
  useEffect(() => {
    if (!user) return;
    const loadAddresses = async () => {
      try {
        setIsLoadingAddresses(true);
        const addresses = await getAddresses();
        setSavedAddresses(addresses);
        // Auto-select default address
        const defaultAddr = addresses.find((a) => a.isDefault) || addresses[0];
        if (defaultAddr) {
          setSelectedAddressId(defaultAddr.id);
          applyAddress(defaultAddr);
        } else {
          setSelectedAddressId("new");
        }
      } catch {
        setSelectedAddressId("new");
      } finally {
        setIsLoadingAddresses(false);
      }
    };
    loadAddresses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const applyAddress = (addr: AddressResponse) => {
    setValue("customerName", addr.recipientName);
    setValue("phone", addr.phone);
    const fullAddress = [addr.line, addr.ward, addr.district, addr.province]
      .filter((s) => s && s !== "N/A")
      .join(", ");
    setValue("address", fullAddress);
    setNewAddressForm({
      label: addr.label,
      recipientName: addr.recipientName,
      phone: addr.phone,
      line: addr.line,
      ward: addr.ward !== "N/A" ? addr.ward : "",
      district: addr.district !== "N/A" ? addr.district : "",
      province: addr.province !== "N/A" ? addr.province : "",
    });
  };

  const handleSelectAddress = (id: string | "new") => {
    setSelectedAddressId(id);
    if (id === "new") {
      setValue("customerName", user?.name || "");
      setValue("phone", user?.phone || "");
      setValue("address", "");
      setNewAddressForm({
        label: "",
        recipientName: user?.name || "",
        phone: user?.phone || "",
        line: "",
        ward: "",
        district: "",
        province: "",
      });
    } else {
      const addr = savedAddresses.find((a) => a.id === id);
      if (addr) applyAddress(addr);
    }
  };

  const handleSaveNewAddress = async () => {
    if (
      !newAddressForm.label ||
      !newAddressForm.line ||
      !newAddressForm.recipientName ||
      !newAddressForm.phone ||
      !newAddressForm.province ||
      !newAddressForm.district ||
      !newAddressForm.ward
    ) {
      toast.error("Vui lòng điền đầy đủ thông tin địa chỉ");
      return;
    }
    try {
      setIsAddingAddress(true);
      const updated = await addAddress({
        label: newAddressForm.label,
        recipientName: newAddressForm.recipientName,
        phone: newAddressForm.phone,
        line: newAddressForm.line,
        ward: newAddressForm.ward || "N/A",
        district: newAddressForm.district || "N/A",
        province: newAddressForm.province || "N/A",
        isDefault: savedAddresses.length === 0,
      });
      setSavedAddresses(updated);
      const created = updated.find(
        (a) => a.line === newAddressForm.line && a.recipientName === newAddressForm.recipientName,
      );
      if (created) {
        setSelectedAddressId(created.id);
        applyAddress(created);
        toast.success("Đã lưu địa chỉ mới");
      }
    } catch {
      toast.error("Không thể lưu địa chỉ mới");
    } finally {
      setIsAddingAddress(false);
    }
  };

  const handleApplyCoupon = async () => {
    const code = couponCode.trim();
    if (!code) {
      toast.error("Vui lòng nhập mã giảm giá.");
      return;
    }

    setIsApplyingCoupon(true);
    try {
      const result = await validatePromotion({
        code,
        orderValue: totals.subtotal,
      });

      if (result.valid && result.discountAmount > 0) {
        setDiscountAmount(result.discountAmount);
        setAppliedCoupon(result.code || code);
        toast.success(
          `Áp dụng mã ${result.code || code} thành công! Giảm ${formatCurrency(result.discountAmount)}.`,
        );
        return;
      }

      toast.error(result.message || "Mã giảm giá không hợp lệ hoặc đã hết hạn.");
    } catch (err: any) {
      if (err?.response?.status === 404) {
        toast.error("");
      } else {
        toast.error(err?.message || err?.response?.data?.message || "Không thể kiểm tra mã giảm giá.");
      }
    } finally {
      setIsApplyingCoupon(false);
    }
  };

  useEffect(() => {
    if (user) {
      setValue("customerType", user.customerType || "B2B");
    }
  }, [user, setValue]);
  const selectedPayment = useWatch({ control, name: "paymentProvider" });

  if (!mounted) {
    return (
      <div className="flex min-h-[300px] flex-col items-center justify-center text-center space-y-3">
        <div className="size-8 rounded-full border-2 border-emerald-200 border-t-emerald-600 animate-spin" />
        <div className="text-sm font-medium text-muted-foreground">
          Đang kiểm tra thông tin thanh toán...
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-[300px] flex-col items-center justify-center text-center space-y-4">
        <div className="text-sm font-semibold text-slate-400 animate-pulse">
          Đang chuyển hướng sang trang đăng nhập...
        </div>
      </div>
    );
  }

  const handleOrderFinish = () => {
    if (isDirectPrintCheckout) {
      sessionStorage.removeItem(DIRECT_PRINT_CHECKOUT_KEY);
    } else {
      clearSelectedItems();
    }
    window.location.href = "/";
  };

  if (isSubmitted && submittedOrder) {
    return (
      <Card className="mx-auto max-w-xl rounded-2xl border-border bg-white p-0 text-center shadow-sm">
        <CardContent className="flex flex-col items-center gap-5 p-8">
          <div className="flex size-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
            <CheckCircle2 className="size-9" />
          </div>
          <div>
            <h2 className="text-2xl font-black tracking-normal text-foreground">
              Đặt Hàng Thành Công!
            </h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Cảm ơn bạn đã lựa chọn PBVM. Mã đơn hàng của bạn là{" "}
              <span className="font-black text-primary">
                #{submittedOrder.orderId}
              </span>
              .{" "}
              {submittedOrder.offline
                ? "Đơn đã được lưu tạm để xử lý lại."
                : "Đơn đã được hệ thống tiếp nhận."}
            </p>
          </div>

          {submittedOrder.paymentProvider === "COD" ? (
            <div className="w-full rounded-2xl bg-muted/40 p-4 text-left border border-border text-xs space-y-1.5">
              <div className="font-bold text-[#253D4E] uppercase tracking-wider text-[10px] mb-1">
                Phương thức thanh toán: COD
              </div>
              <p className="text-muted-foreground leading-relaxed">
                Bạn sẽ thanh toán số tiền tổng cộng bằng tiền mặt cho nhân viên giao hàng chành xe hoặc bưu tá khi nhận sản phẩm.
              </p>
            </div>
          ) : (
            <div className="w-full rounded-2xl bg-muted/40 p-5 text-left border border-border text-xs space-y-3">
              <div className="font-bold text-[#253D4E] uppercase tracking-wider text-[10px] flex items-center gap-1.5 border-b border-border pb-2">
                <Landmark className="size-4 text-primary" /> Hướng dẫn chuyển khoản ngân hàng
              </div>
              <div className="grid grid-cols-3 gap-2">
                <span className="text-muted-foreground">Ngân hàng:</span>
                <span className="col-span-2 font-bold text-foreground">Techcombank (TCB)</span>

                <span className="text-muted-foreground">Số tài khoản:</span>
                <span className="col-span-2 font-bold text-primary text-sm">19035678901234</span>

                <span className="text-muted-foreground">Chủ tài khoản:</span>
                <span className="col-span-2 font-bold text-foreground">CONG TY CP IN AN BAO BI PBVM</span>

                <span className="text-muted-foreground">Số tiền:</span>
                <span className="col-span-2 font-black text-[#253D4E] text-sm">{formatCurrency(totals.grandTotal)}</span>

                <span className="text-muted-foreground">Nội dung CK:</span>
                <span className="col-span-2 font-mono font-bold bg-primary/10 text-primary px-2 py-0.5 rounded text-[10px] w-fit">
                  {submittedOrder.orderId}
                </span>
              </div>
              <p className="text-[10px] text-muted-foreground leading-relaxed italic border-t border-border pt-2">
                * Vui lòng chuyển đúng số tiền và nội dung chuyển khoản để hệ thống tự động xác nhận đơn hàng trong 1-3 phút.
              </p>
            </div>
          )}

          <Button
            onClick={handleOrderFinish}
            className="w-full bg-primary hover:bg-[#2F9A68] text-white py-6 rounded-xl font-bold flex items-center justify-center gap-1.5 shadow-md"
          >
            Quay lại Trang chủ
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (items.length === 0) {
    if (isFetchingPendingOrder) {
      return (
        <Card className="mx-auto max-w-xl rounded-2xl border-border bg-white p-0 text-center shadow-sm">
          <CardContent className="flex flex-col items-center gap-5 p-8">
            <div className="size-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            <p className="text-sm text-muted-foreground">Đang tải thông tin đơn hàng chưa thanh toán...</p>
          </CardContent>
        </Card>
      );
    }

    if (pendingOrder) {
      return (
        <Card className="mx-auto max-w-xl rounded-2xl border-border bg-white p-0 shadow-sm overflow-hidden">
          <CardHeader className="border-b border-border/70 bg-muted/40 px-6 py-4">
            <CardTitle className="text-sm font-black uppercase tracking-[0.14em] text-primary flex items-center gap-2">
              <ShoppingBag className="size-4" />
              Đơn hàng chưa thanh toán
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-5">
            <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4 text-xs space-y-2 text-[#253D4E]">
              <p className="font-bold flex items-center gap-1.5 text-amber-800">
                Nhận diện đơn hàng chưa hoàn tất thanh toán
              </p>
              <p className="leading-relaxed">
                Bạn vừa bấm đặt hàng nhưng chưa hoàn thành bước thanh toán trực tuyến của đơn hàng <strong className="text-primary">#{pendingOrder.code}</strong>.
              </p>
              <p className="leading-relaxed text-[11px] text-muted-foreground">
                Sản phẩm của bạn đã được tạm giữ trong đơn hàng này để tránh bị hết hàng. Vui lòng chọn một trong các thao tác bên dưới để tiếp tục.
              </p>
            </div>

            {/* Chi tiết đơn hàng */}
            <div className="border border-border rounded-xl p-4 bg-muted/20 space-y-3">
              <div className="flex justify-between items-center text-xs pb-2 border-b border-border">
                <span className="font-bold text-foreground">Đơn hàng #{pendingOrder.code}</span>
                <span className="rounded-full bg-amber-100 text-amber-800 px-2 py-0.5 font-bold text-[10px]">
                  Chờ thanh toán
                </span>
              </div>
              <div className="divide-y divide-border/60 max-h-[160px] overflow-y-auto pr-1">
                {pendingOrder.items.map((item: any, idx: number) => (
                  <div key={idx} className="flex justify-between items-center py-2 text-xs">
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-foreground truncate">{cleanProductName(item.name, item.sku)}</p>
                      <p className="text-[10px] text-muted-foreground">Số lượng: {item.quantity}</p>
                    </div>
                    <span className="font-semibold text-foreground shrink-0 pl-2">
                      {formatCurrency(item.unitPrice * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>
              <div className="flex justify-between items-center text-sm pt-2 border-t border-border font-black text-[#253D4E]">
                <span>Tổng tiền đơn hàng:</span>
                <span>{formatCurrency(pendingOrder.total)}</span>
              </div>
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <Button
                onClick={handleRepay}
                className="w-full bg-primary hover:bg-[#2F9A68] text-white py-5 rounded-xl font-bold flex items-center justify-center gap-1.5 shadow-md text-xs"
              >
                Tiếp tục thanh toán Online
                <ArrowRight className="size-4" />
              </Button>

              <div className="grid grid-cols-2 gap-2">
                <Button
                  onClick={handleRestoreCart}
                  disabled={isRestoring}
                  variant="outline"
                  className="h-10 rounded-xl border-amber-600 text-amber-700 hover:bg-amber-50 font-bold text-xs flex items-center justify-center gap-1.5"
                >
                  <ArrowLeft className="size-3.5" />
                  {isRestoring ? "Đang quay lại..." : "Quay lại sửa giỏ"}
                </Button>
                <Button
                  onClick={handleSkipPending}
                  variant="ghost"
                  className="h-10 rounded-xl font-bold text-xs text-muted-foreground hover:bg-muted"
                >
                  Bỏ qua, tạo đơn mới
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      );
    }

    return (
      <Card className="mx-auto max-w-md rounded-2xl border-border bg-white p-0 text-center shadow-sm">
        <CardContent className="flex flex-col items-center gap-5 p-8">
          <div className="flex size-16 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <ShoppingBag className="size-8" />
          </div>
          <div>
            <h2 className="text-lg font-black text-foreground">Giỏ hàng đang trống</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Chọn sản phẩm trước khi tạo đơn checkout.
            </p>
          </div>
          <Button
            asChild
            className="h-11 w-full rounded-xl bg-primary font-bold text-white hover:bg-[#2FA36E]"
          >
            <Link href="/products">Khám phá catalog</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <form
      className="w-full"
      onSubmit={handleSubmit(async (values) => {
        if (!isPaymentAllowedForCart(values.paymentProvider, items)) {
          toast.error("Đơn ly in cần thanh toán online trước khi sản xuất.");
          return;
        }
        if (printBlankConflictSku) {
          toast.error(
            `Không thể thanh toán nhiều dòng cùng mã phôi ${printBlankConflictSku} cùng lúc. Vui lòng chỉ chọn một dòng trước.`,
          );
          return;
        }

        try {
          if (!selectedAddressId || selectedAddressId === "new") {
            toast.error("Vui lòng chọn hoặc lưu địa chỉ giao hàng trước khi đặt hàng.");
            return;
          }

          const order = await createOrder({
            ...values,
            addressId: selectedAddressId,
            customerType: values.customerType as "B2B" | "B2C",
            items: isDirectPrintCheckout ? [] : items.map((item) => ({
              productId: item.productId,
              productRefId: item.productRefId,
              quantity: item.quantity,
              fulfillmentType: item.fulfillmentType,
              designId: item.designId,
              designFile: item.designFile,
            })),
            directItem: isDirectPrintCheckout && directPrintItem
              ? {
                  sku: directPrintItem.productRefId || directPrintItem.productId,
                  quantity: directPrintItem.quantity,
                  designId: directPrintItem.designId,
                  designFile: directPrintItem.designFile,
                }
              : undefined,
          } as any);
          if (order.paymentUrl) {
            toast.success("Đang chuyển hướng sang cổng thanh toán...");
            if (typeof window !== "undefined") {
              sessionStorage.setItem("lastCreatedOrderId", order.id || order.orderId);
              const createdOrderCode = order.code || order.orderId;
              if (createdOrderCode) {
                sessionStorage.setItem("lastCreatedOrderCode", createdOrderCode);
              }
              sessionStorage.setItem("lastPaymentStartedStatus", "UNPAID");
              if (isDirectPrintCheckout) {
                sessionStorage.setItem("pendingDirectPrintCheckout", JSON.stringify(directPrintItem));
                sessionStorage.removeItem("pendingCheckoutSkus");
              } else {
                sessionStorage.setItem("pendingCartBackup", JSON.stringify(items));
                sessionStorage.setItem(
                  "pendingCheckoutSkus",
                  JSON.stringify(
                    items
                      .map((item) => item.productRefId || item.productId)
                      .filter(Boolean),
                  ),
                );
              }
            }
            window.location.href = order.paymentUrl;
            return;
          }
          setSubmittedOrder({
            orderId: order.orderId,
            offline: order.offline,
            paymentProvider: values.paymentProvider,
          });
          setIsSubmitted(true);
          if (isDirectPrintCheckout) {
            sessionStorage.removeItem(DIRECT_PRINT_CHECKOUT_KEY);
          } else {
            await clearSelectedItems();
          }
          toast.success(
            order.offline
              ? "Đã lưu đơn tạm trong chế độ fallback"
              : "Đã tạo đơn hàng",
          );
        } catch (error: any) {
          const apiMsg = error.response?.data?.message || error.message;
          const detail = Array.isArray(apiMsg) ? apiMsg.join(", ") : apiMsg;
          toast.error(`Có lỗi xảy ra khi tạo đơn hàng: ${detail}`);
        }
      })}
    >
      <Card className="overflow-hidden rounded-2xl border-border bg-white p-0 shadow-sm">
        <CardHeader className="border-b border-border/70 bg-muted/40 px-6 py-4 flex flex-row items-center justify-between gap-4 flex-wrap">
          <CardTitle className="flex items-center gap-2 text-sm font-black uppercase tracking-[0.14em] text-primary">
            <ShoppingBag className="size-4" />
            Thông Tin Đặt Hàng &amp; Thanh Toán
          </CardTitle>
          <Link
            href="/cart"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-primary transition-colors bg-white px-3.5 py-1.5 rounded-lg border border-slate-200 shadow-2xs"
          >
            <ArrowLeft className="size-3.5 text-slate-500" />
            <span>Quay lại Giỏ hàng</span>
          </Link>
        </CardHeader>
        <CardContent className="grid gap-6 p-6">
          {hasCustomPrint ? (
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 text-sm leading-6 text-muted-foreground">
              Ly đã thiết kế chỉ thanh toán online theo từng đợt. Hàng không thiết kế có thể chọn COD 50% online, 50% khi nhận hàng hoặc online 100%.
            </div>
          ) : null}



          {/* Address picker */}
          <div className="grid gap-2">
            <Label className="text-xs font-black text-primary flex items-center gap-1.5">
              <MapPin className="size-3.5" />
              Địa chỉ giao hàng
            </Label>

            {isLoadingAddresses ? (
              <div className="flex items-center gap-2 rounded-xl border border-border bg-muted/30 px-4 py-3 text-xs text-muted-foreground">
                <div className="size-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                Đang tải danh sách địa chỉ...
              </div>
            ) : (
              <div className="space-y-2">
                {/* Saved address cards */}
                {savedAddresses.map((addr) => {
                  const isSelected = selectedAddressId === addr.id;
                  const fullAddress = [addr.line, addr.ward, addr.district, addr.province]
                    .filter((s) => s && s !== "N/A")
                    .join(", ");
                  return (
                    <button
                      key={addr.id}
                      type="button"
                      onClick={() => handleSelectAddress(addr.id)}
                      className={`w-full flex items-start gap-3 rounded-xl border-2 p-3.5 text-left transition-all ${isSelected
                          ? "border-primary bg-primary/5"
                          : "border-border bg-white hover:border-primary/40"
                        }`}
                    >
                      {/* Radio indicator */}
                      <div className={`mt-0.5 size-4 shrink-0 rounded-full border-2 flex items-center justify-center transition-all ${isSelected ? "border-primary" : "border-muted-foreground/40"
                        }`}>
                        {isSelected && (
                          <div className="size-2 rounded-full bg-primary" />
                        )}
                      </div>
                      {/* Address info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs font-bold text-foreground">{addr.label}</span>
                          {addr.isDefault && (
                            <span className="flex items-center gap-0.5 rounded-full bg-amber-50 px-1.5 py-0.5 text-[9px] font-bold text-amber-600">
                              <Star className="size-2.5" />
                              Mặc định
                            </span>
                          )}
                        </div>
                        <p className="mt-0.5 text-[11px] font-semibold text-foreground">{addr.recipientName} · {addr.phone}</p>
                        <p className="mt-0.5 text-[11px] text-muted-foreground leading-snug truncate">{fullAddress}</p>
                      </div>
                    </button>
                  );
                })}

                {/* Add new address button */}
                <button
                  type="button"
                  onClick={() => handleSelectAddress("new")}
                  className={`w-full flex items-center gap-3 rounded-xl border-2 p-3.5 text-left transition-all ${selectedAddressId === "new"
                      ? "border-primary bg-primary/5"
                      : "border-dashed border-border bg-white hover:border-primary/40"
                    }`}
                >
                  <div className={`mt-0.5 size-4 shrink-0 rounded-full border-2 flex items-center justify-center transition-all ${selectedAddressId === "new" ? "border-primary" : "border-muted-foreground/40"
                    }`}>
                    {selectedAddressId === "new" && (
                      <div className="size-2 rounded-full bg-primary" />
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-primary">
                    <Plus className="size-3.5" />
                    Thêm địa chỉ mới
                  </div>
                </button>

                {/* New address form */}
                {selectedAddressId === "new" && (
                  <div className="rounded-2xl border border-primary/20 bg-muted/30 p-5">
                    <div className="grid grid-cols-1 gap-x-3 gap-y-4 md:grid-cols-2 xl:grid-cols-3">
                    <div className="grid gap-1.5">
                      <Label className="text-[11px] font-bold text-muted-foreground">Tên địa chỉ (nhãn)</Label>
                      <Select
                        value={newAddressForm.label}
                        onValueChange={(value) => setNewAddressForm((p) => ({ ...p, label: value }))}
                      >
                        <SelectTrigger className="h-10 min-h-10 w-full rounded-xl border-border bg-white px-3 py-0 text-sm leading-none shadow-xs transition-colors hover:border-primary/40 focus-visible:border-primary focus-visible:ring-primary/15">
                          <SelectValue placeholder="Chọn tên địa chỉ" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl shadow-slate-900/10">
                          {addressLabelOptions.map((label) => (
                            <SelectItem
                              key={label}
                              value={label}
                              className="h-9 rounded-lg px-3 pr-8 text-sm font-medium text-slate-700 focus:bg-emerald-50 focus:text-[#253D4E] data-[state=checked]:bg-emerald-50 data-[state=checked]:font-bold data-[state=checked]:text-[#253D4E]"
                            >
                              {label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                      <div className="grid gap-1.5">
                        <Label className="text-[11px] font-bold text-muted-foreground">Người nhận *</Label>
                        <Input
                          placeholder="Nguyễn Văn A"
                          className="h-10 rounded-xl border-border bg-white px-3 text-sm"
                          value={newAddressForm.recipientName}
                          onChange={(e) => {
                            setNewAddressForm((p) => ({ ...p, recipientName: e.target.value }));
                            setValue("customerName", e.target.value);
                          }}
                        />
                      </div>
                      <div className="grid gap-1.5">
                        <Label className="text-[11px] font-bold text-muted-foreground">Số điện thoại *</Label>
                        <Input
                          placeholder="0900000000"
                          className="h-10 rounded-xl border-border bg-white px-3 text-sm"
                          value={newAddressForm.phone}
                          onChange={(e) => {
                            setNewAddressForm((p) => ({ ...p, phone: e.target.value }));
                            setValue("phone", e.target.value);
                          }}
                        />
                      </div>
                    <div className="grid gap-1.5">
                      <Label className="text-[11px] font-bold text-muted-foreground">Số nhà, tên đường *</Label>
                      <Input
                        placeholder="VD: 123 Nguyễn Huệ"
                        className="h-10 rounded-xl border-border bg-white px-3 text-sm"
                        value={newAddressForm.line}
                        onChange={(e) => {
                          const newLine = e.target.value;
                          setNewAddressForm((p) => ({ ...p, line: newLine }));
                          syncCheckoutAddress({ line: newLine });
                        }}
                      />
                    </div>
                      <div className="grid gap-1.5">
                        <Label className="text-[11px] font-bold text-muted-foreground">Tỉnh/Thành phố</Label>
                        <Select
                          value={newAddressForm.province}
                          disabled={isLoadingAdministrativeUnits || provinces.length === 0}
                          onValueChange={(value) => {
                            setNewAddressForm((p) => ({ ...p, province: value, district: "", ward: "" }));
                            syncCheckoutAddress({ province: value, district: "", ward: "" });
                            setProvinceSearch("");
                            setDistrictSearch("");
                            setWardSearch("");
                          }}
                        >
                          <SelectTrigger className="h-10 min-h-10 w-full rounded-xl border-border bg-white px-3 py-0 text-sm leading-none shadow-xs transition-colors hover:border-primary/40 focus-visible:border-primary focus-visible:ring-primary/15">
                            <SelectValue placeholder={isLoadingAdministrativeUnits ? "Đang tải..." : "Chọn tỉnh/thành"} />
                          </SelectTrigger>
                          <SelectContent
                            position="popper"
                            align="start"
                            sideOffset={6}
                            className="max-h-72 w-[var(--radix-select-trigger-width)] rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl shadow-slate-900/10"
                          >
                            <div className="sticky top-0 z-10 bg-white pb-1">
                              <Input
                                value={provinceSearch}
                                onChange={(e) => setProvinceSearch(e.target.value)}
                                onPointerDown={(e) => e.stopPropagation()}
                                onKeyDown={(e) => e.stopPropagation()}
                                placeholder="Tìm tỉnh/thành..."
                                className="h-9 rounded-lg border-slate-200 bg-slate-50 px-3 text-sm"
                              />
                            </div>
                            {filteredProvinces.length === 0 ? (
                              <div className="px-3 py-2 text-xs font-medium text-muted-foreground">Không tìm thấy</div>
                            ) : null}
                            {filteredProvinces.map((province) => (
                              <SelectItem
                                key={province.code}
                                value={province.name}
                                className="h-9 rounded-lg px-3 pr-8 text-sm font-medium text-slate-700 focus:bg-emerald-50 focus:text-[#253D4E] data-[state=checked]:bg-emerald-50 data-[state=checked]:font-bold data-[state=checked]:text-[#253D4E]"
                              >
                                {province.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid gap-1.5">
                        <Label className="text-[11px] font-bold text-muted-foreground">Quận/Huyện</Label>
                        <Select
                          value={newAddressForm.district}
                          disabled={!selectedProvince}
                          onValueChange={(value) => {
                            setNewAddressForm((p) => ({ ...p, district: value, ward: "" }));
                            syncCheckoutAddress({ district: value, ward: "" });
                            setDistrictSearch("");
                            setWardSearch("");
                          }}
                        >
                          <SelectTrigger className="h-10 min-h-10 w-full rounded-xl border-border bg-white px-3 py-0 text-sm leading-none shadow-xs transition-colors hover:border-primary/40 focus-visible:border-primary focus-visible:ring-primary/15">
                            <SelectValue placeholder="Chọn quận/huyện" />
                          </SelectTrigger>
                          <SelectContent
                            position="popper"
                            align="start"
                            sideOffset={6}
                            className="max-h-72 w-[var(--radix-select-trigger-width)] rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl shadow-slate-900/10"
                          >
                            <div className="sticky top-0 z-10 bg-white pb-1">
                              <Input
                                value={districtSearch}
                                onChange={(e) => setDistrictSearch(e.target.value)}
                                onPointerDown={(e) => e.stopPropagation()}
                                onKeyDown={(e) => e.stopPropagation()}
                                placeholder="Tìm quận/huyện..."
                                className="h-9 rounded-lg border-slate-200 bg-slate-50 px-3 text-sm"
                              />
                            </div>
                            {filteredDistricts.length === 0 ? (
                              <div className="px-3 py-2 text-xs font-medium text-muted-foreground">Không tìm thấy</div>
                            ) : null}
                            {filteredDistricts.map((district) => (
                              <SelectItem
                                key={district.code}
                                value={district.name}
                                className="h-9 rounded-lg px-3 pr-8 text-sm font-medium text-slate-700 focus:bg-emerald-50 focus:text-[#253D4E] data-[state=checked]:bg-emerald-50 data-[state=checked]:font-bold data-[state=checked]:text-[#253D4E]"
                              >
                                {district.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid gap-1.5">
                        <Label className="text-[11px] font-bold text-muted-foreground">Phường/Xã</Label>
                        <Select
                          value={newAddressForm.ward}
                          disabled={!selectedDistrict}
                          onValueChange={(value) => {
                            setNewAddressForm((p) => ({ ...p, ward: value }));
                            syncCheckoutAddress({ ward: value });
                            setWardSearch("");
                          }}
                        >
                          <SelectTrigger className="h-10 min-h-10 w-full rounded-xl border-border bg-white px-3 py-0 text-sm leading-none shadow-xs transition-colors hover:border-primary/40 focus-visible:border-primary focus-visible:ring-primary/15">
                            <SelectValue placeholder="Chọn phường/xã" />
                          </SelectTrigger>
                          <SelectContent
                            position="popper"
                            align="start"
                            sideOffset={6}
                            className="max-h-72 w-[var(--radix-select-trigger-width)] rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl shadow-slate-900/10"
                          >
                            <div className="sticky top-0 z-10 bg-white pb-1">
                              <Input
                                value={wardSearch}
                                onChange={(e) => setWardSearch(e.target.value)}
                                onPointerDown={(e) => e.stopPropagation()}
                                onKeyDown={(e) => e.stopPropagation()}
                                placeholder="Tìm phường/xã..."
                                className="h-9 rounded-lg border-slate-200 bg-slate-50 px-3 text-sm"
                              />
                            </div>
                            {filteredWards.length === 0 ? (
                              <div className="px-3 py-2 text-xs font-medium text-muted-foreground">Không tìm thấy</div>
                            ) : null}
                            {filteredWards.map((ward) => (
                              <SelectItem
                                key={ward.code}
                                value={ward.name}
                                className="h-9 rounded-lg px-3 pr-8 text-sm font-medium text-slate-700 focus:bg-emerald-50 focus:text-[#253D4E] data-[state=checked]:bg-emerald-50 data-[state=checked]:font-bold data-[state=checked]:text-[#253D4E]"
                              >
                                {ward.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    {administrativeUnitsError && (
                      <p className="mt-3 text-xs font-bold text-destructive">
                        {administrativeUnitsError}
                      </p>
                    )}
                    {errors.address && (
                      <p className="text-xs font-bold text-destructive">{errors.address.message}</p>
                    )}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={isAddingAddress}
                      onClick={handleSaveNewAddress}
                      className="ml-auto mt-4 flex h-10 rounded-xl border-primary px-4 text-xs font-bold text-primary hover:bg-primary hover:text-white"
                    >
                      {isAddingAddress ? "Đang lưu..." : "Lưu địa chỉ này"}
                    </Button>
                  </div>
                )}

                {/* Hidden inputs for form validation when existing address selected */}
                {selectedAddressId && selectedAddressId !== "new" && (
                  <>
                    <input type="hidden" {...register("customerName")} />
                    <input type="hidden" {...register("phone")} />
                    <input type="hidden" {...register("address")} />
                  </>
                )}
              </div>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="note" className="text-xs font-black text-primary">
              Ghi chú
            </Label>
            <Textarea
              id="note"
              placeholder="Giao giờ hành chính, gọi trước khi giao..."
              className="min-h-24 rounded-xl border-border bg-white text-sm"
              {...register("note")}
            />
          </div>

          {/* Phần thanh toán */}
          <div className="border-t border-border/70 pt-6 space-y-4">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.14em] text-primary">
              <CreditCard className="size-4" />
              Phương thức thanh toán
            </div>

            {requiresOnlinePayment && (
              <div className="rounded-xl border border-primary/20 bg-muted/40 p-3 text-[11px] font-semibold text-[#253D4E]">
                Giỏ có sản phẩm cần in, hệ thống sẽ yêu cầu cọc online trước khi xưởng mở lệnh in.
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {availablePaymentOptions.map((option) => {
                const isCod = option.value === "COD";
                const selected = selectedPayment === option.value;

                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      setValue("paymentProvider", option.value);
                    }}
                    className={`flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-all ${selected
                      ? "border-primary bg-muted/40 text-primary"
                      : "border-border bg-white text-muted-foreground hover:border-primary"
                      }`}
                  >
                    <div className={`size-9 rounded-lg flex items-center justify-center shrink-0 ${isCod ? "bg-amber-50" : "bg-sky-50"}`}>
                      {isCod ? (
                        <Truck className="size-5 text-amber-600" />
                      ) : (
                        <CreditCard className="size-5 text-sky-600" />
                      )}
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-xs font-bold text-foreground">
                        {option.label}
                      </span>
                      <span className="text-[9px] text-muted-foreground">
                        {isCod
                          ? "Thanh toán 50% online, 50% khi nhận hàng"
                          : hasCustomPrint
                            ? "Quét mã QR theo từng đợt bằng cùng đơn hàng"
                            : "Thanh toán online 100% qua PayOS"}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Phần đơn hàng */}
          <div className="border-t border-border/70 pt-6 space-y-4">
            <div className="flex items-center justify-between gap-4 text-xs font-black uppercase tracking-[0.14em] text-primary">
              <span className="flex items-center gap-2">
                <ShoppingBag className="size-4" />
                Đơn hàng ({items.length})
              </span>
              <Link
                href={isDirectPrintCheckout ? "/design-cup" : "/cart"}
                className="normal-case tracking-normal hover:underline"
              >
                {isDirectPrintCheckout ? "Sửa thiết kế" : "Sửa giỏ hàng"}
              </Link>
            </div>

            {/* List of items */}
            <div className="divide-y divide-border max-h-[300px] overflow-y-auto pr-1">
              {items.map((item) => (
                <div key={item.cartItemId} className="flex gap-3 py-3 items-start first:pt-0 last:pb-0">
                  {/* Thumbnail */}
                  <div className="relative size-12 rounded-lg border border-border bg-muted/40 shrink-0 overflow-hidden flex items-center justify-center">
                    {item.imageUrl && item.imageUrl.startsWith("data:") ? (
                      <img src={item.imageUrl} alt={item.name} className="size-10 object-contain p-1" />
                    ) : item.imageUrl ? (
                      <Image src={item.imageUrl} alt={item.name} fill className="object-cover" />
                    ) : (
                      <span className="text-[8px] text-muted-foreground">No img</span>
                    )}
                  </div>
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-bold text-foreground truncate leading-tight">{cleanProductName(item.name, item.productRefId || item.productId)}</h4>
                    <CupConfigDetails item={item} />
                    <div className="flex items-center justify-between mt-1 text-[11px] text-muted-foreground font-medium">
                      <span>{formatCurrency(item.price)} x {item.quantity}</span>
                      <span className="font-bold text-foreground">{formatCurrency(item.price * item.quantity)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Voucher/Promotion Code Input */}
            <div className="border-t border-border pt-4 mt-2">
              <Label className="text-[11px] font-black text-[#253D4E] uppercase tracking-wider mb-1.5 block">Mã giảm giá</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Nhập mã voucher (ví dụ B2BSTART)..."
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  className="h-9 text-xs rounded-xl border-border bg-white"
                  disabled={!!appliedCoupon || isApplyingCoupon}
                />
                {appliedCoupon ? (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setAppliedCoupon(null);
                      setDiscountAmount(0);
                      setCouponCode("");
                    }}
                    className="h-9 px-3 text-xs font-bold text-rose-600 border-rose-200 hover:bg-rose-50 rounded-xl shrink-0"
                  >
                    Hủy
                  </Button>
                ) : (
                  <Button
                    type="button"
                    onClick={handleApplyCoupon}
                    disabled={isApplyingCoupon}
                    className="h-9 px-4 text-xs font-bold text-white bg-slate-800 hover:bg-slate-900 rounded-xl shrink-0 border-0"
                  >
                    {isApplyingCoupon ? "Đang kiểm tra..." : "Áp dụng"}
                  </Button>
                )}
              </div>
            </div>

            <div className="space-y-2.5 border-t border-border pt-4 text-sm">
              <div className="flex justify-between gap-4 text-muted-foreground">
                <span>Tạm tính</span>
                <span className="font-bold text-foreground">
                  {formatCurrency(totals.subtotal)}
                </span>
              </div>
              <div className="flex justify-between gap-4 text-muted-foreground">
                <span>Giao hàng</span>
                <span className="font-bold text-foreground">
                  {totals.shippingFee === 0
                    ? "Miễn phí"
                    : formatCurrency(totals.shippingFee)}
                </span>
              </div>
              {totals.bulkBoxDiscount > 0 && (
                <div className="flex justify-between gap-4 text-emerald-600 font-semibold">
                  <span>Giảm theo thùng</span>
                  <span>-{formatCurrency(totals.bulkBoxDiscount)}</span>
                </div>
              )}
              {discountAmount > 0 && (
                <div className="flex justify-between gap-4 text-emerald-600 font-semibold">
                  <span>Giảm giá ({appliedCoupon})</span>
                  <span>-{formatCurrency(discountAmount)}</span>
                </div>
              )}
              <div className="flex items-baseline justify-between gap-4 border-t border-border pt-4">
                <span className="font-black text-[#253D4E]">Tổng thanh toán</span>
                <span className="text-xl font-black text-[#253D4E]">
                  {formatCurrency(Math.max(0, totals.grandTotal - discountAmount))}
                </span>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="h-12 w-full rounded-xl bg-primary font-bold text-white hover:bg-[#2F9A68] cursor-pointer shadow-xs"
              >
                {isSubmitting ? "Đang tạo đơn..." : "Xác nhận đặt hàng"}
                <ArrowRight className="size-4 ml-1" />
              </Button>

              <Button
                asChild
                variant="outline"
                className="h-10 w-full rounded-xl border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600 font-bold text-xs cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Link href="/cart">
                  <ArrowLeft className="size-3.5" />
                  <span>Quay lại Giỏ hàng</span>
                </Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
