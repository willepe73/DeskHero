'use client';

import React, { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Plus,
  Search,
  FileText,
  Edit2,
  Trash2,
  Upload,
  Download,
  AlertTriangle,
  ChevronRight,
  ChevronLeft,
  Check,
  X,
} from 'lucide-react';
import {
  contractsApi,
  companiesApi,
  freelancersApi,
  getApiErrorMessage,
} from '@/lib/api';
import { formatDate, formatCurrency, getFullName } from '@/lib/utils';
import type { Contract } from '@/lib/types';
import Button from '@/components/ui/Button';
import Input, { Select, TextArea } from '@/components/ui/Input';
import Modal, { ConfirmModal } from '@/components/ui/Modal';
import { TableSkeleton } from '@/components/ui/LoadingSpinner';
import Pagination from '@/components/ui/Pagination';
import {
  ContractStatusBadge,
  ExpiryBadge,
} from '@/components/ui/Badge';
import { useToast } from '@/components/ui/Toast';
import { cn } from '@/lib/utils';

// ─── Wizard Steps ─────────────────────────────────────────────────────────────

const WIZARD_STEPS = [
  { id: 1, label: 'Company', description: 'Select consultancy' },
  { id: 2, label: 'Freelancer', description: 'Select consultant & rate' },
  { id: 3, label: 'Dates & Budget', description: 'Timeline and limits' },
  { id: 4, label: 'Review', description: 'Confirm and create' },
];

// Step schemas
const step1Schema = z.object({
  name: z.string().min(1, 'Contract name is required'),
  consultancy_company_id: z.string().min(1, 'Company is required'),
});

const step2Schema = z.object({
  freelance_id: z.string().min(1, 'Please select a freelancer'),
  purchase_rate: z.coerce.number({ invalid_type_error: 'Must be a number' }).min(0, 'Rate must be positive'),
});

const step3Schema = z.object({
  start_date: z.string().min(1, 'Start date is required'),
  end_date: z.string().min(1, 'End date is required'),
  remarks: z.string().optional(),
});

const fullContractSchema = step1Schema.merge(step2Schema).merge(step3Schema);

type ContractWizardForm = z.infer<typeof fullContractSchema>;

// ─── Wizard Step Indicator ─────────────────────────────────────────────────────

