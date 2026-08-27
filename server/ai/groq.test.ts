import { describe, expect, it, vi } from "vitest";
import { analyzeWithGroq, checkGroqConnection } from "./groq";

const groqTest = process.env.GROQ_API_KEY ? it : it.skip;

describe("Groq server-side configuration", () => {
  groqTest("authenticates against the lightweight models endpoint without exposing the key", async () => {
    const status = await checkGroqConnection();
    expect(status.connected, status.error).toBe(true);
    expect(status.modelCount).toBeTypeOf("number");
  }, 20_000);

  groqTest("returns a structured business analysis from the configured available model", async () => {
    const result = await analyzeWithGroq({
      question: "Qual foi a receita de agosto?",
      organizationName: "Organização de validação",
      industry: "general",
      currency: "AOA",
      metricContext: JSON.stringify({ revenue: [{ date: "2026-08-01", value: 831000 }], sales: [{ date: "2026-08-01", value: 6 }] }),
    });
    expect(result.answer).toMatch(/831[.\s]?000|831 mil/i);
    expect(result.insights.length).toBeGreaterThan(0);
    expect(result.recommendations.length).toBeGreaterThan(0);
    expect(result.answer).not.toMatch(/\b(the|this|with|from)\b/i);
  }, 30_000);

  it("uses the configured Groq model and retains a descriptive server-side failure", async () => {
    const originalFetch = globalThis.fetch;
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ error: { message: "model_not_found" } }), { status: 404 }));
    globalThis.fetch = fetchMock;
    await expect(analyzeWithGroq({ question: "Teste", organizationName: "Teste", industry: "general", currency: "AOA", metricContext: "{}" })).rejects.toThrow("404");
    const body = JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body));
    expect(body.model).toBe("openai/gpt-oss-20b");
    globalThis.fetch = originalFetch;
  });

  it("caps extra insights and recommendations on the server without rejecting the structured response", async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify({ choices: [{ message: { content: JSON.stringify({ answer: "Resultado", insights: ["1", "2", "3", "4", "5"], recommendations: ["1", "2", "3", "4"], suggestedChart: "line", confidenceNote: "Teste" }) } }] }), { status: 200 }));
    const result = await analyzeWithGroq({ question: "Teste", organizationName: "Teste", industry: "general", currency: "AOA", metricContext: "{}" });
    expect(result.insights).toHaveLength(4);
    expect(result.recommendations).toHaveLength(3);
    globalThis.fetch = originalFetch;
  });
});
