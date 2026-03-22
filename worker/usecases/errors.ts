import type { ContentfulStatusCode } from "hono/utils/http-status";

export type UseCaseError =
  | { code: "NOT_FOUND"; message: string }
  | { code: "VALIDATION_ERROR"; message: string; field?: string }
  | { code: "UNAUTHORIZED"; message: string }
  | { code: "CONFLICT"; message: string }
  | { code: "INTERNAL_ERROR"; message: string };

export function notFound(entity: string, id?: number): UseCaseError {
  return {
    code: "NOT_FOUND",
    message: id ? `${entity} ${id} not found` : `${entity} not found`,
  };
}

export function validationError(
  message: string,
  field?: string,
): UseCaseError {
  return { code: "VALIDATION_ERROR", message, field };
}

export function unauthorized(message = "Unauthorized"): UseCaseError {
  return { code: "UNAUTHORIZED", message };
}

export function conflict(message: string): UseCaseError {
  return { code: "CONFLICT", message };
}

export function internalError(message = "Internal server error"): UseCaseError {
  return { code: "INTERNAL_ERROR", message };
}

export function errorToHttpStatus(error: UseCaseError): ContentfulStatusCode {
  switch (error.code) {
    case "VALIDATION_ERROR":
      return 400 as ContentfulStatusCode;
    case "UNAUTHORIZED":
      return 401 as ContentfulStatusCode;
    case "NOT_FOUND":
      return 404 as ContentfulStatusCode;
    case "CONFLICT":
      return 409 as ContentfulStatusCode;
    default:
      return 500 as ContentfulStatusCode;
  }
}

export function errorToMessage(error: UseCaseError): string {
  return error.message;
}
