import { useState } from 'react';
import type { FormEvent } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Shield, Lock } from 'lucide-react';
import { apiClient } from '../../../api/client';
import { applyAdminToken, getAdminToken } from '../auth/adminSession';

type AdminLoginProps = {
    onAuthSuccess: () => void;
};

const AdminLogin = ({ onAuthSuccess }: AdminLoginProps) => {
    const navigate = useNavigate();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    if (getAdminToken()) {
        return <Navigate to="/admin/dashboard" replace />;
    }

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!username.trim() || !password) return;

        setIsSubmitting(true);
        setError(null);
        try {
            const response = await apiClient.post('/auth/admin/login', { username, password });
            const token = response?.data?.token as string | undefined;
            if (!token) {
                setError('Login failed. Please try again.');
                return;
            }
            applyAdminToken(token);
            onAuthSuccess();
            navigate('/admin/dashboard', { replace: true });
        } catch (loginError) {
            setError('Invalid credentials. Please check username and password.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
            <div className="w-full max-w-md bg-slate-950 border border-slate-800 rounded-2xl p-8 shadow-2xl">
                <div className="mb-8">
                    <div className="flex items-center gap-2 text-blue-500 font-bold text-xl">
                        <Shield className="w-6 h-6" />
                        <span>SENTINEL<span className="text-white">.AI</span></span>
                    </div>
                    <h1 className="text-2xl font-bold mt-4">Admin Login</h1>
                    <p className="text-sm text-slate-400 mt-2">Authenticate to access the administration portal.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label className="text-xs uppercase tracking-wider text-slate-400 font-semibold">Username</label>
                        <input
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            type="text"
                            autoComplete="username"
                            className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Enter admin username"
                        />
                    </div>

                    <div>
                        <label className="text-xs uppercase tracking-wider text-slate-400 font-semibold">Password</label>
                        <input
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            type="password"
                            autoComplete="current-password"
                            className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Enter password"
                        />
                    </div>

                    {error && (
                        <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg flex items-center justify-center gap-2"
                    >
                        <Lock className="w-4 h-4" />
                        {isSubmitting ? 'Signing in...' : 'Sign In'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default AdminLogin;
