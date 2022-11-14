import type { Env } from ".";

export function withCors(
  handler: (request: Request, env: Env) => Promise<Response>
) {
  return async (request: Request, env: Env): Promise<Response> => {
    const response =
      request.method === "OPTIONS"
        ? new Response(null)
        : await handler(request, env);

    const origin = request.headers.get("origin");

    if (!origin) {
      return response;
    }

    response.headers.append("Access-Control-Allow-Origin", origin);
    response.headers.append("Access-Control-Allow-Methods", "POST");
    response.headers.append(
      "Access-Control-Allow-Headers",
      "content-type,authorization"
    );
    response.headers.append("Access-Control-Allow-Credentials", "true");
    response.headers.append("Access-Control-Max-Age", "600");

    return response;
  };
}
