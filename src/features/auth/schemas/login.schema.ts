import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Email chưa hợp lệ"),
  password: z.string().min(8, "Mật khẩu tối thiểu 8 ký tự"),
  tenantId: z.string().min(1, "Thiếu tenant"),
});

export const registerSchema = loginSchema.extend({
  name: z.string().min(2, "Nhập tên khách hàng"),
  phone: z.string().regex(/^(0|\+84)[0-9]{9,10}$/, "Số điện thoại chưa hợp lệ"),
  customerType: z.enum(["B2B", "B2C"]),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
