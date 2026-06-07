function getApiBaseUrl() {
  const hostname = window.location.hostname;
  const protocol = window.location.protocol;

  if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname.includes('172.')) {
    return `${protocol}//localhost:8000`;
  }

  return '';
}

const API_BASE_URL = getApiBaseUrl();
