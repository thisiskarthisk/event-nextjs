import axios from "axios";

const APP_API_BASE_URL = '/api/v1';

function appBackendURL(url) {
  if (!(url.startsWith('http://') || url.startsWith('https://'))) {
    url = APP_API_BASE_URL + '/' + url.replace(/^\//, '');
  }

  return url;
}

export async function HttpClient({ url, method, params = {}, data = null, isJSONReq = true, headers = {} }) {
  try {
    if (!headers) {
      headers = {};
    }

    if (!params) {
      params = {};
    }

    if (data instanceof FormData) {
      headers['Content-Type'] = 'application/form-data';
    } else if (isJSONReq || !('Content-Type' in headers)) {
      headers['Content-Type'] = 'application/json';
    }

    if (isJSONReq || !('Accept' in headers)) {
      headers['Accept'] = 'application/json';
    }

    const response = await axios.request({
      url: appBackendURL(url),
      method,
      data,
      params,
      headers
    });

    if (response && response.data) {
      return response.data;
    }
  } catch(error) {
    console.error('[HttpClient] Error occurred:', error);

    return error.response && error.response.data ? error.response.data : null;
  }

  return null;
}

export async function swrFetcher([url, params = {}]) {
  return await HttpClient({
    url,
    method: 'GET',
    params: (params || {}),
  });
}
