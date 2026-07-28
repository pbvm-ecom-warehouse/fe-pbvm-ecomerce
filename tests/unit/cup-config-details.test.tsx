import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { CupConfigDetails } from "@/features/cart/components/cup-config-details";

describe("CupConfigDetails", () => {
  it("shows only the expected cup attributes for custom print cart items", () => {
    render(
      <CupConfigDetails
        item={{
          name: "Ly in theo thiết kế CUP-RND-PP-700-WHT",
          productRefId: "CUP-RND-PP-700-WHT",
          fulfillmentType: "CUSTOM_PRINT",
          attributes: {
            "700": "700ml",
            capacity: "700ml",
            rnd: "Trụ tròn",
            style: "Trụ tròn",
            pp: "Nhựa PP",
            material: "Nhựa PP",
            wht: "Trắng sữa",
            color: "Trắng sữa",
          },
          designFile: {
            artwork: {
              artboard: { printHeightPercent: 100 },
              cup: {
                size: "500ml",
                materialType: "clear",
                style: "straight",
              },
            },
          },
        }}
      />,
    );

    expect(screen.getByText(/Dung tích:/)).toBeInTheDocument();
    expect(screen.getByText(/Chất liệu:/)).toBeInTheDocument();
    expect(screen.getByText(/Kiểu dáng:/)).toBeInTheDocument();
    expect(screen.getByText(/Màu sắc:/)).toBeInTheDocument();
    expect(screen.getAllByText("700ml")).toHaveLength(1);
    expect(screen.getAllByText("Trụ tròn")).toHaveLength(1);
    expect(screen.getAllByText("Nhựa PP")).toHaveLength(1);
    expect(screen.getAllByText("Trắng sữa")).toHaveLength(1);
    expect(screen.queryByText(/700:/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Rnd:/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Pp:/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Wht:/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Vùng in/)).not.toBeInTheDocument();
  });
});
