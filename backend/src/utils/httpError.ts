export class HttpError extends Error {
  public readonly status: number;
  public readonly details?: unknown;

  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.status = status;
    this.details = details;
    Error.captureStackTrace?.(this, this.constructor);
  }

  static badRequest(msg = 'Bad Request', details?: unknown) {
    return new HttpError(400, msg, details);
  }
  static unauthorized(msg = 'Unauthorized') {
    return new HttpError(401, msg);
  }
  static forbidden(msg = 'Forbidden') {
    return new HttpError(403, msg);
  }
  static notFound(msg = 'Not Found') {
    return new HttpError(404, msg);
  }
  static conflict(msg = 'Conflict') {
    return new HttpError(409, msg);
  }
  static internal(msg = 'Internal Server Error') {
    return new HttpError(500, msg);
  }
}
