export class RequestError extends Error {
  constructor(
    message: string,
    public readonly details?: unknown,
    public readonly status = 400,
    public readonly code = 'BAD_REQUEST',
  ) {
    super(message);
    this.name = 'RequestError';
  }
}
