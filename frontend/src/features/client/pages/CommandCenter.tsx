import { Radar, ShieldBan, Wand2, Timer, AlertOctagon, AlertTriangle } from 'lucide-react';
import { useLiveTraffic } from '../../../hooks/useLiveTraffic';
import { useOverviewMetrics } from '../../../hooks/useOverviewMetrics';
import clsx from 'clsx';

const CommandCenter = () => {
    const { metrics } = useOverviewMetrics();
    const { traffic } = useLiveTraffic();
    const mtt = metrics?.mean_time_to_respond_seconds ?? 0;
    const mttMinutes = Math.floor(mtt / 60);
    const mttSeconds = mtt % 60;
    const mttDisplay = `${mttMinutes}m ${String(mttSeconds).padStart(2, '0')}s`;
    const autoProgress = Math.max(0, Math.min(100, metrics?.automation_rate_value ?? 0));
    const mttProgress = Math.max(0, Math.min(100, 100 - (mtt / 300) * 100));
    const severity = metrics?.severity_distribution ?? { critical: 0, high: 0, medium: 0, low: 0 };
    const severityTotal = severity.critical + severity.high + severity.medium + severity.low;
    const apiHealthy = (metrics?.api_latency_ms ?? 0) < 100;
    const dbHealthy = (metrics?.db_latency_ms ?? 0) < 150;

    // Filter for only actioned items for the table
    const recentActions = traffic.filter(p => p.action !== 'MONITOR').slice(0, 5);

    return (
        <div className="max-w-[1600px] mx-auto p-6 lg:p-8 space-y-6">
            {/* KPI Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white dark:bg-surface-dark rounded-xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Radar className="w-16 h-16 text-primary" />
                    </div>
                    <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mb-1">Active Threats</p>
                    <div className="flex items-baseline gap-2">
                        <h3 className="text-3xl font-bold text-slate-900 dark:text-white">{metrics?.active_threats ?? 0}</h3>
                        <span className="text-xs font-medium text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded flex items-center">
                            {`${metrics?.traffic_change_percent ?? 0}%`}
                        </span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-700 h-1 mt-4 rounded-full overflow-hidden">
                        <div className="bg-primary h-full rounded-full" style={{ width: `${Math.max(0, Math.min(100, (metrics?.active_threats ?? 0) / 2))}%` }}></div>
                    </div>
                </div>

                <div className="bg-white dark:bg-surface-dark rounded-xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <ShieldBan className="w-16 h-16 text-primary" />
                    </div>
                    <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mb-1">Blocked IPs (24h)</p>
                    <div className="flex items-baseline gap-2">
                        <h3 className="text-3xl font-bold text-slate-900 dark:text-white">{metrics?.blocked_ips_24h ?? 0}</h3>
                        <span className="text-xs font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded">
                            Avg. {metrics?.avg_blocked_per_hour ?? 0}/hr
                        </span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-700 h-1 mt-4 rounded-full overflow-hidden">
                        <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${Math.max(0, Math.min(100, (metrics?.blocked_ips_24h ?? 0) / 2))}%` }}></div>
                    </div>
                </div>

                <div className="bg-white dark:bg-surface-dark rounded-xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Wand2 className="w-16 h-16 text-primary" />
                    </div>
                    <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mb-1">Auto-Remediated</p>
                    <div className="flex items-baseline gap-2">
                        <h3 className="text-3xl font-bold text-slate-900 dark:text-white">{metrics?.automation_rate ?? '...'}</h3>
                        <span className="text-xs font-medium text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded flex items-center">
                            Live
                        </span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-700 h-1 mt-4 rounded-full overflow-hidden">
                        <div className="bg-primary h-full rounded-full" style={{ width: `${autoProgress}%` }}></div>
                    </div>
                </div>

                <div className="bg-white dark:bg-surface-dark rounded-xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Timer className="w-16 h-16 text-primary" />
                    </div>
                    <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mb-1">Mean Time to Respond</p>
                    <div className="flex items-baseline gap-2">
                        <h3 className="text-3xl font-bold text-slate-900 dark:text-white">{mttDisplay}</h3>
                        <span className="text-xs font-medium text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded flex items-center">
                            Last 24h
                        </span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-700 h-1 mt-4 rounded-full overflow-hidden">
                        <div className="bg-warning h-full rounded-full" style={{ width: `${mttProgress}%` }}></div>
                    </div>
                </div>
            </div>

            {/* Split Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Severity Distribution */}
                <div className="lg:col-span-2 bg-white dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col">
                    <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
                        <h3 className="font-bold text-lg text-slate-900 dark:text-white">Incident Severity Distribution</h3>
                        <select className="bg-slate-50 dark:bg-surface-darker border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs rounded px-2 py-1">
                            <option>Last 24 Hours</option>
                            <option>Last 7 Days</option>
                        </select>
                    </div>
                    <div className="p-6 flex-1 flex flex-col md:flex-row items-center gap-8">
                        {/* Abstract Donut Chart */}
                        <div className="relative w-48 h-48 flex-shrink-0">
                            <div className="absolute inset-0 rounded-full border-[16px] border-danger opacity-90" style={{ clipPath: 'polygon(50% 0%, 100% 0%, 100% 100%, 50% 50%)', transform: 'rotate(-10deg)' }}></div>
                            <div className="absolute inset-0 rounded-full border-[16px] border-warning opacity-90" style={{ clipPath: 'polygon(50% 50%, 100% 100%, 0% 100%, 0% 50%)', transform: 'rotate(45deg)' }}></div>
                            <div className="absolute inset-0 rounded-full border-[16px] border-primary opacity-90" style={{ clipPath: 'polygon(0 0, 50% 0, 50% 50%, 0 50%)', transform: 'rotate(0deg)' }}></div>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="text-3xl font-bold text-slate-900 dark:text-white">Total</span>
                                <span className="text-sm text-slate-500 dark:text-slate-400">{severityTotal}</span>
                            </div>
                        </div>

                        {/* Legend */}
                        <div className="flex-1 grid grid-cols-2 gap-4 w-full">
                            <div className="bg-slate-50 dark:bg-surface-darker p-3 rounded-lg border border-slate-100 dark:border-slate-700/50">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="w-3 h-3 rounded-full bg-danger"></span>
                                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Critical</span>
                                </div>
                                <div className="flex justify-between items-end">
                                    <span className="text-2xl font-bold text-slate-900 dark:text-white">{severity.critical}</span>
                                    <span className="text-xs text-danger font-medium">Last 24h</span>
                                </div>
                            </div>
                            <div className="bg-slate-50 dark:bg-surface-darker p-3 rounded-lg border border-slate-100 dark:border-slate-700/50">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="w-3 h-3 rounded-full bg-warning"></span>
                                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">High</span>
                                </div>
                                <div className="flex justify-between items-end">
                                    <span className="text-2xl font-bold text-slate-900 dark:text-white">{severity.high}</span>
                                    <span className="text-xs text-slate-500">Last 24h</span>
                                </div>
                            </div>
                            <div className="bg-slate-50 dark:bg-surface-darker p-3 rounded-lg border border-slate-100 dark:border-slate-700/50">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="w-3 h-3 rounded-full bg-primary/60"></span>
                                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Medium</span>
                                </div>
                                <div className="flex justify-between items-end">
                                    <span className="text-2xl font-bold text-slate-900 dark:text-white">{severity.medium}</span>
                                </div>
                            </div>
                            <div className="bg-slate-50 dark:bg-surface-darker p-3 rounded-lg border border-slate-100 dark:border-slate-700/50">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="w-3 h-3 rounded-full bg-slate-500"></span>
                                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Low</span>
                                </div>
                                <div className="flex justify-between items-end">
                                    <span className="text-2xl font-bold text-slate-900 dark:text-white">{severity.low}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* System Health */}
                <div className="bg-white dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col">
                    <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
                        <h3 className="font-bold text-lg text-slate-900 dark:text-white">System Health</h3>
                    </div>
                    <div className="p-6 flex flex-col gap-4">
                        <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-surface-darker border border-slate-100 dark:border-slate-700/50">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-emerald-500/10 rounded text-emerald-500">
                                    <AlertOctagon className="w-4 h-4" />
                                </div>
                                <div>
                                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">API Gateway</h4>
                                    <p className={clsx("text-xs font-medium", apiHealthy ? "text-emerald-500" : "text-warning")}>
                                        {apiHealthy ? "Online" : "Slow"} ({metrics?.api_latency_ms ?? 0}ms)
                                    </p>
                                </div>
                            </div>
                            <div className={clsx("h-2 w-2 rounded-full", apiHealthy ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]" : "bg-warning shadow-[0_0_8px_rgba(245,158,11,0.6)]")}></div>
                        </div>
                        <div className={clsx("flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-surface-darker border border-slate-100 dark:border-slate-700/50 border-l-4", dbHealthy ? "border-l-emerald-500" : "border-l-warning")}>
                            <div className="flex items-center gap-3">
                                <div className={clsx("p-2 rounded", dbHealthy ? "bg-emerald-500/10 text-emerald-500" : "bg-warning/10 text-warning")}>
                                    <AlertTriangle className="w-4 h-4" />
                                </div>
                                <div>
                                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">Database Cluster</h4>
                                    <p className={clsx("text-xs font-medium", dbHealthy ? "text-emerald-500" : "text-warning")}>
                                        {dbHealthy ? "Online" : "High Latency"} ({metrics?.db_latency_ms ?? 0}ms)
                                    </p>
                                </div>
                            </div>
                            <div className={clsx("h-2 w-2 rounded-full", dbHealthy ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]" : "bg-warning shadow-[0_0_8px_rgba(245,158,11,0.6)]")}></div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                    <h3 className="font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2">
                        <Timer className="text-primary w-5 h-5" />
                        Recent Automated Actions
                    </h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 dark:bg-surface-darker border-b border-slate-200 dark:border-slate-700">
                            <tr>
                                <th className="px-6 py-3 font-semibold text-slate-600 dark:text-slate-400">Time</th>
                                <th className="px-6 py-3 font-semibold text-slate-600 dark:text-slate-400">Action Type</th>
                                <th className="px-6 py-3 font-semibold text-slate-600 dark:text-slate-400">Target</th>
                                <th className="px-6 py-3 font-semibold text-slate-600 dark:text-slate-400">Trigger</th>
                                <th className="px-6 py-3 font-semibold text-slate-600 dark:text-slate-400">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                            {recentActions.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                                        No recent automated actions. Waiting for traffic...
                                    </td>
                                </tr>
                            ) : (
                                recentActions.map((action, idx) => (
                                    <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-surface-darker/50 transition-colors">
                                        <td className="px-6 py-3 text-slate-500 font-mono">{new Date(action.timestamp).toLocaleTimeString()}</td>
                                        <td className="px-6 py-3 text-slate-900 dark:text-white font-medium">{action.action}</td>
                                        <td className="px-6 py-3 text-slate-500 font-mono">{action.src_ip}</td>
                                        <td className="px-6 py-3 text-slate-500">{action.type}</td>
                                        <td className="px-6 py-3">
                                            <span className={clsx("inline-flex items-center px-2 py-0.5 rounded text-xs font-medium",
                                                action.action.includes('BLOCK') ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" : "bg-warning/10 text-warning border border-warning/20"
                                            )}>
                                                {action.action.includes('BLOCK') ? 'Success' : 'Pending'}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default CommandCenter;
