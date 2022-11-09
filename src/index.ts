import { Router } from "itty-router";
import { Stash } from "@cipherstash/stashjs-worker";

import { HandlerError } from "./utils";
import { serveStaticFile } from "./static";
import { PatientRecord, PatientRecordQuery, decodeQuery } from "./patient";

import { v4 as uuidv4 } from "uuid";

import SCHEMA from "../users.annotated.json";

export interface Env {
  CIPHERSTASH_CLIENT_SECRET: string;
  // The host of the CipherStash instance
  CIPHERSTASH_HOST: string;
  // The source encryption key for the CipherStash instance
  CIPHERSTASH_KEY: string;
  // KVNamespace used by Worker Sites to serve the static app part of the worker
  __STATIC_CONTENT: KVNamespace;
}

const TOKEN_COOKIE_NAME = "cs_access_token";

async function getAccessToken(env: Env, request: Request): Promise<string> {
  const cookies = `; ${request.headers.get("cookie") ?? ""}`;
  const parts = cookies.split(`; ${TOKEN_COOKIE_NAME}=`);

  if (parts.length === 2) {
    const token = parts.pop()?.split(";").shift();

    if (token) {
      return token;
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

  return (await response.json<{ accessToken: string }>()).accessToken;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    try {
      const router = Router();

      function withStash(
        handler: (request: Request, stash: Stash) => Promise<Response>
      ) {
        return async (request: Request): Promise<Response> => {
          const token = await getAccessToken(env, request);

          if (!token) {
            throw new HandlerError("Failed to get authentication token", 500);
          }

          const stash = Stash.fromAnnotatedSchema(SCHEMA, {
            host: env.CIPHERSTASH_HOST,
            key: env.CIPHERSTASH_KEY,
            token,
          });

          const response = await handler(request, stash);

          response.headers.append(
            "set-cookie",
            `${TOKEN_COOKIE_NAME}=${token}; SameSite=Strict; Secure; HttpOnly`
          );

          return response;
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
      );

      // Catch-all handler for serving the static app.
      router.all("*", (request: Request) => serveStaticFile(env, request));

      return await router.handle(request);
    } catch (e) {
      if (e instanceof HandlerError) {
        return e.toResponse();
      }

      console.error("An unexpected error occurred:", e);

      return Response.json(
        {
          success: false,
          error: String(e),
        },
        { status: 500 }
      );
    }
  },
};
