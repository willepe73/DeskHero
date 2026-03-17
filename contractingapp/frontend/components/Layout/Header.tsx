'use client';

import React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { LogOut, Bell, ChevronRight } from 'lucide-react';
import { removeToken, getDecodedToken } from '@/lib/auth';
import Button from '@/components/ui/Button';

const pageTitles: Record<string, string> = {
  '/': 'Dashboard',
  '/companies': 'Companies',
  '/consultants': 'Consultants',
  '/clients': 'Clients',
  '/contracts': 'Contracts',
  '/assignments': 'Assignments',
};

function getBreadcrumbs(pathname: string): { label: string; href?: string }[] {
  const base = pageTitles[pathname] ?? pageTitles[pathname.split('/')[1] ? `/${pathname.split('/')[1]}` : '/'];
  if (!base) return [{ label: 'Page' }];
  if (pathname === '/') return [{ label: 'Dashboard' }];
  return [
    { label: 'Home', href: '/' },
    { label: base },
  ];
}

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const user = getDecodedToken();
  const breadcrumbs = getBreadcrumbs(pathname);

  const handleLogout = () => {
    removeToken();
    router.push('/login');
    router.refresh();
  };

  const title = pageTitles[pathname] ?? 'Page';

  return (
    <header className="fixed top-0 left-60 right-0 z-20 h-14 bg-white border-b border-gray-200 flex items-center justify-between px-6">
      {/* Left: breadcrumbs */}
      <div className="flex items-center gap-1.5 text-sm">
        {breadcrumbs.map((crumb, idx) => (
          <React.Fragment key={idx}>
            {idx > 0 && <ChevronRight size={14} className="text-gray-400" />}
            {crumb.href ? (
              <a
                href={crumb.href}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                {crumb.label}
              </a>
            ) : (
              <span className="text-gray-900 font-semibold">{crumb.label}</span>
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Right: user actions */}
      <div className="flex items-center gap-3">
        <button
          className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          aria-label="Notifications"
        >
          <Bell size={17} />
        </button>

        {user && (
          <div className="flex items-center gap-2 pl-2 border-l border-gray-200">
            <div className="w-7 h-7 rounded-full bg-brand-600 flex items-center justify-center text-xs font-bold text-white">
              {user.sub?.charAt(0).toUpperCase() ?? 'U'}
            </div>
            <span className="text-sm font-medium text-gray-700 max-w-[120px] truncate">
              {user.sub}
            </span>
          </div>
        )}

        <Button
          variant="ghost"
          size="sm"
          onClick={handleLogout}
          leftIcon={<LogOut size={15} />}
          className="text-gray-500 hover:text-red-600"
        >
          Sign out
        </Button>
      </div>
    </header>
  );
}
