import { parse as parseUrl, URLSearchParams, UrlWithParsedQuery } from 'url';

type GenerateParamsOptions = {
  w?: string;
  q?: string;
};

type GenerateParamsResult = {
  url: string;
  parsedUrl: UrlWithParsedQuery;
  params: Record<string, string>;
};

export function generateParams(
  url: string,
  options: GenerateParamsOptions = {}
): GenerateParamsResult {
  const encodedUrl = encodeURIComponent(url);
  const params = new URLSearchParams();
  params.append('url', url);
  options.q && params.append('q', options.q);
  options.w && params.append('w', options.w);

  const parsedUrl = parseUrl(`/?${params.toString()}`, true);

  return {
    url: encodedUrl,
    parsedUrl,
    params: Object.fromEntries(params),
  };
}

export type GenerateParams = ReturnType<typeof generateParams>;
