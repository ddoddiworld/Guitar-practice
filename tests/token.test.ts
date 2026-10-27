import { it, expect } from "vitest";
import { verifyPlanToken } from "../server/utils/token";
it("verifies exact tokens with the Worker-compatible Web Crypto API", async () => {
  expect(await verifyPlanToken("secret", "secret")).toBe(true);
  expect(await verifyPlanToken("secret-extra", "secret")).toBe(false);
  expect(await verifyPlanToken("", "secret")).toBe(false);
  expect(await verifyPlanToken("secret", "")).toBe(false);
});
