import type { Env } from ".";
import { HandlerError } from "./utils";

export function withAdminAuth(
  env: Env,
  handler: (request: Request) => Promise<Response>
) {
  return async (request: Request): Promise<Response> => {
    const auth = request.headers.get("authorization");

    if (!auth) {
      throw new HandlerError("Expected auth header", 401);
    }

    const [, encoded] = auth.split("Basic ");
    const decoded = atob(encoded);

    if (decoded !== `admin:${env.ADMIN_AUTH_PASSWORD}`) {
      throw new HandlerError("Invalid credentials", 401);
    }

    return await handler(request);
  };
}
