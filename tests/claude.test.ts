import { describe, it, expect, vi } from "vitest";
import { requestPlan } from "../server/utils/claude";
const input = { goal: "코드 전환", dailyMinutes: 30, songs: [], records: [] };
describe("Claude API adapter", () => {
  it("sends credentials only to Anthropic and includes the validated context", async () => {
    const request = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(
        JSON.stringify({
          content: [
            { type: "text", text: "월요일: 30분" },
            { type: "text", text: "화요일: 30분" },
          ],
        }),
      ),
    );
    expect(
      await requestPlan(
        { apiKey: "test-key", model: "test-model" },
        input,
        request,
      ),
    ).toBe("월요일: 30분\n화요일: 30분");
    expect(request.mock.calls[0]?.[0]).toBe(
      "https://api.anthropic.com/v1/messages",
    );
    const options = request.mock.calls[0]?.[1];
    expect(options?.headers).toMatchObject({
      "x-api-key": "test-key",
      "anthropic-version": "2023-06-01",
    });
    const body = JSON.parse(options?.body as string);
    expect(body.model).toBe("test-model");
    expect(JSON.parse(body.messages[0].content)).toEqual(input);
  });
  it("rejects upstream errors without echoing sensitive response bodies", async () => {
    const request = vi
      .fn<typeof fetch>()
      .mockResolvedValue(
        new Response("secret-provider-error", { status: 401 }),
      );
    await expect(
      requestPlan({ apiKey: "secret", model: "test" }, input, request),
    ).rejects.toThrow("Claude request failed");
  });
  it("rejects empty or truncated plans", async () => {
    for (const response of [
      { content: [] },
      {
        stop_reason: "max_tokens",
        content: [{ type: "text", text: "partial" }],
      },
    ]) {
      const request = vi
        .fn<typeof fetch>()
        .mockResolvedValue(new Response(JSON.stringify(response)));
      await expect(
        requestPlan({ apiKey: "test", model: "test" }, input, request),
      ).rejects.toThrow();
    }
  });
});
