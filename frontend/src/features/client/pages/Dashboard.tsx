import { Link } from 'react-router-dom';
import { ArrowRight, Activity, ShieldAlert, Zap, Radio, Globe } from 'lucide-react';
import clsx from 'clsx';
import { useSystemHealth } from '../../../hooks/useSystemHealth';

const Dashboard = () => {
    const { health } = useSystemHealth();

    return (
        <div className="max-w-7xl mx-auto px-6 py-8 space-y-8 relative z-10">
            {/* Ambient Glow Effects */}
            <div className="absolute top-[-20%] left-[20%] w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] pointer-events-none"></div>
            <div className="absolute bottom-[-10%] right-[10%] w-[400px] h-[400px] bg-primary/5 rounded-full blur-[100px] pointer-events-none"></div>

            {/* Hero Section */}
            <div className="flex flex-col lg:flex-row items-start lg:items-end justify-between gap-6 pb-6 border-b border-gray-200 dark:border-white/5 relative z-10">
                <div className="space-y-2 max-w-2xl">
                    <div className={clsx(
                        "inline-flex items-center space-x-2 px-3 py-1 rounded-full border text-xs font-bold tracking-wider mb-2 animate-pulse-slow",
                        health?.status === 'HEALTHY'
                            ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500"
                            : "bg-red-500/10 border-red-500/20 text-red-500"
                    )}>
                        <div className={clsx("w-2 h-2 rounded-full animate-pulse", health?.status === 'HEALTHY' ? "bg-emerald-500" : "bg-red-500")}></div>
                        <span>SYSTEM STATUS: {health?.status || 'CONNECTING...'}</span>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white leading-tight">
                        AI-Driven Automated <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-300">Incident Response System</span>
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 text-lg max-w-xl pt-2">
                        Real-time heuristic analysis and automated threat mitigation engine. Platform is currently operating at nominal capacity.
                    </p>
                </div>

                {/* Automation Indicators */}
                <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
                    <div className="flex-1 lg:flex-none bg-white dark:bg-surface-dark border border-gray-200 dark:border-white/10 rounded-xl p-4 flex items-center justify-between gap-4 shadow-sm min-w-[200px]">
                        <div>
                            <div className="text-xs text-slate-500 dark:text-slate-400 uppercase font-bold tracking-wider mb-1">Auto-Block</div>
                            <div className="text-emerald-500 font-bold flex items-center gap-2">
                                <Zap className="w-4 h-4" />
                                ENABLED
                            </div>
                        </div>
                        <div className="h-8 w-14 bg-primary/20 rounded-full p-1 relative">
                            <div className="w-6 h-6 bg-primary rounded-full absolute right-1 shadow-lg"></div>
                        </div>
                    </div>
                    <div className="flex-1 lg:flex-none bg-white dark:bg-surface-dark border border-gray-200 dark:border-white/10 rounded-xl p-4 flex items-center justify-between gap-4 shadow-sm min-w-[200px]">
                        <div>
                            <div className="text-xs text-slate-500 dark:text-slate-400 uppercase font-bold tracking-wider mb-1">Human-Review</div>
                            <div className="text-amber-500 font-bold flex items-center gap-2">
                                <Activity className="w-4 h-4" />
                                ACTIVE
                            </div>
                        </div>
                        <div className="h-8 w-14 bg-amber-500/20 rounded-full p-1 relative">
                            <div className="w-6 h-6 bg-amber-500 rounded-full absolute right-1 shadow-lg"></div>
                        </div>
                    </div>
                </div>
            </div>

            {/* KPI Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
                {/* Traffic KPI */}
                <div className="group relative bg-white dark:bg-surface-dark border border-gray-200 dark:border-white/5 rounded-2xl p-6 hover:border-primary/50 transition-all duration-300 shadow-lg dark:shadow-none overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div className="relative z-10">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3 className="text-slate-500 dark:text-slate-400 text-sm font-medium uppercase tracking-wide">Total Traffic (24h)</h3>
                                <div className="flex items-baseline mt-1 space-x-2">
                                    <span className="text-4xl font-bold text-slate-900 dark:text-white">
                                        {health ? health.traffic_processed : '...'}
                                    </span>
                                    <span className="text-sm font-medium text-emerald-500 flex items-center">
                                        +12%
                                    </span>
                                </div>
                            </div>
                            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                                <Radio className="w-6 h-6" />
                            </div>
                        </div>
                        {/* Sparkline decoration */}
                        <div className="h-12 w-full flex items-end justify-between gap-1 opacity-70">
                            {[30, 50, 40, 70, 55, 45, 80, 60, 40, 30, 20, 45].map((h, i) => (
                                <div key={i} className={clsx("w-1/12 rounded-t-sm", i === 7 ? "bg-primary animate-pulse" : "bg-primary/30")} style={{ height: `${h}%` }}></div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Incidents KPI */}
                <div className="group relative bg-white dark:bg-surface-dark border border-gray-200 dark:border-white/5 rounded-2xl p-6 hover:border-red-500/50 transition-all duration-300 shadow-lg dark:shadow-none overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div className="relative z-10">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3 className="text-slate-500 dark:text-slate-400 text-sm font-medium uppercase tracking-wide">System Health</h3>
                                <div className="flex items-baseline mt-1 space-x-2">
                                    <span className="text-4xl font-bold text-slate-900 dark:text-white">
                                        {health?.status === 'HEALTHY' ? '98%' : '75%'}
                                    </span>
                                    <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Score</span>
                                </div>
                            </div>
                            <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center text-red-500 relative">
                                <ShieldAlert className="w-6 h-6" />
                                {health?.status !== 'HEALTHY' && <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full animate-ping"></span>}
                            </div>
                        </div>
                        <div className="w-full bg-slate-100 dark:bg-black/30 rounded-full h-2 overflow-hidden mt-6">
                            <div className="bg-gradient-to-r from-red-600 to-amber-500 h-full rounded-full" style={{ width: health?.status === 'HEALTHY' ? '98%' : '75%' }}></div>
                        </div>
                    </div>
                </div>

                {/* Automation Rate KPI */}
                <div className="group relative bg-white dark:bg-surface-dark border border-gray-200 dark:border-white/5 rounded-2xl p-6 hover:border-purple-500/50 transition-all duration-300 shadow-lg dark:shadow-none overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div className="relative z-10 flex items-center justify-between">
                        <div>
                            <h3 className="text-slate-500 dark:text-slate-400 text-sm font-medium uppercase tracking-wide">Auto-Resolution</h3>
                            <div className="flex items-baseline mt-1 space-x-2">
                                <span className="text-4xl font-bold text-slate-900 dark:text-white">
                                    {health ? health.automation_rate : '...'}
                                </span>
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 max-w-[140px]">Percentage of threats neutralized automatically.</p>
                        </div>
                        <div className="relative w-24 h-24 flex items-center justify-center">
                            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                                <path className="text-slate-100 dark:text-white/5" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3"></path>
                                <path className="text-purple-500 drop-shadow-md" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeDasharray="98.2, 100" strokeLinecap="round" strokeWidth="3"></path>
                            </svg>
                            <Zap className="absolute text-purple-500 w-8 h-8" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Navigation Cards */}
            <div className="pt-4 relative z-10">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-6 border-l-4 border-primary pl-3">Operating Consoles</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Command Center */}
                    <Link to="/client/command-center" className="group relative block h-64 rounded-2xl overflow-hidden shadow-lg transform hover:-translate-y-1 transition-all duration-300 bg-surface-darker">
                        <div className="absolute inset-0 bg-gradient-to-t from-background-dark via-background-dark/80 to-transparent z-10"></div>
                        <div className="absolute inset-0 p-6 flex flex-col justify-end border-2 border-transparent hover:border-primary/50 z-20 transition-colors">
                            <div className="mb-auto">
                                <span className="w-12 h-12 rounded-xl bg-primary/20 backdrop-blur-sm flex items-center justify-center border border-primary/30 mb-4 group-hover:bg-primary group-hover:text-white transition-colors text-primary">
                                    <ShieldAlert className="w-6 h-6" />
                                </span>
                            </div>
                            <h3 className="text-2xl font-bold text-white mb-2 group-hover:text-primary transition-colors">Command Center</h3>
                            <p className="text-slate-300 text-sm mb-4">Centralized view for active threats, incident queues, and real-time intervention controls.</p>
                            <div className="flex items-center text-primary text-sm font-bold uppercase tracking-wider">
                                <span>Access Console</span>
                                <ArrowRight className="w-4 h-4 ml-1 transform group-hover:translate-x-1 transition-transform" />
                            </div>
                        </div>
                    </Link>

                    {/* Threat Intel */}
                    <Link to="/client/map" className="group relative block h-64 rounded-2xl overflow-hidden shadow-lg transform hover:-translate-y-1 transition-all duration-300 bg-surface-darker">
                        <div className="absolute inset-0 bg-gradient-to-t from-background-dark via-background-dark/80 to-transparent z-10"></div>
                        <div className="absolute inset-0 p-6 flex flex-col justify-end border-2 border-transparent hover:border-cyan-500/50 z-20 transition-colors">
                            <div className="mb-auto">
                                <span className="w-12 h-12 rounded-xl bg-cyan-500/20 backdrop-blur-sm flex items-center justify-center border border-cyan-500/30 mb-4 group-hover:bg-cyan-500 group-hover:text-white transition-colors text-cyan-400">
                                    <Globe className="w-6 h-6" />
                                </span>
                            </div>
                            <h3 className="text-2xl font-bold text-white mb-2 group-hover:text-cyan-400 transition-colors">Threat Intelligence</h3>
                            <p className="text-slate-300 text-sm mb-4">Global threat database, hash lookups, and adversarial TTP analysis.</p>
                            <div className="flex items-center text-cyan-400 text-sm font-bold uppercase tracking-wider">
                                <span>Explore Data</span>
                                <ArrowRight className="w-4 h-4 ml-1 transform group-hover:translate-x-1 transition-transform" />
                            </div>
                        </div>
                    </Link>

                    {/* Automation Status */}
                    <Link to="/client/automation" className="group relative block h-64 rounded-2xl overflow-hidden shadow-lg transform hover:-translate-y-1 transition-all duration-300 bg-surface-darker">
                        <div className="absolute inset-0 bg-gradient-to-t from-background-dark via-background-dark/80 to-transparent z-10"></div>
                        <div className="absolute inset-0 p-6 flex flex-col justify-end border-2 border-transparent hover:border-purple-500/50 z-20 transition-colors">
                            <div className="mb-auto">
                                <span className="w-12 h-12 rounded-xl bg-purple-500/20 backdrop-blur-sm flex items-center justify-center border border-purple-500/30 mb-4 group-hover:bg-purple-500 group-hover:text-white transition-colors text-purple-400">
                                    <Zap className="w-6 h-6" />
                                </span>
                            </div>
                            <h3 className="text-2xl font-bold text-white mb-2 group-hover:text-purple-400 transition-colors">Automation Status</h3>
                            <p className="text-slate-300 text-sm mb-4">Playbook execution health, API connector status, and bot performance metrics.</p>
                            <div className="flex items-center text-purple-400 text-sm font-bold uppercase tracking-wider">
                                <span>Check Systems</span>
                                <ArrowRight className="w-4 h-4 ml-1 transform group-hover:translate-x-1 transition-transform" />
                            </div>
                        </div>
                    </Link>
                </div>
            </div>

            {/* Footer */}
            <div className="pt-8 border-t border-gray-200 dark:border-white/5 flex flex-col md:flex-row items-center justify-between text-xs text-slate-500 dark:text-slate-600 font-mono">
                <div className="flex items-center space-x-4">
                    <span>System Version: v4.2.0-rc3</span>
                    <span>Server: US-EAST-1A</span>
                    <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Database Connected</span>
                </div>
                <div className="mt-2 md:mt-0">
                    © 2024 Enterprise Security Operations. Unauthorized access is prohibited.
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
