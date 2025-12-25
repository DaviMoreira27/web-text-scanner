import { describe, it, before, afterEach } from "node:test";
import * as scraperService from "../../src/scraper/scraper.service.ts";
import assert from "node:assert";
import * as browserApi from "playwright";
import type {
  Browser,
  BrowserContext,
  Page,
  Response,
} from "playwright";

describe("calculateBufferSize", () => {
  it("should return the correct size for a non-empty buffer", () => {
    const array = new Array<string>(60);
    array.fill(Math.random().toString());
    const buffer = Buffer.alloc(10 * 1024); // 10 Kb

    assert.strictEqual(10 * 1024, scraperService.calculateBufferSize(buffer));
  });

  it("should return 0 for an empty buffer", () => {
    const array = new Array<string>(60);
    array.fill(Math.random().toString());
    const buffer = Buffer.alloc(0); // 0 Kb

    assert.strictEqual(0, scraperService.calculateBufferSize(buffer));
  });

  it("should return the correct size for a large buffer", () => {
    const array = new Array<string>(60);
    array.fill(Math.random().toString());
    const buffer = Buffer.alloc(10 * 1024 * 1024); // 10 mb

    assert.strictEqual(buffer.length, scraperService.calculateBufferSize(buffer));
  });
});

describe("scrapePage", () => {
  let gotoMock: () => Promise<Response>;
  let screenshotMock: () => Promise<Buffer>;

  let contextCloseCalled = false;
  let browserCloseCalled = false;

  before(() => {
    gotoMock = async () =>
      ({
        ok: () => true,
      } as Response);

    screenshotMock = async () => Buffer.from("image");

    const pageMock: Pick<Page, "goto" | "screenshot"> = {
      goto: async () => gotoMock(),
      screenshot: async () => screenshotMock(),
    };

    const contextMock: Pick<BrowserContext, "newPage" | "close"> = {
      newPage: async () => pageMock as Page,
      close: async () => {
        contextCloseCalled = true;
      },
    };

    const browserMock: Pick<Browser, "newContext" | "close"> = {
      newContext: async () => contextMock as BrowserContext,
      close: async () => {
        browserCloseCalled = true;
      },
    };

    Object.defineProperty(browserApi.chromium, "launch", {
      value: async () => browserMock as Browser,
    });
  });

  afterEach(() => {
    contextCloseCalled = false;
    browserCloseCalled = false;

    gotoMock = async () =>
      ({
        ok: () => true,
      } as Response);

    screenshotMock = async () => Buffer.from("image");
  });

  it("should return a buffer when the page loads successfully and the screenshot is valid", async () => {
    const result = await scraperService.scrapePage("https://example.com");

    assert.ok(result);
    assert.ok(Buffer.isBuffer(result));
    assert.ok(result.length > 0);
  });

  it("should return undefined when the page response is not OK", async () => {
    gotoMock = async () =>
      ({
        ok: () => false,
      } as Response);

    const result = await scraperService.scrapePage("https://example.com");

    assert.strictEqual(result, undefined);
  });

  it("should return undefined when the screenshot buffer is empty", async () => {
    screenshotMock = async () => Buffer.alloc(0);

    const result = await scraperService.scrapePage("https://example.com");

    assert.strictEqual(result, undefined);
  });

  it("should return undefined when a timeout error occurs during navigation", async () => {
    gotoMock = async () => {
      throw new browserApi.errors.TimeoutError("timeout");
    };

    const result = await scraperService.scrapePage("https://example.com");

    assert.strictEqual(result, undefined);
  });

  it("should handle unexpected errors without throwing", async () => {
    screenshotMock = async () => {
      throw new Error("unexpected");
    };

    const result = await scraperService.scrapePage("https://example.com");

    assert.strictEqual(result, undefined);
  });

  it("should always close the browser and context", async () => {
    await scraperService.scrapePage("https://example.com");

    assert.strictEqual(contextCloseCalled, true);
    assert.strictEqual(browserCloseCalled, true);
  });
});
