import { describe, it, expect, vi, afterEach } from "vitest";
import { telegramProvider } from "./telegram";
import { ProviderError, classifyError } from "../retry";

const credentials = { botToken: "123:ABC", chatId: "-100123" };
const payload = { caption: "📰 <b>عنوان</b>\n\nملخص", articleUrl: "https://www.lumiq.news/reviews/x?utm_source=telegram" };

function mockFetchOnce(response: { ok: boolean; status?: number; json: () => Promise<unknown> }) {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: response.ok,
      status: response.status ?? (response.ok ? 200 : 400),
      json: response.json,
    } as Response),
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("telegramProvider.send — success path", () => {
  it("stores Telegram's result.message_id on success", async () => {
    mockFetchOnce({ ok: true, json: async () => ({ ok: true, result: { message_id: 4242 } }) });

    const result = await telegramProvider.send(payload, credentials);
    expect(result.id).toBe("4242");
  });

  it("calls sendMessage with parse_mode HTML and the caption text", async () => {
    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ ok: true, result: { message_id: 1 } }),
    } as Response);
    vi.stubGlobal("fetch", fetchSpy);

    await telegramProvider.send(payload, credentials);

    const [, init] = fetchSpy.mock.calls[0];
    const body = JSON.parse((init as RequestInit).body as string);
    expect(body.parse_mode).toBe("HTML");
    expect(body.text).toContain("<b>عنوان</b>");
    expect(body.text).not.toContain("*عنوان*");
  });
});

describe("telegramProvider.send — HTTP 429 with retry_after", () => {
  it("surfaces retry_after so the retry classifier can honor it", async () => {
    mockFetchOnce({
      ok: false,
      status: 429,
      json: async () => ({ ok: false, error_code: 429, description: "Too Many Requests", parameters: { retry_after: 12 } }),
    });

    await expect(telegramProvider.send(payload, credentials)).rejects.toThrow();

    try {
      await telegramProvider.send(payload, credentials);
    } catch (err) {
      expect(err).toBeInstanceOf(ProviderError);
      const classification = classifyError(err);
      expect(classification.kind).toBe("transient");
      expect(classification.retryAfterSeconds).toBe(12);
    }
  });
});

describe("telegramProvider.send — Telegram 5xx", () => {
  it("is classified as a transient failure", async () => {
    mockFetchOnce({ ok: false, status: 502, json: async () => ({ ok: false, error_code: 502, description: "Bad Gateway" }) });

    try {
      await telegramProvider.send(payload, credentials);
      expect.unreachable();
    } catch (err) {
      expect(classifyError(err).kind).toBe("transient");
    }
  });
});

describe("telegramProvider.send — network failure", () => {
  it("is classified as a transient failure", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("fetch failed")));

    try {
      await telegramProvider.send(payload, credentials);
      expect.unreachable();
    } catch (err) {
      expect(classifyError(err).kind).toBe("transient");
    }
  });
});

describe("telegramProvider.send — sendPhoto path (Sprint 5)", () => {
  const payloadWithImage = { ...payload, imageUrl: "https://example.com/og.png" };

  it("calls sendPhoto (not sendMessage) when payload.imageUrl is present", async () => {
    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ ok: true, result: { message_id: 7 } }),
    } as Response);
    vi.stubGlobal("fetch", fetchSpy);

    await telegramProvider.send(payloadWithImage, credentials);

    const [url, init] = fetchSpy.mock.calls[0];
    expect(url as string).toContain("/sendPhoto");
    const body = JSON.parse((init as RequestInit).body as string);
    expect(body.photo).toBe("https://example.com/og.png");
    expect(body.parse_mode).toBe("HTML");
    expect(body.caption).toContain("<b>عنوان</b>");
    expect(body.text).toBeUndefined();
  });

  it("falls back to sendMessage when no imageUrl is present", async () => {
    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ ok: true, result: { message_id: 8 } }),
    } as Response);
    vi.stubGlobal("fetch", fetchSpy);

    await telegramProvider.send(payload, credentials);

    const [url] = fetchSpy.mock.calls[0];
    expect(url as string).toContain("/sendMessage");
  });

  it("trims an oversized caption to stay under sendPhoto's 1024-char limit", async () => {
    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ ok: true, result: { message_id: 9 } }),
    } as Response);
    vi.stubGlobal("fetch", fetchSpy);

    const longPayload = { ...payloadWithImage, caption: "نص طويل جداً ".repeat(150) };
    await telegramProvider.send(longPayload, credentials);

    const [, init] = fetchSpy.mock.calls[0];
    const body = JSON.parse((init as RequestInit).body as string);
    expect((body.caption as string).length).toBeLessThanOrEqual(1024);
  });

  it("still succeeds and returns message_id via the sendPhoto path", async () => {
    mockFetchOnce({ ok: true, json: async () => ({ ok: true, result: { message_id: 4242 } }) });
    const result = await telegramProvider.send(payloadWithImage, credentials);
    expect(result.id).toBe("4242");
  });
});

describe("telegramProvider.send — permanent 4xx failure", () => {
  it("chat not found is classified as permanent", async () => {
    mockFetchOnce({ ok: false, status: 400, json: async () => ({ ok: false, error_code: 400, description: "Bad Request: chat not found" }) });

    try {
      await telegramProvider.send(payload, credentials);
      expect.unreachable();
    } catch (err) {
      expect(classifyError(err).kind).toBe("permanent");
    }
  });

  it("missing credentials throws immediately without calling fetch", async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);

    await expect(telegramProvider.send(payload, {})).rejects.toThrow(/missing botToken or chatId/);
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
