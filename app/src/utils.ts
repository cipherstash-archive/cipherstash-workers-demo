export function cn(...values: (string | null | undefined | false)[]): string {
  return values.filter((x) => !!x).join(" ");
}

function getApiBaseUrl(): string {
  const baseUrl = import.meta.env.VITE_API_DOMAIN;

  if (typeof baseUrl !== "string") {
    throw new Error("Expected baseUrl to be set and a string");
  }

  try {
    new URL(baseUrl);
  } catch (e) {
    throw new Error(`Expected baseUrl (${baseUrl}) to be a fully formed URL`);
  }

  if (baseUrl.endsWith("/")) {
    return baseUrl.slice(0, -1);
  } else {
    return baseUrl;
  }
}

const BASE_URL = getApiBaseUrl();

export function apiUrl(endpoint: string): string {
  if (endpoint.startsWith("/")) {
    endpoint = endpoint.slice(1);
  }

  return `${BASE_URL}/${endpoint}`;
}
