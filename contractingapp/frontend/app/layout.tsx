'use client';

import React, { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { isAuthenticated } from '@/lib/auth';
import { ToastProvider } from '@/components/ui/Toast';
import Sidebar from '@/components/Layout/Sidebar';
import Header from '@/components/Layout/Header';
import { FullPageSpinner } from '@/components/ui/LoadingSpinner';
import './globals.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2,       // 2 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const PUBLIC_PATHS = ['/login'];

function AuthGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const isPublic = PUBLIC_PATHS.includes(pathname);

  useEffect(() => {
    const authenticated = isAuthenticated();
    if (!authenticated && !isPublic) {
      router.replace('/login');
    } else if (authenticated && pathname === '/login') {
      router.replace('/');
    } else {
      setChecking(false);
    }
  }, [pathname, isPublic, router]);

  if (checking && !isPublic) return <FullPageSpinner />;
  return <>{children}</>;
}

function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isPublic = PUBLIC_PATHS.includes(pathname);

  if (isPublic) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex flex-col flex-1 ml-60">
        <Header />
        <main className="flex-1 pt-14 p-6 bg-gray-50 min-h-screen">
          {children}
        </main>
      </div>
    </div>
  );
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>ContractPro — Consultant Management</title>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <QueryClientProvider client={queryClient}>
          <ToastProvider>
            <AuthGuard>
              <AppShell>{children}</AppShell>
            </AuthGuard>
          </ToastProvider>
          <ReactQueryDevtools initialIsOpen={false} />
        </QueryClientProvider>
      </body>
    </html>
  );
}
