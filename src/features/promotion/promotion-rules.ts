export type ValidatePromotionInput = {
  code: string;
  orderValue: number;
};

export type ValidatePromotionResult = {
  valid: boolean;
  code: string;
  discountAmount: number;
  message?: string;
};

export async function validatePromotion(
  input: ValidatePromotionInput,
): Promise<ValidatePromotionResult> {
  void input;
  throw new Error("BE chưa có API /promotions/validate để kiểm tra mã giảm giá.");
}
