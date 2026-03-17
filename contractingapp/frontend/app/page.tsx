'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import {
  Users,
  Briefcase,
  AlertTriangle,
  FileText,
  TrendingUp,
  ArrowRight,
  Clock,
  CalendarClock,
} from 'lucide-react';
import { dashboardApi } from '@/lib/api';
import { formatDate, formatCurrency } from '@/lib/utils';
import { CardSkeleton, TableSkeleton } from '@/components/ui/LoadingSpinner';
import { ContractStatusBadge, ProfileTypeBadge, ExpiryBadge } from '@/components/ui/Badge';
import type { Assignment, Contract } from '@/lib/types';

interface MetricCardProps {
  title: string;
  value: number | string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  description?: string;
  href?: string;
}

function MetricCard({
  title,
  value,
  icon: Icon,
  color,
  bgColor,
  description,
  href,
}: MetricCardProps) {
  const content = (
    <div className="metric-card flex items-start gap-4 hover:shadow-md transition-shadow">
      <div className={`w-12 h-12 rounded-xl ${bgColor} flex items-center justify-center shrink-0`}>
        <Icon size={22} className={color} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-500 font-medium">{title}</p>
        <p className="text-3xl font-bold text-gray-900 mt-0.5">{value}</p>
        {description && (
          <p className="text-xs text-gray-400 mt-1">{description}</p>
        )}
      </div>
      {href && <ArrowRight size={16} className="text-gray-300 shrink-0 mt-1" />}
    </div>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }
  return content;
}

function ContractRow({ contract }: { contract: Contract }) {
  return (
    <tr className="hover:bg-gray-50 transition-colors">
      <td className="table-cell font-medium text-gray-900">
        <div>
          {contract.name}
          <div className="flex gap-1.5 mt-1">
            <ProfileTypeBadge type={contract.profile_type} />
            {contract.end_date && <ExpiryBadge endDate={contract.end_date} />}
          </div>
        </div>
      </td>
      <td className="table-cell">
        <ContractStatusBadge status={contract.status} />
      </td>
      <td className="table-cell text-gray-500">{formatDate(contract.start_date)}</td>
      <td className="table-cell text-gray-500">
        {contract.end_date ? formatDate(contract.end_date) : <span className="text-gray-300">Open-ended</span>}
      </td>
      <td className="table-cell text-gray-500">
        {contract.max_budget ? formatCurrency(contract.max_budget) : <span className="text-gray-300">—</span>}
      </td>
    </tr>
  );
}

