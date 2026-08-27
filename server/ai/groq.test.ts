import { describe, expect, it } from "vitest";
import { checkGroqConnection } from "./groq";

const groqTest = process.env.GROQ_API_KEY ? it : it.skip;

describe("Groq server-side configuration", () => {
  groqTest("authenticates against the lightweight models endpoint without exposing the key", async () => {
    const status = await checkGroqConnection();
    expect(status.connected, status.error).toBe(true);
    expect(status.modelCount).toBeTypeOf("number");
  }, 20_000);
});
