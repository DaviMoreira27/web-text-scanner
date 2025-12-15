import { describe, it } from "node:test";
import * as scraperService from "../scraper/scraper.service.ts";
import assert from "node:assert";

describe("Page access", () => {
  it("Should work for a valid and accessible page", async () => {
    const page = "https://google.com";

    const data = await scraperService.getPage(page);

    assert.equal(data, true);
  });

  it("Should calculate correctly the size of a buffer", () => {
    const array = new Array<string>(60);
    array.fill(Math.random().toString());
    const buffer = Buffer.alloc(10 * 1024); // 10 Kb

    assert.strictEqual(buffer, scraperService.calculateBufferSize(buffer));
  });
});
