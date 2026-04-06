const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1']);

function getBaseUrl() {
  if (typeof window === 'undefined') {
    return '/api';
  }

  const { hostname } = window.location;

  if (LOCAL_HOSTS.has(hostname)) {
    return 'http://localhost:3000';
  }

  return `${window.location.origin}/api`;
}

export function buildApiUrl(path: string) {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${getBaseUrl()}${normalizedPath}`;
}
