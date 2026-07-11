import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
    ArrowLeft,
    CalendarDays,
    CheckCircle2,
    FileText,
    Send,
    Trash2,
    XCircle,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { DownloadReportButton } from '@/components/reports/DownloadReportButton';
import { ApplicationContractDialog } from '@/pages/owner/ApplicationContractDialog';
import { showError, showSuccess } from '@/lib/toast';
import {
    useApplication,
    useDeleteApplication,
    useRejectApplication,
} from '@/queries/application.queries';
import {
    useLeaseContracts,
    useSendLeaseContract,
} from '@/queries/leaseContract.queries';
import { useDownloadLeaseContractPdf } from '@/queries/report.queries';
import type { ApplicationStatus, PropertyApplication } from '@/schemas/application.schema';
import type { LeaseContract } from '@/schemas/leaseContract.schema';

const fadeUp = {
    initial: { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.35, ease: 'easeOut' as const },
};

type ApplicantDataView = {
    stay?: string;
    requirements: Array<{ question: string; answer: string }>;
    legacyLines: string[];
};

function formatMoney(n: number | null | undefined): string {
    if (n == null || Number.isNaN(n)) return '-';
    return new Intl.NumberFormat(undefined, {
        style: 'currency',
        currency: 'TZS',
        maximumFractionDigits: 0,
    }).format(n);
}

function formatDate(value: string | null | undefined): string {
    if (!value) return '-';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return value.slice(0, 10);
    return new Intl.DateTimeFormat(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    }).format(d);
}

function initials(name: string | null | undefined, email: string | null | undefined): string {
    const source = name?.trim() || email?.trim() || 'Tenant';
    const parts = source.split(/\s+/).filter(Boolean);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return `${parts[0][0] ?? ''}${parts[1][0] ?? ''}`.toUpperCase();
}

function statusPillClass(status: ApplicationStatus): string {
    switch (status) {
        case 'PENDING':
            return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300';
        case 'APPROVED':
            return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300';
        case 'CONTRACT_SENT':
            return 'bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-300';
        case 'CONTRACT_ACCEPTED':
            return 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300';
        case 'REJECTED':
        case 'CONTRACT_REJECTED':
            return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
        default:
            return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';
    }
}

function parseApplicantData(raw: string | null | undefined): ApplicantDataView {
    if (!raw?.trim()) return { requirements: [], legacyLines: [] };
    try {
        const parsed = JSON.parse(raw) as {
            bookingWindow?: {
                checkInDate?: string;
                checkOutDate?: string;
            };
            bookingRequirements?: Array<{ question?: string; answer?: string }>;
        };
        const stay =
            parsed.bookingWindow?.checkInDate && parsed.bookingWindow?.checkOutDate
                ? `${parsed.bookingWindow.checkInDate} to ${parsed.bookingWindow.checkOutDate}`
                : undefined;
        const requirements = Array.isArray(parsed.bookingRequirements)
            ? parsed.bookingRequirements
                  .map((item) => ({
                      question: item.question?.trim() ?? '',
                      answer: item.answer?.trim() ?? '',
                  }))
                  .filter((item) => item.question || item.answer)
            : [];
        return { stay, requirements, legacyLines: [] };
    } catch {
        return {
            requirements: [],
            legacyLines: raw.split(/\r?\n/).map((line) => line.trim()).filter(Boolean),
        };
    }
}

function ContractLineItems({
    contract,
}: {
    contract: LeaseContract | undefined;
}) {
    if (!contract) {
        return <p className="text-sm text-slate-500">No contract has been created yet.</p>;
    }
    return (
        <div className="space-y-3">
            {contract.items.length === 0 ? (
                <p className="text-sm text-slate-500">No contract items.</p>
            ) : (
                contract.items.map((item, idx) => (
                    <div
                        key={item.id ?? idx}
                        className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950"
                    >
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <p className="font-semibold text-slate-950 dark:text-white">{item.label}</p>
                                <p className="mt-1 text-xs text-slate-500">
                                    {item.leaseType === 'RECURRING'
                                        ? `Bills ${item.timeFrame?.toLowerCase() ?? 'period'} x ${item.recurringNumber ?? 1}`
                                        : 'One-time charge'}
                                </p>
                                <p className="mt-1 text-xs text-slate-500">
                                    {item.startDate ?? '-'} to {item.endDate ?? '-'}
                                </p>
                            </div>
                            <div className="text-right">
                                <p className="font-semibold text-slate-950 dark:text-white">
                                    {formatMoney(item.amount)}
                                </p>
                                {item.totalAmount != null && item.totalAmount !== item.amount ? (
                                    <p className="mt-1 text-xs text-slate-500">
                                        Total {formatMoney(item.totalAmount)}
                                    </p>
                                ) : null}
                            </div>
                        </div>
                    </div>
                ))
            )}
        </div>
    );
}

