'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Plus,
  Search,
  ClipboardList,
  Edit2,
  Trash2,
  AlertTriangle,
  Hash,
  DollarSign,
} from 'lucide-react';
import {
  assignmentsApi,
  contractsApi,
  clientsApi,
  employeesApi,
  getApiErrorMessage,
} from '@/lib/api';
import { formatDate, formatCurrency, getFullName } from '@/lib/utils';
import type { Assignment } from '@/lib/types';
import Button from '@/components/ui/Button';
import Input, { Select, TextArea } from '@/components/ui/Input';
import Modal, { ConfirmModal } from '@/components/ui/Modal';
import { TableSkeleton } from '@/components/ui/LoadingSpinner';
import Pagination from '@/components/ui/Pagination';
import { AssignmentStatusBadge } from '@/components/ui/Badge';
import { useToast } from '@/components/ui/Toast';
import { cn } from '@/lib/utils';

// ─── Form Schema ──────────────────────────────────────────────────────────────

const assignmentSchema = z
  .object({
    contract_id: z.string().optional(),
    employee_id: z.string().optional(),
    client_id: z.string().min(1, 'Client (billing) is required'),
    end_client_id: z.string().min(1, 'End client is required'),
    timesheet_code: z
      .string()
      .min(1, 'Timesheet code is required')
      .regex(/^[A-Z0-9_-]+$/i, 'Code may only contain letters, numbers, hyphens, and underscores'),
    start_date: z.string().min(1, 'Start date is required'),
    end_date: z.string().min(1, 'End date is required'),
    client_tariff: z.coerce
      .number({ invalid_type_error: 'Must be a number' })
      .min(0, 'Tariff must be positive'),
    end_tariff: z.coerce.number().min(0).optional().or(z.literal('')),
    tariff_type: z.enum(['percentage', '50_50', 'end_tariff']),
    remarks: z.string().optional(),
    status: z.enum(['active', 'completed', 'cancelled']),
  })
  .refine(
    (data) => Boolean(data.contract_id) !== Boolean(data.employee_id),
    { message: 'Select either a contract or an employee', path: ['contract_id'] }
  );

type AssignmentForm = z.infer<typeof assignmentSchema>;

type AssignmentType = 'contract' | 'employee';

// ─── Assignment Form Modal ─────────────────────────────────────────────────────

