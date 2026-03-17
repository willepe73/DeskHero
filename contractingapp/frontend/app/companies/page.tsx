'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Plus,
  Search,
  Building2,
  Edit2,
  Trash2,
  MoreVertical,
  AlertTriangle,
} from 'lucide-react';
import { companiesApi, getApiErrorMessage } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import type { ConsultancyCompany } from '@/lib/types';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Modal, { ConfirmModal } from '@/components/ui/Modal';
import { TableSkeleton } from '@/components/ui/LoadingSpinner';
import Pagination from '@/components/ui/Pagination';
import { useToast } from '@/components/ui/Toast';

const companySchema = z.object({
  name: z
    .string()
    .min(1, 'Company name is required')
    .max(200, 'Name must be under 200 characters'),
});

type CompanyForm = z.infer<typeof companySchema>;

function CompanyFormModal({
  isOpen,
  onClose,
  company,
}: {
  isOpen: boolean;
  onClose: () => void;
  company?: ConsultancyCompany;
}) {
  const qc = useQueryClient();
  const { success, error: toastError } = useToast();
  const isEditing = Boolean(company);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CompanyForm>({
    resolver: zodResolver(companySchema),
    defaultValues: { name: company?.name ?? '' },
  });

  React.useEffect(() => {
    if (isOpen) reset({ name: company?.name ?? '' });
  }, [isOpen, company, reset]);

  const createMutation = useMutation({
    mutationFn: companiesApi.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['companies'] });
      success('Company created', 'The company has been added successfully.');
      onClose();
    },
    onError: (err) => toastError('Failed to create company', getApiErrorMessage(err)),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: CompanyForm }) =>
      companiesApi.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['companies'] });
      success('Company updated', 'Changes have been saved.');
      onClose();
    },
    onError: (err) => toastError('Failed to update company', getApiErrorMessage(err)),
  });

  const onSubmit = (data: CompanyForm) => {
    if (isEditing && company) {
      updateMutation.mutate({ id: company.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Company' : 'Add Company'}
      description={
        isEditing
          ? 'Update the consultancy company details.'
          : 'Add a new consultancy company to the system.'
      }
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit(onSubmit)}
            loading={isSubmitting || createMutation.isPending || updateMutation.isPending}
          >
            {isEditing ? 'Save Changes' : 'Add Company'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Company Name"
          placeholder="e.g. Cronos NV"
          error={errors.name?.message}
          required
          {...register('name')}
        />
      </form>
    </Modal>
  );
}

function CompanyDetailModal({
  isOpen,
  onClose,
  company,
}: {
  isOpen: boolean;
  onClose: () => void;
  company: ConsultancyCompany | null;
}) {
  if (!company) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Company Details"
      size="sm"
      footer={
        <Button variant="secondary" onClick={onClose}>
          Close
        </Button>
      }
    >
      <div className="space-y-4">
        <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
          <div className="w-12 h-12 rounded-xl bg-brand-100 flex items-center justify-center shrink-0">
            <Building2 size={22} className="text-brand-600" />
          </div>
          <div>
            <p className="font-semibold text-gray-900">{company.name}</p>
            <p className="text-xs text-gray-500">ID: {company.id}</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-1">
              Created
            </p>
            <p className="text-sm text-gray-700">{formatDate(company.created_at)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-1">
              Last Updated
            </p>
            <p className="text-sm text-gray-700">{formatDate(company.updated_at)}</p>
          </div>
        </div>
      </div>
    </Modal>
  );
}

export default function CompaniesPage() {
  const qc = useQueryClient();
  const { success, error: toastError } = useToast();

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;

  const [formOpen, setFormOpen] = useState(false);
  const [editCompany, setEditCompany] = useState<ConsultancyCompany | undefined>();
  const [detailCompany, setDetailCompany] = useState<ConsultancyCompany | null>(null);
  const [deleteCompany, setDeleteCompany] = useState<ConsultancyCompany | null>(null);

  // Debounce search
  React.useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 350);
    return () => clearTimeout(t);
  }, [search]);

  const { data, isLoading, error } = useQuery({
    queryKey: ['companies', debouncedSearch, page],
    queryFn: () =>
      companiesApi.list({ search: debouncedSearch, page, size: PAGE_SIZE }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => companiesApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['companies'] });
      success('Company deleted', 'The company has been removed.');
      setDeleteCompany(null);
    },
    onError: (err) => toastError('Failed to delete company', getApiErrorMessage(err)),
  });

  const openCreate = () => {
    setEditCompany(undefined);
    setFormOpen(true);
  };

  const openEdit = (company: ConsultancyCompany) => {
    setEditCompany(company);
    setFormOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Companies</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Manage your consultancy companies
          </p>
        </div>
        <Button
          variant="primary"
          leftIcon={<Plus size={16} />}
          onClick={openCreate}
        >
          Add Company
        </Button>
      </div>

      {/* Search */}
      <div className="card p-4">
        <Input
          placeholder="Search companies…"
          leftAddon={<Search size={15} />}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {isLoading ? (
          <TableSkeleton rows={8} cols={4} />
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <AlertTriangle size={32} className="mb-2 text-yellow-400" />
            <p className="text-sm">Failed to load companies</p>
          </div>
        ) : !data?.items.length ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <Building2 size={40} className="mb-3 text-gray-200" />
            <p className="text-sm font-medium">No companies found</p>
            {debouncedSearch ? (
              <p className="text-xs mt-1">Try adjusting your search</p>
            ) : (
              <Button
                variant="primary"
                size="sm"
                className="mt-3"
                onClick={openCreate}
              >
                Add your first company
              </Button>
            )}
          </div>
        ) : (
          <>
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="table-header">Company Name</th>
                  <th className="table-header">Created</th>
                  <th className="table-header">Last Updated</th>
                  <th className="table-header w-20">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {data.items.map((company) => (
                  <tr
                    key={company.id}
                    className="hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => setDetailCompany(company)}
                  >
                    <td className="table-cell">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-brand-100 flex items-center justify-center shrink-0">
                          <Building2 size={14} className="text-brand-600" />
                        </div>
                        <span className="font-medium text-gray-900">
                          {company.name}
                        </span>
                      </div>
                    </td>
                    <td className="table-cell text-gray-500">
                      {formatDate(company.created_at)}
                    </td>
                    <td className="table-cell text-gray-500">
                      {formatDate(company.updated_at)}
                    </td>
                    <td
                      className="table-cell"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => openEdit(company)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-brand-600 hover:bg-brand-50 transition-colors"
                          title="Edit"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => setDeleteCompany(company)}
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

      {/* Modals */}
      <CompanyFormModal
        isOpen={formOpen}
        onClose={() => setFormOpen(false)}
        company={editCompany}
      />

      <CompanyDetailModal
        isOpen={Boolean(detailCompany)}
        onClose={() => setDetailCompany(null)}
        company={detailCompany}
      />

      <ConfirmModal
        isOpen={Boolean(deleteCompany)}
        onClose={() => setDeleteCompany(null)}
        onConfirm={() => deleteCompany && deleteMutation.mutate(deleteCompany.id)}
        title="Delete Company"
        message={`Are you sure you want to delete "${deleteCompany?.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        loading={deleteMutation.isPending}
      />
    </div>
  );
}
