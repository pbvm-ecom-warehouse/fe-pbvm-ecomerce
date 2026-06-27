"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Camera, User, Lock, Eye, EyeOff, UserCog, LogOut, Check } from "lucide-react";

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
import { useAuthStore } from "@/stores/auth-store";
import { logout, changePassword, updateProfile } from "@/features/auth/services/auth.service";

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

  // Prepopulate profile settings form when user state is loaded
  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setPhone(user.phone || "");
      setCustomerType(user.type || "B2B");
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
        type: (updated.customerType as "B2B" | "B2C") || customerType,
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
    <main className="mx-auto w-full max-w-5xl px-4 py-10">
      <div className="grid gap-8 md:grid-cols-3">
        {/* Left Column - Avatar & Core Info Card */}
        <div className="md:col-span-1">
          <Card className="h-full border border-slate-200 rounded-2xl shadow-sm bg-white overflow-hidden p-6 flex flex-col justify-between items-center">
            <div className="w-full flex flex-col items-center">
              {/* Interactive Avatar Upload Container */}
              <div
                onClick={handleAvatarClick}
                className="relative group size-32 rounded-full border-2 border-slate-100 bg-slate-50 flex items-center justify-center overflow-hidden cursor-pointer shadow-sm active:scale-95 transition-all duration-200"
              >
                {isUploadingAvatar ? (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-white text-xs font-bold">
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

              <h2 className="font-black text-[#253D4E] text-base mt-4 text-center truncate max-w-full">
                {user.name}
              </h2>
              <p className="text-[11px] font-bold text-slate-400 mt-0.5 truncate max-w-full text-center">
                {user.email}
              </p>

              <div className="w-full border-t border-slate-100 my-5" />

              <div className="w-full space-y-3.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-400">ID tài khoản</span>
                  <span className="font-mono text-slate-600 truncate max-w-[120px]">{user.id}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-400">Cơ chế giá</span>
                  <span className="font-black text-[#3BB77E] bg-[#DEF9EC] px-2 py-0.5 rounded-full text-[10px]">
                    {user.type === "B2B" ? "Sỉ B2B" : "Lẻ B2C"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-400">Chi nhánh</span>
                  <span className="font-extrabold text-slate-600">{user.tenantId}</span>
                </div>
              </div>

            </div>

            <div className="w-full mt-6">
              <Button
                onClick={handleLogout}
                disabled={isLoggingOut}
                variant="outline"
                className="w-full text-rose-600 border-rose-100 hover:bg-rose-50 hover:border-rose-200 rounded-xl font-bold text-xs h-10 select-none cursor-pointer flex items-center justify-center gap-2 active:scale-98 transition-all"
              >
                <LogOut size={14} />
                {isLoggingOut ? "Đang xử lý..." : "Đăng xuất tài khoản"}
              </Button>
            </div>
          </Card>
        </div>

        {/* Right Column - Forms Card */}
        <div className="md:col-span-2 flex flex-col justify-between gap-6">
          {/* Card 1: Account Settings Form */}
          <Card className="border border-slate-200 rounded-2xl shadow-sm bg-white overflow-hidden">
            <CardHeader className="border-b border-slate-100 bg-slate-50/50 p-5 flex flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-100 rounded-lg text-primary">
                  <UserCog size={18} />
                </div>
                <div>
                  <CardTitle className="text-base font-bold text-[#253D4E]">Thông tin cá nhân</CardTitle>
                  <CardDescription className="text-[11px] font-medium text-[#78858F]">
                    Cập nhật tên cửa hàng, số điện thoại liên hệ và loại cơ chế giá.
                  </CardDescription>
                </div>
              </div>
              {!isEditing && (
                <Button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="bg-[#3BB77E] hover:bg-[#34a370] active:scale-[0.98] rounded-xl px-4 font-bold text-xs h-9 cursor-pointer shadow-sm flex items-center justify-center gap-1.5 transition-all shrink-0 select-none"
                >
                  <UserCog size={12} />
                  Chỉnh sửa
                </Button>
              )}
            </CardHeader>
            <CardContent className="p-6">
              {!isEditing ? (
                <div className="space-y-6">
                  <div className="grid gap-6 sm:grid-cols-2">
                    <div className="space-y-1 sm:col-span-2">
                      <span className="text-[11px] font-black text-[#78858F] uppercase tracking-wider block">
                        Tên cửa hàng / Doanh nghiệp
                      </span>
                      <span className="text-sm font-bold text-[#253D4E] block mt-1">{user.name}</span>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[11px] font-black text-[#78858F] uppercase tracking-wider block">
                        Số điện thoại
                      </span>
                      <span className="text-sm font-bold text-[#253D4E] block mt-1">
                        {user.phone || <span className="text-slate-300 italic font-semibold">Chưa cập nhật</span>}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[11px] font-black text-[#78858F] uppercase tracking-wider block">
                        Phân loại khách hàng
                      </span>
                      <span className="text-sm font-bold text-[#253D4E] block mt-1">
                        {user.type === "B2B" ? "Mua sỉ (B2B)" : "Mua lẻ (B2C)"}
                      </span>
                    </div>
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
                        className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-[#253D4E] transition-all placeholder:text-slate-300 focus:border-[#3BB77E] focus:outline-none focus:ring-4 focus:ring-emerald-500/10 shadow-sm"
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
                        className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-[#253D4E] transition-all placeholder:text-slate-300 focus:border-[#3BB77E] focus:outline-none focus:ring-4 focus:ring-emerald-500/10 shadow-sm"
                      />
                    </div>

                    <div className="space-y-1.5 col-span-1">
                      <Label className="text-xs font-bold text-[#78858F] tracking-wide block mb-1">
                        Phân loại khách hàng
                      </Label>
                      <div className="grid grid-cols-2 gap-2 h-11 bg-slate-50 border border-slate-100 rounded-xl p-1">
                        <button
                          type="button"
                          onClick={() => setCustomerType("B2B")}
                          className={`text-xs font-bold rounded-lg flex items-center justify-center gap-1 transition-all cursor-pointer ${customerType === "B2B"
                              ? "bg-white text-primary shadow-sm"
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
                              ? "bg-white text-primary shadow-sm"
                              : "text-slate-500 hover:text-slate-700"
                            }`}
                        >
                          {customerType === "B2C" && <Check size={12} />}
                          Mua lẻ (B2C)
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 mt-4">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => {
                        setIsEditing(false);
                        setName(user.name || "");
                        setPhone(user.phone || "");
                        setCustomerType(user.type || "B2B");
                      }}
                      className="rounded-xl font-bold text-xs h-10 text-slate-500 hover:bg-slate-100 cursor-pointer animate-in fade-in"
                    >
                      Hủy bỏ
                    </Button>
                    <Button
                      type="submit"
                      disabled={isSavingProfile}
                      className="bg-[#3BB77E] hover:bg-[#34a370] active:scale-[0.98] rounded-xl px-5 font-bold text-xs h-10 cursor-pointer shadow-md select-none flex items-center justify-center gap-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSavingProfile ? "Đang lưu..." : "Lưu thông tin"}
                    </Button>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>

          {/* Card 2: Change Password Form */}
          <Card className="border border-slate-200 rounded-2xl shadow-sm bg-white overflow-hidden">
            <CardHeader className="border-b border-slate-100 bg-slate-50/50 p-5 flex flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-100 rounded-lg text-slate-700">
                  <Lock size={18} />
                </div>
                <div>
                  <CardTitle className="text-base font-bold text-[#253D4E]">Bảo mật & Mật khẩu</CardTitle>
                  <CardDescription className="text-[11px] font-medium text-[#78858F]">
                    Thay đổi mật khẩu đăng nhập để bảo vệ thông tin tài khoản của bạn.
                  </CardDescription>
                </div>
              </div>
              {!showPasswordForm && (
                <Button
                  type="button"
                  onClick={() => setShowPasswordForm(true)}
                  className="bg-slate-800 hover:bg-slate-900 text-white rounded-xl px-4 font-bold text-xs h-9 cursor-pointer shadow-sm flex items-center gap-1.5 transition-all active:scale-98 shrink-0 select-none"
                >
                  <Lock size={12} />
                  Đổi mật khẩu
                </Button>
              )}
            </CardHeader>
            {showPasswordForm && (
              <CardContent className="p-6">
                <form onSubmit={handleChangePassword} className="space-y-4">
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
                        className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-4 pr-10 text-sm text-[#253D4E] transition-all placeholder:text-slate-300 focus:border-[#3BB77E] focus:outline-none focus:ring-4 focus:ring-emerald-500/10 shadow-sm"
                      />
                      <button
                        type="button"
                        onClick={() => setShowOldPassword(!showOldPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer flex items-center justify-center"
                      >
                        {showOldPassword ? <EyeOff size={16} /> : <Eye size={16} />}
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
                          className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-4 pr-10 text-sm text-[#253D4E] transition-all placeholder:text-slate-300 focus:border-[#3BB77E] focus:outline-none focus:ring-4 focus:ring-emerald-500/10 shadow-sm"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer flex items-center justify-center"
                        >
                          {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
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
                          className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-4 pr-10 text-sm text-[#253D4E] transition-all placeholder:text-slate-300 focus:border-[#3BB77E] focus:outline-none focus:ring-4 focus:ring-emerald-500/10 shadow-sm"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmNewPassword(!showConfirmNewPassword)}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer flex items-center justify-center"
                        >
                          {showConfirmNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => {
                        setShowPasswordForm(false);
                        setOldPassword("");
                        setNewPassword("");
                        setConfirmNewPassword("");
                      }}
                      className="rounded-xl font-bold text-xs h-10 text-slate-500 hover:bg-slate-100 cursor-pointer animate-in fade-in"
                    >
                      Hủy bỏ
                    </Button>
                    <Button
                      type="submit"
                      disabled={isChangingPassword}
                      className="bg-slate-800 hover:bg-slate-900 text-white active:scale-[0.98] rounded-xl px-5 font-bold text-xs h-10 cursor-pointer shadow-md select-none flex items-center justify-center gap-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isChangingPassword ? "Đang đổi..." : "Cập nhật mật khẩu"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            )}
          </Card>
        </div>
      </div>
    </main>
  );
}
