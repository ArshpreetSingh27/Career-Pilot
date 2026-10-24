import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.tsx';
import './index.css';
import './workspace.css';
import { ThemeProvider } from './contexts/ThemeContext.tsx';
import { AuthProvider } from './contexts/AuthContext.tsx';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';

// Deployment-specific Vercel URLs share this build, but the API intentionally
// accepts browser requests only from the configured production origin.
const canonicalOrigin = import.meta.env.VITE_CANONICAL_ORIGIN;
let redirectingToCanonicalOrigin = false;
if (import.meta.env.PROD && canonicalOrigin && window.location.hostname.endsWith('.vercel.app')) {
  try {
    const canonical = new URL(canonicalOrigin);
    if (canonical.protocol === 'https:' && canonical.hostname.endsWith('.vercel.app') && window.location.origin !== canonical.origin) {
      window.location.replace(`${canonical.origin}${window.location.pathname}${window.location.search}${window.location.hash}`);
      redirectingToCanonicalOrigin = true;
    }
  } catch { /* Invalid optional build setting: leave navigation unchanged. */ }
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

if (!redirectingToCanonicalOrigin) ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ThemeProvider>
          <AuthProvider>
            <App />
            <Toaster position="top-right" toastOptions={{ style: { background: 'var(--panel)', color: 'var(--ink)', border: '1px solid var(--line)', borderRadius: '10px', fontSize: '13px' } }} />
          </AuthProvider>
        </ThemeProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>
);
