export class AppError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message)
    this.name = 'AppError'
  }
}

export const notFound = (message: string) => new AppError(404, message)
export const upstreamError = (message = 'Failed to fetch market data') =>
  new AppError(502, message)
