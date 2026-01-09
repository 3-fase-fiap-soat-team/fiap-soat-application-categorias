export abstract class ExceptionBase extends Error {
    abstract code: string

  constructor(
    readonly message: string,
    readonly cause?: Error,
  ) {
    super(message);
    Error.captureStackTrace(this, this.constructor);
  }

  toJson() {
    return {
      message: this.message,
      code: this.code,
      stack: this.stack,
      cause: JSON.stringify(this.cause),
    };
  }
}