import { z } from "zod";

export const checkoutSchema = z.object({
  customerName: z.string().min(2, "Nhập tên người nhận"),
  customerType: z.enum(["B2B", "B2C"]),
  phone: z.string().regex(/^(0|\+84)[0-9]{9,10}$/, "Số điện thoại chưa hợp lệ"),
  address: z.string().min(10, "Nhập địa chỉ giao hàng chi tiết"),
  paymentProvider: z.enum(["COD", "PAYOS"]),
  note: z.string().max(300).optional(),
  shippingMethod: z.string().optional(),
  reqVAT: z.boolean().optional(),
  companyName: z.string().optional(),
  companyTaxId: z.string().optional(),
  companyAddress: z.string().optional(),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;
