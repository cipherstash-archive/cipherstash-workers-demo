export class HandlerError extends Error {
  constructor(public message: string, public statusCode: number) {
    super(`HandlerError(${statusCode}): ${message}`);
  }

  toResponse(): Response {
    return Response.json(
      {
        success: false,
        error: this.message,
      },
      { status: this.statusCode }
    );
  }
}

const UUID_RE =
  /^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/gi;

export function isValidUuid(value: string): boolean {
  return UUID_RE.test(value);
}
