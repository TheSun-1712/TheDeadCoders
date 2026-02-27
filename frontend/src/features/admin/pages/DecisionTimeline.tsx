import { useState, useEffect } from 'react';
import { apiClient } from '../../../api/client';
import { History, CheckCircle, XCircle, Shield, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';
import clsx from 'clsx';

const DecisionTimeline = () => {
    const [logs, setLogs] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchLogs = async () => {
            try {
                const res = await apiClient.get('/logs/audit');
                setLogs(res.data.reverse()); // Newest first
            } catch (error) {
                console.error("Failed to fetch logs", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchLogs();
    }, []);

    return (
        <div className="max-w-4xl mx-auto p-8">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                        <History className="text-blue-500" />
                        Decision Timeline
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-2">
                        Chronological record of all system and analyst actions.
                    </p>
                </div>
                <div className="text-sm text-slate-500">
                    Total Records: {logs.length}
                </div>
            </div>

            <div className="relative border-l-2 border-slate-200 dark:border-slate-800 ml-3 space-y-8">
                {isLoading ? <div className="pl-6">Loading timeline...</div> : logs.map((log, idx) => (
                    <div key={idx} className="relative pl-8">
                        {/* Timeline Node */}
                        <div className={clsx(
                            "absolute -left-[9px] top-0 h-4 w-4 rounded-full border-2 border-white dark:border-[#0b1019]",
                            log.action.includes('BLOCK') ? "bg-red-500" :
                                log.action === 'FALSE_POSITIVE' ? "bg-slate-400" : "bg-blue-500"
                        )}></div>

                        {/* Content Card */}
                        <div className="bg-white dark:bg-[#151b29] rounded-lg border border-slate-200 dark:border-slate-800 p-5 shadow-sm hover:border-blue-500/50 transition-colors">
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-2 gap-2">
                                <h3 className="font-bold text-slate-900 dark:text-white text-lg flex items-center gap-2">
                                    {log.type}
                                    <span className="text-xs font-normal text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                                        ID: {log.id}
                                    </span>
                                </h3>
                                <div className="text-xs font-mono text-slate-500">
                                    {log.timestamp ? format(new Date(log.timestamp), 'MMM dd, HH:mm:ss') : 'Unknown Time'}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 text-sm text-slate-500 dark:text-slate-400">
                                <div className="flex items-center gap-2">
                                    <span className="font-semibold text-slate-700 dark:text-slate-300">Source:</span> {log.src_ip} ({log.country})
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="font-semibold text-slate-700 dark:text-slate-300">Analysis:</span> {Math.round(log.confidence * 100)}% Confidence
                                </div>
                            </div>

                            <div className="flex items-center gap-3 bg-slate-50 dark:bg-[#0b1019] p-3 rounded border border-slate-200 dark:border-slate-700">
                                {log.action.includes('BLOCK') ? <Shield className="w-5 h-5 text-red-500" /> : <CheckCircle className="w-5 h-5 text-slate-500" />}

                                <div className="flex-1">
                                    <p className="text-sm font-bold text-slate-900 dark:text-white">
                                        Action Information: {log.action}
                                    </p>
                                    <p className="text-xs text-slate-500">
                                        Executed by: <span className="font-mono text-blue-500">{log.handled_by || 'SYSTEM'}</span>
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}

                {!isLoading && logs.length === 0 && (
                    <div className="pl-8 text-slate-500">No actions recorded yet.</div>
                )}
            </div>
        </div>
    );
};

export default DecisionTimeline;