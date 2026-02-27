import { Link } from 'react-router-dom';
import { useAdminData } from '../hooks/useAdminData';
import { AlertTriangle, Clock, ShieldAlert, CheckCircle, XCircle, ArrowRight, Filter } from 'lucide-react';
import clsx from 'clsx';
import { format } from 'date-fns';

const AdminDashboard = () => {
    const { pendingIncidents, stats, recentActions, resolveIncident } = useAdminData();

    return (
        <div className="p-6 grid grid-cols-12 gap-6 relative min-h-screen">
            {/* Left Column: Pending Reviews */}
            <div className="col-span-12 lg:col-span-8 xl:col-span-9 flex flex-col gap-6">

                {/* Section Header */}
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <AlertTriangle className="text-amber-400" />
                        Pending Incidents Requiring Review
                    </h2>
                    <div className="flex gap-2">
                        <button className="px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 bg-white dark:bg-[#101622] border border-slate-200 dark:border-slate-700 rounded hover:border-blue-500 transition-colors flex items-center gap-1">
                            <Filter className="w-3 h-3" /> Filter
                        </button>
                    </div>
                </div>

                {/* Active Incidents Grid */}
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                    {pendingIncidents.length === 0 ? (
                        <div className="col-span-full p-8 text-center bg-white dark:bg-[#101622] rounded-lg border border-slate-200 dark:border-slate-800 text-slate-500">
                            <CheckCircle className="w-12 h-12 mx-auto mb-3 text-emerald-500" />
                            <h3 className="text-lg font-medium text-slate-900 dark:text-white">All Clear</h3>
                            <p>No pending incidents in the queue.</p>
                        </div>
                    ) : (
                        pendingIncidents.map((incident) => (
                            <div key={incident.id} className="group relative bg-white dark:bg-[#101622] border-l-4 border-l-amber-400 border-y border-r border-slate-200 dark:border-slate-700 rounded-r-lg shadow-sm hover:shadow-md transition-all p-5">
                                <div className="absolute top-4 right-4 flex items-center gap-2">
                                    <span className="text-xs font-mono text-slate-500">ID: INC-{incident.id}</span>
                                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-red-500/10 text-red-500 border border-red-500/20">
                                        {incident.confidence > 0.9 ? 'Critical' : 'High'}
                                    </span>
                                </div>

                                <div className="mb-4 pr-12">
                                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">{incident.type}</h3>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">
                                        Source: {incident.src_ip} ({incident.country}) → Port {incident.destination_port}
                                    </p>
                                </div>

                                <div className="flex flex-wrap items-end justify-between gap-4">
                                    <div className="flex items-center gap-4 text-sm">
                                        <div>
                                            <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">AI Confidence</p>
                                            <div className="flex items-center gap-2">
                                                <div className="w-16 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                                    <div className="h-full bg-blue-500" style={{ width: `${incident.confidence * 100}%` }}></div>
                                                </div>
                                                <span className="font-bold text-blue-500">{Math.round(incident.confidence * 100)}%</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-col items-end gap-2">
                                        <Link
                                            to={`/admin/incidents/review/${incident.id}`}
                                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded shadow-lg shadow-blue-500/20 transition-all flex items-center gap-2"
                                        >
                                            Review Now <ArrowRight className="w-4 h-4" />
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Recent Actions (Bottom) */}
                <div className="mt-auto">
                    <h2 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4">Recent Actions</h2>
                    <div className="bg-white dark:bg-[#101622] border border-slate-200 dark:border-slate-700 rounded-lg p-4">
                        <div className="relative pl-6 border-l border-slate-200 dark:border-slate-700 space-y-6">
                            {recentActions.length === 0 ? <p className="text-sm text-slate-500">No recent actions.</p> : recentActions.map((action, idx) => (
                                <div key={idx} className="relative">
                                    <span className={clsx(
                                        "absolute -left-[29px] top-1 h-3 w-3 rounded-full ring-4 ring-white dark:ring-[#101622]",
                                        action.action === 'AUTO_BLOCKED' ? "bg-purple-500" :
                                            action.action === 'MANUAL_BLOCK' ? "bg-red-500" : "bg-emerald-500"
                                    )}></span>
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="text-sm font-medium text-slate-900 dark:text-white">
                                                {action.action.replace('_', ' ')}: {action.src_ip}
                                            </p>
                                            <p className="text-xs text-slate-500 mt-1">
                                                Packet #{action.id} • Type: {action.type}
                                            </p>
                                        </div>
                                        <span className="text-xs text-slate-400 font-mono">
                                            {action.timestamp ? format(new Date(action.timestamp), 'HH:mm') : 'Just now'}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Column: Priority Queue & Status */}
            <div className="col-span-12 lg:col-span-4 xl:col-span-3 flex flex-col h-full gap-6">

                {/* Priority Queue Widget */}
                <div className="flex flex-col h-full bg-white dark:bg-[#101622] border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
                    <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#151b29] flex justify-between items-center">
                        <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">Priority Queue</h2>
                        <span className="bg-blue-500/10 text-blue-500 text-xs font-bold px-2 py-1 rounded">{pendingIncidents.length} Items</span>
                    </div>
                    <div className="flex-1 overflow-y-auto">
                        {pendingIncidents.map((incident) => (
                            <div key={incident.id} className="p-4 border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer group">
                                <div className="flex justify-between items-start mb-1">
                                    <span className="text-xs font-mono text-red-500 font-bold">HIGH</span>
                                    <span className="text-xs text-slate-400 font-mono">2m ago</span>
                                </div>
                                <h4 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-blue-500 transition-colors">
                                    {incident.type}
                                </h4>
                            </div>
                        ))}
                        {pendingIncidents.length === 0 && (
                            <div className="p-8 text-center text-slate-400 text-sm">Queue empty</div>
                        )}
                    </div>
                </div>

                {/* System Health Widget */}
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                    <div className="flex items-center gap-3 mb-2">
                        <ShieldAlert className="text-blue-500 w-5 h-5" />
                        <h4 className="text-sm font-bold text-blue-500">System Health</h4>
                    </div>
                    <div className="space-y-3">
                        <div className="flex justify-between text-xs">
                            <span className="text-slate-500 dark:text-slate-400">Avg Response</span>
                            <span className="text-slate-900 dark:text-white font-mono">{stats.avgResponseTime}</span>
                        </div>
                        <div className="w-full h-1 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-500 w-[80%]"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;