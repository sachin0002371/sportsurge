import openNextWorker from "./.open-next/worker.js";
export { DOQueueHandler, DOShardedTagCache, BucketCachePurge } from "./.open-next/worker.js";

// Scanner / bot pattern list to drop instantly with zero CPU
const BOT_PATH_REGEX = /(\.php|\.asp|\.aspx|\.jsp|\.cgi|\.env|\.git|\.yml|\.yaml|\.ini|\.conf|wp-admin|wp-content|wp-includes|xmlrpc|phpmyadmin)/i;

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // 1. Instantly drop bots & vulnerability scanners (0.05ms CPU)
    if (BOT_PATH_REGEX.test(url.pathname)) {
      return new Response("Not Found", {
        status: 404,
        headers: {
          "Content-Type": "text/plain",
          "Cache-Control": "public, max-age=86400",
        },
      });
    }

    // 2. Check Cloudflare Edge Cache API (caches.default) for GET requests
    if (request.method === "GET" && !url.pathname.startsWith("/api/vote")) {
      const cache = caches.default;
      const cacheKey = new Request(url.toString(), request);
      const cachedResponse = await cache.match(cacheKey);

      if (cachedResponse) {
        // Cache Hit! Served from Cloudflare edge in < 1ms CPU!
        const hitResponse = new Response(cachedResponse.body, cachedResponse);
        hitResponse.headers.set("X-Worker-Cache", "HIT");
        return hitResponse;
      }

      // Cache Miss: Run OpenNext Next.js worker
      const response = await openNextWorker.fetch(request, env, ctx);

      // Cache successful responses in Cloudflare's in-datacenter Edge Cache
      if (response.status === 200) {
        const responseToCache = response.clone();
        const headers = new Headers(responseToCache.headers);

        let sMaxAge = 600; // 10 minutes default
        if (url.pathname === "/") sMaxAge = 900; // 15 mins for home
        else if (url.pathname.includes("/news")) sMaxAge = 1800; // 30 mins
        else if (url.pathname.startsWith("/api/")) sMaxAge = 300; // 5 mins

        headers.set("Cache-Control", `public, max-age=60, s-maxage=${sMaxAge}, stale-while-revalidate=86400`);
        headers.set("X-Worker-Cache", "MISS");

        const cachedEntry = new Response(responseToCache.body, {
          status: responseToCache.status,
          statusText: responseToCache.statusText,
          headers,
        });

        // Store asynchronously without adding latency to the client
        ctx.waitUntil(cache.put(cacheKey, cachedEntry));
      }

      return response;
    }

    // For POST/PUT or non-cacheable routes, pass directly to OpenNext
    return openNextWorker.fetch(request, env, ctx);
  },
};
