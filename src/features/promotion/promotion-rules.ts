import { apiClient } from "@/lib/api-client";
import { type ApiEnvelope, unwrapApiData } from "@/lib/api-contract";

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

export async function validatePromotion(input: ValidatePromotionInput) {
  const response = await apiClient.post<
    ApiEnvelope<ValidatePromotionResult> | ValidatePromotionResult
  >("/promotions/validate", input);
  return unwrapApiData(response.data);
}
