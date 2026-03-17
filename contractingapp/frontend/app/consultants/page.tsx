'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Plus,
  Search,
  Users,
  Edit2,
  Trash2,
  UserCheck,
  UserX,
  AlertTriangle,
} from 'lucide-react';
import { freelancersApi, employeesApi, getApiErrorMessage } from '@/lib/api';
import { formatCurrency, formatDate, getFullName } from '@/lib/utils';
import type { FreelanceProfile, EmployeeProfile } from '@/lib/types';
import Button from '@/components/ui/Button';
import Input, { Select } from '@/components/ui/Input';
import Modal, { ConfirmModal } from '@/components/ui/Modal';
import { TableSkeleton } from '@/components/ui/LoadingSpinner';
import Pagination from '@/components/ui/Pagination';
import { ConsultantStatusBadge } from '@/components/ui/Badge';
import { useToast } from '@/components/ui/Toast';

// ─── Freelancer Form ──────────────────────────────────────────────────────────

const freelancerSchema = z.object({
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  fixed: z.boolean(),
  status: z.enum(['active', 'inactive']),
});

type FreelancerForm = z.infer<typeof freelancerSchema>;

function FreelancerFormModal({
  isOpen,
  onClose,
  profile,
}: {
  isOpen: boolean;
  onClose: () => void;
  profile?: FreelanceProfile;
}) {
  const qc = useQueryClient();
  const { success, error: toastError } = useToast();
  const isEditing = Boolean(profile);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FreelancerForm>({
    resolver: zodResolver(freelancerSchema),
    defaultValues: {
      first_name: profile?.first_name ?? '',
      last_name: profile?.last_name ?? '',
      fixed: profile?.fixed ?? false,
      status: profile?.status ?? 'active',
    },
  });

  React.useEffect(() => {
    if (isOpen) {
      reset({
        first_name: profile?.first_name ?? '',
        last_name: profile?.last_name ?? '',
        fixed: profile?.fixed ?? false,
        status: profile?.status ?? 'active',
      });
    }
  }, [isOpen, profile, reset]);

  const createMutation = useMutation({
    mutationFn: freelancersApi.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['freelancers'] });
      success('Freelancer added', 'New freelance profile created.');
      onClose();
    },
    onError: (err) => toastError('Failed to create freelancer', getApiErrorMessage(err)),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: FreelancerForm }) =>
      freelancersApi.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['freelancers'] });
      success('Freelancer updated', 'Changes have been saved.');
      onClose();
    },
    onError: (err) => toastError('Failed to update freelancer', getApiErrorMessage(err)),
  });

  const onSubmit = (data: FreelancerForm) => {
    if (isEditing && profile) {
      updateMutation.mutate({ id: profile.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Freelancer' : 'Add Freelancer'}
      description="Freelance consultant profile details"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button
            variant="primary"
            onClick={handleSubmit(onSubmit)}
            loading={isSubmitting || createMutation.isPending || updateMutation.isPending}
          >
            {isEditing ? 'Save Changes' : 'Add Freelancer'}
          </Button>
        </>
      }
    >
      <form className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="First Name"
            placeholder="Jean"
            error={errors.first_name?.message}
            required
            {...register('first_name')}
          />
          <Input
            label="Last Name"
            placeholder="Dupont"
            error={errors.last_name?.message}
            required
            {...register('last_name')}
          />
        </div>
        <Select
          label="Status"
          options={[
            { value: 'active', label: 'Active' },
            { value: 'inactive', label: 'Inactive' },
          ]}
          error={errors.status?.message}
          {...register('status')}
        />
        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
          <input
            type="checkbox"
            id="fixed"
            className="w-4 h-4 text-brand-600 rounded border-gray-300 focus:ring-brand-500"
            {...register('fixed')}
          />
          <label htmlFor="fixed" className="text-sm text-gray-700">
            Fixed rate (not day-based)
          </label>
        </div>
      </form>
    </Modal>
  );
}

// ─── Employee Form ────────────────────────────────────────────────────────────

const employeeSchema = z.object({
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  cronos_cost_price_220d: z.coerce
    .number({ invalid_type_error: 'Must be a number' })
    .min(0, 'Cost must be positive'),
  cronos_cost_price_180d: z.coerce
    .number({ invalid_type_error: 'Must be a number' })
    .min(0, 'Cost must be positive'),
  status: z.enum(['active', 'inactive']),
});

type EmployeeForm = z.infer<typeof employeeSchema>;

function EmployeeFormModal({
  isOpen,
  onClose,
  profile,
}: {
  isOpen: boolean;
  onClose: () => void;
  profile?: EmployeeProfile;
}) {
  const qc = useQueryClient();
  const { success, error: toastError } = useToast();
  const isEditing = Boolean(profile);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<EmployeeForm>({
    resolver: zodResolver(employeeSchema),
    defaultValues: {
      first_name: profile?.first_name ?? '',
      last_name: profile?.last_name ?? '',
      cronos_cost_price_220d: profile?.cronos_cost_price_220d ?? 0,
      cronos_cost_price_180d: profile?.cronos_cost_price_180d ?? 0,
      status: profile?.status ?? 'active',
    },
  });

  React.useEffect(() => {
    if (isOpen) {
      reset({
        first_name: profile?.first_name ?? '',
        last_name: profile?.last_name ?? '',
        cronos_cost_price_220d: profile?.cronos_cost_price_220d ?? 0,
        cronos_cost_price_180d: profile?.cronos_cost_price_180d ?? 0,
        status: profile?.status ?? 'active',
      });
    }
  }, [isOpen, profile, reset]);

  const createMutation = useMutation({
    mutationFn: employeesApi.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['employees'] });
      success('Employee added', 'New employee profile created.');
      onClose();
    },
    onError: (err) => toastError('Failed to create employee', getApiErrorMessage(err)),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: EmployeeForm }) =>
      employeesApi.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['employees'] });
      success('Employee updated', 'Changes have been saved.');
      onClose();
    },
    onError: (err) => toastError('Failed to update employee', getApiErrorMessage(err)),
  });

  const onSubmit = (data: EmployeeForm) => {
    if (isEditing && profile) {
      updateMutation.mutate({ id: profile.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Employee' : 'Add Employee'}
      description="Employee consultant profile details"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button
            variant="primary"
            onClick={handleSubmit(onSubmit)}
            loading={isSubmitting || createMutation.isPending || updateMutation.isPending}
          >
            {isEditing ? 'Save Changes' : 'Add Employee'}
          </Button>
        </>
      }
    >
      <form className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="First Name"
            placeholder="Marie"
            error={errors.first_name?.message}
            required
            {...register('first_name')}
          />
          <Input
            label="Last Name"
            placeholder="Martin"
            error={errors.last_name?.message}
            required
            {...register('last_name')}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Cost Price (220 days) €"
            type="number"
            step="0.01"
            placeholder="320"
            error={errors.cronos_cost_price_220d?.message}
            required
            hint="Annual / 220 working days"
            {...register('cronos_cost_price_220d')}
          />
          <Input
            label="Cost Price (180 days) €"
            type="number"
            step="0.01"
            placeholder="390"
            error={errors.cronos_cost_price_180d?.message}
            required
            hint="Annual / 180 working days"
            {...register('cronos_cost_price_180d')}
          />
        </div>
        <Select
          label="Status"
          options={[
            { value: 'active', label: 'Active' },
            { value: 'inactive', label: 'Inactive' },
          ]}
          error={errors.status?.message}
          {...register('status')}
        />
      </form>
    </Modal>
  );
}

// ─── Freelancer Detail Modal ──────────────────────────────────────────────────

function FreelancerDetailModal({
  profileId,
  onClose,
}: {
  profileId: string | null;
  onClose: () => void;
}) {
  const { data: profile, isLoading } = useQuery({
    queryKey: ['freelancer', profileId],
    queryFn: () => freelancersApi.get(profileId!),
    enabled: Boolean(profileId),
  });

  return (
    <Modal
      isOpen={Boolean(profileId)}
      onClose={onClose}
      title={profile ? getFullName(profile) : 'Freelancer Details'}
      description="Profile and contracts"
    >
      {isLoading ? (
        <div className="py-8 text-center text-sm text-gray-400">Loading…</div>
      ) : profile ? (
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-gray-500">Status</p>
              <p className="font-medium text-gray-900 capitalize">{profile.status}</p>
            </div>
            <div>
              <p className="text-gray-500">Type</p>
              <p className="font-medium text-gray-900">{profile.fixed ? 'Fixed' : 'Daily'}</p>
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Contracts</p>
            {!profile.contracts?.length ? (
              <p className="text-sm text-gray-400 py-4 text-center">No contracts found</p>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="table-header">Name</th>
                    <th className="table-header">Purchase Rate</th>
                    <th className="table-header">Status</th>
                    <th className="table-header">Start</th>
                    <th className="table-header">End</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {profile.contracts.map((c) => (
                    <tr key={c.id}>
                      <td className="table-cell">{c.name}</td>
                      <td className="table-cell">{formatCurrency(c.purchase_rate)}</td>
                      <td className="table-cell capitalize">{c.status}</td>
                      <td className="table-cell">{formatDate(c.start_date)}</td>
                      <td className="table-cell">{c.end_date ? formatDate(c.end_date) : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      ) : null}
    </Modal>
  );
}

// ─── Employee Detail Modal ────────────────────────────────────────────────────

function EmployeeDetailModal({
  profileId,
  onClose,
}: {
  profileId: string | null;
  onClose: () => void;
}) {
  const { data: profile, isLoading } = useQuery({
    queryKey: ['employee', profileId],
    queryFn: () => employeesApi.get(profileId!),
    enabled: Boolean(profileId),
  });

  return (
    <Modal
      isOpen={Boolean(profileId)}
      onClose={onClose}
      title={profile ? getFullName(profile) : 'Employee Details'}
      description="Profile and assignments"
    >
      {isLoading ? (
        <div className="py-8 text-center text-sm text-gray-400">Loading…</div>
      ) : profile ? (
        <div className="space-y-5">
          <div className="grid grid-cols-3 gap-3 text-sm">
            <div>
              <p className="text-gray-500">Status</p>
              <p className="font-medium text-gray-900 capitalize">{profile.status}</p>
            </div>
            <div>
              <p className="text-gray-500">Cost/day (220d)</p>
              <p className="font-medium text-gray-900">{formatCurrency(profile.cronos_cost_price_220d)}</p>
            </div>
            <div>
              <p className="text-gray-500">Cost/day (180d)</p>
              <p className="font-medium text-gray-900">{formatCurrency(profile.cronos_cost_price_180d)}</p>
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Assignments</p>
            {!profile.assignments?.length ? (
              <p className="text-sm text-gray-400 py-4 text-center">No assignments found</p>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="table-header">Timesheet Code</th>
                    <th className="table-header">Client Tariff</th>
                    <th className="table-header">Type</th>
                    <th className="table-header">Status</th>
                    <th className="table-header">Start</th>
                    <th className="table-header">End</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {profile.assignments.map((a) => (
                    <tr key={a.id}>
                      <td className="table-cell font-mono text-xs">{a.timesheet_code}</td>
                      <td className="table-cell">{formatCurrency(a.client_tariff)}</td>
                      <td className="table-cell capitalize">{a.tariff_type.replace('_', ' ')}</td>
                      <td className="table-cell capitalize">{a.status}</td>
                      <td className="table-cell">{formatDate(a.start_date)}</td>
                      <td className="table-cell">{a.end_date ? formatDate(a.end_date) : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      ) : null}
    </Modal>
  );
}

// ─── Freelancers Tab ──────────────────────────────────────────────────────────

function FreelancersTab() {
  const qc = useQueryClient();
  const { success, error: toastError } = useToast();
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;

  const [formOpen, setFormOpen] = useState(false);
  const [editProfile, setEditProfile] = useState<FreelanceProfile | undefined>();
  const [deleteProfile, setDeleteProfile] = useState<FreelanceProfile | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);

  React.useEffect(() => {
    const t = setTimeout(() => { setDebouncedSearch(search); setPage(1); }, 350);
    return () => clearTimeout(t);
  }, [search]);

  const { data, isLoading, error } = useQuery({
    queryKey: ['freelancers', debouncedSearch, statusFilter, page],
    queryFn: () =>
      freelancersApi.list({ search: debouncedSearch, status: statusFilter || undefined, page, size: PAGE_SIZE }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => freelancersApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['freelancers'] });
      success('Freelancer deleted');
      setDeleteProfile(null);
    },
    onError: (err) => toastError('Failed to delete', getApiErrorMessage(err)),
  });

  const openCreate = () => { setEditProfile(undefined); setFormOpen(true); };
  const openEdit = (p: FreelanceProfile) => { setEditProfile(p); setFormOpen(true); };

  return (
    <div className="space-y-4">
      <div className="flex gap-3 flex-wrap items-center justify-between">
        <div className="flex gap-2 flex-wrap">
          <Input
            placeholder="Search freelancers…"
            leftAddon={<Search size={15} />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-56"
          />
          <Select
            options={[
              { value: '', label: 'All Statuses' },
              { value: 'active', label: 'Active' },
              { value: 'inactive', label: 'Inactive' },
            ]}
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="w-36"
          />
        </div>
        <Button variant="primary" size="sm" leftIcon={<Plus size={14} />} onClick={openCreate}>
          Add Freelancer
        </Button>
      </div>

      <div className="card overflow-hidden">
        {isLoading ? (
          <TableSkeleton rows={6} cols={5} />
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-400">
            <AlertTriangle size={28} className="mb-2 text-yellow-400" />
            <p className="text-sm">Failed to load freelancers</p>
          </div>
        ) : !data?.items.length ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-400">
            <Users size={36} className="mb-2 text-gray-200" />
            <p className="text-sm">No freelancers found</p>
          </div>
        ) : (
          <>
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="table-header">Name</th>
                  <th className="table-header">Type</th>
                  <th className="table-header">Status</th>
                  <th className="table-header w-24">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {data.items.map((p) => (
                  <tr
                    key={p.id}
                    className="hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => setDetailId(p.id)}
                  >
                    <td className="table-cell">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-sm font-semibold text-purple-700 shrink-0">
                          {p.first_name.charAt(0)}{p.last_name.charAt(0)}
                        </div>
                        <span className="font-medium text-gray-900">{getFullName(p)}</span>
                      </div>
                    </td>
                    <td className="table-cell">
                      <span className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-600">
                        {p.fixed ? 'Fixed' : 'Daily'}
                      </span>
                    </td>
                    <td className="table-cell">
                      <ConsultantStatusBadge status={p.status} />
                    </td>
                    <td className="table-cell" onClick={(e) => e.stopPropagation()}>
                      <div className="flex gap-1">
                        <button
                          onClick={() => openEdit(p)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-brand-600 hover:bg-brand-50 transition-colors"
                          title="Edit"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => setDeleteProfile(p)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {data.pages > 1 && (
              <Pagination page={page} totalPages={data.pages} total={data.total} pageSize={PAGE_SIZE} onPageChange={setPage} />
            )}
          </>
        )}
      </div>

      <FreelancerDetailModal profileId={detailId} onClose={() => setDetailId(null)} />
      <FreelancerFormModal isOpen={formOpen} onClose={() => setFormOpen(false)} profile={editProfile} />
      <ConfirmModal
        isOpen={Boolean(deleteProfile)}
        onClose={() => setDeleteProfile(null)}
        onConfirm={() => deleteProfile && deleteMutation.mutate(deleteProfile.id)}
        title="Delete Freelancer"
        message={`Are you sure you want to delete ${getFullName(deleteProfile)}? This action cannot be undone.`}
        confirmLabel="Delete"
        loading={deleteMutation.isPending}
      />
    </div>
  );
}

// ─── Employees Tab ────────────────────────────────────────────────────────────

function EmployeesTab() {
  const qc = useQueryClient();
  const { success, error: toastError } = useToast();
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;

  const [formOpen, setFormOpen] = useState(false);
  const [editProfile, setEditProfile] = useState<EmployeeProfile | undefined>();
  const [deleteProfile, setDeleteProfile] = useState<EmployeeProfile | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);

  React.useEffect(() => {
    const t = setTimeout(() => { setDebouncedSearch(search); setPage(1); }, 350);
    return () => clearTimeout(t);
  }, [search]);

  const { data, isLoading, error } = useQuery({
    queryKey: ['employees', debouncedSearch, statusFilter, page],
    queryFn: () =>
      employeesApi.list({ search: debouncedSearch, status: statusFilter || undefined, page, size: PAGE_SIZE }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => employeesApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['employees'] });
      success('Employee deleted');
      setDeleteProfile(null);
    },
    onError: (err) => toastError('Failed to delete', getApiErrorMessage(err)),
  });

  const openCreate = () => { setEditProfile(undefined); setFormOpen(true); };
  const openEdit = (p: EmployeeProfile) => { setEditProfile(p); setFormOpen(true); };

  return (
    <div className="space-y-4">
      <div className="flex gap-3 flex-wrap items-center justify-between">
        <div className="flex gap-2 flex-wrap">
          <Input
            placeholder="Search employees…"
            leftAddon={<Search size={15} />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-56"
          />
          <Select
            options={[
              { value: '', label: 'All Statuses' },
              { value: 'active', label: 'Active' },
              { value: 'inactive', label: 'Inactive' },
            ]}
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="w-36"
          />
        </div>
        <Button variant="primary" size="sm" leftIcon={<Plus size={14} />} onClick={openCreate}>
          Add Employee
        </Button>
      </div>

      <div className="card overflow-hidden">
        {isLoading ? (
          <TableSkeleton rows={6} cols={5} />
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-400">
            <AlertTriangle size={28} className="mb-2 text-yellow-400" />
            <p className="text-sm">Failed to load employees</p>
          </div>
        ) : !data?.items.length ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-400">
            <Users size={36} className="mb-2 text-gray-200" />
            <p className="text-sm">No employees found</p>
          </div>
        ) : (
          <>
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="table-header">Name</th>
                  <th className="table-header">Cost/day (220d)</th>
                  <th className="table-header">Cost/day (180d)</th>
                  <th className="table-header">Status</th>
                  <th className="table-header w-24">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {data.items.map((p) => (
                  <tr
                    key={p.id}
                    className="hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => setDetailId(p.id)}
                  >
                    <td className="table-cell">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-sm font-semibold text-blue-700 shrink-0">
                          {p.first_name.charAt(0)}{p.last_name.charAt(0)}
                        </div>
                        <span className="font-medium text-gray-900">{getFullName(p)}</span>
                      </div>
                    </td>
                    <td className="table-cell">{formatCurrency(p.cronos_cost_price_220d)}</td>
                    <td className="table-cell">{formatCurrency(p.cronos_cost_price_180d)}</td>
                    <td className="table-cell">
                      <ConsultantStatusBadge status={p.status} />
                    </td>
                    <td className="table-cell" onClick={(e) => e.stopPropagation()}>
                      <div className="flex gap-1">
                        <button
                          onClick={() => openEdit(p)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-brand-600 hover:bg-brand-50 transition-colors"
                          title="Edit"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => setDeleteProfile(p)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {data.pages > 1 && (
              <Pagination page={page} totalPages={data.pages} total={data.total} pageSize={PAGE_SIZE} onPageChange={setPage} />
            )}
          </>
        )}
      </div>

      <EmployeeDetailModal profileId={detailId} onClose={() => setDetailId(null)} />
      <EmployeeFormModal isOpen={formOpen} onClose={() => setFormOpen(false)} profile={editProfile} />
      <ConfirmModal
        isOpen={Boolean(deleteProfile)}
        onClose={() => setDeleteProfile(null)}
        onConfirm={() => deleteProfile && deleteMutation.mutate(deleteProfile.id)}
        title="Delete Employee"
        message={`Are you sure you want to delete ${getFullName(deleteProfile)}? This action cannot be undone.`}
        confirmLabel="Delete"
        loading={deleteMutation.isPending}
      />
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

type Tab = 'freelancers' | 'employees';

export default function ConsultantsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('freelancers');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Consultants</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Manage freelancers and employees
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-gray-100 rounded-xl w-fit">
        {(['freelancers', 'employees'] as Tab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab === 'freelancers' ? (
              <UserCheck size={15} />
            ) : (
              <UserX size={15} />
            )}
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {activeTab === 'freelancers' ? <FreelancersTab /> : <EmployeesTab />}
    </div>
  );
}
