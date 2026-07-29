import { afterEach, describe, expect, it, vi } from "vitest";

import { POST } from "@/app/api/ai/generate-logo/route";

describe("AI generate logo route", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns an error instead of sample SVG fallback when AI providers fail", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: false,
      status: 503,
    } as Response);

    const response = await POST(
      new Request("http://localhost/api/ai/generate-logo", {
        method: "POST",
        body: JSON.stringify({ prompt: "logo trà sữa màu đỏ" }),
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body.dataUrl).toBeUndefined();
    expect(body.error).toContain("AI image generation failed");
  });
});
