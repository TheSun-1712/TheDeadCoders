import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiClient } from '../../../api/client';
import type { Packet } from '../../../types';
import { ShieldAlert, Activity, MapPin, Server, User, ArrowLeft, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import clsx from 'clsx';

const IncidentReview = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [incident, setIncident] = useState<Packet | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isResolving, setIsResolving] = useState(false);

    useEffect(() => {
        const fetchIncident = async () => {
            try {
                // Since we don't have a single item endpoint, we fetch all pending and find it
                const res = await apiClient.get('/incidents/pending');
                const found = res.data.find((i: Packet) => i.id === Number(id));
                setIncident(found || null);
            } catch (error) {
                console.error("Failed to fetch incident", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchIncident();
    }, [id]);

    const handleAction = async (action: 'BLOCK' | 'IGNORE') => {
        if (!incident) return;
        setIsResolving(true);
        try {
            await apiClient.post(`/incidents/${incident.id}/resolve`, { action });
            navigate('/admin/dashboard');
        } catch (error) {
            console.error("Failed to resolve", error);
            setIsResolving(false);
        }
    };

    if (isLoading) return <div className="p-8 text-center text-slate-500">Loading incident details...</div>;
    if (!incident) return <div className="p-8 text-center text-slate-500">Incident not found or already resolved. <button onClick={() => navigate('/admin/dashboard')} className="text-blue-500 underline">Return to Dashboard</button></div>;

    return (
        <div className="flex h-full flex-col bg-slate-50 dark:bg-[#0b1019] relative">
            {/* Header */}
            <div className="bg-white dark:bg-[#151b29] border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/admin/dashboard')} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                        <ArrowLeft className="w-5 h-5 text-slate-500" />
                    </button>
                    <div>
                        <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            Incident #{incident.id}
                            <span className={clsx(
                                "text-xs px-2 py-0.5 rounded border uppercase tracking-wider",
                                incident.confidence > 0.9 ? "bg-red-500/10 text-red-500 border-red-500/20" : "bg-amber-500/10 text-amber-500 border-amber-500/20"
                            )}>
                                {incident.confidence > 0.9 ? 'Critical' : 'High Severity'}
                            </span>
                        </h1>
                        <p className="text-sm text-slate-500 dark:text-slate-400">{incident.type}</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <div className="text-right hidden sm:block">
                        <p className="text-xs text-slate-500 uppercase font-bold">Time Detected</p>
                        <p className="text-sm font-mono text-slate-700 dark:text-slate-300">{new Date(incident.timestamp).toLocaleString()}</p>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
                {/* Left Sidebar: Context */}
                <aside className="w-full lg:w-80 bg-white dark:bg-[#151b29] border-r border-slate-200 dark:border-slate-800 overflow-y-auto p-6 shrink-0">
                    <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4">Context Data</h3>

                    <div className="space-y-6">
                        <div>
                            <label className="text-xs text-slate-400 block mb-1">Source IP</label>
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded bg-blue-500/10 flex items-center justify-center text-blue-500">
                                    <Server className="w-4 h-4" />
                                </div>
                                <div>
                                    <div className="font-mono text-sm font-bold text-slate-900 dark:text-white">{incident.src_ip}</div>
                                    <div className="text-xs text-slate-500">{incident.country}</div>
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="text-xs text-slate-400 block mb-1">Target</label>
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded bg-purple-500/10 flex items-center justify-center text-purple-500">
                                    <Activity className="w-4 h-4" />
                                </div>
                                <div>
                                    <div className="font-mono text-sm font-bold text-slate-900 dark:text-white">Port {incident.destination_port}</div>
                                    <div className="text-xs text-slate-500">Protocol: TCP</div>
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="text-xs text-slate-400 block mb-1">Geo-Location</label>
                            <div className="h-32 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center relative overflow-hidden">
                                <MapPin className="text-slate-400" />
                                <span className="absolute bottom-2 left-2 text-xs font-mono text-slate-500">Lat: {incident.lat}, Lon: {incident.lon}</span>
                            </div>
                        </div>
                    </div>
                </aside>

                {/* Main Analysis */}
                <main className="flex-1 overflow-y-auto p-6 lg:p-10">
                    <div className="max-w-4xl mx-auto space-y-8">
                        {/* AI Confidence */}
                        <div className="bg-white dark:bg-[#151b29] rounded-xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-8">
                            <div className="relative w-32 h-32 flex items-center justify-center shrink-0">
                                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                                    <path className="text-slate-100 dark:text-slate-800" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3"></path>
                                    <path className={clsx(incident.confidence > 0.9 ? "text-red-500" : "text-amber-500")} strokeDasharray={`${incident.confidence * 100}, 100`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="3"></path>
                                </svg>
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                    <span className="text-2xl font-bold text-slate-900 dark:text-white">{Math.round(incident.confidence * 100)}%</span>
                                    <span className="text-[10px] uppercase text-slate-500">Confidence</span>
                                </div>
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-2">AI Analysis</h2>
                                <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
                                    The system has detected a high probability <strong>{incident.type}</strong> based on traffic patterns from {incident.country}.
                                    Behavior is consistent with known attack vectors targeting administrative ports.
                                </p>
                            </div>
                        </div>

                        {/* Action Panel */}
                        <div className="bg-slate-900 rounded-xl p-1 overflow-hidden">
                            <div className="bg-slate-800/50 backdrop-blur-sm p-6 rounded-lg">
                                <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
                                    <ShieldAlert className="text-amber-400" />
                                    Recommended Action: Block Source IP
                                </h3>
                                <div className="flex flex-wrap gap-4">
                                    <button
                                        onClick={() => handleAction('BLOCK')}
                                        disabled={isResolving}
                                        className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-lg flex items-center justify-center gap-2 transition-transform active:scale-95 disabled:opacity-50"
                                    >
                                        <CheckCircle className="w-5 h-5" />
                                        {isResolving ? 'Processing...' : 'Approve Block'}
                                    </button>
                                    <button
                                        onClick={() => handleAction('IGNORE')}
                                        disabled={isResolving}
                                        className="flex-1 bg-slate-700 hover:bg-slate-600 text-slate-300 font-bold py-3 px-6 rounded-lg flex items-center justify-center gap-2 transition-transform active:scale-95 disabled:opacity-50"
                                    >
                                        <XCircle className="w-5 h-5" />
                                        Mark as False Positive
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default IncidentReview;