function AssignmentFormModal({
  isOpen,
  onClose,
  assignment,
}: {
  isOpen: boolean;
  onClose: () => void;
  assignment?: Assignment;
}) {
  const qc = useQueryClient();
  const { success, error: toastError } = useToast();
  const isEditing = Boolean(assignment);

  const [assignmentType, setAssignmentType] = useState<AssignmentType>(
    assignment?.employee_id ? 'employee' : 'contract'
  );

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<AssignmentForm>({
    resolver: zodResolver(assignmentSchema),
    defaultValues: {
      contract_id: assignment?.contract_id ?? '',
      employee_id: assignment?.employee_id ?? '',
      client_id: assignment?.client_id ?? '',
      end_client_id: assignment?.end_client_id ?? '',
      timesheet_code: assignment?.timesheet_code ?? '',
      start_date: assignment?.start_date?.slice(0, 10) ?? '',
      end_date: assignment?.end_date?.slice(0, 10) ?? '',
      client_tariff: assignment?.client_tariff ?? 0,
      end_tariff: assignment?.end_tariff ?? '',
      tariff_type: assignment?.tariff_type ?? 'percentage',
      remarks: assignment?.remarks ?? '',
      status: assignment?.status ?? 'active',
    },
  });

  const tariffType = watch('tariff_type');

  React.useEffect(() => {
    if (isOpen) {
      const type = assignment?.employee_id ? 'employee' : 'contract';
      setAssignmentType(type);
      reset({
        contract_id: assignment?.contract_id ?? '',
        employee_id: assignment?.employee_id ?? '',
        client_id: assignment?.client_id ?? '',
        end_client_id: assignment?.end_client_id ?? '',
        timesheet_code: assignment?.timesheet_code ?? '',
        start_date: assignment?.start_date?.slice(0, 10) ?? '',
        end_date: assignment?.end_date?.slice(0, 10) ?? '',
        client_tariff: assignment?.client_tariff ?? 0,
        end_tariff: assignment?.end_tariff ?? '',
        tariff_type: assignment?.tariff_type ?? 'percentage',
        remarks: assignment?.remarks ?? '',
        status: assignment?.status ?? 'active',
      });
    }
  }, [isOpen, assignment, reset]);

  // Clear opposing field when toggle changes
  const handleTypeChange = (type: AssignmentType) => {
    setAssignmentType(type);
    if (type === 'contract') {
      setValue('employee_id', '');
    } else {
      setValue('contract_id', '');
    }
  };

  // Load select options
  const { data: contracts } = useQuery({
    queryKey: ['contracts-select'],
    queryFn: () => contractsApi.list({ status: 'active', size: 100 }),
  });
  const { data: employees } = useQuery({
    queryKey: ['employees-select'],
    queryFn: () => employeesApi.list({ status: 'active', size: 100 }),
  });
  const { data: clients } = useQuery({
    queryKey: ['clients-select'],
    queryFn: () => clientsApi.list({ size: 100 }),
  });

  const contractOptions =
    contracts?.items.map((c) => ({ value: c.id, label: c.name })) ?? [];
  const employeeOptions =
    employees?.items.map((e) => ({ value: e.id, label: getFullName(e) })) ?? [];
  const clientOptions =
    clients?.items.map((c) => ({ value: c.id, label: c.name })) ?? [];

  const buildPayload = (data: AssignmentForm) => ({
    ...data,
    contract_id: assignmentType === 'contract' ? data.contract_id : undefined,
    employee_id: assignmentType === 'employee' ? data.employee_id : undefined,
    end_tariff: data.end_tariff ? Number(data.end_tariff) : undefined,
    end_date: data.end_date || undefined,
    remarks: data.remarks || undefined,
  });

  const createMutation = useMutation({
    mutationFn: (data: AssignmentForm) => assignmentsApi.create(buildPayload(data)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['assignments'] });
      success('Assignment created', 'New assignment added.');
      onClose();
    },
    onError: (err) => toastError('Failed to create assignment', getApiErrorMessage(err)),
  });

  const updateMutation = useMutation({
    mutationFn: (data: AssignmentForm) =>
      assignmentsApi.update(assignment!.id, buildPayload(data)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['assignments'] });
      success('Assignment updated', 'Changes have been saved.');
      onClose();
    },
    onError: (err) => toastError('Failed to update assignment', getApiErrorMessage(err)),
  });

  const onSubmit = (data: AssignmentForm) => {
    if (isEditing) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Assignment' : 'Create Assignment'}
      description="Assignment details and billing configuration"
      size="xl"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button
            variant="primary"
            onClick={handleSubmit(onSubmit)}
            loading={isSubmitting || createMutation.isPending || updateMutation.isPending}
          >
            {isEditing ? 'Save Changes' : 'Create Assignment'}
          </Button>
        </>
      }
    >
      <form className="space-y-4">
        {/* Assignment type toggle */}
        <div>
          <label className="form-label">Assignment Type <span className="text-red-500">*</span></label>
          <div className="flex gap-3 mt-1">
            {(['contract', 'employee'] as AssignmentType[]).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => handleTypeChange(type)}
                className={cn(
                  'flex-1 flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all text-left',
                  assignmentType === type
                    ? 'border-brand-500 bg-brand-50'
                    : 'border-gray-200 hover:border-gray-300'
                )}
              >
                <div
                  className={cn(
                    'w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0',
                    assignmentType === type ? 'border-brand-500' : 'border-gray-300'
                  )}
                >
                  {assignmentType === type && (
                    <div className="w-2 h-2 rounded-full bg-brand-500" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900 capitalize">{type}</p>
                  <p className="text-xs text-gray-500">
                    {type === 'contract' ? 'Linked to a freelancer contract' : 'Direct employee assignment'}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Contract or Employee select + Timesheet Code */}
        <div className="grid grid-cols-2 gap-4">
          {assignmentType === 'contract' ? (
            <Select
              label="Contract"
              placeholder="Select contract…"
              options={contractOptions}
              error={errors.contract_id?.message}
              required
              {...register('contract_id')}
            />
          ) : (
            <Select
              label="Employee"
              placeholder="Select employee…"
              options={employeeOptions}
              error={errors.employee_id?.message}
              required
              {...register('employee_id')}
            />
          )}
          <Input
            label="Timesheet Code"
            placeholder="e.g. PROJ-2024-Q3"
            leftAddon={<Hash size={14} />}
            error={errors.timesheet_code?.message}
            required
            hint="Used for time tracking and billing"
            {...register('timesheet_code')}
          />
        </div>

        {/* Client selects */}
        <div className="grid grid-cols-2 gap-4">
          <Select
            label="Billing Client"
            placeholder="Select billing client…"
            options={clientOptions}
            error={errors.client_id?.message}
            required
            hint="Client who receives the invoice"
            {...register('client_id')}
          />
          <Select
            label="End Client"
            placeholder="Select end client…"
            options={clientOptions}
            error={errors.end_client_id?.message}
            required
            hint="Final client where consultant works"
            {...register('end_client_id')}
          />
        </div>

        {/* Dates */}
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Start Date"
            type="date"
            error={errors.start_date?.message}
            required
            {...register('start_date')}
          />
          <Input
            label="End Date"
            type="date"
            required
            {...register('end_date')}
          />
        </div>

        {/* Tariff config */}
        <div className="p-4 bg-gray-50 rounded-xl space-y-4">
          <h4 className="text-sm font-semibold text-gray-700">Billing Configuration</h4>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Client Tariff (€/day)"
              type="number"
              step="0.01"
              placeholder="700"
              leftAddon={<DollarSign size={14} />}
              error={errors.client_tariff?.message}
              required
              {...register('client_tariff')}
            />
            <Select
              label="Tariff Type"
              options={[
                { value: 'percentage', label: 'Percentage' },
                { value: '50_50', label: '50/50' },
                { value: 'end_tariff', label: 'End tariff' },
              ]}
              error={errors.tariff_type?.message}
              required
              {...register('tariff_type')}
            />
          </div>
          {tariffType === 'end_tariff' && (
            <Input
              label="End Client Tariff (€/day)"
              type="number"
              step="0.01"
              placeholder="650"
              leftAddon={<DollarSign size={14} />}
              hint="Tariff charged to the end client"
              error={errors.end_tariff?.message}
              {...register('end_tariff')}
            />
          )}
        </div>

        {/* Status & Remarks */}
        <div className="grid grid-cols-2 gap-4">
          <Select
            label="Status"
            options={[
              { value: 'active', label: 'Active' },
              { value: 'completed', label: 'Completed' },
              { value: 'cancelled', label: 'Cancelled' },
            ]}
            error={errors.status?.message}
            {...register('status')}
          />
        </div>
        <TextArea
          label="Remarks"
          placeholder="Additional notes about this assignment…"
          {...register('remarks')}
        />
      </form>
    </Modal>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AssignmentsPage() {
  const qc = useQueryClient();
  const { success, error: toastError } = useToast();

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [contractFilter, setContractFilter] = useState('');
  const [employeeFilter, setEmployeeFilter] = useState('');
  const [clientFilter, setClientFilter] = useState('');
  const [endClientFilter, setEndClientFilter] = useState('');
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;

  const [formOpen, setFormOpen] = useState(false);
  const [editAssignment, setEditAssignment] = useState<Assignment | undefined>();
  const [deleteAssignment, setDeleteAssignment] = useState<Assignment | null>(null);

  React.useEffect(() => {
    const t = setTimeout(() => { setDebouncedSearch(search); setPage(1); }, 350);
    return () => clearTimeout(t);
  }, [search]);

  const { data, isLoading, error } = useQuery({
    queryKey: ['assignments', debouncedSearch, statusFilter, contractFilter, employeeFilter, clientFilter, endClientFilter, page],
    queryFn: () =>
      assignmentsApi.list({
        timesheet_code: debouncedSearch || undefined,
        status: statusFilter as 'active' | 'completed' | 'cancelled' | undefined || undefined,
        contract_id: contractFilter || undefined,
        employee_id: employeeFilter || undefined,
        client_id: clientFilter || undefined,
        end_client_id: endClientFilter || undefined,
        page,
        size: PAGE_SIZE,
      }),
  });

  // Load contracts, employees, and clients for display
  const { data: contracts } = useQuery({
    queryKey: ['contracts-all'],
    queryFn: () => contractsApi.list({ size: 200 }),
  });
  const { data: employees } = useQuery({
    queryKey: ['employees-all'],
    queryFn: () => employeesApi.list({ size: 200 }),
  });
  const { data: clients } = useQuery({
    queryKey: ['clients-all'],
    queryFn: () => clientsApi.list({ size: 200 }),
  });

  const contractMap = Object.fromEntries(
    contracts?.items.map((c) => [c.id, c.name]) ?? []
  );
  const employeeMap = Object.fromEntries(
    employees?.items.map((e) => [e.id, getFullName(e)]) ?? []
  );
  const clientMap = Object.fromEntries(
    clients?.items.map((c) => [c.id, c.name]) ?? []
  );

  const deleteMutation = useMutation({
    mutationFn: (id: string) => assignmentsApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['assignments'] });
      success('Assignment deleted');
      setDeleteAssignment(null);
    },
    onError: (err) => toastError('Failed to delete', getApiErrorMessage(err)),
  });

  const openCreate = () => { setEditAssignment(undefined); setFormOpen(true); };
  const openEdit = (a: Assignment) => { setEditAssignment(a); setFormOpen(true); };

  const tariffTypeLabels: Record<string, string> = {
    percentage: 'Percentage',
    '50_50': '50/50',
    end_tariff: 'End tariff',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Assignments</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Track consultant assignments by timesheet code
          </p>
        </div>
        <Button variant="primary" leftIcon={<Plus size={16} />} onClick={openCreate}>
          New Assignment
        </Button>
      </div>

      {/* Filters */}
      <div className="card p-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <Input
          placeholder="Search by timesheet code…"
          leftAddon={<Search size={15} />}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Select
          options={[
            { value: '', label: 'All Statuses' },
            { value: 'active', label: 'Active' },
            { value: 'completed', label: 'Completed' },
            { value: 'cancelled', label: 'Cancelled' },
          ]}
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
        />
        <Select
          options={[
            { value: '', label: 'All Contracts' },
            ...(contracts?.items.map((c) => ({ value: c.id, label: c.name })) ?? []),
          ]}
          value={contractFilter}
          onChange={(e) => { setContractFilter(e.target.value); setPage(1); }}
        />
        <Select
          options={[
            { value: '', label: 'All Employees' },
            ...(employees?.items.map((e) => ({ value: e.id, label: getFullName(e) })) ?? []),
          ]}
          value={employeeFilter}
          onChange={(e) => { setEmployeeFilter(e.target.value); setPage(1); }}
        />
        <Select
          options={[
            { value: '', label: 'All Billing Clients' },
            ...(clients?.items.map((c) => ({ value: c.id, label: c.name })) ?? []),
          ]}
          value={clientFilter}
          onChange={(e) => { setClientFilter(e.target.value); setPage(1); }}
        />
        <Select
          options={[
            { value: '', label: 'All End Clients' },
            ...(clients?.items.map((c) => ({ value: c.id, label: c.name })) ?? []),
          ]}
          value={endClientFilter}
          onChange={(e) => { setEndClientFilter(e.target.value); setPage(1); }}
        />
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {isLoading ? (
          <TableSkeleton rows={8} cols={6} />
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <AlertTriangle size={32} className="mb-2 text-yellow-400" />
            <p className="text-sm">Failed to load assignments</p>
          </div>
        ) : !data?.items.length ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <ClipboardList size={40} className="mb-3 text-gray-200" />
            <p className="text-sm font-medium">No assignments found</p>
            {!debouncedSearch && !statusFilter && (
              <Button variant="primary" size="sm" className="mt-3" onClick={openCreate}>
                Create your first assignment
              </Button>
            )}
          </div>
        ) : (
          <>
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="table-header">Timesheet Code</th>
                  <th className="table-header">Contract / Employee</th>
                  <th className="table-header">Client</th>
                  <th className="table-header">Tariff</th>
                  <th className="table-header">Dates</th>
                  <th className="table-header">Status</th>
                  <th className="table-header w-24">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {data.items.map((assignment) => (
                  <tr key={assignment.id} className="hover:bg-gray-50 transition-colors">
                    <td className="table-cell">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center shrink-0">
                          <Hash size={14} className="text-green-600" />
                        </div>
                        <div>
                          <p className="font-mono text-sm font-semibold text-gray-900">
                            {assignment.timesheet_code}
                          </p>
                          <p className="text-xs text-gray-400 capitalize">
                            {tariffTypeLabels[assignment.tariff_type]}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="table-cell text-gray-600">
                      <span className="text-xs">
                        {assignment.contract_id
                          ? (contractMap[assignment.contract_id] ?? (
                              <span className="font-mono text-gray-400">{assignment.contract_id.slice(0, 8)}…</span>
                            ))
                          : assignment.employee_id
                          ? (
                            <span className="text-blue-600">
                              {employeeMap[assignment.employee_id] ?? assignment.employee_id.slice(0, 8)}
                            </span>
                          )
                          : <span className="text-gray-300">—</span>}
                      </span>
                    </td>
                    <td className="table-cell text-gray-600">
                      <div className="text-xs space-y-0.5">
                        <p>{clientMap[assignment.client_id] ?? assignment.client_id.slice(0, 8)}</p>
                        {assignment.end_client_id !== assignment.client_id && (
                          <p className="text-gray-400">
                            End: {clientMap[assignment.end_client_id] ?? assignment.end_client_id?.slice(0, 8)}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="table-cell">
                      <p className="text-sm font-semibold text-gray-900">
                        {formatCurrency(assignment.client_tariff)}/day
                      </p>
                      {assignment.end_tariff && (
                        <p className="text-xs text-gray-400">
                          End: {formatCurrency(assignment.end_tariff)}/day
                        </p>
                      )}
                    </td>
                    <td className="table-cell text-gray-500 text-xs">
                      <p>{formatDate(assignment.start_date)}</p>
                      <p className="text-gray-400">
                        {`→ ${formatDate(assignment.end_date)}`}
                      </p>
                    </td>
                    <td className="table-cell">
                      <AssignmentStatusBadge status={assignment.status} />
                    </td>
                    <td className="table-cell">
                      <div className="flex gap-1">
                        <button
                          onClick={() => openEdit(assignment)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-brand-600 hover:bg-brand-50 transition-colors"
                          title="Edit"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => setDeleteAssignment(assignment)}
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
              <Pagination
                page={page}
                totalPages={data.pages}
                total={data.total}
                pageSize={PAGE_SIZE}
                onPageChange={setPage}
              />
            )}
          </>
        )}
      </div>

      <AssignmentFormModal
        isOpen={formOpen}
        onClose={() => setFormOpen(false)}
        assignment={editAssignment}
      />
      <ConfirmModal
        isOpen={Boolean(deleteAssignment)}
        onClose={() => setDeleteAssignment(null)}
        onConfirm={() => deleteAssignment && deleteMutation.mutate(deleteAssignment.id)}
        title="Delete Assignment"
        message={`Are you sure you want to delete assignment "${deleteAssignment?.timesheet_code}"? This action cannot be undone.`}
        confirmLabel="Delete"
        loading={deleteMutation.isPending}
      />
    </div>
  );
}
