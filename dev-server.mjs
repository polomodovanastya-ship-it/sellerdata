import { createServer } from "node:http";
import { createReadStream, statSync } from "node:fs";
import { extname, join, normalize } from "node:path";
import { loadEnv } from "./server/load-env.mjs";
import { handleFbsLeads } from "./server/fbs-leads.mjs";

loadEnv();

const ROOT = process.cwd();
const portArgIndex = process.argv.indexOf("--port");
const PORT = Number(
  (portArgIndex !== -1 ? process.argv[portArgIndex + 1] : undefined) || process.env.PORT || 8080,
);

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".webmanifest": "application/manifest+json",
  ".txt": "text/plain; charset=utf-8",
};

function resolveFile(urlPath) {
  const clean = normalize(decodeURIComponent(urlPath.split("?")[0])).replace(/^(\.\.[/\\])+/, "");
  if (!clean || clean === "/") return join(ROOT, "index.html");
  const candidates = [join(ROOT, clean)];
  if (clean.endsWith("/")) candidates.push(join(ROOT, clean, "index.html"));
  for (const file of candidates) {
    try {
      if (statSync(file).isFile()) return file;
    } catch {
      /* next candidate */
    }
  }
  return null;
}

createServer(async (req, res) => {
  const url = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);

  if (await handleFbsLeads(req, res, url)) return;

  const file = resolveFile(url.pathname);
  if (!file) {
    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Not found");
    return;
  }

  res.writeHead(200, {
    "Content-Type": TYPES[extname(file).toLowerCase()] || "application/octet-stream",
    "Cache-Control": "no-cache",
  });
  createReadStream(file).pipe(res);
}).listen(PORT, "::", () => {
  console.log(`eureka ecom on http://localhost:${PORT}/`);
  console.log(
    "Lead API: POST /api/fbs-leads (WEEEK via .env or upstream fbs.revelio.tech)",
  );
});
