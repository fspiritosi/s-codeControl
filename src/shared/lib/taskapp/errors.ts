export class TaskAppError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: 'config' | 'http' | 'network' | 'parse',
    message: string
  ) {
    super(message);
    this.name = 'TaskAppError';
  }
}
