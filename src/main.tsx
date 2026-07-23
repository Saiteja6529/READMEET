import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Intercept fetch calls to google client to route through our server proxy
const originalFetch = window.fetch;
window.fetch = async function (input: RequestInfo | URL, init?: RequestInit) {
  let url = '';
  if (typeof input === 'string') {
    url = input;
  } else if (input instanceof URL) {
    url = input.toString();
  } else if (input && typeof input === 'object' && 'url' in (input as any)) {
    url = (input as any).url;
  }

  if (url.includes('generativelanguage.googleapis.com')) {
    const urlObj = new URL(url);
    const newUrl = '/api/gemini-proxy' + urlObj.pathname + urlObj.search;
    
    // If the input is a Request object, we need to extract its parameters
    if (input instanceof Request) {
      const requestInit: RequestInit = {
        method: input.method,
        headers: (() => {
          const h: Record<string, string> = {};
          input.headers.forEach((v, k) => { h[k] = v; });
          return h;
        })(),
        body: input.body,
        credentials: input.credentials,
        mode: input.mode,
      };
      return originalFetch(newUrl, { ...requestInit, ...init });
    }
    
    return originalFetch(newUrl, init);
  }

  return originalFetch(input, init);
};


createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
