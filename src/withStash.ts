import type { Env } from ".";
import { HandlerError } from "./utils";
import SCHEMA from "../patients.annotated.json";
import { Stash } from "@cipherstash/stashjs-worker";

const TOKEN_COOKIE_NAME = "cs_access_token";

// Cloudflare workers supports toGMTString
declare global {
  interface Date {
    toGMTString(): string;
  }
}

function setCookie(res: Response, token: string, expires: Date) {
  res.headers.append(
    "set-cookie",
    // todo: see whether this could be UTC instead of GMT
    `${TOKEN_COOKIE_NAME}=${token}; SameSite=None; Secure; expires=${expires.toGMTString()}`
  );
}

/**
 * Set an expired access token cookie so that it gets deleted
 */
export function deleteCookie(res: Response) {
  setCookie(res, "", new Date(new Date().getTime() + 1000 * 60 * 60));
}

function bufferFromHex(hex: string): Uint8Array {
  return new Uint8Array(
    hex.match(/[\da-f]{2}/gi)?.map((h) => parseInt(h, 16)) ?? []
  );
}

function bufferToHex(buffer: Uint8Array): string {
  return Array.from(buffer)
    .map((x) => x.toString(16).padStart(2, "0"))
    .join("");
}

export function withAuth(
  env: Env,
  handler: (request: Request, token: string) => Promise<Response>
) {
  return async (request: Request): Promise<Response> => {
    // Instead of storing user sessions in a durable object we store a CipherStash access token encrypted as a cookie.
    // When users make requests to the service this method checks for and decrypts an access token from the cookie.
    // If no access token is present we use the CipherStash access key to do a token exchange and create a short-lived access token.
    //
    // This Web Crypto key is created from the provided CIPHERSTASH_KEY and is used to encrypt the access token sent to the user.
    const key = await crypto.subtle.importKey(
      "raw",
      bufferFromHex(env.CIPHERSTASH_KEY),
      { name: "AES-GCM" },
      false,
      ["encrypt", "decrypt"]
    );

    const cookies = `; ${request.headers.get("cookie") ?? ""}`;
    const parts = cookies.split(`; ${TOKEN_COOKIE_NAME}=`);

    if (parts.length === 2) {
      const encrypted = parts.pop()?.split(";").shift();

      // If there was an access token in the cookies - decrypt it and pass it through.
      if (encrypted) {
        const [iv, enc] = encrypted.split(".");

        const decrypted = await crypto.subtle.decrypt(
          {
            name: "AES-GCM",
            iv: bufferFromHex(iv),
          },
          key,
          bufferFromHex(enc)
        );

        const decoder = new TextDecoder();
        const token = decoder.decode(decrypted);

        return await handler(request, token);
      }
    }

    // Since there was no cached token - perform a token exchange with the CipherStash console and get a short lived token.
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

    // If the token exchange failed it's probably because of a misconfiguration error.
    if (response.status !== 200) {
      throw new HandlerError(
        "Failed to exchange auth token",
        500,
        await response.json<{}>().catch(() => undefined)
      );
    }

    const { accessToken, expiry } = await response.json<{
      accessToken: string;
      expiry: number;
    }>();

    // Set the cookie to expire 10s before the actual access token expires.
    // This ensures that the user will need to go back through the token exchange flow before the token has expired
    // which saves them from running into any unauthorised errors.
    const expires = new Date(expiry * 1000 - (5 * 60 * 1000));

    const res = await handler(request, accessToken);

    // Create a 16 byte IV for encrypting the
    // This IV is stored along side the encrypted access token in the user cookie.
    const iv = new Uint8Array(16);
    crypto.getRandomValues(iv);

    const encoder = new TextEncoder();

    const encrypted = await crypto.subtle.encrypt(
      {
        name: "AES-GCM",
        iv,
      },
      key,
      encoder.encode(accessToken)
    );

    // Set the cookie on the response in the format <iv>.<ciphertext>
    setCookie(
      res,
      `${bufferToHex(iv)}.${bufferToHex(new Uint8Array(encrypted))}`,
      expires
    );

    return res;
  };
}

/**
 * Create a handler with a CipherStash client created from the current environment
 *
 * This handler also does a token exchange and authenticates with CipherStash using the CipherStash access key from the environment.
 */
export function withStash(
  env: Env,
  handler: (request: Request, stash: Stash) => Promise<Response>
) {
  return withAuth(env, async (request, token) => {
    const stash = Stash.fromAnnotatedSchema(SCHEMA, {
      host: `https://${SCHEMA.service.host}`,
      key: env.CIPHERSTASH_KEY,
      token,
    });

    return await handler(request, stash);
  });
}
