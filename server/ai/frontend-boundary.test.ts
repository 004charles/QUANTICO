import { describe, expect, it } from "vitest";
import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";

async function readClientSources(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const chunks = await Promise.all(entries.map(async (entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return readClientSources(path);
    if (/\.(ts|tsx|css|html)$/.test(entry.name)) return [await readFile(path, "utf8")];
    return [];
  }));
  return chunks.flat();
}

describe("AI credential boundary", () => {
  it("does not reference the Groq credential anywhere in client-side source", async () => {
    const sources = await readClientSources(join(process.cwd(), "client", "src"));
    expect(sources.join("\n")).not.toContain("GROQ_API_KEY");
  });
});
