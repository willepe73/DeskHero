'use client';

import React from 'react';
import { cn } from '@/lib/utils';

type BadgeVariant =
  | 'green'
  | 'red'
  | 'yellow'
  | 'blue'
  | 'gray'
  | 'purple'
  | 'orange';

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
  dot?: boolean;
}

const variantClasses: Record<BadgeVariant, string> = {
  green: 'bg-green-100 text-green-800 border-green-200',
  red: 'bg-red-100 text-red-800 border-red-200',
  yellow: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  blue: 'bg-blue-100 text-blue-800 border-blue-200',
  gray: 'bg-gray-100 text-gray-700 border-gray-200',
  purple: 'bg-purple-100 text-purple-800 border-purple-200',
  orange: 'bg-orange-100 text-orange-800 border-orange-200',
};

const dotClasses: Record<BadgeVariant, string> = {
  green: 'bg-green-500',
  red: 'bg-red-500',
  yellow: 'bg-yellow-500',
  blue: 'bg-blue-500',
  gray: 'bg-gray-400',
  purple: 'bg-purple-500',
  orange: 'bg-orange-500',
};

export default function Badge({
  variant = 'gray',
  children,
  className,
  dot = false,
}: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border',
        variantClasses[variant],
        className
      )}
    >
      {dot && (
        <span
          className={cn('w-1.5 h-1.5 rounded-full shrink-0', dotClasses[variant])}
        />
      )}
      {children}
    </span>
  );
}

// Convenience helpers for common status types
export function ContractStatusBadge({ status }: { status: 'active' | 'terminated' }) {
  return (
    <Badge variant={status === 'active' ? 'green' : 'red'} dot>
      {status === 'active' ? 'Active' : 'Terminated'}
    </Badge>
  );
}

export function AssignmentStatusBadge({
  status,
}: {
  status: 'active' | 'completed' | 'cancelled';
}) {
  const map: Record<string, BadgeVariant> = {
    active: 'green',
    completed: 'blue',
    cancelled: 'gray',
  };
  return (
    <Badge variant={map[status] ?? 'gray'} dot>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  );
}

export function ProfileTypeBadge({
  type,
}: {
  type: 'freelance' | 'employee';
}) {
  return (
    <Badge variant={type === 'freelance' ? 'purple' : 'blue'}>
      {type === 'freelance' ? 'Freelancer' : 'Employee'}
    </Badge>
  );
}

export function ClientTypeBadge({
  type,
}: {
  type: 'intercompany' | 'end_client';
}) {
  return (
    <Badge variant={type === 'intercompany' ? 'orange' : 'blue'}>
      {type === 'intercompany' ? 'Intercompany' : 'End Client'}
    </Badge>
  );
}

export function ConsultantStatusBadge({
  status,
}: {
  status: 'active' | 'inactive';
}) {
  return (
    <Badge variant={status === 'active' ? 'green' : 'gray'} dot>
      {status === 'active' ? 'Active' : 'Inactive'}
    </Badge>
  );
}

export function ExpiryBadge({ endDate }: { endDate: string | undefined | null }) {
  if (!endDate) return <Badge variant="gray">No end date</Badge>;
  const daysLeft = Math.ceil(
    (new Date(endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );
  if (daysLeft < 0) return <Badge variant="red" dot>Expired</Badge>;
  if (daysLeft <= 30) return <Badge variant="yellow" dot>{daysLeft}d left</Badge>;
  return null;
}
