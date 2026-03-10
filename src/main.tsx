import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import './index.css'
import App from './App.tsx'
import { TenantProvider } from './contexts/TenantContext'
import { AuthProvider } from './contexts/AuthContext'

const queryClient = new QueryClient()

console.log('Main.tsx: Starting application...');
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <TenantProvider>
        <AuthProvider>
          <App />
        </AuthProvider>
      </TenantProvider>
    </QueryClientProvider>
  </StrictMode>,
)
