import { describe, expect, it } from "vitest";

import {
  parsePromptToBananaLogoOptions,
  promptRequestsText,
} from "@/features/cup-designer/services/artwork-generator.service";

describe("artwork AI prompt options", () => {
  it("does not request text for normal logo/image prompts", () => {
    expect(promptRequestsText("tạo logo hình con rồng màu đỏ")).toBe(false);
    expect(parsePromptToBananaLogoOptions("tạo logo hình con rồng màu đỏ")).toMatchObject({
      brandName: "",
      includeText: false,
    });
  });

  it("requests text only when the prompt explicitly asks for text", () => {
    expect(promptRequestsText('tạo logo có chữ "Arknote"')).toBe(true);
    expect(parsePromptToBananaLogoOptions('tạo logo có chữ "Arknote"')).toMatchObject({
      brandName: "Arknote",
      includeText: true,
    });
  });
});