function StepIndicator({
  currentStep,
  totalSteps,
}: {
  currentStep: number;
  totalSteps: number;
}) {
  return (
    <div className="flex items-center justify-between mb-6">
      {WIZARD_STEPS.map((step, idx) => {
        const isCompleted = currentStep > step.id;
        const isActive = currentStep === step.id;

        return (
          <React.Fragment key={step.id}>
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  'w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold transition-all',
                  isCompleted
                    ? 'bg-green-500 text-white'
                    : isActive
                    ? 'bg-brand-600 text-white ring-4 ring-brand-100'
                    : 'bg-gray-100 text-gray-400'
                )}
              >
                {isCompleted ? <Check size={16} /> : step.id}
              </div>
              <p
                className={cn(
                  'mt-1 text-xs font-medium',
                  isActive ? 'text-brand-600' : isCompleted ? 'text-green-600' : 'text-gray-400'
                )}
              >
                {step.label}
              </p>
            </div>
            {idx < WIZARD_STEPS.length - 1 && (
              <div
                className={cn(
                  'flex-1 h-0.5 mx-2 mb-4',
                  currentStep > step.id ? 'bg-green-400' : 'bg-gray-200'
                )}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// ─── Contract Wizard Modal ─────────────────────────────────────────────────────

function ContractWizardModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const { success, error: toastError } = useToast();
  const [step, setStep] = useState(1);

  const {
    register,
    handleSubmit,
    watch,
    trigger,
    reset,
    formState: { errors },
  } = useForm<ContractWizardForm>({
    resolver: zodResolver(fullContractSchema),
    mode: 'onChange',
  });

  // Data for selects
  const { data: companies } = useQuery({
    queryKey: ['companies-select'],
    queryFn: () => companiesApi.list({ size: 100 }),
  });
  const { data: freelancers } = useQuery({
    queryKey: ['freelancers-select'],
    queryFn: () => freelancersApi.list({ status: 'active', size: 100 }),
  });

  React.useEffect(() => {
    if (isOpen) { reset(); setStep(1); }
  }, [isOpen, reset]);

  const createMutation = useMutation({
    mutationFn: (data: ContractWizardForm) => {
      const payload = {
        ...data,
        status: 'active' as const,
        end_date: data.end_date || undefined,
        remarks: data.remarks || undefined,
      };
      return contractsApi.create(payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['contracts'] });
      success('Contract created', 'The new contract has been created.');
      onClose();
    },
    onError: (err) => toastError('Failed to create contract', getApiErrorMessage(err)),
  });

  const nextStep = async () => {
    let fields: (keyof ContractWizardForm)[] = [];
    if (step === 1) fields = ['name', 'consultancy_company_id'];
    if (step === 2) fields = ['freelance_id', 'purchase_rate'];
    if (step === 3) fields = ['start_date'];
    const valid = await trigger(fields);
    if (valid) setStep((s) => s + 1);
  };

  const companyOptions = companies?.items.map((c) => ({ value: c.id, label: c.name })) ?? [];
  const freelancerOptions = freelancers?.items.map((f) => ({
    value: f.id,
    label: getFullName(f),
  })) ?? [];

  const formValues = watch();

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create Contract"
      size="lg"
      closeOnBackdrop={false}
      footer={
        <div className="flex items-center justify-between w-full">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => (step > 1 ? setStep((s) => s - 1) : onClose())}
            leftIcon={<ChevronLeft size={14} />}
          >
            {step > 1 ? 'Back' : 'Cancel'}
          </Button>
          <div className="flex gap-2">
            {step < 4 ? (
              <Button
                variant="primary"
                onClick={nextStep}
                rightIcon={<ChevronRight size={14} />}
              >
                Next
              </Button>
            ) : (
              <Button
                variant="primary"
                onClick={handleSubmit((data) => createMutation.mutate(data))}
                loading={createMutation.isPending}
                leftIcon={<Check size={14} />}
              >
                Create Contract
              </Button>
            )}
          </div>
        </div>
      }
    >
      <StepIndicator currentStep={step} totalSteps={4} />

      {/* Step 1: Company */}
      {step === 1 && (
        <div className="space-y-4">
          <Input
            label="Contract Name"
            placeholder="e.g. Freelance Contract Q3 2024"
            error={errors.name?.message}
            required
            {...register('name')}
          />
          <Select
            label="Consultancy Company"
            placeholder="Select a company…"
            options={companyOptions}
            error={errors.consultancy_company_id?.message}
            required
            {...register('consultancy_company_id')}
          />
        </div>
      )}

      {/* Step 2: Freelancer & Rate */}
      {step === 2 && (
        <div className="space-y-4">
          <Select
            label="Select Freelancer"
            placeholder="Choose a freelancer…"
            options={freelancerOptions}
            error={errors.freelance_id?.message}
            required
            {...register('freelance_id')}
          />
          <Input
            label="Purchase Rate (€/day)"
            type="number"
            step="0.01"
            placeholder="650"
            hint="Daily rate paid to the freelancer"
            error={errors.purchase_rate?.message}
            required
            {...register('purchase_rate')}
          />
        </div>
      )}

      {/* Step 3: Dates & Budget */}
      {step === 3 && (
        <div className="space-y-4">
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
              error={errors.end_date?.message}
              {...register('end_date')}
            />
          </div>
          <TextArea
            label="Remarks"
            placeholder="Additional notes about this contract…"
            error={errors.remarks?.message}
            {...register('remarks')}
          />
        </div>
      )}

      {/* Step 4: Review */}
      {step === 4 && (
        <div className="space-y-4">
          <div className="p-4 bg-gray-50 rounded-xl space-y-3">
            <h3 className="font-semibold text-gray-800 text-sm">Contract Summary</h3>
            <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
              <div>
                <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Name</p>
                <p className="text-gray-800 font-medium mt-0.5">{formValues.name || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Company ID</p>
                <p className="text-gray-800 font-medium mt-0.5 truncate">
                  {companyOptions.find((c) => c.value === formValues.consultancy_company_id)?.label || '—'}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Freelancer</p>
                <p className="text-gray-800 font-medium mt-0.5">
                  {freelancerOptions.find((f) => f.value === formValues.freelance_id)?.label || '—'}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Purchase Rate</p>
                <p className="text-gray-800 font-medium mt-0.5">
                  {formValues.purchase_rate ? formatCurrency(Number(formValues.purchase_rate)) + '/day' : '—'}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Start Date</p>
                <p className="text-gray-800 font-medium mt-0.5">{formatDate(formValues.start_date)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">End Date</p>
                <p className="text-gray-800 font-medium mt-0.5">
                  {formatDate(formValues.end_date)}
                </p>
              </div>
              {formValues.remarks && (
                <div className="col-span-2">
                  <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Remarks</p>
                  <p className="text-gray-700 mt-0.5 text-xs">{formValues.remarks}</p>
                </div>
              )}
            </div>
          </div>
          <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <FileText size={16} className="text-blue-500 shrink-0 mt-0.5" />
            <p className="text-sm text-blue-700">
              After creating the contract, you can upload a PDF document from the contracts list.
            </p>
          </div>
        </div>
      )}
    </Modal>
  );
}

// ─── Edit Contract Modal ───────────────────────────────────────────────────────

const editContractSchema = z.object({
  name: z.string().min(1, 'Contract name is required'),
  purchase_rate: z.coerce.number({ invalid_type_error: 'Must be a number' }).min(0, 'Rate must be positive'),
  start_date: z.string().min(1, 'Start date is required'),
  end_date: z.string().min(1, 'End date is required'),
  remarks: z.string().optional(),
  status: z.enum(['active', 'terminated']),
});

type EditContractForm = z.infer<typeof editContractSchema>;

function EditContractModal({
  isOpen,
  onClose,
  contract,
}: {
  isOpen: boolean;
  onClose: () => void;
  contract: Contract;
}) {
  const qc = useQueryClient();
  const { success, error: toastError } = useToast();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<EditContractForm>({
    resolver: zodResolver(editContractSchema),
    defaultValues: {
      name: contract.name,
      purchase_rate: contract.purchase_rate,
      start_date: contract.start_date?.slice(0, 10) ?? '',
      end_date: contract.end_date?.slice(0, 10) ?? '',
      remarks: contract.remarks ?? '',
      status: contract.status,
    },
  });

  React.useEffect(() => {
    if (isOpen) {
      reset({
        name: contract.name,
        purchase_rate: contract.purchase_rate,
        start_date: contract.start_date?.slice(0, 10) ?? '',
        end_date: contract.end_date?.slice(0, 10) ?? '',
        remarks: contract.remarks ?? '',
        status: contract.status,
      });
    }
  }, [isOpen, contract, reset]);

  const updateMutation = useMutation({
    mutationFn: (data: EditContractForm) =>
      contractsApi.update(contract.id, {
        ...data,
        purchase_rate: Number(data.purchase_rate),
        end_date: data.end_date || undefined,
        remarks: data.remarks || undefined,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['contracts'] });
      success('Contract updated');
      onClose();
    },
    onError: (err) => toastError('Failed to update', getApiErrorMessage(err)),
  });

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Contract"
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button
            variant="primary"
            onClick={handleSubmit((d) => updateMutation.mutate(d))}
            loading={isSubmitting || updateMutation.isPending}
          >
            Save Changes
          </Button>
        </>
      }
    >
      <form className="space-y-4">
        <Input
          label="Contract Name"
          error={errors.name?.message}
          required
          {...register('name')}
        />
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
            error={errors.end_date?.message}
            {...register('end_date')}
          />
        </div>
        <Input
          label="Purchase Rate (€/day)"
          type="number"
          step="0.01"
          error={errors.purchase_rate?.message}
          required
          {...register('purchase_rate')}
        />
        <Select
          label="Status"
          options={[
            { value: 'active', label: 'Active' },
            { value: 'terminated', label: 'Terminated' },
          ]}
          {...register('status')}
        />
        <TextArea
          label="Remarks"
          placeholder="Additional notes…"
          {...register('remarks')}
        />
        <div>
          <p className="text-sm font-medium text-gray-700 mb-1.5">PDF Document</p>
          <PdfDropZone contract={contract} />
        </div>
      </form>
    </Modal>
  );
}

// ─── PDF Drop Zone (Edit Modal) ───────────────────────────────────────────────

function PdfDropZone({ contract }: { contract: Contract }) {
  const qc = useQueryClient();
  const { success, error: toastError } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);

  const uploadMutation = useMutation({
    mutationFn: (file: File) => contractsApi.uploadPdf(contract.id, file),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['contracts'] });
      success('PDF uploaded', 'Contract document has been attached.');
    },
    onError: (err) => toastError('Upload failed', getApiErrorMessage(err)),
  });

  const validateAndUpload = (file: File) => {
    setFileError(null);
    if (file.type !== 'application/pdf') {
      setFileError('Only PDF files are accepted.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setFileError('File must be 10 MB or smaller.');
      return;
    }
    uploadMutation.mutate(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => setIsDragOver(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) validateAndUpload(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) validateAndUpload(file);
    e.target.value = '';
  };

  const handleDownload = async () => {
    try {
      const blob = await contractsApi.downloadPdf(contract.id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `contract-${contract.id}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      toastError('Download failed', getApiErrorMessage(err));
    }
  };

  return (
    <div className="space-y-2">
      {contract.pdf_blob_storage_id && (
        <div className="flex items-center gap-2 px-3 py-2 bg-green-50 border border-green-200 rounded-lg">
          <FileText size={14} className="text-green-600 shrink-0" />
          <span className="text-sm text-gray-700 font-medium flex-1 truncate">
            contract-{contract.id}.pdf
          </span>
          <button
            type="button"
            onClick={handleDownload}
            className="text-brand-600 hover:underline text-xs flex items-center gap-1 shrink-0"
          >
            <Download size={12} /> Download
          </button>
        </div>
      )}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !uploadMutation.isPending && fileRef.current?.click()}
        className={cn(
          'border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all',
          isDragOver
            ? 'border-brand-400 bg-brand-50'
            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50',
          uploadMutation.isPending && 'pointer-events-none opacity-60'
        )}
      >
        <input
          ref={fileRef}
          type="file"
          accept=".pdf"
          className="hidden"
          onChange={handleFileChange}
        />
        {uploadMutation.isPending ? (
          <div className="flex flex-col items-center gap-2 text-gray-500">
            <div className="w-5 h-5 border-2 border-brand-400 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm">Uploading…</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <Upload size={20} className="text-gray-400" />
            {contract.pdf_blob_storage_id ? (
              <>
                <p className="text-sm text-gray-600 font-medium">Drag & drop or click to replace</p>
                <p className="text-xs text-amber-600">Uploading a new file will replace the existing PDF</p>
              </>
            ) : (
              <>
                <p className="text-sm text-gray-600 font-medium">No PDF attached — drag & drop or click to upload</p>
                <p className="text-xs text-gray-400">PDF files up to 10 MB</p>
              </>
            )}
          </div>
        )}
      </div>
      {fileError && (
        <p className="text-xs text-red-600 flex items-center gap-1">
          <X size={12} /> {fileError}
        </p>
      )}
    </div>
  );
}

// ─── PDF Table Actions (download only) ────────────────────────────────────────

function PdfActions({ contract }: { contract: Contract }) {
  const { error: toastError } = useToast();

  const handleDownload = async () => {
    try {
      const blob = await contractsApi.downloadPdf(contract.id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `contract-${contract.id}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      toastError('Download failed', getApiErrorMessage(err));
    }
  };

  if (!contract.pdf_blob_storage_id) return null;

  return (
    <button
      onClick={handleDownload}
      className="p-1.5 rounded-lg text-gray-400 hover:text-green-600 hover:bg-green-50 transition-colors"
      title="Download PDF"
    >
      <Download size={14} />
    </button>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ContractsPage() {
  const qc = useQueryClient();
  const { success, error: toastError } = useToast();

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [companyFilter, setCompanyFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;

  const [wizardOpen, setWizardOpen] = useState(false);
  const [editContract, setEditContract] = useState<Contract | null>(null);
  const [deleteContract, setDeleteContract] = useState<Contract | null>(null);

  React.useEffect(() => {
    const t = setTimeout(() => { setDebouncedSearch(search); setPage(1); }, 350);
    return () => clearTimeout(t);
  }, [search]);

  const { data, isLoading, error } = useQuery({
    queryKey: ['contracts', debouncedSearch, companyFilter, statusFilter, page],
    queryFn: () =>
      contractsApi.list({
        search: debouncedSearch,
        company_id: companyFilter || undefined,
        status: statusFilter as 'active' | 'terminated' | undefined || undefined,
        page,
        size: PAGE_SIZE,
      }),
  });

  const { data: companies } = useQuery({
    queryKey: ['companies-filter'],
    queryFn: () => companiesApi.list({ size: 100 }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => contractsApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['contracts'] });
      success('Contract deleted');
      setDeleteContract(null);
    },
    onError: (err) => toastError('Failed to delete', getApiErrorMessage(err)),
  });

  const companyOptions = [
    { value: '', label: 'All Companies' },
    ...(companies?.items.map((c) => ({ value: c.id, label: c.name })) ?? []),
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Contracts</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Contract center — manage all consulting agreements
          </p>
        </div>
        <Button
          variant="primary"
          leftIcon={<Plus size={16} />}
          onClick={() => setWizardOpen(true)}
        >
          New Contract
        </Button>
      </div>

      {/* Filters */}
      <div className="card p-4 flex gap-3 flex-wrap">
        <Input
          placeholder="Search contracts…"
          leftAddon={<Search size={15} />}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-52"
        />
        <Select
          options={companyOptions}
          value={companyFilter}
          onChange={(e) => { setCompanyFilter(e.target.value); setPage(1); }}
          className="w-44"
        />
        <Select
          options={[
            { value: '', label: 'All Statuses' },
            { value: 'active', label: 'Active' },
            { value: 'terminated', label: 'Terminated' },
          ]}
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="w-36"
        />
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {isLoading ? (
          <TableSkeleton rows={8} cols={6} />
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <AlertTriangle size={32} className="mb-2 text-yellow-400" />
            <p className="text-sm">Failed to load contracts</p>
          </div>
        ) : !data?.items.length ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <FileText size={40} className="mb-3 text-gray-200" />
            <p className="text-sm font-medium">No contracts found</p>
            {!debouncedSearch && !statusFilter && (
              <Button variant="primary" size="sm" className="mt-3" onClick={() => setWizardOpen(true)}>
                Create your first contract
              </Button>
            )}
          </div>
        ) : (
          <>
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="table-header">Contract</th>
                  <th className="table-header">Purchase Rate</th>
                  <th className="table-header">Status</th>
                  <th className="table-header">Start</th>
                  <th className="table-header">End</th>
                  <th className="table-header w-28">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {data.items.map((contract) => (
                  <tr key={contract.id} className="hover:bg-gray-50 transition-colors">
                    <td className="table-cell">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-brand-50 flex items-center justify-center shrink-0">
                          <FileText size={14} className="text-brand-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{contract.name}</p>
                          {contract.pdf_blob_storage_id && (
                            <span className="text-[10px] text-green-600 flex items-center gap-0.5">
                              <FileText size={10} /> PDF attached
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="table-cell text-gray-700 font-medium">
                      {formatCurrency(contract.purchase_rate)}/day
                    </td>
                    <td className="table-cell">
                      <div className="flex flex-col gap-1">
                        <ContractStatusBadge status={contract.status} />
                        <ExpiryBadge endDate={contract.end_date} />
                      </div>
                    </td>
                    <td className="table-cell text-gray-500">{formatDate(contract.start_date)}</td>
                    <td className="table-cell text-gray-500">{formatDate(contract.end_date)}</td>
                    <td className="table-cell">
                      <div className="flex items-center gap-1">
                        <PdfActions contract={contract} />
                        <button
                          onClick={() => setEditContract(contract)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-brand-600 hover:bg-brand-50 transition-colors"
                          title="Edit"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => setDeleteContract(contract)}
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

      {/* Modals */}
      <ContractWizardModal isOpen={wizardOpen} onClose={() => setWizardOpen(false)} />

      {editContract && (
        <EditContractModal
          isOpen={Boolean(editContract)}
          onClose={() => setEditContract(null)}
          contract={editContract}
        />
      )}

      <ConfirmModal
        isOpen={Boolean(deleteContract)}
        onClose={() => setDeleteContract(null)}
        onConfirm={() => deleteContract && deleteMutation.mutate(deleteContract.id)}
        title="Delete Contract"
        message={`Are you sure you want to delete "${deleteContract?.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        loading={deleteMutation.isPending}
      />
    </div>
  );
}
