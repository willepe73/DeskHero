'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeClasses = {
  xs: 'w-3 h-3 border-[1.5px]',
  sm: 'w-4 h-4 border-2',
  md: 'w-6 h-6 border-2',
  lg: 'w-8 h-8 border-[3px]',
};

export default function LoadingSpinner({
  size = 'md',
  className,
}: LoadingSpinnerProps) {
  return (
    <span
      className={cn(
        'inline-block rounded-full border-current border-t-transparent animate-spin',
        sizeClasses[size],
        className
      )}
      role="status"
      aria-label="Loading"
    />
  );
}

export function FullPageSpinner() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <LoadingSpinner size="lg" className="text-brand-600 mx-auto" />
        <p className="mt-3 text-sm text-gray-500">Loading…</p>
      </div>
    </div>
  );
}

export function TableSkeleton({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="overflow-hidden">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="flex gap-4 px-4 py-3 border-b border-gray-100"
        >
          {Array.from({ length: cols }).map((_, j) => (
            <div
              key={j}
              className={cn(
                'h-4 rounded skeleton',
                j === 0 ? 'w-1/4' : j === cols - 1 ? 'w-1/6' : 'flex-1'
              )}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="card p-6 space-y-3">
      <div className="h-4 w-1/3 rounded skeleton" />
      <div className="h-8 w-1/2 rounded skeleton" />
      <div className="h-3 w-2/3 rounded skeleton" />
    </div>
  );
}
