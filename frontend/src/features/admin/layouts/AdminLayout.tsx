import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Shield, LayoutDashboard, FileText, Gavel, History, Settings, Bell } from 'lucide-react';
import clsx from 'clsx';
import FloatingWidget from '../../../components/MasterAI/FloatingWidget';
import { useAdminData } from '../hooks/useAdminData';

const AdminLayout = ({ children }: { children: React.ReactNode }) => {
    const location = useLocation();
    const { stats } = useAdminData();

    const navItems = [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/admin/dashboard' },
        { icon: FileText, label: 'Incidents', path: '/admin/incidents' },
        { icon: History, label: 'Audit Logs', path: '/admin/compliance' },
        { icon: Gavel, label: 'Policies', path: '/admin/policy' },
        { icon: Settings, label: 'Settings', path: '/admin/settings' },
    ];

    return (
        <div className="admin-portal flex h-screen bg-black text-slate-100 font-display selection:bg-blue-500/40 selection:text-white">
            {/* Sidebar */}
            <aside className="w-64 bg-slate-950 border-r border-slate-800 flex flex-col z-20 hidden md:flex">
                <div className="h-16 flex items-center px-6 border-b border-slate-200 dark:border-slate-800">
                    <div className="flex items-center gap-2 text-blue-600 font-bold text-xl tracking-tighter">
                        <Shield className="w-6 h-6" />
                        <span className="text-white">SENTINEL<span className="text-blue-400">.AI</span></span>
                    </div>
                </div>

                <nav className="flex-1 py-6 px-3 space-y-1">
                    {navItems.map((item) => {
                        const isActive = location.pathname.startsWith(item.path);
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={clsx(
                                    "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors group relative",
                                    isActive
                                        ? "bg-blue-500/10 text-blue-500"
                                        : "text-slate-400 hover:bg-slate-800 hover:text-blue-300"
                                )}
                            >
                                {isActive && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-blue-500 rounded-r-full"></span>}
                                <item.icon className="w-5 h-5" />
                                <span className="text-sm font-medium">{item.label}</span>
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-4 border-t border-slate-200 dark:border-slate-800">
                    <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer">
                        <img
                            src="https://lh3.googleusercontent.com/aida-public/AB6AXuCn02apqPNqWYfW-6_BjDyJcip0quihU29GMYP6wIwC4AFFEKfzr1oRhhPyGGoAYSkcVAR0X8icAFTuvKnrDp67SzAAyFHrXol4ywwSs0c5-34Lx6ehpjg2-QsPgvEjHmfyI96WRIsvXqtsAqrYdBrBXzZ6og4serHMwznGqfpY0Fi1DmTg7XW6W2ftgbjHPvF1GwpjtZ2HPtaBtW4FjhUYqSuj4BkXnvdBpFXPUpHmUmexRvhtosPtA4P3EPYuNMEOwOQsRb8c6eWA"
                            alt="Admin"
                            className="w-8 h-8 rounded-full border border-slate-700"
                        />
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate text-white">Analyst One</p>
                            <p className="text-xs text-emerald-500 truncate">● Online</p>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col h-full overflow-hidden relative">
                {/* Header */}
                <header className="h-16 bg-slate-950 border-b border-slate-800 flex items-center justify-between px-6 z-10 shrink-0">
                    <div className="flex items-center gap-4">
                        <h1 className="text-xl font-bold text-white">
                            Dashboard <span className="text-slate-400 font-normal mx-2">/</span> <span className="text-base font-normal text-slate-500">Shift Delta</span>
                        </h1>
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2">
                            <span className="flex h-2 w-2 rounded-full bg-amber-400 animate-pulse"></span>
                            <span className="text-sm text-slate-500 dark:text-slate-400">Open Tickets:</span>
                            <span className="text-lg font-bold text-white">{stats.openTickets}</span>
                        </div>
                        <div className="h-4 w-px bg-slate-200 dark:bg-slate-700"></div>
                        <button className="relative p-2 rounded-full hover:bg-slate-800 text-slate-300 transition-colors">
                            <Bell className="w-5 h-5" />
                            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-slate-950"></span>
                        </button>
                    </div>
                </header>

                {/* Page Content */}
                <div className="flex-1 overflow-auto bg-black">
                    {children}
                </div>
            </main>
            <FloatingWidget />
        </div>
    );
};

export default AdminLayout;
