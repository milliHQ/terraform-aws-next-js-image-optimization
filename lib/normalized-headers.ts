import { IncomingHttpHeaders } from 'http';

/**
 * Normalizes the headers from API Gateway 2.0 format
 */
export function normalizeHeaders(
  headers: Record<string, string>
): IncomingHttpHeaders {
  const _headers: IncomingHttpHeaders = {};

  for (const [key, value] of Object.entries(headers)) {
    _headers[key.toLocaleLowerCase()] = value;
  }

  return _headers;
}
