import { createReadStream, existsSync } from "node:fs";
import { createBrotliCompress, createGzip } from "node:zlib";
import { extname, join, normalize } from "node:path";
import { createServer } from "node:http";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL(".", import.meta.url));
const port = Number(process.env.PORT || 3000);

const contentTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
};

function sendRuntimeConfig(response) {
  const apiBaseUrl = process.env.API_BASE_URL || "http://localhost:5000";
  const payload = JSON.stringify({ apiBaseUrl });

  response.setHeader("Content-Type", "text/javascript; charset=utf-8");
  response.setHeader("Cache-Control", "no-store");
  response.end(`window.TARO_PORTAL_CONFIG = ${payload};`);
}

function resolveRequestPath(urlPath) {
  const decodedPath = decodeURIComponent(urlPath.split("?")[0]);
  const cleanPath = normalize(decodedPath).replace(/^(\.\.[/\\])+/, "");
  const requestedPath = join(root, cleanPath);

  if (existsSync(requestedPath) && !requestedPath.endsWith("\\") && !requestedPath.endsWith("/")) {
    return requestedPath;
  }

  return join(root, "index.html");
}

createServer((request, response) => {
  if ((request.url || "").split("?")[0] === "/config.js") {
    sendRuntimeConfig(response);
    return;
  }

  const filePath = resolveRequestPath(request.url || "/");
  const extension = extname(filePath);
  const acceptsEncoding = request.headers["accept-encoding"] || "";
  const isCompressible = [".html", ".css", ".js", ".json", ".svg"].includes(extension);

  response.setHeader("Content-Type", contentTypes[extension] || "application/octet-stream");
  response.setHeader("X-Content-Type-Options", "nosniff");

  if (filePath.includes(`${join(root, "assets")}`)) {
    response.setHeader("Cache-Control", "public, max-age=604800, stale-while-revalidate=86400");
  } else {
    response.setHeader("Cache-Control", "no-cache");
  }

  if (!isCompressible) {
    createReadStream(filePath).pipe(response);
    return;
  }

  response.setHeader("Vary", "Accept-Encoding");

  if (acceptsEncoding.includes("br")) {
    response.setHeader("Content-Encoding", "br");
    createReadStream(filePath).pipe(createBrotliCompress()).pipe(response);
    return;
  }

  if (acceptsEncoding.includes("gzip")) {
    response.setHeader("Content-Encoding", "gzip");
    createReadStream(filePath).pipe(createGzip()).pipe(response);
    return;
  }

  createReadStream(filePath).pipe(response);
}).listen(port, () => {
  console.log(`Taro portal running at http://localhost:${port}`);
});
