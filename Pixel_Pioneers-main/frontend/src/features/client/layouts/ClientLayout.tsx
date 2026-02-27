import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Shield, LayoutDashboard, Zap, Map as MapIcon, Terminal, Settings, Bell, Search } from 'lucide-react';
import clsx from 'clsx';
import { useSystemHealth } from '../../../hooks/useSystemHealth';

const Layout = ({ children }: { children: React.ReactNode }) => {
    const location = useLocation();
    const { health } = useSystemHealth();

    const navItems = [
        { icon: LayoutDashboard, label: 'Overview', path: '/client/dashboard' },
        { icon: Shield, label: 'Command Center', path: '/client/command-center' },
        { icon: Zap, label: 'Automation', path: '/client/automation' },
        { icon: MapIcon, label: 'Threat Map', path: '/client/map' },
        { icon: Terminal, label: 'Event Stream', path: '/client/events' },
    ];

    return (
        <div className="flex h-screen bg-background-dark text-slate-200 font-display selection:bg-primary selection:text-white">
            {/* Sidebar */}
            <aside className="w-64 bg-surface-darker border-r border-slate-800 flex flex-col z-20 hidden md:flex">
                <div className="h-16 flex items-center px-6 border-b border-slate-800">
                    <div className="flex items-center gap-2 text-primary font-bold text-xl tracking-tighter">
                        <Shield className="w-6 h-6" />
                        <span>SOAR<span className="text-slate-500 font-light">OPS</span></span>
                    </div>
                </div>

                <nav className="flex-1 py-6 px-3 space-y-1">
                    {navItems.map((item) => {
                        const isActive = location.pathname === item.path;
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={clsx(
                                    "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors",
                                    isActive
                                        ? "bg-primary/10 text-primary border-r-2 border-primary"
                                        : "text-slate-400 hover:bg-primary/10 hover:text-primary"
                                )}
                            >
                                <item.icon className="w-5 h-5" />
                                <span className="text-sm font-medium">{item.label}</span>
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-4 border-t border-slate-800">
                    <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-surface-dark transition-colors cursor-pointer">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary to-blue-400 flex items-center justify-center text-white text-xs font-bold">
                            AU
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate text-slate-200">Admin User</p>
                            <p className="text-xs text-slate-400 truncate">SecOps Lead</p>
                        </div>
                        <Settings className="w-4 h-4 text-slate-400" />
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col h-full overflow-hidden relative">
                {/* Header */}
                <header className="h-16 bg-surface-darker border-b border-slate-800 flex items-center justify-between px-6 z-10">
                    <div className="flex items-center gap-4">
                        <div className="relative hidden sm:block">
                            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                            <input
                                type="text"
                                placeholder="Search incidents..."
                                className="pl-8 pr-4 py-1.5 text-sm bg-surface-dark border-none rounded text-slate-300 placeholder-slate-400 focus:ring-1 focus:ring-primary w-64"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        {/* System Status */}
                        <div className="hidden lg:flex items-center gap-3 mr-4 border-r border-slate-700 pr-4">
                            <div className={clsx(
                                "flex items-center gap-1.5 px-2 py-1 rounded border",
                                health?.status === 'HEALTHY'
                                    ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500"
                                    : "bg-red-500/10 border-red-500/20 text-red-500"
                            )}>
                                <div className={clsx("w-1.5 h-1.5 rounded-full animate-pulse", health?.status === 'HEALTHY' ? "bg-emerald-500" : "bg-red-500")}></div>
                                <span className="text-xs font-medium">{health?.status || 'CONNECTING...'}</span>
                            </div>
                            <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-slate-800 border border-slate-700">
                                <span className="text-xs font-medium text-slate-400">12ms Latency</span>
                            </div>
                        </div>

                        <div className="h-8 w-px bg-slate-700 mx-1"></div>

                        <button className="relative p-2 text-slate-400 hover:text-white transition-colors">
                            <Bell className="w-5 h-5" />
                            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full"></span>
                        </button>
                    </div>
                </header>

                {/* Page Content */}
                <div className="flex-1 overflow-y-auto bg-background-dark">
                    {children}
                </div>
            </main>
        </div>
    );
};

export default Layout;
