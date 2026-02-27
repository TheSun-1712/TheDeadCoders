import { ShieldCheck, Flag, TrendingUp, TrendingDown } from 'lucide-react';
import { useSystemHealth } from '../../../hooks/useSystemHealth';
import { useLiveTraffic } from '../../../hooks/useLiveTraffic';
import clsx from 'clsx';
import type { Packet } from '../../../types';

const AutomationStatus = () => {
    const { health } = useSystemHealth();
    const { traffic } = useLiveTraffic();

    // Filter relevant actions
    const automatedActions = traffic.filter(p => p.action !== 'MONITOR');

    return (
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* KPIs Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Threshold Card 1 */}
                <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-700/50 rounded-xl p-4 flex flex-col justify-between relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                        <ShieldCheck className="w-16 h-16 text-primary" />
                    </div>
                    <div>
                        <div className="text-xs uppercase tracking-wider text-slate-500 font-semibold mb-1">Auto-Block Confidence</div>
                        <div className="flex items-end gap-2">
                            <span className="text-3xl font-bold text-slate-800 dark:text-white">95%</span>
                            <span className="text-xs text-emerald-500 mb-1 font-medium">Active</span>
                        </div>
                    </div>
                    <div className="mt-4 w-full bg-slate-100 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-primary h-full rounded-full" style={{ width: '95%' }}></div>
                    </div>
                    <div className="mt-2 text-xs text-slate-400">Strict threshold. Requires high fidelity IOC match.</div>
                </div>

                {/* Threshold Card 2 */}
                <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-700/50 rounded-xl p-4 flex flex-col justify-between relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Flag className="w-16 h-16 text-yellow-500" />
                    </div>
                    <div>
                        <div className="text-xs uppercase tracking-wider text-slate-500 font-semibold mb-1">Review Threshold</div>
                        <div className="flex items-end gap-2">
                            <span className="text-3xl font-bold text-slate-800 dark:text-white">70%</span>
                            <span className="text-xs text-yellow-500 mb-1 font-medium">Flagged</span>
                        </div>
                    </div>
                    <div className="mt-4 w-full bg-slate-100 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-yellow-500 h-full rounded-full" style={{ width: '70%' }}></div>
                    </div>
                    <div className="mt-2 text-xs text-slate-400">Moderate confidence. Escalates to Tier 1 analyst.</div>
                </div>

                {/* Metric Card 1 */}
                <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-700/50 rounded-xl p-4 flex flex-col justify-center">
                    <div className="flex items-center justify-between mb-2">
                        <div className="text-xs uppercase tracking-wider text-slate-500 font-semibold">Analyst Hours Saved</div>
                        <TrendingUp className="w-4 h-4 text-emerald-500" />
                    </div>
                    <div className="text-3xl font-bold text-slate-800 dark:text-white mb-1">142h</div>
                    <div className="text-xs text-slate-400">Based on 15m avg handling time per event.</div>
                </div>

                {/* Metric Card 2 */}
                <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-700/50 rounded-xl p-4 flex flex-col justify-center">
                    <div className="flex items-center justify-between mb-2">
                        <div className="text-xs uppercase tracking-wider text-slate-500 font-semibold">False Positive Rate</div>
                        <TrendingDown className="w-4 h-4 text-emerald-500" />
                    </div>
                    <div className="text-3xl font-bold text-slate-800 dark:text-white mb-1">0.04%</div>
                    <div className="text-xs text-slate-400">Last 24h - 3 overrides by human analysts.</div>
                </div>
            </div>

            {/* Main Chart Area */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-96 min-h-[24rem]">
                {/* Main Comparison Chart - Simulated with CSS */}
                <div className="lg:col-span-2 bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-700/50 rounded-xl p-5 flex flex-col">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h3 className="font-semibold text-lg text-slate-800 dark:text-white">Decision Velocity</h3>
                            <p className="text-sm text-slate-500">Automated Remediation vs Human Review Volume</p>
                        </div>
                        <div className="flex items-center gap-4 text-xs">
                            <div className="flex items-center gap-2">
                                <span className="w-3 h-3 rounded-full bg-primary"></span>
                                <span className="text-slate-400">Automated</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="w-3 h-3 rounded-full bg-slate-600"></span>
                                <span className="text-slate-400">Human</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex-1 flex items-end gap-2 sm:gap-4 justify-between pt-4 pb-2 border-b border-slate-200 dark:border-slate-700">
                        {[0, 4, 8, 12, 16, 20].map((hour) => (
                            <div key={hour} className="w-full flex flex-col gap-1 h-full justify-end group cursor-pointer relative">
                                <div className="w-full bg-slate-600/80 hover:bg-slate-500 rounded-t-sm transition-all" style={{ height: `${Math.random() * 20 + 10}%` }}></div>
                                <div className="w-full bg-primary hover:bg-blue-600 rounded-t-sm transition-all" style={{ height: `${Math.random() * 40 + 30}%` }}></div>
                                <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] text-slate-500">{hour.toString().padStart(2, '0')}:00</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Donut / Ratio Chart */}
                <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-700/50 rounded-xl p-5 flex flex-col relative overflow-hidden">
                    <h3 className="font-semibold text-lg text-slate-800 dark:text-white mb-4 z-10">Automation Ratio</h3>
                    <div className="flex-1 flex items-center justify-center relative z-10">
                        <div className="relative w-40 h-40">
                            <svg className="w-full h-full" viewBox="0 0 100 100">
                                <circle className="text-slate-200 dark:text-slate-800 stroke-current" cx="50" cy="50" fill="transparent" r="40" strokeWidth="8"></circle>
                                <circle className="text-primary stroke-current transition-all duration-1000" cx="50" cy="50" fill="transparent" r="40" strokeDasharray="251.2" strokeDashoffset={`${251.2 * (1 - (parseFloat(health?.automation_rate || "98") / 100))}`} strokeLinecap="round" strokeWidth="8" transform="rotate(-90 50 50)"></circle>
                            </svg>
                            <div className="absolute top-0 left-0 w-full h-full flex flex-col items-center justify-center">
                                <span className="text-3xl font-bold text-slate-800 dark:text-white">{health?.automation_rate || '98%'}</span>
                                <span className="text-[10px] text-slate-500 uppercase tracking-widest">Automated</span>
                            </div>
                        </div>
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-4 text-center z-10">
                        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-2">
                            <div className="text-xs text-slate-500">Total Events</div>
                            <div className="font-semibold text-slate-800 dark:text-white">{health ? health.traffic_processed : '...'}</div>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-2">
                            <div className="text-xs text-slate-500">Escalated</div>
                            <div className="font-semibold text-slate-800 dark:text-white">1,488</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Recent Actions List */}
            <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-700/50 rounded-xl flex flex-col overflow-hidden h-[400px]">
                <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between bg-slate-50 dark:bg-surface-darker/50">
                    <h3 className="font-semibold text-slate-800 dark:text-white flex items-center gap-2">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                        Live Automation Stream
                    </h3>
                </div>
                <div className="overflow-y-auto flex-1">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 dark:bg-surface-darker text-xs uppercase text-slate-500 font-medium sticky top-0 z-10 shadow-sm">
                            <tr>
                                <th className="px-6 py-3 tracking-wider">Status</th>
                                <th className="px-6 py-3 tracking-wider">Action Type</th>
                                <th className="px-6 py-3 tracking-wider">Target Entity</th>
                                <th className="px-6 py-3 tracking-wider">Reasoning</th>
                                <th className="px-6 py-3 tracking-wider">Confidence</th>
                                <th className="px-6 py-3 tracking-wider text-right">Time</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                            {automatedActions.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-8 text-center text-slate-500">Waiting for automation events...</td>
                                </tr>
                            ) : (
                                automatedActions.map((action, idx) => (
                                    <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                        <td className="px-6 py-3 whitespace-nowrap">
                                            <span className={clsx("inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium",
                                                action.action === 'AUTO_BLOCKED' ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400" :
                                                    action.action === 'MANUAL_BLOCK' ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400" :
                                                        "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
                                            )}>
                                                <span className={clsx("w-1.5 h-1.5 rounded-full",
                                                    (action.action === 'AUTO_BLOCKED' || action.action === 'MANUAL_BLOCK') ? "bg-red-500" : "bg-yellow-500"
                                                )}></span>
                                                {action.action}
                                            </span>
                                        </td>
                                        <td className="px-6 py-3 text-slate-700 dark:text-slate-300 font-medium">{getActionDescription(action)}</td>
                                        <td className="px-6 py-3 text-primary font-mono text-xs">{action.src_ip}</td>
                                        <td className="px-6 py-3 text-slate-500 dark:text-slate-400">{action.type}</td>
                                        <td className="px-6 py-3">
                                            <div className="flex items-center gap-2">
                                                <div className="w-16 bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                                                    <div className={clsx("h-full rounded-full", action.confidence > 0.9 ? "bg-primary" : "bg-yellow-500")} style={{ width: `${action.confidence * 100}%` }}></div>
                                                </div>
                                                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{Math.round(action.confidence * 100)}%</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-3 text-slate-400 text-right text-xs">
                                            {new Date(action.timestamp).toLocaleTimeString()}
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

function getActionDescription(action: Packet): string {
    if (action.type === 'DDoS Attack') return 'Firewall Rule Add';
    if (action.type === 'Malware') return 'Endpoint Isolation';
    if (action.type === 'Phishing') return 'Email Purge';
    return 'Traffic Analysis';
}

export default AutomationStatus;
