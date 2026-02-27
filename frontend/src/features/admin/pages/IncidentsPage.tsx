import { Link } from 'react-router-dom';
import { AlertTriangle, ArrowRight, CheckCircle, Clock4 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import clsx from 'clsx';
import { useAdminData } from '../hooks/useAdminData';

const IncidentsPage = () => {
    const { pendingIncidents, recentActions, isLoading } = useAdminData();

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8">
            <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                    <AlertTriangle className="text-amber-500" />
                    Incident Center
                </h1>
                <p className="text-slate-500 dark:text-slate-400 mt-2">
                    Track pending investigations and recently resolved security actions.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-[#101622] border border-slate-200 dark:border-slate-800 rounded-xl p-5">
                    <p className="text-xs uppercase tracking-wider text-slate-500 font-bold">Open Incidents</p>
                    <p className="text-3xl font-bold text-slate-900 dark:text-white mt-2">{pendingIncidents.length}</p>
                </div>
                <div className="bg-white dark:bg-[#101622] border border-slate-200 dark:border-slate-800 rounded-xl p-5">
                    <p className="text-xs uppercase tracking-wider text-slate-500 font-bold">Resolved (Recent)</p>
                    <p className="text-3xl font-bold text-emerald-500 mt-2">{recentActions.length}</p>
                </div>
                <div className="bg-white dark:bg-[#101622] border border-slate-200 dark:border-slate-800 rounded-xl p-5">
                    <p className="text-xs uppercase tracking-wider text-slate-500 font-bold">Queue Health</p>
                    <p className={clsx(
                        "text-lg font-bold mt-2",
                        pendingIncidents.length > 10 ? "text-red-500" : pendingIncidents.length > 3 ? "text-amber-500" : "text-emerald-500"
                    )}>
                        {pendingIncidents.length > 10 ? 'Overloaded' : pendingIncidents.length > 3 ? 'Busy' : 'Stable'}
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <section className="bg-white dark:bg-[#101622] border border-slate-200 dark:border-slate-800 rounded-xl">
                    <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                        <h2 className="font-bold text-slate-900 dark:text-white">Pending Review Queue</h2>
                        <span className="text-xs text-slate-500">{pendingIncidents.length} items</span>
                    </div>
                    <div className="divide-y divide-slate-200 dark:divide-slate-800">
                        {isLoading && <p className="p-5 text-sm text-slate-500">Loading incidents...</p>}
                        {!isLoading && pendingIncidents.length === 0 && (
                            <p className="p-5 text-sm text-slate-500">No pending incidents.</p>
                        )}
                        {pendingIncidents.map((incident) => (
                            <div key={incident.id} className="p-5 flex items-center justify-between gap-4">
                                <div>
                                    <p className="font-semibold text-slate-900 dark:text-white">
                                        {incident.type}
                                    </p>
                                    <p className="text-sm text-slate-500">
                                        {incident.src_ip} ({incident.country}) {'->'} Port {incident.destination_port}
                                    </p>
                                </div>
                                <Link
                                    to={`/admin/incidents/review/${incident.id}`}
                                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-bold flex items-center gap-1"
                                >
                                    Review <ArrowRight className="w-3 h-3" />
                                </Link>
                            </div>
                        ))}
                    </div>
                </section>

                <section className="bg-white dark:bg-[#101622] border border-slate-200 dark:border-slate-800 rounded-xl">
                    <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                        <h2 className="font-bold text-slate-900 dark:text-white">Recent Decisions</h2>
                        <Clock4 className="w-4 h-4 text-slate-400" />
                    </div>
                    <div className="divide-y divide-slate-200 dark:divide-slate-800">
                        {recentActions.length === 0 && (
                            <p className="p-5 text-sm text-slate-500">No decisions logged yet.</p>
                        )}
                        {recentActions.map((action, idx) => (
                            <div key={`${action.id}-${idx}`} className="p-5 flex items-start gap-3">
                                <CheckCircle className={clsx(
                                    "w-4 h-4 mt-1",
                                    String(action.action).includes('BLOCK') ? 'text-red-500' : 'text-emerald-500'
                                )} />
                                <div>
                                    <p className="font-medium text-slate-900 dark:text-white">
                                        {String(action.action).replace('_', ' ')} on {action.src_ip}
                                    </p>
                                    <p className="text-xs text-slate-500 mt-1">
                                        {action.timestamp
                                            ? formatDistanceToNow(new Date(action.timestamp), { addSuffix: true })
                                            : 'just now'}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            </div>
        </div>
    );
};

export default IncidentsPage;
