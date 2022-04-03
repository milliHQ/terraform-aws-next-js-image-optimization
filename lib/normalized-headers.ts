/**
 * Normalizes the headers from API Gateway 2.0 format
 */
export function normalizeHeaders(
  headers: Record<string, string>
): Record<string, string> {
  const _headers: Record<string, string> = {};

  for (const [key, value] of Object.entries(headers)) {
    _headers[key.toLowerCase()] = value;
  }

  return _headers;
}
