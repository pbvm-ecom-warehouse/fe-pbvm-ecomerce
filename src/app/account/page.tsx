"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Camera, User, Lock, Eye, EyeOff, UserCog, LogOut, Check, MapPin, Trash2, Plus, Edit2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { logout, changePassword, updateProfile } from "@/features/auth/services/auth.service";
import { getAddresses, addAddress, deleteAddress, setDefaultAddress, updateAddress } from "@/features/checkout/services/checkout.service";

export default function AccountPage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Profile forms state
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [customerType, setCustomerType] = useState<"B2B" | "B2C">("B2B");
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Change password forms state
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);

  // Password visibility visibility state
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);

  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Address book state
  const [addresses, setAddresses] = useState<any[]>([]);
  const [loadingAddresses, setLoadingAddresses] = useState(false);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);

  const [addrLabel, setAddrLabel] = useState("");
  const [addrRecipient, setAddrRecipient] = useState("");
  const [addrPhone, setAddrPhone] = useState("");
  const [addrLine, setAddrLine] = useState("");
  const [addrWard, setAddrWard] = useState("");
  const [addrDistrict, setAddrDistrict] = useState("");
  const [addrProvince, setAddrProvince] = useState("");
  const [isSubmittingAddress, setIsSubmittingAddress] = useState(false);

  const fetchAddresses = async () => {
    if (!user || user.type === "admin") return;
    setLoadingAddresses(true);
    try {
      const data = await getAddresses();
      setAddresses(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingAddresses(false);
    }
  };

  useEffect(() => {
    fetchAddresses();
  }, [user]);


  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addrRecipient || !addrPhone || !addrLine) {
      toast.error("Vui lòng điền đầy đủ các thông tin bắt buộc.");
      return;
    }
    setIsSubmittingAddress(true);
    try {
      if (editingAddressId) {
        // Edit mode
        const updated = await updateAddress(editingAddressId, {
          label: addrLabel || "Địa chỉ khác",
          recipientName: addrRecipient,
          phone: addrPhone,
          line: addrLine,
          ward: addrWard || "N/A",
          district: addrDistrict || "N/A",
          province: addrProvince || "N/A",
        });
        setAddresses(updated || []);
        toast.success("Cập nhật địa chỉ thành công!");
      } else {
        // Create mode
        const updated = await addAddress({
          label: addrLabel || "Địa chỉ khác",
          recipientName: addrRecipient,
          phone: addrPhone,
          line: addrLine,
          ward: addrWard || "N/A",
          district: addrDistrict || "N/A",
          province: addrProvince || "N/A",
        });
        setAddresses(updated || []);
        toast.success("Thêm địa chỉ mới thành công!");
      }
      handleCancelAddressForm();
    } catch (err: any) {
      toast.error((editingAddressId ? "Cập nhật" : "Thêm") + " địa chỉ thất bại: " + (err.response?.data?.message || err.message));
    } finally {
      setIsSubmittingAddress(false);
    }
  };

  const handleTriggerEditAddress = (addr: any) => {
    setEditingAddressId(addr.id);
    setAddrLabel(addr.label || "");
    setAddrRecipient(addr.recipientName || "");
    setAddrPhone(addr.phone || "");
    setAddrLine(addr.line || "");
    setAddrWard(addr.ward === "N/A" ? "" : addr.ward);
    setAddrDistrict(addr.district === "N/A" ? "" : addr.district);
    setAddrProvince(addr.province === "N/A" ? "" : addr.province);
    setShowAddressForm(true);
  };

  const handleCancelAddressForm = () => {
    setAddrLabel("");
    setAddrRecipient("");
    setAddrPhone("");
    setAddrLine("");
    setAddrWard("");
    setAddrDistrict("");
    setAddrProvince("");
    setShowAddressForm(false);
    setEditingAddressId(null);
  };

  const handleDeleteAddress = async (id: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa địa chỉ này?")) return;
    try {
      const updated = await deleteAddress(id);
      setAddresses(updated || []);
      toast.success("Xóa địa chỉ thành công!");
    } catch (err: any) {
      toast.error("Xóa địa chỉ thất bại: " + (err.response?.data?.message || err.message));
    }
  };

  const handleSetDefaultAddress = async (id: string) => {
    try {
      const updated = await setDefaultAddress(id);
      setAddresses(updated || []);
      toast.success("Đặt địa chỉ mặc định thành công!");
    } catch (err: any) {
      toast.error("Đặt mặc định thất bại: " + (err.response?.data?.message || err.message));
    }
  };

  // Prepopulate profile settings form when user state is loaded
  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setPhone(user.phone || "");
      setCustomerType(user.customerType || "B2B");
    }
  }, [user]);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      toast.success("Đăng xuất thành công!");
      router.push("/login");
    } catch (error) {
      console.error(error);
      toast.error("Đã xảy ra lỗi khi đăng xuất.");
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Verify file size limit (2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Hình ảnh vượt quá giới hạn 2MB.");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = reader.result as string;
      setIsUploadingAvatar(true);
      try {
        const updated = await updateProfile({ avatar: base64String });
        setUser({
          ...user!,
          avatar: updated.avatar || base64String,
        });
        toast.success("Cập nhật ảnh đại diện thành công!");
      } catch (err: any) {
        console.error(err);
        const errMsg = err.response?.data?.message || "Lỗi khi cập nhật ảnh đại diện.";
        toast.error(errMsg);
      } finally {
        setIsUploadingAvatar(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Vui lòng nhập tên hiển thị.");
      return;
    }

    setIsSavingProfile(true);
    try {
      const updated = await updateProfile({
        name,
        phone,
        customerType,
      });
      setUser({
        ...user!,
        name: updated.name || name,
        phone: updated.phone || phone,
        customerType: (updated.customerType as "B2B" | "B2C") || customerType,
      });
      toast.success("Cập nhật thông tin cá nhân thành công!");
      setIsEditing(false);
    } catch (err: any) {
      console.error(err);
      const errMsg = err.response?.data?.message || "Cập nhật thất bại. Vui lòng kiểm tra lại.";
      toast.error(errMsg);
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!oldPassword) {
      toast.error("Vui lòng nhập mật khẩu hiện tại.");
      return;
    }
    if (newPassword.length < 8) {
      toast.error("Mật khẩu mới phải dài tối thiểu 8 ký tự.");
      return;
    }
    if (newPassword !== confirmNewPassword) {
      toast.error("Xác nhận mật khẩu mới không trùng khớp.");
      return;
    }

    setIsChangingPassword(true);
    try {
      await changePassword({
        oldPassword,
        newPassword,
      });
      toast.success("Đổi mật khẩu thành công!");
      setOldPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
      setShowPasswordForm(false);
    } catch (err: any) {
      console.error(err);
      const errMsg = err.response?.data?.message || "Đổi mật khẩu thất bại. Vui lòng kiểm tra mật khẩu cũ.";
      toast.error(errMsg);
    } finally {
      setIsChangingPassword(false);
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
            Vui lòng đăng nhập hoặc tạo tài khoản mới để truy cập và quản lý thông tin khách hàng sỉ B2B.
          </CardDescription>
          <div className="flex justify-center gap-3">
            <Button asChild className="bg-[#3BB77E] hover:bg-[#34a370] rounded-xl px-5 font-bold text-xs h-10 shadow-sm cursor-pointer">
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

  // Generate fallback avatar monogram (first letter)
  const monogram = (user.name || user.email || "?").charAt(0).toUpperCase();

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-10">
      <Card className="border border-slate-200 rounded-2xl shadow-sm bg-white overflow-hidden w-full">
        {/* Unified Card Header */}
        <CardHeader className="border-b border-slate-100 bg-slate-50/50 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 rounded-lg text-primary">
              <User size={20} />
            </div>
            <div>
              <CardTitle className="text-base font-bold text-[#253D4E] uppercase tracking-wider">
                Quản lý tài khoản sỉ B2B
              </CardTitle>
              <CardDescription className="text-xs font-semibold text-slate-500">
                Cập nhật ảnh đại diện, thông tin cá nhân, sổ địa chỉ nhận hàng và bảo mật tài khoản.
              </CardDescription>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              type="button"
              onClick={() => setShowPasswordForm(true)}
              className="bg-slate-800 hover:bg-slate-900 text-white rounded-xl px-4 font-bold text-xs h-9 cursor-pointer shadow-xs flex items-center gap-1.5 transition-all active:scale-98 select-none border-0"
            >
              <Lock size={12} />
              Đổi mật khẩu
            </Button>
            
            <Button
              onClick={handleLogout}
              disabled={isLoggingOut}
              variant="outline"
              className="text-rose-600 border-rose-100 hover:bg-rose-50 hover:border-rose-200 rounded-xl font-bold text-xs h-9 select-none cursor-pointer flex items-center justify-center gap-2 active:scale-98 transition-all px-4"
            >
              <LogOut size={13} />
              {isLoggingOut ? "Đang xử lý..." : "Đăng xuất"}
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-6 space-y-8 divide-y divide-slate-100">
          {/* SECTION 1: AVATAR & PERSONAL INFORMATION */}
          <div className="grid gap-6 md:grid-cols-[160px_1fr] items-start pb-6">
            {/* Interactive Avatar Upload Container */}
            <div className="flex flex-col items-center gap-2">
              <div
                onClick={handleAvatarClick}
                className="relative group size-32 rounded-full border-2 border-slate-100 bg-slate-50 flex items-center justify-center overflow-hidden cursor-pointer shadow-sm active:scale-95 transition-all duration-200"
              >
                {isUploadingAvatar ? (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-white text-[10px] font-bold">
                    Tải lên...
                  </div>
                ) : null}
                {user.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="size-full object-cover rounded-full"
                  />
                ) : (
                  <span className="text-4xl font-extrabold text-[#3BB77E] select-none">{monogram}</span>
                )}
                {/* Camera Hover Overlay */}
                <div className="absolute inset-0 bg-black/45 rounded-full flex flex-col items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <Camera size={18} />
                  <span className="text-[10px] font-black mt-1 uppercase tracking-wide">Thay ảnh</span>
                </div>
              </div>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleAvatarChange}
                className="hidden"
                accept="image/*"
              />
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Ảnh đại diện</span>
            </div>

            {/* Profile fields and metadata */}
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-[#253D4E]">Hồ sơ cá nhân</h3>
                  <p className="text-[11px] text-slate-400 font-medium">Chi tiết thông tin doanh nghiệp/tên tài khoản của bạn.</p>
                </div>
                {!isEditing && (
                  <Button
                    type="button"
                    onClick={() => setIsEditing(true)}
                    className="bg-[#3BB77E] hover:bg-[#34a370] text-white active:scale-[0.98] rounded-xl px-3 font-bold text-xs h-8 cursor-pointer shadow-xs flex items-center justify-center gap-1 transition-all select-none border-0"
                  >
                    <UserCog size={12} />
                    Sửa thông tin
                  </Button>
                )}
              </div>

              {!isEditing ? (
                <div className="grid gap-4 sm:grid-cols-2 text-xs">
                  <div className="space-y-1 sm:col-span-2">
                    <span className="text-[10px] font-bold text-[#78858F] uppercase tracking-wider block">
                      Tên cửa hàng / Doanh nghiệp
                    </span>
                    <span className="text-sm font-bold text-[#253D4E] block mt-0.5">{user.name}</span>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-[#78858F] uppercase tracking-wider block">
                      Địa chỉ Email
                    </span>
                    <span className="text-sm font-bold text-[#253D4E] block mt-0.5">{user.email}</span>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-[#78858F] uppercase tracking-wider block">
                      Số điện thoại
                    </span>
                    <span className="text-sm font-bold text-[#253D4E] block mt-0.5">
                      {user.phone || <span className="text-slate-300 italic font-semibold">Chưa cập nhật</span>}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-[#78858F] uppercase tracking-wider block">
                      Cơ chế giá áp dụng
                    </span>
                    <span className="font-extrabold text-[#3BB77E] bg-[#DEF9EC] px-2 py-0.5 rounded-full text-[10px] inline-block mt-0.5">
                      {user.customerType === "B2B" ? "Sỉ B2B" : "Lẻ B2C"}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-[#78858F] uppercase tracking-wider block">
                      Mã chi nhánh
                    </span>
                    <span className="text-sm font-bold text-[#253D4E] block mt-0.5">{user.tenantId}</span>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSaveProfile} className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5 sm:col-span-2">
                      <Label htmlFor="displayName" className="text-xs font-bold text-[#78858F] tracking-wide">
                        Tên cửa hàng / Doanh nghiệp
                      </Label>
                      <Input
                        id="displayName"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="PBVM Bakery"
                        className="h-10 w-full rounded-xl border border-slate-200 bg-white px-4 text-xs text-[#253D4E] focus:ring-4 focus:ring-emerald-500/10 focus:border-[#3BB77E] focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1.5 col-span-1">
                      <Label htmlFor="displayPhone" className="text-xs font-bold text-[#78858F] tracking-wide">
                        Số điện thoại
                      </Label>
                      <Input
                        id="displayPhone"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="0900000000"
                        className="h-10 w-full rounded-xl border border-slate-200 bg-white px-4 text-xs text-[#253D4E] focus:ring-4 focus:ring-emerald-500/10 focus:border-[#3BB77E] focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1.5 col-span-1">
                      <Label className="text-xs font-bold text-[#78858F] tracking-wide block mb-1">
                        Phân loại khách hàng
                      </Label>
                      <div className="grid grid-cols-2 gap-2 h-10 bg-slate-50 border border-slate-100 rounded-xl p-1">
                        <button
                          type="button"
                          onClick={() => setCustomerType("B2B")}
                          className={`text-xs font-bold rounded-lg flex items-center justify-center gap-1 transition-all cursor-pointer ${customerType === "B2B"
                            ? "bg-white text-primary shadow-xs"
                            : "text-slate-500 hover:text-slate-700"
                            }`}
                        >
                          {customerType === "B2B" && <Check size={12} />}
                          Mua sỉ (B2B)
                        </button>
                        <button
                          type="button"
                          onClick={() => setCustomerType("B2C")}
                          className={`text-xs font-bold rounded-lg flex items-center justify-center gap-1 transition-all cursor-pointer ${customerType === "B2C"
                            ? "bg-white text-primary shadow-xs"
                            : "text-slate-500 hover:text-slate-700"
                            }`}
                        >
                          {customerType === "B2C" && <Check size={12} />}
                          Mua lẻ (B2C)
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => {
                        setIsEditing(false);
                        setName(user.name || "");
                        setPhone(user.phone || "");
                        setCustomerType(user.customerType || "B2B");
                      }}
                      className="rounded-xl font-bold text-xs h-9 text-slate-500 hover:bg-slate-100 cursor-pointer animate-in fade-in"
                    >
                      Hủy bỏ
                    </Button>
                    <Button
                      type="submit"
                      disabled={isSavingProfile}
                      className="bg-[#3BB77E] hover:bg-[#34a370] text-white rounded-xl px-4 font-bold text-xs h-9 cursor-pointer shadow-md select-none flex items-center justify-center gap-1 transition-all disabled:opacity-50"
                    >
                      {isSavingProfile ? "Đang lưu..." : "Lưu thông tin"}
                    </Button>
                  </div>
                </form>
              )}
            </div>
          </div>

          {/* SECTION 2: ADDRESS BOOK */}
          {user && user.type !== "admin" && (
            <div className="py-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-emerald-100 rounded-lg text-[#3BB77E]">
                    <MapPin size={16} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[#253D4E]">Địa chỉ giao nhận</h3>
                    <p className="text-[11px] text-slate-400 font-medium">Quản lý các địa chỉ nhận hàng để thanh toán nhanh hơn.</p>
                  </div>
                </div>
                {!showAddressForm && (
                  <Button
                    type="button"
                    onClick={() => setShowAddressForm(true)}
                    className="bg-[#3BB77E] hover:bg-[#34a370] text-white rounded-xl px-3 font-bold text-xs h-8 cursor-pointer shadow-xs flex items-center gap-1 transition-all border-0"
                  >
                    <Plus size={12} />
                    Thêm địa chỉ mới
                  </Button>
                )}
              </div>

              {/* Add/Edit Address Form inside the Card */}
              {showAddressForm && (
                <form onSubmit={handleSaveAddress} className="space-y-4 border border-slate-100 p-4 rounded-xl bg-slate-50/50 mb-4 animate-in fade-in duration-200">
                  <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider">
                    {editingAddressId ? "Cập nhật địa chỉ" : "Tạo địa chỉ giao nhận mới"}
                  </h4>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="addrLabel" className="text-xs font-bold text-[#78858F] tracking-wide">Tên gợi nhớ (Ví dụ: Nhà riêng, Công ty)</Label>
                      <Input
                        id="addrLabel"
                        value={addrLabel}
                        onChange={(e) => setAddrLabel(e.target.value)}
                        placeholder="Nhà riêng"
                        className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs text-[#253D4E]"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="addrRecipient" className="text-xs font-bold text-[#78858F] tracking-wide">Họ tên người nhận *</Label>
                      <Input
                        id="addrRecipient"
                        value={addrRecipient}
                        onChange={(e) => setAddrRecipient(e.target.value)}
                        placeholder="Nguyễn Văn A"
                        className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs text-[#253D4E]"
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="addrPhone" className="text-xs font-bold text-[#78858F] tracking-wide">Số điện thoại nhận hàng *</Label>
                      <Input
                        id="addrPhone"
                        value={addrPhone}
                        onChange={(e) => setAddrPhone(e.target.value)}
                        placeholder="0901234567"
                        className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs text-[#253D4E]"
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="addrLine" className="text-xs font-bold text-[#78858F] tracking-wide">Địa chỉ chi tiết *</Label>
                      <Input
                        id="addrLine"
                        value={addrLine}
                        onChange={(e) => setAddrLine(e.target.value)}
                        placeholder="97 Đường số 7"
                        className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs text-[#253D4E]"
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="addrWard" className="text-xs font-bold text-[#78858F] tracking-wide">Phường / Xã</Label>
                      <Input
                        id="addrWard"
                        value={addrWard}
                        onChange={(e) => setAddrWard(e.target.value)}
                        placeholder="Bình Hưng"
                        className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs text-[#253D4E]"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="addrDistrict" className="text-xs font-bold text-[#78858F] tracking-wide">Quận / Huyện</Label>
                      <Input
                        id="addrDistrict"
                        value={addrDistrict}
                        onChange={(e) => setAddrDistrict(e.target.value)}
                        placeholder="Bình Chánh"
                        className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs text-[#253D4E]"
                      />
                    </div>
                    <div className="space-y-1.5 sm:col-span-2">
                      <Label htmlFor="addrProvince" className="text-xs font-bold text-[#78858F] tracking-wide">Tỉnh / Thành phố</Label>
                      <Input
                        id="addrProvince"
                        value={addrProvince}
                        onChange={(e) => setAddrProvince(e.target.value)}
                        placeholder="TP. Hồ Chí Minh"
                        className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs text-[#253D4E]"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={handleCancelAddressForm}
                      className="rounded-xl font-bold text-xs h-9 text-slate-500 hover:bg-slate-100 cursor-pointer"
                    >
                      Hủy bỏ
                    </Button>
                    <Button
                      type="submit"
                      disabled={isSubmittingAddress}
                      className="bg-[#3BB77E] hover:bg-[#34a370] text-white rounded-xl px-4 font-bold text-xs h-9 cursor-pointer shadow-md select-none border-0"
                    >
                      {isSubmittingAddress ? "Đang xử lý..." : editingAddressId ? "Cập nhật" : "Thêm mới"}
                    </Button>
                  </div>
                </form>
              )}

              {loadingAddresses ? (
                <div className="flex justify-center py-4">
                  <div className="size-6 rounded-full border-2 border-emerald-200 border-t-emerald-600 animate-spin" />
                </div>
              ) : addresses.length === 0 ? (
                <div className="text-center py-6 text-xs text-slate-400 font-medium italic">
                  Chưa có địa chỉ giao hàng nào được lưu.
                </div>
              ) : (
                <div className="space-y-3">
                  {addresses.map((addr) => (
                    <div
                      key={addr.id}
                      className={`relative rounded-xl border p-4 bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all ${addr.isDefault
                          ? "border-emerald-300 bg-emerald-50/10 shadow-xs"
                          : "border-slate-100 hover:border-slate-200"
                        }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-extrabold text-xs text-[#253D4E] uppercase tracking-wide">
                            {addr.label}
                          </span>
                          {addr.isDefault && (
                            <span className="bg-emerald-100 text-emerald-700 text-[9px] px-2 py-0.5 rounded-full font-black uppercase tracking-wider">
                              Mặc định
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] font-bold text-slate-700 mt-1">
                          {addr.recipientName} — {addr.phone}
                        </div>
                        <div className="text-[10px] text-slate-500 leading-relaxed font-medium">
                          {addr.line}, {addr.ward !== "N/A" ? `Phường ${addr.ward}, ` : ""}{addr.district !== "N/A" ? `${addr.district}, ` : ""}{addr.province !== "N/A" ? addr.province : ""}
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0 self-end md:self-auto border-t border-slate-100/60 pt-2.5 md:border-t-0 md:pt-0 mt-1 md:mt-0">
                        {!addr.isDefault && (
                          <button
                            onClick={() => handleSetDefaultAddress(addr.id)}
                            className="text-[10px] font-extrabold text-[#3BB77E] hover:text-[#34a370] cursor-pointer focus:outline-none bg-transparent border-0 p-0 flex items-center gap-1 select-none"
                          >
                            Đặt làm mặc định
                          </button>
                        )}
                        <button
                          onClick={() => handleTriggerEditAddress(addr)}
                          className="text-[10px] font-extrabold text-slate-500 hover:text-slate-600 cursor-pointer focus:outline-none bg-transparent border-0 p-0 flex items-center gap-1 select-none ml-2"
                        >
                          <Edit2 size={12} />
                          Sửa
                        </button>
                        <button
                          onClick={() => handleDeleteAddress(addr.id)}
                          className="text-[10px] font-extrabold text-rose-500 hover:text-rose-600 cursor-pointer focus:outline-none bg-transparent border-0 p-0 flex items-center gap-1 select-none ml-2"
                        >
                          <Trash2 size={12} />
                          Xóa
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </CardContent>
      </Card>

      {/* Change Password Dialog */}
      <Dialog open={showPasswordForm} onOpenChange={setShowPasswordForm}>
        <DialogContent className="max-w-md rounded-2xl p-6 bg-white border border-slate-200">
          <DialogHeader className="space-y-2">
            <DialogTitle className="text-sm font-black text-[#253D4E] uppercase tracking-wider flex items-center gap-2">
              <Lock className="size-4 text-slate-800" />
              Đổi mật khẩu tài khoản
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
              Vui lòng nhập mật khẩu hiện tại và mật khẩu mới để tiếp tục bảo mật tài khoản.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleChangePassword} className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label htmlFor="oldPasswordInput" className="text-xs font-bold text-[#78858F] tracking-wide">
                Mật khẩu hiện tại
              </Label>
              <div className="relative">
                <Input
                  id="oldPasswordInput"
                  type={showOldPassword ? "text" : "password"}
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  placeholder="••••••••"
                  className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-4 pr-10 text-xs text-[#253D4E] focus:ring-4 focus:ring-emerald-500/10 focus:border-[#3BB77E] focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowOldPassword(!showOldPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer flex items-center justify-center"
                >
                  {showOldPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="newPasswordInput" className="text-xs font-bold text-[#78858F] tracking-wide">
                  Mật khẩu mới
                </Label>
                <div className="relative">
                  <Input
                    id="newPasswordInput"
                    type={showNewPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-4 pr-10 text-xs text-[#253D4E] focus:ring-4 focus:ring-emerald-500/10 focus:border-[#3BB77E] focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer flex items-center justify-center"
                  >
                    {showNewPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="confirmNewPasswordInput" className="text-xs font-bold text-[#78858F] tracking-wide">
                  Xác nhận mật khẩu mới
                </Label>
                <div className="relative">
                  <Input
                    id="confirmNewPasswordInput"
                    type={showConfirmNewPassword ? "text" : "password"}
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-4 pr-10 text-xs text-[#253D4E] focus:ring-4 focus:ring-emerald-500/10 focus:border-[#3BB77E] focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmNewPassword(!showConfirmNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer flex items-center justify-center"
                  >
                    {showConfirmNewPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>
            </div>

            <DialogFooter className="flex gap-2 justify-end pt-4 border-t border-slate-100 mt-4">
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setShowPasswordForm(false);
                  setOldPassword("");
                  setNewPassword("");
                  setConfirmNewPassword("");
                }}
                className="rounded-xl font-bold text-xs h-10 text-slate-500 hover:bg-slate-100 cursor-pointer"
              >
                Hủy bỏ
              </Button>
              <Button
                type="submit"
                disabled={isChangingPassword}
                className="bg-slate-800 hover:bg-slate-900 text-white rounded-xl px-5 font-bold text-xs h-10 cursor-pointer shadow-md select-none border-0"
              >
                {isChangingPassword ? "Đang đổi..." : "Cập nhật mật khẩu"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </main>
  );
}
