import { Router } from "itty-router";
import { Stash } from "@cipherstash/stashjs-worker";

import { HandlerError } from "./utils";
import { PatientRecord, PatientRecordQuery, decodeQuery } from "./patient";

import { v4 as uuidv4 } from "uuid";

import SCHEMA from "../patients.annotated.json";

export interface Env {
  CIPHERSTASH_CLIENT_SECRET: string;
  // The host of the CipherStash instance
  CIPHERSTASH_HOST: string;
  // The source encryption key for the CipherStash instance
  CIPHERSTASH_KEY: string;
  // The password for the admin dashboard
  ADMIN_AUTH_PASSWORD: string;
}

const TOKEN_COOKIE_NAME = "cs_access_token";

// Cloudflare workers supports toGMTString
declare global {
  interface Date {
    toGMTString(): string;
  }
}

function setCookie(req: Request, res: Response, token: string, expires?: Date) {
  res.headers.append(
    "set-cookie",
    // todo: see whether this could be UTC instead of GMT
    `${TOKEN_COOKIE_NAME}=${token}; SameSite=None; Secure; expires=${(
      expires ?? new Date(0)
    ).toGMTString()}`
  );
}

function withAuth(
  env: Env,
  handler: (request: Request, token: string) => Promise<Response>
) {
  return async (request: Request): Promise<Response> => {
    const cookies = `; ${request.headers.get("cookie") ?? ""}`;
    const parts = cookies.split(`; ${TOKEN_COOKIE_NAME}=`);

    if (parts.length === 2) {
      const token = parts.pop()?.split(";").shift();

      if (token) {
        return await handler(request, token);
      }
    }

    const response = await fetch(
      "https://console.cipherstash.com/api/authorise",
      {
        method: "POST",
        body: JSON.stringify({
          accessKey: env.CIPHERSTASH_CLIENT_SECRET,
        }),
        headers: {
          "content-type": "application/json",
        },
      }
    );

    const { accessToken, expiry } = await response.json<{
      accessToken: string;
      expiry: number;
    }>();

    const expires = new Date(expiry * 1000 - 10 * 1000);

    const res = await handler(request, accessToken);

    setCookie(request, res, accessToken, expires);

    return res;
  };
}

function withCors(handler: (request: Request, env: Env) => Promise<Response>) {
  return async (request: Request, env: Env): Promise<Response> => {
    const response =
      request.method === "OPTIONS"
        ? new Response(null)
        : await handler(request, env);

    const origin = request.headers.get("origin");

    if (!origin) {
      throw new HandlerError("Expected origin header", 400);
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

export default {
  fetch: withCors(async (request, env) => {
    try {
      const router = Router();

      function withStash(
        handler: (request: Request, stash: Stash) => Promise<Response>
      ) {
        return withAuth(env, async (request, token) => {
          const stash = Stash.fromAnnotatedSchema(SCHEMA, {
            host: env.CIPHERSTASH_HOST,
            key: env.CIPHERSTASH_KEY,
            token,
          });

          return await handler(request, stash);
        });
      }

      function withAdminAuth(handler: (request: Request) => Promise<Response>) {
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

      router.post(
        "/secure",
        withStash(async (request, stash) => {
          const result = PatientRecord.safeParse(await request.json());

          if (!result.success) {
            throw new HandlerError(
              "Failed to parse record from request body",
              400,
              result.error.format()
            );
          }

          const record = result.data;

          const id = uuidv4();

          await stash.put({
            ...record,
            id,
          });

          return Response.json({
            success: true,
            id,
          });
        })
      );

      router.post(
        "/search",
        withAdminAuth(
          withStash(async (request, stash) => {
            const result = PatientRecordQuery.safeParse(await request.json());

            if (!result.success) {
              throw new HandlerError(
                "Failed to parse query from request body",
                400,
                result.error.format()
              );
            }

            const query = result.data;

            const { limit, offset, ordering } = query;

            const records = await stash.query(
              (builder) => decodeQuery(query, builder),
              {
                limit,
                offset,
                ordering: ordering && [ordering],
              }
            );

            return Response.json({
              success: true,
              records,
            });
          })
        )
      );

      router.post(
        "/login",
        withAdminAuth(async (request) => Response.json({ success: true }))
      );

      router.all("*", () => new Response(null, { status: 404 }));

      return await router.handle(request);
    } catch (e) {
      console.error("An error occurred:", e);

      const response =
        e instanceof HandlerError
          ? e.toResponse()
          : Response.json(
              {
                success: false,
                error: String(e),
              },
              { status: 500 }
            );

      // delete cookie if there is an error response
      setCookie(request, response, "");

      return response;
    }
  }),
};
