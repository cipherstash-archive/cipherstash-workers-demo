import manifestJSON from "__STATIC_CONTENT_MANIFEST";
import mime from "mime";

const ASSET_MANIFEST = JSON.parse(manifestJSON);

function normalizePath(path: string) {
  return path
    .split("/")
    .filter((x) => !!x)
    .join("/");
}

/**
 * Serve a static file from the "Worker Site"
 */
export async function serveStaticFile<
  Env extends { __STATIC_CONTENT: KVNamespace }
>(env: Env, request: Request): Promise<Response> {
  const url = new URL(request.url);
  const pathKey =
    ASSET_MANIFEST[normalizePath(url.pathname)] ?? ASSET_MANIFEST["index.html"];

  const value = await env.__STATIC_CONTENT.get(pathKey, "arrayBuffer");

  if (!value) {
    return new Response(null, { status: 404 });
  }

  const response = new Response(value);

  let mimeType = mime.getType(pathKey) ?? "text/plain";

  if (mimeType.startsWith("text") || mimeType === "application/javascript") {
    mimeType += "; charset=utf-8";
  }

  response.headers.append("content-type", mimeType);

  // Anything in the assets/ directory is hashed so it can be cached for a while
  if (pathKey.startsWith("assets/")) {
    response.headers.append("cache-control", "max-age=604800");
  }

  return response;
}
