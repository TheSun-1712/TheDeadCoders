import { useEffect, useState } from 'react';
import { apiClient } from '../../../api/client';
import { Save, Gavel, AlertOctagon, RotateCcw } from 'lucide-react';

const PolicyConfig = () => {
    const [threshold, setThreshold] = useState(0.95);
    const [noiseRate, setNoiseRate] = useState(0.08);
    const [defaultThreshold, setDefaultThreshold] = useState(0.95);
    const [defaultNoiseRate, setDefaultNoiseRate] = useState(0.08);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);

    useEffect(() => {
        const fetchCurrent = async () => {
            try {
                const res = await apiClient.get('/config/current');
                const current = Number(res?.data?.config?.auto_block_threshold);
                const currentNoise = Number(res?.data?.config?.model_noise_rate);
                if (!Number.isNaN(current) && current >= 0.0 && current <= 1.0) {
                    setThreshold(current);
                    setDefaultThreshold(current);
                }
                if (!Number.isNaN(currentNoise) && currentNoise >= 0.0 && currentNoise <= 0.5) {
                    setNoiseRate(currentNoise);
                    setDefaultNoiseRate(currentNoise);
                }
            } catch (error) {
                console.error("Failed to fetch current config", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchCurrent();
    }, []);

    const handleSave = async () => {
        setIsSaving(true);
        setMessage(null);
        try {
            await apiClient.post('/config/update-body', {
                threshold,
                model_noise_rate: noiseRate
            });
            setDefaultThreshold(threshold);
            setDefaultNoiseRate(noiseRate);
            setMessage({ text: 'Policy updated successfully.', type: 'success' });
        } catch (error) {
            console.error("Failed to update policy", error);
            setMessage({ text: 'Failed to update policy.', type: 'error' });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="p-8 max-w-5xl mx-auto">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                    <Gavel className="text-blue-500" />
                    Policy Governance
                </h1>
                <p className="text-slate-500 dark:text-slate-400 mt-2">
                    Configure autonomous response thresholds and role-based access controls.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* AI Thresholds */}
                <div className="bg-white dark:bg-[#151b29] rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white">AI Response Sensitivity</h2>
                        <span className="px-2 py-1 bg-blue-500/10 text-blue-500 rounded text-xs font-bold border border-blue-500/20">Active Profile: Custom</span>
                    </div>

                    <div className="space-y-8">
                        <div className="relative">
                            <div className="flex justify-between mb-2">
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Auto-Block Confidence Threshold</label>
                                <span className="text-xl font-bold text-blue-500 font-mono">{Math.round(threshold * 100)}%</span>
                            </div>
                            <p className="text-xs text-slate-500 mb-6">Minimum confidence score required for AI to execute immediate IP bans without human review.</p>

                            <input
                                type="range"
                                min="0.50"
                                max="0.99"
                                step="0.01"
                                value={threshold}
                                onChange={(e) => setThreshold(parseFloat(e.target.value))}
                                className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                            />
                            <div className="flex justify-between text-xs text-slate-400 mt-2">
                                <span>Aggressive (50%)</span>
                                <span>Conservative (99%)</span>
                            </div>
                        </div>

                        <div className="relative">
                            <div className="flex justify-between mb-2">
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Simulation Noise Rate</label>
                                <span className="text-xl font-bold text-blue-500 font-mono">{Math.round(noiseRate * 100)}%</span>
                            </div>
                            <p className="text-xs text-slate-500 mb-6">Injects controlled uncertainty so automation does not stay unrealistically perfect in simulation.</p>

                            <input
                                type="range"
                                min="0.00"
                                max="0.30"
                                step="0.01"
                                value={noiseRate}
                                onChange={(e) => setNoiseRate(parseFloat(e.target.value))}
                                className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                            />
                            <div className="flex justify-between text-xs text-slate-400 mt-2">
                                <span>Stable (0%)</span>
                                <span>Noisy (30%)</span>
                            </div>
                        </div>

                        {message && (
                            <div className={`p-3 rounded text-sm ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                {message.text}
                            </div>
                        )}

                        <div className="flex gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                            <button
                                onClick={() => {
                                    setThreshold(defaultThreshold);
                                    setNoiseRate(defaultNoiseRate);
                                }}
                                className="px-4 py-2 text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded hover:bg-slate-200 dark:hover:bg-slate-700 font-medium transition-colors flex items-center gap-2"
                            >
                                <RotateCcw className="w-4 h-4" /> Reset
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={isSaving || isLoading}
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-bold shadow-lg shadow-blue-500/20 transition-all flex ml-auto items-center gap-2"
                            >
                                <Save className="w-4 h-4" /> {isSaving ? 'Saving...' : 'Commit Policy'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Automation Rules Information (Read Only) */}
                <div className="bg-white dark:bg-[#151b29] rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm opacity-80">
                    <div className="flex items-center gap-2 mb-4">
                        <AlertOctagon className="text-slate-400" />
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Active Ruleset</h2>
                    </div>
                    <ul className="space-y-4">
                        <li className="flex items-start gap-3 p-3 rounded bg-slate-50 dark:bg-[#0b1019] border border-slate-200 dark:border-slate-800">
                            <div className="mt-1 w-2 h-2 rounded-full bg-green-500"></div>
                            <div>
                                <p className="text-sm font-bold text-slate-900 dark:text-white">SQL Injection Prevention</p>
                                <p className="text-xs text-slate-500">Block IPs attempting SQLi patterns &gt; 5 times/min.</p>
                            </div>
                        </li>
                        <li className="flex items-start gap-3 p-3 rounded bg-slate-50 dark:bg-[#0b1019] border border-slate-200 dark:border-slate-800">
                            <div className="mt-1 w-2 h-2 rounded-full bg-green-500"></div>
                            <div>
                                <p className="text-sm font-bold text-slate-900 dark:text-white">DDoS Rate Limiting</p>
                                <p className="text-xs text-slate-500">Drop packets exceeding global threshold of 10k/sec.</p>
                            </div>
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default PolicyConfig;
