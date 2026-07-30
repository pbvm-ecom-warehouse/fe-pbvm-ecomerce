import { beforeEach, describe, expect, it, vi } from "vitest";

const artworkGeneratorMock = vi.hoisted(() => ({
  parsePromptToBananaLogoOptions: vi.fn((prompt: string) => ({
    brandName: prompt,
    transparentBg: true,
  })),
  promptRequestsText: vi.fn((promptText: string) => /chu|text|ten|slogan/i.test(promptText)),
  generateBananaLogoArtworkAsync: vi.fn(),
}));

const uploadMock = vi.hoisted(() => ({
  uploadImageToCloudinary: vi.fn(),
}));

vi.mock("@/features/cup-designer/services/artwork-generator.service", () => artworkGeneratorMock);
vi.mock("@/features/cup-designer/services/cloudinary-upload.service", () => uploadMock);

import { sendChatMessageToAi } from "@/features/cup-designer/services/ai-chat.service";

describe("AI chat logo editing", () => {
  beforeEach(() => {
    artworkGeneratorMock.parsePromptToBananaLogoOptions.mockClear();
    artworkGeneratorMock.generateBananaLogoArtworkAsync.mockReset();
    uploadMock.uploadImageToCloudinary.mockReset();
    artworkGeneratorMock.generateBananaLogoArtworkAsync.mockResolvedValue("data:image/png;base64,logo");
    uploadMock.uploadImageToCloudinary.mockResolvedValue("https://cdn.example/logo.png");
  });

  it("recognizes natural Vietnamese logo edit prompts and preserves current logo context", async () => {
    await sendChatMessageToAi("sửa logo đổi màu đỏ, giữ nguyên chữ Bông Búp Tea", [], {
      materialType: "clear",
      style: "straight",
      size: "500ml",
      layersCount: 2,
      currentLayers: [
        {
          type: "image",
          prompt: "green tea leaf logo with round badge",
          src: "https://cdn.example/old-green-tea-logo.png",
        },
        { type: "text", text: "Bông Búp Tea" },
      ],
    });

    expect(artworkGeneratorMock.generateBananaLogoArtworkAsync).toHaveBeenCalledTimes(1);
    const [, structuredPrompt] = artworkGeneratorMock.generateBananaLogoArtworkAsync.mock.calls[0];
    expect(structuredPrompt).toContain("sửa logo đổi màu đỏ");
    expect(structuredPrompt).toContain("green tea leaf logo with round badge");
    expect(structuredPrompt).toContain("https://cdn.example/old-green-tea-logo.png");
    expect(structuredPrompt).toContain("Bông Búp Tea");
    expect(structuredPrompt.toLowerCase()).toContain("preserv");
  });
});