const ApplicationDetail = () => {
    const { t } = useTranslation();
    const { applicationId } = useParams();
    const appId = applicationId ? Number(applicationId) : undefined;
    const appQuery = useApplication(Number.isFinite(appId) ? appId : undefined);
    const contractsQuery = useLeaseContracts();
    const rejectMut = useRejectApplication();
    const deleteMut = useDeleteApplication();
    const sendMut = useSendLeaseContract();
    const downloadLease = useDownloadLeaseContractPdf();
    const [contractOpen, setContractOpen] = useState(false);
    const [searchParams, setSearchParams] = useSearchParams();
    const [autoOpened, setAutoOpened] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    const base = location.pathname.startsWith('/landlord') ? '/landlord' : '/owner';

    const app = appQuery.data;
    const contract = useMemo(() => {
        if (!app?.contractId) return undefined;
        return (contractsQuery.data ?? []).find((item) => item.id === app.contractId);
    }, [app?.contractId, contractsQuery.data]);
    const applicantData = parseApplicantData(app?.applicantData);

    useEffect(() => {
        if (app && searchParams.get('contract') === '1' && !autoOpened) {
            setContractOpen(true);
            setAutoOpened(true);
            setSearchParams({}, { replace: true });
        }
    }, [app, autoOpened, searchParams, setSearchParams]);

    const goBack = () => navigate(`${base}/applications`);

    const handleReject = async (nextApp: PropertyApplication) => {
        const reason = window.prompt(`Reason for rejecting ${nextApp.tenant.name ?? 'this tenant'}?`);
        if (!reason?.trim()) return;
        try {
            await rejectMut.mutateAsync({ id: nextApp.id, body: { reason: reason.trim() } });
            showSuccess('Booking request rejected.');
        } catch (e) {
            showError(e instanceof Error ? e.message : 'Could not reject request');
        }
    };

    const handleDelete = async (nextApp: PropertyApplication) => {
        const ok = window.confirm(`Delete application from ${nextApp.tenant.name ?? nextApp.tenant.email ?? 'this tenant'}?`);
        if (!ok) return;
        try {
            await deleteMut.mutateAsync(nextApp.id);
            showSuccess('Application deleted.');
            goBack();
        } catch (e) {
            showError(e instanceof Error ? e.message : 'Could not delete application');
        }
    };

    const handleSendContract = async () => {
        if (!contract) return;
        try {
            await sendMut.mutateAsync(contract.id);
            showSuccess('Contract sent to tenant.');
        } catch (e) {
            showError(e instanceof Error ? e.message : 'Could not send contract');
        }
    };

    if (appQuery.isPending) {
        return (
            <div className="mx-auto max-w-7xl space-y-4">
                <div className="h-16 animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-900" />
                <div className="h-96 animate-pulse rounded-[28px] bg-slate-100 dark:bg-slate-900" />
            </div>
        );
    }

    if (appQuery.isError || !app) {
        return (
            <motion.div {...fadeUp} className="mx-auto max-w-3xl rounded-2xl border border-red-200 bg-red-50 p-6 text-red-900 dark:border-red-900 dark:bg-red-950/40 dark:text-red-100">
                {appQuery.error instanceof Error ? appQuery.error.message : 'Could not load application'}
            </motion.div>
        );
    }

    return (
        <motion.div {...fadeUp} className="mx-auto max-w-7xl space-y-6 pb-10">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <Button type="button" variant="ghost" className="w-fit" onClick={goBack}>
                    <ArrowLeft className="h-4 w-4" />
                    Back to applications
                </Button>
                <span className={`w-fit rounded-full px-3 py-1.5 text-xs font-bold uppercase ${statusPillClass(app.status)}`}>
                    {app.status.replace(/_/g, ' ')}
                </span>
            </div>

            <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950">
                <div className="grid lg:grid-cols-[1fr_360px]">
                    <div className="bg-[linear-gradient(135deg,#f8fafc_0%,#eef7f1_55%,#f8fafc_100%)] p-6 sm:p-8 dark:bg-[linear-gradient(135deg,#020617_0%,#082f2b_58%,#0f172a_100%)]">
                        <div className="flex items-start gap-4">
                            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-sm font-bold text-white dark:bg-white dark:text-slate-950">
                                {initials(app.tenant.name, app.tenant.email)}
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">
                                    Application #{app.id}
                                </p>
                                <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950 dark:text-white">
                                    {app.tenant.name ?? 'Tenant'}
                                </h1>
                                <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{app.tenant.email}</p>
                            </div>
                        </div>

                        {app.coverNote ? (
                            <div className="mt-6 max-w-3xl rounded-2xl border border-white/70 bg-white/80 p-4 text-sm leading-6 text-slate-700 shadow-sm dark:border-white/10 dark:bg-white/10 dark:text-slate-200">
                                {app.coverNote}
                            </div>
                        ) : null}
                    </div>

                    <aside className="border-t border-slate-200 bg-slate-950 p-6 text-white lg:border-l lg:border-t-0 dark:border-slate-800">
                        <p className="text-xs font-semibold uppercase text-slate-400">Requested unit</p>
                        <h2 className="mt-2 text-xl font-bold">{app.property.title}</h2>
                        <p className="mt-1 text-sm text-slate-300">
                            {app.unit.floorLabel ? `${app.unit.floorLabel} · ` : ''}Unit {app.unit.unitNumber}
                        </p>
                        <div className="mt-6 grid grid-cols-2 gap-3">
                            <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                                <p className="text-xs text-slate-400">Rent</p>
                                <p className="mt-1 font-semibold">{formatMoney(app.unit.monthlyRent)}</p>
                            </div>
                            <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                                <p className="text-xs text-slate-400">Received</p>
                                <p className="mt-1 font-semibold">{formatDate(app.createdAt)}</p>
                            </div>
                        </div>
                    </aside>
                </div>
            </section>

            <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
                <section className="space-y-6">
                    <div className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950">
                        <h2 className="text-lg font-semibold text-slate-950 dark:text-white">Applicant details</h2>
                        <div className="mt-5 grid gap-4 sm:grid-cols-2">
                            <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-900">
                                <p className="text-xs font-semibold uppercase text-slate-500">Phone</p>
                                <p className="mt-1 text-sm text-slate-900 dark:text-white">
                                    {app.tenant.phoneNumber ?? '-'}
                                </p>
                            </div>
                            <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-900">
                                <p className="text-xs font-semibold uppercase text-slate-500">Expected stay</p>
                                <p className="mt-1 text-sm text-slate-900 dark:text-white">
                                    {applicantData.stay ?? '-'}
                                </p>
                            </div>
                        </div>

                        {applicantData.requirements.length > 0 || applicantData.legacyLines.length > 0 ? (
                            <div className="mt-5 space-y-3">
                                {applicantData.requirements.map((item, idx) => (
                                    <div
                                        key={`${item.question}-${idx}`}
                                        className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800"
                                    >
                                        <p className="text-xs font-semibold uppercase text-slate-500">
                                            {item.question || `Answer ${idx + 1}`}
                                        </p>
                                        <p className="mt-2 text-sm text-slate-700 dark:text-slate-300">
                                            {item.answer || '-'}
                                        </p>
                                    </div>
                                ))}
                                {applicantData.legacyLines.map((line, idx) => (
                                    <div
                                        key={`${line}-${idx}`}
                                        className="rounded-2xl border border-slate-200 p-4 text-sm text-slate-700 dark:border-slate-800 dark:text-slate-300"
                                    >
                                        {line}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="mt-5 text-sm text-slate-500">No extra applicant answers were provided.</p>
                        )}
                    </div>

                    <div className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950">
                        <div className="flex items-center justify-between gap-4">
                            <div>
                                <h2 className="text-lg font-semibold text-slate-950 dark:text-white">Lease contract</h2>
                                <p className="mt-1 text-sm text-slate-500">
                                    {contract ? `${contract.status} · ${contract.startDate} to ${contract.endDate}` : 'No draft yet'}
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                                {contract ? (
                                    <DownloadReportButton
                                        label={t('reports.downloadLease')}
                                        isLoading={downloadLease.isPending}
                                        onDownload={() => downloadLease.mutateAsync(contract.id)}
                                    />
                                ) : (
                                    <FileText className="h-5 w-5 text-emerald-600" />
                                )}
                            </div>
                        </div>
                        <div className="mt-5">
                            <ContractLineItems contract={contract} />
                        </div>
                    </div>
                </section>

                <aside className="space-y-4">
                    <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950">
                        <h2 className="font-semibold text-slate-950 dark:text-white">Manage application</h2>
                        <p className="mt-1 text-sm text-slate-500">
                            Approve by preparing a contract, reject with reason, or remove stale applications.
                        </p>
                        <div className="mt-5 space-y-2">
                            {app.status === 'PENDING' || (app.status === 'APPROVED' && !app.contractId) || contract?.status === 'DRAFT' ? (
                                <Button
                                    type="button"
                                    className="w-full bg-emerald-600 text-white hover:bg-emerald-700"
                                    onClick={() => setContractOpen(true)}
                                >
                                    <CheckCircle2 className="h-4 w-4" />
                                    {contract?.status === 'DRAFT'
                                        ? 'Edit contract'
                                        : app.status === 'PENDING'
                                          ? 'Approve with contract'
                                          : 'Create contract'}
                                </Button>
                            ) : null}
                            {contract?.status === 'DRAFT' ? (
                                <Button
                                    type="button"
                                    className="w-full bg-sky-600 text-white hover:bg-sky-700"
                                    disabled={sendMut.isPending}
                                    onClick={() => void handleSendContract()}
                                >
                                    <Send className="h-4 w-4" />
                                    Send contract
                                </Button>
                            ) : null}
                            {app.status === 'PENDING' ? (
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="w-full border-red-200 text-red-700 hover:bg-red-50 dark:border-red-900 dark:text-red-300 dark:hover:bg-red-950/30"
                                    disabled={rejectMut.isPending}
                                    onClick={() => void handleReject(app)}
                                >
                                    <XCircle className="h-4 w-4" />
                                    Reject
                                </Button>
                            ) : null}
                            <Button
                                type="button"
                                variant="ghost"
                                className="w-full justify-start text-red-600 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950/30"
                                disabled={deleteMut.isPending}
                                onClick={() => void handleDelete(app)}
                            >
                                <Trash2 className="h-4 w-4" />
                                Delete application
                            </Button>
                        </div>
                    </div>

                    <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950">
                        <h2 className="flex items-center gap-2 font-semibold text-slate-950 dark:text-white">
                            <CalendarDays className="h-4 w-4 text-emerald-600" />
                            Review history
                        </h2>
                        <div className="mt-4 space-y-3 text-sm">
                            <p className="flex justify-between gap-4 text-slate-500">
                                <span>Created</span>
                                <span className="text-slate-900 dark:text-white">{formatDate(app.createdAt)}</span>
                            </p>
                            <p className="flex justify-between gap-4 text-slate-500">
                                <span>Reviewed</span>
                                <span className="text-slate-900 dark:text-white">{formatDate(app.reviewedAt)}</span>
                            </p>
                            <p className="flex justify-between gap-4 text-slate-500">
                                <span>Reviewer</span>
                                <span className="text-slate-900 dark:text-white">
                                    {app.reviewedBy?.name ?? '-'}
                                </span>
                            </p>
                        </div>
                        {app.rejectionReason ? (
                            <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/30 dark:text-red-300">
                                {app.rejectionReason}
                            </p>
                        ) : null}
                    </div>
                </aside>
            </div>

            <ApplicationContractDialog
                application={app}
                contract={contract}
                open={contractOpen}
                onOpenChange={setContractOpen}
            />
        </motion.div>
    );
};

export default ApplicationDetail;
