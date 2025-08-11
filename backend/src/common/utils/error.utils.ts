export function isError(error: unknown): error is Error {
  return typeof error === 'object' && error !== null && 'message' in error;
}

export function getErrorMessage(error: unknown): string {
  if (isError(error)) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'Unknown error occurred';
}

export function hasErrorProperty(error: unknown, property: string): boolean {
  return typeof error === 'object' && error !== null && property in error;
}

export function getErrorProperty(error: unknown, property: string): unknown {
  if (hasErrorProperty(error, property)) {
    return (error as any)[property];
  }
  return undefined;
}
