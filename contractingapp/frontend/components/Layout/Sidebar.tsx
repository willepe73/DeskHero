'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Building2,
  Users,
  Briefcase,
  FileText,
  ClipboardList,
  Shield,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { getDecodedToken } from '@/lib/auth';

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/companies', label: 'Companies', icon: Building2 },
  { href: '/consultants', label: 'Consultants', icon: Users },
  { href: '/clients', label: 'Clients', icon: Briefcase },
  { href: '/contracts', label: 'Contracts', icon: FileText },
  { href: '/assignments', label: 'Assignments', icon: ClipboardList },
];

export default function Sidebar() {
  const pathname = usePathname();
  const user = getDecodedToken();

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  return (
    <aside className="flex flex-col w-60 shrink-0 h-screen bg-brand-800 text-white fixed left-0 top-0 z-30">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 py-5 border-b border-brand-700">
        <div className="w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center shrink-0">
          <Shield size={16} className="text-white" />
        </div>
        <div>
          <p className="text-sm font-bold text-white leading-tight">ContractPro</p>
          <p className="text-[10px] text-brand-300 leading-tight">Management Suite</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        <p className="px-3 mb-2 text-[10px] font-semibold text-brand-400 uppercase tracking-widest">
          Main Menu
        </p>
        {navItems.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              'sidebar-link',
              isActive(href)
                ? 'sidebar-link-active'
                : 'sidebar-link-inactive'
            )}
          >
            <Icon size={17} className="shrink-0" />
            <span>{label}</span>
          </Link>
        ))}
      </nav>

      {/* User info */}
      {user && (
        <div className="px-3 pb-4 pt-3 border-t border-brand-700">
          <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg bg-brand-700/50">
            <div className="w-7 h-7 rounded-full bg-brand-500 flex items-center justify-center shrink-0 text-xs font-bold">
              {user.sub?.charAt(0).toUpperCase() ?? 'U'}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-white truncate">
                {user.sub}
              </p>
              <p className="text-[10px] text-brand-300 capitalize">
                {user.role?.replace('_', ' ') ?? 'User'}
              </p>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
