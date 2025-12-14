import { serve } from "@hono/node-server";
import { Hono } from "hono";
import {
  crawlSitemaps,
  extractUrlsFromSitemap,
  getSiteMap,
} from "./sitemap-discovery.ts";

const app = new Hono();

app.get("/urls", async (c) => {
  const url = new URL("https://www.va.gov");
  const sitemapString = await getSiteMap(url);
  const getSitemapUrls = extractUrlsFromSitemap(sitemapString);

  const allUrls = await crawlSitemaps(getSitemapUrls);
  return c.json({
    urls: allUrls,
  });
});

serve(
  {
    fetch: app.fetch,
    port: 3000,
  },
  (addr) => {
    console.log(
      `Server is available on the following address: http://localhost:${addr.port}`,
    );
  },
);

export default app;
