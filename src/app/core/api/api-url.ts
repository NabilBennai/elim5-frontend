import { environment } from '../../../environments/environment';

function getBaseUrl() {
  return environment.apiBaseUrl.replace(/\/$/, '');
}

export function buildApiUrl(path: string) {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${getBaseUrl()}${normalizedPath}`;
}
