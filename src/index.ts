import { Router } from "itty-router";

import { HandlerError } from "./utils";
import { PatientRecord, PatientRecordQuery, decodeQuery } from "./patient";

import { v4 as uuidv4 } from "uuid";

import { withCors } from "./withCors";
import { deleteCookie, withAuth, withStash } from "./withStash";
import { withAdminAuth } from "./withAdminAuth";

export interface Env {
  CIPHERSTASH_CLIENT_SECRET: string;
  // The source encryption key for the CipherStash instance
  CIPHERSTASH_KEY: string;
  // The password for the admin dashboard
  ADMIN_AUTH_PASSWORD: string;
}

export default {
  fetch: withCors(async (request, env) => {
    try {
      const router = Router();
      router.post(
        "/secure",
        withStash(env, async (request, stash) => {
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

      // The search endpoint is used to query patient information.
      //
      router.post(
        "/search",
        withAdminAuth(
          env,
          withStash(env, async (request, stash) => {
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

      // This endpoint is used to check whether the Basic authentication provided by the user is correct
      // Validation is handled by the withAdminAuth function
      router.post(
        "/login",
        withAdminAuth(env, async () => Response.json({ success: true }))
      );

      // This endpoint is used when the app first loads to get an authentication token and validate CORS
      router.post(
        "/auth-preflight",
        withAuth(env, async () => Response.json({ success: true }))
      );

      // If the worker doesn't have
      router.all("*", () => new Response(null, { status: 404 }));

      return await router.handle(request);
    } catch (e) {
      let response: Response;

      if (e instanceof HandlerError) {
        response = e.toResponse();
      } else {
        console.error("An unexpected error occurred", e);
        response = Response.json(
          {
            success: false,
            error: String(e),
          },
          { status: 500 }
        );
      }

      // delete cookie if there is an error response
      deleteCookie(response);

      return response;
    }
  }),
};
