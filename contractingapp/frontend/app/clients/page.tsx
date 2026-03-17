'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Plus,
  Search,
  Briefcase,
  Edit2,
  Trash2,
  MapPin,
  AlertTriangle,
} from 'lucide-react';
import { clientsApi, assignmentsApi, getApiErrorMessage } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import type { Client } from '@/lib/types';
import Button from '@/components/ui/Button';
import Input, { Select, TextArea } from '@/components/ui/Input';
import Modal, { ConfirmModal } from '@/components/ui/Modal';
import { TableSkeleton } from '@/components/ui/LoadingSpinner';
import Pagination from '@/components/ui/Pagination';
import { ClientTypeBadge, AssignmentStatusBadge } from '@/components/ui/Badge';
import { useToast } from '@/components/ui/Toast';

// ─── Form Schema ──────────────────────────────────────────────────────────────

const clientSchema = z.object({
  name: z.string().min(1, 'Client name is required'),
  type: z.enum(['intercompany', 'end_client']),
  billing_address: z.string().optional(),
});

type ClientForm = z.infer<typeof clientSchema>;

// ─── Client Form Modal ────────────────────────────────────────────────────────

function ClientFormModal({
  isOpen,
  onClose,
  client,
}: {
  isOpen: boolean;
  onClose: () => void;
  client?: Client;
}) {
  const qc = useQueryClient();
  const { success, error: toastError } = useToast();
  const isEditing = Boolean(client);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ClientForm>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      name: client?.name ?? '',
      type: client?.type ?? 'end_client',
      billing_address: client?.billing_address ?? '',
    },
  });

  React.useEffect(() => {
    if (isOpen) {
      reset({
        name: client?.name ?? '',
        type: client?.type ?? 'end_client',
        billing_address: client?.billing_address ?? '',
      });
    }
  }, [isOpen, client, reset]);

  const createMutation = useMutation({
    mutationFn: clientsApi.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['clients'] });
      success('Client created', 'New client added to directory.');
      onClose();
    },
    onError: (err) => toastError('Failed to create client', getApiErrorMessage(err)),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: ClientForm }) =>
      clientsApi.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['clients'] });
      success('Client updated', 'Changes have been saved.');
      onClose();
    },
    onError: (err) => toastError('Failed to update client', getApiErrorMessage(err)),
  });

  const onSubmit = (data: ClientForm) => {
    const payload = {
      ...data,
      billing_address: data.billing_address || undefined,
    };
    if (isEditing && client) {
      updateMutation.mutate({ id: client.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Client' : 'Add Client'}
      description="Client contact and billing details"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button
            variant="primary"
            onClick={handleSubmit(onSubmit)}
            loading={isSubmitting || createMutation.isPending || updateMutation.isPending}
          >
            {isEditing ? 'Save Changes' : 'Add Client'}
          </Button>
        </>
      }
    >
      <form className="space-y-4">
        <Input
          label="Client Name"
          placeholder="Acme Corporation"
          error={errors.name?.message}
          required
          {...register('name')}
        />
        <Select
          label="Client Type"
          options={[
            { value: 'end_client', label: 'End Client' },
            { value: 'intercompany', label: 'Intercompany' },
          ]}
          error={errors.type?.message}
          required
          {...register('type')}
        />
        <TextArea
          label="Billing Address"
          placeholder="123 Business Park, Brussels, Belgium"
          hint="Optional — include full postal address for invoices"
          error={errors.billing_address?.message}
          {...register('billing_address')}
        />
      </form>
    </Modal>
  );
}

// ─── Client Detail Modal ──────────────────────────────────────────────────────

function ClientDetailModal({
  isOpen,
  onClose,
  client,
}: {
  isOpen: boolean;
  onClose: () => void;
  client: Client | null;
}) {
  const { data: assignments, isLoading } = useQuery({
    queryKey: ['client-assignments', client?.id],
    queryFn: () =>
      client
        ? assignmentsApi.list({ search: '', page: 1, size: 20 })
        : Promise.resolve({ items: [], total: 0, page: 1, size: 20, pages: 0 }),
    enabled: Boolean(client),
  });

  if (!client) return null;

  // Filter assignments by client_id
  const clientAssignments = assignments?.items.filter(
    (a) => a.client_id === client.id || a.end_client_id === client.id
  ) ?? [];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Client Details"
      size="lg"
      footer={
        <Button variant="secondary" onClick={onClose}>Close</Button>
      }
    >
      <div className="space-y-5">
        {/* Header card */}
        <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl">
          <div className="w-12 h-12 rounded-xl bg-teal-100 flex items-center justify-center shrink-0">
            <Briefcase size={22} className="text-teal-600" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-gray-900 text-lg">{client.name}</h3>
              <ClientTypeBadge type={client.type} />
            </div>
            <div className="mt-2 space-y-1">
              {client.billing_address && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <MapPin size={13} className="text-gray-400" />
                  {client.billing_address}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Assignments */}
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-3">Assignments</h4>
          {isLoading ? (
            <TableSkeleton rows={3} cols={4} />
          ) : clientAssignments.length === 0 ? (
            <div className="text-center py-6 text-gray-400 text-sm bg-gray-50 rounded-xl">
              No assignments linked to this client
            </div>
          ) : (
            <div className="divide-y divide-gray-100 border border-gray-100 rounded-xl overflow-hidden">
              {clientAssignments.map((a) => (
                <div key={a.id} className="flex items-center justify-between px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {a.timesheet_code}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatDate(a.start_date)} — {a.end_date ? formatDate(a.end_date) : 'Ongoing'}
                    </p>
                  </div>
                  <AssignmentStatusBadge status={a.status} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ClientsPage() {
  const qc = useQueryClient();
  const { success, error: toastError } = useToast();

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;

  const [formOpen, setFormOpen] = useState(false);
  const [editClient, setEditClient] = useState<Client | undefined>();
  const [detailClient, setDetailClient] = useState<Client | null>(null);
  const [deleteClient, setDeleteClient] = useState<Client | null>(null);

  React.useEffect(() => {
    const t = setTimeout(() => { setDebouncedSearch(search); setPage(1); }, 350);
    return () => clearTimeout(t);
  }, [search]);

  const { data, isLoading, error } = useQuery({
    queryKey: ['clients', debouncedSearch, typeFilter, page],
    queryFn: () =>
      clientsApi.list({
        search: debouncedSearch,
        type: typeFilter || undefined,
        page,
        size: PAGE_SIZE,
      }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => clientsApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['clients'] });
      success('Client deleted');
      setDeleteClient(null);
    },
    onError: (err) => toastError('Failed to delete client', getApiErrorMessage(err)),
  });

  const openCreate = () => { setEditClient(undefined); setFormOpen(true); };
  const openEdit = (c: Client) => { setEditClient(c); setFormOpen(true); };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Clients</h1>
          <p className="text-sm text-gray-500 mt-0.5">Client directory and assignments</p>
        </div>
        <Button variant="primary" leftIcon={<Plus size={16} />} onClick={openCreate}>
          Add Client
        </Button>
      </div>

      {/* Filters */}
      <div className="card p-4 flex gap-3 flex-wrap">
        <Input
          placeholder="Search clients…"
          leftAddon={<Search size={15} />}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-56"
        />
        <Select
          options={[
            { value: '', label: 'All Types' },
            { value: 'intercompany', label: 'Intercompany' },
            { value: 'end_client', label: 'End Client' },
          ]}
          value={typeFilter}
          onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
          className="w-40"
        />
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {isLoading ? (
          <TableSkeleton rows={8} cols={4} />
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <AlertTriangle size={32} className="mb-2 text-yellow-400" />
            <p className="text-sm">Failed to load clients</p>
          </div>
        ) : !data?.items.length ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <Briefcase size={40} className="mb-3 text-gray-200" />
            <p className="text-sm font-medium">No clients found</p>
            {!debouncedSearch && !typeFilter && (
              <Button variant="primary" size="sm" className="mt-3" onClick={openCreate}>
                Add your first client
              </Button>
            )}
          </div>
        ) : (
          <>
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="table-header">Client</th>
                  <th className="table-header">Type</th>
                  <th className="table-header">Billing Email</th>
                  <th className="table-header">Billing Address</th>
                  <th className="table-header w-24">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {data.items.map((client) => (
                  <tr
                    key={client.id}
                    className="hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => setDetailClient(client)}
                  >
                    <td className="table-cell">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-teal-100 flex items-center justify-center shrink-0">
                          <Briefcase size={14} className="text-teal-600" />
                        </div>
                        <span className="font-medium text-gray-900">{client.name}</span>
                      </div>
                    </td>
                    <td className="table-cell">
                      <ClientTypeBadge type={client.type} />
                    </td>
                    <td className="table-cell text-gray-500">
                      {client.billing_address ? (
                        <div className="flex items-center gap-1.5">
                          <MapPin size={12} className="text-gray-400 shrink-0" />
                          <span className="truncate max-w-[180px]">{client.billing_address}</span>
                        </div>
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>
                    <td className="table-cell" onClick={(e) => e.stopPropagation()}>
                      <div className="flex gap-1">
                        <button
                          onClick={() => openEdit(client)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-brand-600 hover:bg-brand-50 transition-colors"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => setDeleteClient(client)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
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

      <ClientFormModal isOpen={formOpen} onClose={() => setFormOpen(false)} client={editClient} />
      <ClientDetailModal isOpen={Boolean(detailClient)} onClose={() => setDetailClient(null)} client={detailClient} />
      <ConfirmModal
        isOpen={Boolean(deleteClient)}
        onClose={() => setDeleteClient(null)}
        onConfirm={() => deleteClient && deleteMutation.mutate(deleteClient.id)}
        title="Delete Client"
        message={`Are you sure you want to delete "${deleteClient?.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        loading={deleteMutation.isPending}
      />
    </div>
  );
}
