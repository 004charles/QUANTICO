import { describe, expect, it } from "vitest";
import { extractProductMetrics } from "./metric-extraction";

describe("product metric extraction", () => {
  it("aggregates revenue and unique orders per mapped product", () => {
    const products = extractProductMetrics([
      { ProdutoReal: "Plano Pro", Montante: "500", Documento: "A-1" },
      { ProdutoReal: "Plano Pro", Montante: "300", Documento: "A-1" },
      { ProdutoReal: "Plano Base", Montante: "200", Documento: "A-2" },
    ], { product: "ProdutoReal", revenue: "Montante", order: "Documento" });
    expect(products).toEqual([{ productName: "Plano Pro", totalRevenue: 800, salesCount: 1 }, { productName: "Plano Base", totalRevenue: 200, salesCount: 1 }]);
  });
});
