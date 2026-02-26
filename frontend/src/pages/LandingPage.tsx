import { Link } from 'react-router-dom';
import { Shield, Lock } from 'lucide-react';

const LandingPage = () => {
    return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 font-display">
            <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Client Portal Card */}
                <Link to="/client/dashboard" className="group relative bg-slate-800 rounded-2xl p-8 border border-slate-700 hover:border-emerald-500 transition-all duration-300 hover:shadow-[0_0_30px_rgba(16,185,129,0.3)] overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Shield className="w-32 h-32 text-emerald-500" />
                    </div>
                    <div className="relative z-10 flex flex-col h-full">
                        <div className="w-16 h-16 rounded-xl bg-emerald-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                            <Shield className="w-8 h-8 text-emerald-400" />
                        </div>
                        <h2 className="text-3xl font-bold text-white mb-2">Client Portal</h2>
                        <p className="text-slate-400 mb-8 flex-grow">
                            Monitor system health, view automated threat responses, and track real-time network traffic.
                        </p>
                        <div className="flex items-center text-emerald-400 font-bold uppercase tracking-wider text-sm group-hover:translate-x-2 transition-transform">
                            Enter Portal <span className="ml-2">→</span>
                        </div>
                    </div>
                </Link>

                {/* Admin Portal Card */}
                <Link to="/admin/dashboard" className="group relative bg-slate-800 rounded-2xl p-8 border border-slate-700 hover:border-blue-500 transition-all duration-300 hover:shadow-[0_0_30px_rgba(59,130,246,0.3)] overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Lock className="w-32 h-32 text-blue-500" />
                    </div>
                    <div className="relative z-10 flex flex-col h-full">
                        <div className="w-16 h-16 rounded-xl bg-blue-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                            <Lock className="w-8 h-8 text-blue-400" />
                        </div>
                        <h2 className="text-3xl font-bold text-white mb-2">Admin Portal</h2>
                        <p className="text-slate-400 mb-8 flex-grow">
                            Manage security policies, investigate incidents, and audit system compliance.
                        </p>
                        <div className="flex items-center text-blue-400 font-bold uppercase tracking-wider text-sm group-hover:translate-x-2 transition-transform">
                            Enter Console <span className="ml-2">→</span>
                        </div>
                    </div>
                </Link>
            </div>
        </div>
    );
};

export default LandingPage;
