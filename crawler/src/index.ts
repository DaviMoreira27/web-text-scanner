import { serve } from "@hono/node-server";
import { Hono } from "hono";
import {
  crawlSitemaps,
  extractUrlsFromSitemap,
  getSiteMap,
} from "./sitemap-discovery.ts";
import { producer } from "./queue/queue.config.ts";

const app = new Hono();

app.get("/urls", async (c) => {
  const url = new URL("https://www.va.gov");
  const sitemapString = await getSiteMap(url);
  const getSitemapUrls = extractUrlsFromSitemap(sitemapString);

  const allUrls = await crawlSitemaps(getSitemapUrls);

  // await producer.connect();
  // await producer.send({
  //   topic: "website-scraper",
  //   messages: allUrls.map((item) => ({
  //     value: item,
  //   })),
  // });

  return c.json({
    urls: allUrls.length,
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
