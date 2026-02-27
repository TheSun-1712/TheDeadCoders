import { useState, useEffect } from 'react';
import { apiClient } from '../../../api/client';
import { FileText, Download } from 'lucide-react';
import { format } from 'date-fns';

const ComplianceReports = () => {
    const [auditLogs, setAuditLogs] = useState<any[]>([]);
    const [stats, setStats] = useState({
        total: 0,
        blocks: 0,
        autoRate: 0
    });
    const [downloading, setDownloading] = useState<string | null>(null);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await apiClient.get('/logs/audit');
                const logs = res.data;
                setAuditLogs(logs);
                const blocks = logs.filter((l: any) => l.action.includes('BLOCK')).length;
                const auto = logs.filter((l: any) => l.handled_by === 'SYSTEM_AUTOMATION').length;

                setStats({
                    total: logs.length,
                    blocks,
                    autoRate: logs.length > 0 ? (auto / logs.length) * 100 : 0
                });
            } catch (error) {
                console.error("Failed to fetch stats", error);
            }
        };
        fetchStats();
    }, []);

    const triggerDownload = (filename: string, content: string, mimeType: string) => {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
    };

    const toCsv = (rows: any[]) => {
        const headers = ['id', 'timestamp', 'src_ip', 'type', 'action', 'handled_by', 'model_version'];
        const escape = (v: unknown) => {
            const s = String(v ?? '');
            return `"${s.replace(/"/g, '""')}"`;
        };
        const lines = [
            headers.join(','),
            ...rows.map((row) => headers.map((h) => escape((row as any)[h])).join(',')),
        ];
        return lines.join('\n');
    };

    const handleDownload = async (fileFormat: 'csv' | 'json') => {
        if (auditLogs.length === 0) return;
        setDownloading(fileFormat);
        try {
            const stamp = format(new Date(), 'yyyyMMdd_HHmmss');
            if (fileFormat === 'csv') {
                const csv = toCsv(auditLogs);
                triggerDownload(`audit_logs_${stamp}.csv`, csv, 'text/csv;charset=utf-8;');
            } else {
                triggerDownload(
                    `audit_logs_${stamp}.json`,
                    JSON.stringify(auditLogs, null, 2),
                    'application/json;charset=utf-8;'
                );
            }
        } finally {
            setDownloading(null);
        }
    };

    return (
        <div className="p-8 max-w-6xl mx-auto">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                    <FileText className="text-blue-500" />
                    Compliance & Reports
                </h1>
                <p className="text-slate-500 dark:text-slate-400 mt-2">
                    System Accountability & Governance Audit Dashboard.
                </p>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white dark:bg-[#151b29] p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Recorded Events</p>
                    <p className="text-3xl font-bold text-slate-900 dark:text-white mt-1">{stats.total}</p>
                </div>
                <div className="bg-white dark:bg-[#151b29] p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Threats Neutralized</p>
                    <p className="text-3xl font-bold text-emerald-500 mt-1">{stats.blocks}</p>
                </div>
                <div className="bg-white dark:bg-[#151b29] p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Automation Rate</p>
                    <p className="text-3xl font-bold text-blue-500 mt-1">{stats.autoRate.toFixed(1)}%</p>
                </div>
            </div>

            {/* Mock Reports List */}
            <div className="bg-white dark:bg-[#151b29] rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">Generated Reports</h3>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => handleDownload('csv')}
                            disabled={auditLogs.length === 0 || downloading !== null}
                            className="px-3 py-1.5 text-xs font-semibold rounded border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50"
                        >
                            {downloading === 'csv' ? 'Exporting CSV...' : 'Export CSV'}
                        </button>
                        <button
                            onClick={() => handleDownload('json')}
                            disabled={auditLogs.length === 0 || downloading !== null}
                            className="px-3 py-1.5 text-xs font-semibold rounded border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50"
                        >
                            {downloading === 'json' ? 'Exporting JSON...' : 'Export JSON'}
                        </button>
                    </div>
                </div>
                <div className="divide-y divide-slate-200 dark:divide-slate-800">
                    {[
                        { name: 'Weekly Security Audit (CSV)', date: new Date().toISOString(), format: 'csv' as const },
                        { name: 'Incident Timeline Export (JSON)', date: new Date(Date.now() - 86400000).toISOString(), format: 'json' as const },
                        { name: 'Compliance Snapshot (CSV)', date: new Date(Date.now() - 172800000).toISOString(), format: 'csv' as const },
                    ].map((report, idx) => (
                        <div key={idx} className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-[#0b1019] transition-colors">
                            <div className="flex items-center gap-4">
                                <div className="p-2 bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg">
                                    <FileText className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="font-medium text-slate-900 dark:text-white">{report.name}</p>
                                    <p className="text-xs text-slate-500">{format(new Date(report.date), 'MMM dd, yyyy')}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => handleDownload(report.format)}
                                disabled={auditLogs.length === 0 || downloading !== null}
                                className="p-2 text-slate-400 hover:text-blue-500 transition-colors disabled:opacity-50"
                                title={`Download ${report.format.toUpperCase()}`}
                            >
                                <Download className="w-5 h-5" />
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ComplianceReports;
