import { z } from "zod";

export const checkoutSchema = z.object({
  customerName: z.string().min(2, "Nhập tên người nhận"),
  customerType: z.enum(["B2B", "B2C"]),
  phone: z.string().regex(/^(0|\+84)[0-9]{9,10}$/, "Số điện thoại chưa hợp lệ"),
  address: z.string().min(10, "Nhập địa chỉ giao hàng chi tiết"),
  paymentProvider: z.enum(["COD", "VNPAY", "MOMO", "ZALOPAY"]),
  note: z.string().max(300).optional(),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;
