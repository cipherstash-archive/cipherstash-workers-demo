import { Router } from "itty-router";
import { Stash, debug } from "@cipherstash/stashjs-worker";

import { HandlerError, isValidUuid } from "./utils";
import { serveStaticFile } from "./static";

import { v4 as uuidv4 } from "uuid";

import SCHEMA from "../users.annotated.json";

import z from "zod";

export interface Env {
  // The host of the CipherStash instance
  CIPHERSTASH_HOST: string;
  // The source encryption key for the CipherStash instance
  CIPHERSTASH_KEY: string;
  // KVNamespace used by Worker Sites to serve the static app part of the worker
  __STATIC_CONTENT: KVNamespace;
}

function dateString() {
  return z.preprocess((x): Date | undefined => {
    if (typeof x === "string") {
      const date = new Date(x);

      if (!isNaN(Number(date))) {
        return date;
      }
    }

    return undefined;
  }, z.date());
}

const PatientRecord = z.object({
  name: z.string(),
  dob: dateString(),
  phone: z.string(),
  gender: z.string(),
  socialSecurityNumber: z.string(),
  medicalConditions: z.string(),
  comments: z.string(),
});

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

      router.get(
        "/search",
        withStash(async (request, stash) => {
          throw new HandlerError("Unimplemented!", 500);
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
