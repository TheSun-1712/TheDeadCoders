import { Link } from 'react-router-dom';
import { ArrowRight, Activity, ShieldAlert, Zap, Radio, Globe } from 'lucide-react';
import clsx from 'clsx';
import { useSystemHealth } from '../../../hooks/useSystemHealth';

const Dashboard = () => {
    const { health } = useSystemHealth();

    return (
        <div className="relative min-h-screen bg-background-light dark:bg-background-dark text-slate-800 dark:text-white">

            {/* Grid Background */}
            <div className="absolute inset-0 bg-grid-pattern pointer-events-none"></div>

            {/* Ambient Glow Effects */}
            <div className="absolute top-[-20%] left-[20%] w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] pointer-events-none"></div>
            <div className="absolute bottom-[-10%] right-[10%] w-[400px] h-[400px] bg-accent-red/5 rounded-full blur-[100px] pointer-events-none"></div>

            <div className="max-w-7xl mx-auto px-6 py-8 space-y-8 relative z-10">

                {/* ================= HERO ================= */}
                <div className="flex flex-col lg:flex-row items-start lg:items-end justify-between gap-6 pb-6 border-b border-gray-200 dark:border-white/5">

                    <div className="space-y-2 max-w-2xl">
                        <div
                            className={clsx(
                                "inline-flex items-center space-x-2 px-3 py-1 rounded-full border text-xs font-bold tracking-wider mb-2 glow-orange-red",
                                health?.status === 'HEALTHY'
                                    ? "bg-primary/10 border-primary/30 text-primary"
                                    : "bg-accent-red/10 border-accent-red/30 text-accent-red"
                            )}
                        >
                            <div
                                className={clsx(
                                    "w-2 h-2 rounded-full",
                                    health?.status === 'HEALTHY'
                                        ? "bg-primary shadow-[0_0_8px_rgba(255,77,0,1)]"
                                        : "bg-accent-red"
                                )}
                            />
                            <span>SYSTEM STATUS: {health?.status || 'CONNECTING...'}</span>
                        </div>

                        <h1 className="text-4xl md:text-5xl font-bold leading-tight">
                            AI-Driven Automated <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent-red via-primary to-orange-400">
                                Incident Response System
                            </span>
                        </h1>

                        <p className="text-slate-500 dark:text-slate-400 text-lg max-w-xl pt-2">
                            Real-time heuristic analysis and automated threat mitigation engine.
                            Platform is currently operating at nominal capacity.
                        </p>
                    </div>

                    {/* Automation Indicators */}
                    <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">

                        {/* Auto Block */}
                        <div className="flex-1 lg:flex-none bg-white dark:bg-surface-dark border border-gray-200 dark:border-white/10 rounded-xl p-4 flex items-center justify-between gap-4 shadow-sm min-w-[200px]">
                            <div>
                                <div className="text-xs text-slate-500 dark:text-slate-400 uppercase font-bold tracking-wider mb-1">
                                    Auto-Block
                                </div>
                                <div className="text-primary font-bold flex items-center gap-2">
                                    <Zap className="w-4 h-4" />
                                    ENABLED
                                </div>
                            </div>
                            <div className="h-8 w-14 bg-primary/20 rounded-full p-1 border border-primary/10 relative">
                                <div className="w-6 h-6 bg-primary rounded-full absolute right-1 shadow-lg shadow-primary/40"></div>
                            </div>
                        </div>

                        {/* Human Review */}
                        <div className="flex-1 lg:flex-none bg-white dark:bg-surface-dark border border-gray-200 dark:border-white/10 rounded-xl p-4 flex items-center justify-between gap-4 shadow-sm min-w-[200px]">
                            <div>
                                <div className="text-xs text-slate-500 dark:text-slate-400 uppercase font-bold tracking-wider mb-1">
                                    Human-Review
                                </div>
                                <div className="text-accent-red font-bold flex items-center gap-2">
                                    <Activity className="w-4 h-4" />
                                    ACTIVE
                                </div>
                            </div>
                            <div className="h-8 w-14 bg-accent-red/20 rounded-full p-1 border border-accent-red/10 relative">
                                <div className="w-6 h-6 bg-accent-red rounded-full absolute right-1 shadow-lg shadow-accent-red/40"></div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ================= KPI GRID ================= */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                    {/* Traffic */}
                    <div className="group relative bg-white dark:bg-surface-dark border border-gray-200 dark:border-white/5 rounded-2xl p-6 hover:border-primary/50 transition-all duration-300 shadow-lg dark:shadow-none overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>

                        <div className="relative z-10">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="text-slate-500 dark:text-slate-400 text-sm font-medium uppercase tracking-wide">
                                        Total Traffic (24h)
                                    </h3>
                                    <div className="flex items-baseline mt-1 space-x-2">
                                        <span className="text-4xl font-bold">
                                            {health ? health.traffic_processed : '...'}
                                        </span>
                                        <span className="text-sm font-medium text-primary">
                                            +12%
                                        </span>
                                    </div>
                                </div>
                                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                                    <Radio className="w-6 h-6" />
                                </div>
                            </div>

                            <div className="h-12 w-full flex items-end justify-between gap-1 opacity-70">
                                {[30, 50, 40, 70, 55, 45, 80, 60, 40, 30, 20, 45].map((h, i) => (
                                    <div key={i} className="w-1/12 bg-primary/30 rounded-t-sm" style={{ height: `${h}%` }}></div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* System Health */}
                    <div className="group relative bg-white dark:bg-surface-dark border border-gray-200 dark:border-white/5 rounded-2xl p-6 hover:border-accent-red/50 transition-all duration-300 shadow-lg dark:shadow-none overflow-hidden border-accent-red/20">
                        <div className="absolute inset-0 bg-gradient-to-br from-accent-red/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>

                        <div className="relative z-10">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="text-slate-500 dark:text-slate-400 text-sm font-medium uppercase tracking-wide">
                                        System Health
                                    </h3>
                                    <div className="flex items-baseline mt-1 space-x-2">
                                        <span className="text-4xl font-bold">
                                            {health?.status === 'HEALTHY' ? '98%' : '75%'}
                                        </span>
                                        <span className="text-sm text-slate-500">Score</span>
                                    </div>
                                </div>
                                <div className="w-10 h-10 rounded-lg bg-accent-red/10 flex items-center justify-center text-accent-red border border-accent-red/20">
                                    <ShieldAlert className="w-6 h-6" />
                                </div>
                            </div>

                            <div className="w-full bg-gray-100 dark:bg-black/30 rounded-full h-2 overflow-hidden mt-6">
                                <div
                                    className="bg-gradient-to-r from-accent-red to-primary h-full rounded-full"
                                    style={{ width: health?.status === 'HEALTHY' ? '98%' : '75%' }}
                                ></div>
                            </div>
                        </div>
                    </div>

                    {/* Automation Rate */}
                    <div className="group relative bg-white dark:bg-surface-dark border border-gray-200 dark:border-white/5 rounded-2xl p-6 hover:border-primary/50 transition-all duration-300 shadow-lg dark:shadow-none overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>

                        <div className="relative z-10 flex items-center justify-between">
                            <div>
                                <h3 className="text-slate-500 dark:text-slate-400 text-sm font-medium uppercase tracking-wide">
                                    Auto-Resolution
                                </h3>
                                <div className="flex items-baseline mt-1 space-x-2">
                                    <span className="text-4xl font-bold">
                                        {health ? health.automation_rate : '...'}
                                    </span>
                                </div>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 max-w-[140px]">
                                    Percentage of threats neutralized automatically.
                                </p>
                            </div>

                            <div className="relative w-24 h-24">
                                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                                    <path className="text-gray-100 dark:text-white/5"
                                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                        fill="none" stroke="currentColor" strokeWidth="3" />
                                    <path className="text-primary drop-shadow-[0_0_8px_rgba(255,77,0,0.5)]"
                                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                        fill="none" stroke="currentColor"
                                        strokeDasharray="98.2, 100"
                                        strokeLinecap="round"
                                        strokeWidth="3" />
                                </svg>
                                <Zap className="absolute inset-0 m-auto text-primary w-8 h-8" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* ================= NAVIGATION CARDS ================= */}
                <div className="pt-4">
                    <h2 className="text-lg font-semibold mb-6 border-l-4 border-primary pl-3">
                        Operating Consoles
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                        {/* Command Center */}
                        <Link to="/client/command-center"
                            className="group relative block h-64 rounded-2xl overflow-hidden shadow-lg transform hover:-translate-y-1 transition-all duration-300 bg-surface-dark">

                            <div className="absolute inset-0 bg-gradient-to-t from-background-dark via-background-dark/80 to-transparent"></div>

                            <div className="absolute inset-0 p-6 flex flex-col justify-end border-2 border-transparent group-hover:border-primary/50 transition-all duration-500">
                                <div className="mb-auto">
                                    <span className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center border border-primary/30 mb-4 group-hover:bg-primary group-hover:text-white transition-colors text-primary">
                                        <ShieldAlert className="w-6 h-6" />
                                    </span>
                                </div>

                                <h3 className="text-2xl font-bold mb-2 group-hover:text-primary">
                                    Command Center
                                </h3>
                                <p className="text-slate-300 text-sm mb-4">
                                    Centralized view for active threats, incident queues, and real-time intervention controls.
                                </p>

                                <div className="flex items-center text-primary text-sm font-bold uppercase tracking-wider">
                                    <span>Access Console</span>
                                    <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                                </div>
                            </div>
                        </Link>

                        {/* Threat Intelligence */}
                        <Link to="/client/map"
                            className="group relative block h-64 rounded-2xl overflow-hidden shadow-lg transform hover:-translate-y-1 transition-all duration-300 bg-surface-dark">

                            <div className="absolute inset-0 bg-gradient-to-t from-background-dark via-background-dark/80 to-transparent"></div>

                            <div className="absolute inset-0 p-6 flex flex-col justify-end border-2 border-transparent group-hover:border-accent-red/50 transition-all duration-500">
                                <div className="mb-auto">
                                    <span className="w-12 h-12 rounded-xl bg-accent-red/20 flex items-center justify-center border border-accent-red/30 mb-4 group-hover:bg-accent-red group-hover:text-white transition-colors text-accent-red">
                                        <Globe className="w-6 h-6" />
                                    </span>
                                </div>

                                <h3 className="text-2xl font-bold mb-2 group-hover:text-accent-red">
                                    Threat Intelligence
                                </h3>
                                <p className="text-slate-300 text-sm mb-4">
                                    Global threat database, hash lookups, and adversarial TTP analysis.
                                </p>

                                <div className="flex items-center text-accent-red text-sm font-bold uppercase tracking-wider">
                                    <span>Explore Data</span>
                                    <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                                </div>
                            </div>
                        </Link>

                        {/* Automation */}
                        <Link to="/client/automation"
                            className="group relative block h-64 rounded-2xl overflow-hidden shadow-lg transform hover:-translate-y-1 transition-all duration-300 bg-surface-dark">

                            <div className="absolute inset-0 bg-gradient-to-t from-background-dark via-background-dark/80 to-transparent"></div>

                            <div className="absolute inset-0 p-6 flex flex-col justify-end border-2 border-transparent group-hover:border-primary/50 transition-all duration-500">
                                <div className="mb-auto">
                                    <span className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center border border-primary/30 mb-4 group-hover:bg-primary group-hover:text-white transition-colors text-primary">
                                        <Zap className="w-6 h-6" />
                                    </span>
                                </div>

                                <h3 className="text-2xl font-bold mb-2 group-hover:text-primary">
                                    Automation Status
                                </h3>
                                <p className="text-slate-300 text-sm mb-4">
                                    Playbook execution health, API connector status, and bot performance metrics.
                                </p>

                                <div className="flex items-center text-primary text-sm font-bold uppercase tracking-wider">
                                    <span>Check Systems</span>
                                    <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                                </div>
                            </div>
                        </Link>
                    </div>
                </div>

                {/* ================= FOOTER ================= */}
                <div className="pt-8 border-t border-gray-200 dark:border-white/5 flex flex-col md:flex-row items-center justify-between text-xs text-slate-500 dark:text-slate-600 font-mono">
                    <div className="flex items-center space-x-4">
                        <span>System Version: v4.2.0-rc3</span>
                        <span>Server: US-EAST-1A</span>
                        <span className="flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_4px_rgba(255,77,0,0.8)]"></span>
                            Database Connected
                        </span>
                    </div>

                    <div className="mt-2 md:mt-0">
                        © 2024 Enterprise Security Operations. Unauthorized access is prohibited.
                    </div>
                </div>

            </div>
        </div>
    );
};

export default Dashboard;