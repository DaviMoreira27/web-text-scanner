import * as browserApi from "playwright";
import { type Buffer } from "buffer";

export async function scrapePage(url: string): Promise<Buffer | undefined> {

  let browser: browserApi.Browser;
  let context: browserApi.BrowserContext;

  try {
    browser = await browserApi.chromium.launch();
    context = await browser.newContext({
      userAgent: `Mozilla/5.0 (Linux; Android 6.0.1; Nexus 5X Build/MMB29P) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/W.X.Y.Z Mobile Safari/537.36 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)`,
    });
  } catch (error) {
    console.error("Error starting the browser api", error);
    throw new Error("Invalid browser environment");
  }


  try {
    const page = await context.newPage();

    const pageResponse = await page.goto(url, {
      waitUntil: "domcontentloaded",
      timeout: 2 * 60 * 60,
    }); // 2 minutes

    const pageScreenshot = await page.screenshot({ fullPage: true });

    const success = pageResponse?.ok();

    if (success && calculateBufferSize(pageScreenshot) > 0) {
      return pageScreenshot;
    }
  } catch (error) {
    console.error(`Error scrapping page, ${url}`);
    if (error instanceof browserApi.errors.TimeoutError) {
      console.error("Timeout error recorded");
      throw new Error('Timeout error, could not access given page');
    }
    throw new Error('Page couldnt be accessed');
  } finally {
    if (context) {
      await context.close();
    }

    if (browser) {
      await browser.close();
    }
  }
}

export function calculateBufferSize(data: Buffer): number {
  return data.length;
}
