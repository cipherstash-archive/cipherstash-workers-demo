import { Router } from "itty-router";
import { Stash } from "@cipherstash/stashjs-worker";

import { HandlerError } from "./utils";
import { serveStaticFile } from "./static";
import { PatientRecord, PatientRecordQuery } from "./patient";

import { v4 as uuidv4 } from "uuid";

import SCHEMA from "../users.annotated.json";
import { decodeQuery } from "./record";

export interface Env {
  // The host of the CipherStash instance
  CIPHERSTASH_HOST: string;
  // The source encryption key for the CipherStash instance
  CIPHERSTASH_KEY: string;
  // KVNamespace used by Worker Sites to serve the static app part of the worker
  __STATIC_CONTENT: KVNamespace;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    try {
      const router = Router();

      function withStash(
        handler: (request: Request, stash: Stash) => Promise<Response>
      ) {
        return async (request: Request): Promise<Response> => {
          const token = request.headers
            .get("authorization")
            ?.split("Bearer ")?.[1];

          if (!token) {
            throw new HandlerError("Invalid auth header", 400);
          }

          const stash = Stash.fromAnnotatedSchema(SCHEMA, {
            host: env.CIPHERSTASH_HOST,
            key: env.CIPHERSTASH_KEY,
            token,
          });

          return await handler(request, stash);
        };
      }

      router.post(
        "/secure",
        withStash(async (request, stash) => {
          const result = PatientRecord.safeParse(await request.json());

          if (!result.success) {
            throw new HandlerError(
              "Failed to parse record from request body",
              400
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
              400
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
