// ----------------------------------------------------------------------

export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  } else if (typeof error === 'string') {
    return error;
  } else if (typeof error === 'object' && error !== null) {
    // API response format: { status_code, data, error: "..." }
    if ('error' in error && typeof (error as any).error === 'string') {
      return (error as { error: string }).error;
    }
    if ('message' in error && typeof (error as any).message === 'string') {
      return (error as { message: string }).message;
    }
  }
  return 'Ha ocurrido un error inesperado.';
}
