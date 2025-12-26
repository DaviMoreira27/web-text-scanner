import { after, describe, it } from "node:test";
import * as scraperService from "../../src/scraper/scraper.service.ts";
import assert from "node:assert";
import { readFile, unlink, writeFile } from "node:fs/promises";

const filePath = "./tests/integration/screenshot.png";

describe("scrapePage", () => {
    it("should return a non-empty buffer for a valid page", async () => {
        const page = "https://google.com"; page
        const buffer = await scraperService.scrapePage(page);

        assert.ok(buffer.length > 0);
    });

    it("should throw an error for an inaccessible page", async () => {
        const id = crypto.randomUUID();
        const inexistentPage = `https://non-existent-page-${id}.com`;

        assert.rejects(async () => { await scraperService.scrapePage(inexistentPage) }, Error);
    });

    it("should handle real navigation timeouts", async () => {
        const timeoutUrl = "http://10.255.255.1";

        await assert.rejects(
            scraperService.scrapePage(timeoutUrl),
            Error
        );
    });

    it("should download the screenshot of a valid page", async () => {
        const page = "https://google.com";
        const buffer = await scraperService.scrapePage(page);

        await writeFile(filePath, buffer);

        const savedFile = await readFile(filePath);
        assert.ok(savedFile.length > 0);

        await unlink(filePath);
    });
});
