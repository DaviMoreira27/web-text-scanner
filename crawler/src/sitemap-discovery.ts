export async function getSiteMap(url: URL) {
  const origin = url.origin;

  const possibleSitemapLocations = [
    `${origin}/sitemap.xml`,
    `${origin}/sitemap_index.xml`,
    `${origin}/sitemap-index.xml`,
    `${origin}/sitemapindex.xml`,
    `${origin}/sitemap/sitemap.xml`,
    `${origin}/sitemap/index.xml`,
    `${origin}/sitemaps/sitemap.xml`,
    `${origin}/sitemaps.xml`,
    `${origin}/sitemap1.xml`,
    `${origin}/sitemap-index1.xml`,
    `${origin}/sitemap_index1.xml`,
    `${origin}/sitemap/main-sitemap.xml`,
    `${origin}/sitemap/sitemap-index.xml`,
    `${origin}/sitemap/sitemap_index.xml`,
    `${origin}/sitemap/sitemap1.xml`,
    `${origin}/sitemap.xml.gz`,
    `${origin}/sitemap_index.xml.gz`,
    `${origin}/sitemap/sitemap.xml.gz`,
    `${origin}/sitemap-index.xml.gz`,
  ];

  for (const link of possibleSitemapLocations) {
    try {
      const fetcher = await fetch(link, {
        method: "GET",
        headers: {
          "Content-Type": "application/xml",
        },
      });

      const dataString = await fetcher.text();
      return dataString;
    } catch (error) {
      console.error("Error: ", error);
      console.warn("Invalid origin", link);
      continue;
    }
  }

  throw new Error("Sitemap not found!");
}

export function extractUrlsFromSitemap(xmlString: string) {
  if (!xmlString || typeof xmlString !== "string") return [];

  const re = /<\s*(?:\w+:)?loc\b[^>]*>([\s\S]*?)<\/\s*(?:\w+:)?loc\s*>/gi;

  const urls: string[] = [];
  let m;
  while ((m = re.exec(xmlString)) !== null) {
    let content = m[1].trim();

    if (/^<!\[CDATA\[/.test(content)) {
      content = content
        .replace(/^<!\[CDATA\[(?:\s*)/, "")
        .replace(/(?:\s*)\]\]>$/, "");
    }

    content = content.replace(/&(#?)(x?)(\w+);/g, (_, isNum, isHex, code) => {
      if (isNum) {
        return isHex
          ? String.fromCharCode(parseInt(code, 16))
          : String.fromCharCode(parseInt(code, 10));
      }
      switch (code) {
        case "amp":
          return "&";
        case "lt":
          return "<";
        case "gt":
          return ">";
        case "quot":
          return '"';
        case "apos":
          return "'";
        default:
          return `&${code};`;
      }
    });

    if (content) urls.push(content);
  }

  return Array.from(new Set(urls));
}

export async function crawlSitemaps(
  initialUrls: string[],
  visited: Set<string> = new Set(),
): Promise<string[]> {
  const results = new Set<string>();

  for (const url of initialUrls) {
    if (visited.has(url)) continue;
    visited.add(url);

    // se não for XML, adiciona e continua
    if (!url.endsWith(".xml")) {
      results.add(url);
      continue;
    }

    try {
      const res = await fetch(url);
      if (!res.ok) continue;

      const xml = await res.text();

      const locUrls = extractUrlsFromSitemap(xml);

      // adiciona todas localmente
      for (const u of locUrls) results.add(u);

      // busca recursivamente para os que forem xml
      const childSitemaps = locUrls.filter((u) => u.endsWith(".xml"));

      if (childSitemaps.length > 0) {
        const nested = await crawlSitemaps(childSitemaps, visited);
        for (const n of nested) results.add(n);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      console.warn("Fetch failed", message);
    }
  }

  return Array.from(results);
}
