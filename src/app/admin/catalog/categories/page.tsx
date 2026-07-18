"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Plus, RefreshCw, Folder } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  adminListCategories,
  adminCreateCategory,
} from "@/features/catalog/services/admin-catalog.service";

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Form state
  const [catName, setCatName] = useState("");
  const [catSlug, setCatSlug] = useState("");
  const [catPosition, setCatPosition] = useState(1);
  const [showAddForm, setShowAddForm] = useState(false);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const data = await adminListCategories();
      setCategories(data || []);
    } catch (error) {
      console.error(error);
      toast.error("Lấy danh sách danh mục thất bại.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName || !catSlug) {
      toast.error("Vui lòng nhập tên và slug cho danh mục.");
      return;
    }

    try {
      const payload = {
        name: catName.trim(),
        slug: catSlug.trim().toLowerCase().replace(/\s+/g, "-"),
        parentId: null, // Flat hierarchy for simplicity
        position: Number(catPosition),
      };

      await adminCreateCategory(payload);
      toast.success("Tạo danh mục mới thành công!");
      
      // Reset form
      setCatName("");
      setCatSlug("");
      setCatPosition(1);
      setShowAddForm(false);
      
      fetchCategories();
    } catch (error: any) {
      console.error(error);
      toast.error(error.response?.data?.message || "Tạo danh mục thất bại.");
    }
  };

  return (
    <div className="space-y-6">
      <div className={showAddForm || categories.length === 0 ? "grid gap-6 md:grid-cols-[1.5fr_1fr]" : "w-full"}>
        {/* Categories Card */}
        <Card className="rounded-2xl border-[#E9E3DD] shadow-sm bg-white overflow-hidden h-fit">
          <CardHeader className="border-b border-[#E9E3DD] py-4 bg-slate-50/50 flex flex-row items-center justify-between gap-4">
            <CardTitle className="text-sm font-black text-slate-700 uppercase tracking-wider">
              Danh sách danh mục
            </CardTitle>
            <div className="flex gap-2 shrink-0">
              <Button
                onClick={fetchCategories}
                variant="outline"
                className="h-8 rounded-lg border border-[#E9E3DD] bg-white text-slate-600 hover:bg-slate-50 flex items-center gap-1.5 cursor-pointer text-[10px] font-bold"
              >
                <RefreshCw className="size-3" />
                Làm mới
              </Button>
              <Button
                onClick={() => setShowAddForm(!showAddForm)}
                className="h-8 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center gap-1.5 cursor-pointer border-0 text-[10px] shadow-sm"
              >
                <Plus className="size-3" />
                {showAddForm ? "Ẩn Form" : "Thêm danh mục"}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex h-64 items-center justify-center bg-white">
                <div className="flex flex-col items-center gap-2">
                  <div className="size-8 rounded-full border-4 border-emerald-200 border-t-emerald-600 animate-spin" />
                  <div className="text-xs text-slate-400 font-medium">Đang tải danh mục...</div>
                </div>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-[#E9E3DD] hover:bg-transparent">
                    <TableHead className="w-[50px] font-bold text-slate-500 text-xs pl-6">Icon</TableHead>
                    <TableHead className="font-bold text-slate-500 text-xs">Tên danh mục</TableHead>
                    <TableHead className="font-bold text-slate-500 text-xs">Slug</TableHead>
                    <TableHead className="font-bold text-slate-500 text-xs pr-6 text-right">Vị trí (Thứ tự)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categories.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="h-40 text-center text-xs text-slate-400 font-medium">
                        Chưa có danh mục nào.
                      </TableCell>
                    </TableRow>
                  ) : (
                    categories.map((c) => {
                      const id = c.id || c._id;
                      return (
                        <TableRow key={id} className="border-b border-[#E9E3DD]/60 hover:bg-slate-50/30">
                          <TableCell className="pl-6 py-4">
                            <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                              <Folder className="size-4" />
                            </div>
                          </TableCell>
                          <TableCell className="align-middle font-bold text-slate-800 text-xs">
                            {c.name}
                          </TableCell>
                          <TableCell className="align-middle text-xs font-mono text-slate-500">
                            {c.slug}
                          </TableCell>
                          <TableCell className="align-middle text-right pr-6 text-xs text-slate-500 font-bold">
                            {c.position || 1}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Add Form (rendered conditionally or as sidebar card) */}
        {(showAddForm || categories.length === 0) && (
          <Card className="rounded-2xl border-[#E9E3DD] shadow-sm bg-white h-fit">
            <CardHeader className="border-b border-[#E9E3DD] py-4">
              <CardTitle className="text-sm font-black text-slate-700 uppercase tracking-wider">
                Thêm danh mục mới
              </CardTitle>
              <CardDescription className="text-xs">
                Nhập thông tin để thiết lập danh mục mới
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="cName" className="text-xs font-bold text-slate-500">Tên danh mục *</Label>
                  <Input
                    id="cName"
                    value={catName}
                    onChange={(e) => {
                      setCatName(e.target.value);
                      // Auto slug
                      setCatSlug(
                        e.target.value
                          .toLowerCase()
                          .normalize("NFD")
                          .replace(/[\u0300-\u036f]/g, "")
                          .replace(/đ/g, "d")
                          .replace(/[^a-z0-9\s-]/g, "")
                          .trim()
                          .replace(/\s+/g, "-"),
                      );
                    }}
                    placeholder="VD: Ly in theo yêu cầu"
                    className="h-10 text-xs rounded-xl"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="cSlug" className="text-xs font-bold text-slate-500">Slug *</Label>
                  <Input
                    id="cSlug"
                    value={catSlug}
                    onChange={(e) => setCatSlug(e.target.value)}
                    placeholder="ly-in-theo-yeu-cau"
                    className="h-10 text-xs rounded-xl"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="cPosition" className="text-xs font-bold text-slate-500">Thứ tự hiển thị (Số)</Label>
                  <Input
                    id="cPosition"
                    type="number"
                    value={catPosition}
                    onChange={(e) => setCatPosition(Number(e.target.value))}
                    placeholder="1"
                    className="h-10 text-xs rounded-xl"
                  />
                </div>

                <Button
                  type="submit"
                  className="h-10 w-full rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold cursor-pointer border-0 text-xs mt-2"
                >
                  Tạo danh mục
                </Button>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