function daysUntil(dateStr: string): number {
  const diff = new Date(dateStr).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function AssignmentExpiryRow({ assignment }: { assignment: Assignment }) {
  const days = daysUntil(assignment.end_date);
  return (
    <tr className="hover:bg-gray-50 transition-colors">
      <td className="table-cell font-medium text-gray-900">{assignment.timesheet_code}</td>
      <td className="table-cell text-gray-500">{formatDate(assignment.end_date)}</td>
      <td className="table-cell">
        <span
          className={
            days <= 7
              ? 'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700'
              : days <= 14
              ? 'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-700'
              : 'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700'
          }
        >
          {days <= 0 ? 'Today' : `${days}d left`}
        </span>
      </td>
      <td className="table-cell text-gray-500">{formatCurrency(assignment.client_tariff)}/day</td>
    </tr>
  );
}

export default function DashboardPage() {
  const { data: metrics, isLoading, error } = useQuery({
    queryKey: ['dashboard-metrics'],
    queryFn: dashboardApi.getMetrics,
    // Fallback to stub data if API not connected yet
    placeholderData: {
      active_freelancers: 0,
      active_employees: 0,
      upcoming_expirations: 0,
      recent_contracts: [],
      expiring_assignments: [],
    },
  });

  return (
    <div className="space-y-6">
      {/* Page heading */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Overview of your consulting operations
        </p>
      </div>

      {/* Metric cards */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Active Freelancers"
            value={metrics?.active_freelancers ?? 0}
            icon={Users}
            color="text-purple-600"
            bgColor="bg-purple-100"
            description="Currently on active contracts"
            href="/consultants"
          />
          <MetricCard
            title="Active Employees"
            value={metrics?.active_employees ?? 0}
            icon={Briefcase}
            color="text-blue-600"
            bgColor="bg-blue-100"
            description="Currently on active contracts"
            href="/consultants"
          />
          <MetricCard
            title="Expiring Contracts"
            value={metrics?.upcoming_expirations ?? 0}
            icon={AlertTriangle}
            color="text-yellow-600"
            bgColor="bg-yellow-100"
            description="Contracts expiring within 30 days"
            href="/contracts"
          />
          <MetricCard
            title="Expiring Assignments"
            value={metrics?.expiring_assignments?.length ?? 0}
            icon={CalendarClock}
            color="text-orange-600"
            bgColor="bg-orange-100"
            description="Assignments expiring within 30 days"
            href="/assignments"
          />
        </div>
      )}

      {/* Quick links */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Companies', href: '/companies', icon: Briefcase, color: 'text-orange-500' },
          { label: 'Clients', href: '/clients', icon: Users, color: 'text-teal-500' },
          { label: 'Contracts', href: '/contracts', icon: FileText, color: 'text-brand-500' },
          { label: 'Assignments', href: '/assignments', icon: TrendingUp, color: 'text-green-500' },
        ].map(({ label, href, icon: Icon, color }) => (
          <Link
            key={href}
            href={href}
            className="card p-4 flex items-center gap-3 hover:shadow-md transition-shadow group"
          >
            <Icon size={20} className={color} />
            <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">
              {label}
            </span>
            <ArrowRight
              size={14}
              className="ml-auto text-gray-300 group-hover:text-gray-500 transition-colors"
            />
          </Link>
        ))}
      </div>

      {/* Expiring assignments */}
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <CalendarClock size={17} className="text-orange-400" />
            <h2 className="text-base font-semibold text-gray-900">Expiring Assignments</h2>
            <span className="text-xs text-gray-400 font-normal">within 30 days</span>
          </div>
          <Link
            href="/assignments"
            className="flex items-center gap-1 text-sm text-brand-600 hover:text-brand-700 font-medium"
          >
            View all <ArrowRight size={14} />
          </Link>
        </div>

        {isLoading ? (
          <TableSkeleton rows={3} cols={4} />
        ) : error ? null : metrics?.expiring_assignments && metrics.expiring_assignments.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="table-header">Timesheet Code</th>
                  <th className="table-header">End Date</th>
                  <th className="table-header">Time Left</th>
                  <th className="table-header">Tariff</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {metrics.expiring_assignments.map((a) => (
                  <AssignmentExpiryRow key={a.id} assignment={a} />
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-gray-400">
            <CalendarClock size={32} className="mb-2 text-gray-200" />
            <p className="text-sm">No assignments expiring in the next 30 days</p>
          </div>
        )}
      </div>

      {/* Recent contracts */}
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Clock size={17} className="text-gray-400" />
            <h2 className="text-base font-semibold text-gray-900">Recent Contracts</h2>
          </div>
          <Link
            href="/contracts"
            className="flex items-center gap-1 text-sm text-brand-600 hover:text-brand-700 font-medium"
          >
            View all <ArrowRight size={14} />
          </Link>
        </div>

        {isLoading ? (
          <TableSkeleton rows={5} cols={5} />
        ) : error ? (
          <div className="flex items-center justify-center py-12 text-gray-400">
            <div className="text-center">
              <AlertTriangle size={32} className="mx-auto mb-2 text-yellow-400" />
              <p className="text-sm">Could not load metrics. Is the API running?</p>
            </div>
          </div>
        ) : metrics?.recent_contracts && metrics.recent_contracts.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="table-header">Contract</th>
                  <th className="table-header">Status</th>
                  <th className="table-header">Start Date</th>
                  <th className="table-header">End Date</th>
                  <th className="table-header">Budget</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {metrics.recent_contracts.map((contract) => (
                  <ContractRow key={contract.id} contract={contract} />
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-gray-400">
            <FileText size={32} className="mb-2 text-gray-200" />
            <p className="text-sm">No contracts yet</p>
            <Link
              href="/contracts"
              className="mt-2 text-sm text-brand-600 hover:underline"
            >
              Create your first contract
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
