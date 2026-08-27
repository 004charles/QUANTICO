import { describe, expect, it } from "vitest";
import { decryptConnectorCredential, encryptConnectorCredential } from "./data-connectors";

describe("connector credential protection", () => {
  it("encrypts credentials before storage and can decrypt only inside the server module", () => {
    const original = "credential-for-test-only";
    const ciphertext = encryptConnectorCredential(original);
    expect(ciphertext).not.toContain(original);
    expect(ciphertext.split(".")).toHaveLength(3);
    expect(decryptConnectorCredential(ciphertext)).toBe(original);
  });
});
