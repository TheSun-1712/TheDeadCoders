import { useEffect, useState } from 'react';
import { apiClient } from '../../../api/client';
import { Save, Settings2 } from 'lucide-react';

type SettingsState = {
    dynamic_threshold_enabled: boolean;
    auto_resolve_pending_enabled: boolean;
    pending_auto_resolve_queue_trigger: number;
    pending_auto_resolve_delta: number;
};

const SettingsPage = () => {
    const [settings, setSettings] = useState<SettingsState>({
        dynamic_threshold_enabled: true,
        auto_resolve_pending_enabled: true,
        pending_auto_resolve_queue_trigger: 18,
        pending_auto_resolve_delta: 0.03,
    });
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);

    useEffect(() => {
        const fetchCurrent = async () => {
            try {
                const res = await apiClient.get('/config/current');
                const cfg = res?.data?.config ?? {};
                setSettings({
                    dynamic_threshold_enabled: Boolean(cfg.dynamic_threshold_enabled),
                    auto_resolve_pending_enabled: Boolean(cfg.auto_resolve_pending_enabled),
                    pending_auto_resolve_queue_trigger: Number(cfg.pending_auto_resolve_queue_trigger ?? 18),
                    pending_auto_resolve_delta: Number(cfg.pending_auto_resolve_delta ?? 0.03),
                });
            } catch (error) {
                console.error("Failed to load settings", error);
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
            await apiClient.post('/config/update-body', settings);
            setMessage({ text: 'Settings updated successfully.', type: 'success' });
        } catch (error) {
            console.error("Failed to update settings", error);
            setMessage({ text: 'Failed to update settings.', type: 'error' });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="p-8 max-w-5xl mx-auto space-y-8">
            <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                    <Settings2 className="text-blue-500" />
                    Platform Settings
                </h1>
                <p className="text-slate-500 dark:text-slate-400 mt-2">
                    Control runtime behavior for automated incident handling.
                </p>
            </div>

            <div className="bg-white dark:bg-[#151b29] rounded-xl border border-slate-200 dark:border-slate-800 p-6 space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="font-semibold text-slate-900 dark:text-white">Dynamic Thresholding</p>
                        <p className="text-xs text-slate-500 mt-1">Auto-adjust confidence threshold based on queue pressure.</p>
                    </div>
                    <input
                        type="checkbox"
                        checked={settings.dynamic_threshold_enabled}
                        onChange={(e) => setSettings((prev) => ({ ...prev, dynamic_threshold_enabled: e.target.checked }))}
                        disabled={isLoading}
                        className="h-4 w-4 accent-blue-600"
                    />
                </div>

                <div className="flex items-center justify-between">
                    <div>
                        <p className="font-semibold text-slate-900 dark:text-white">Auto Resolve Pending Queue</p>
                        <p className="text-xs text-slate-500 mt-1">Allow system to auto-process queued reviews at high backlog.</p>
                    </div>
                    <input
                        type="checkbox"
                        checked={settings.auto_resolve_pending_enabled}
                        onChange={(e) => setSettings((prev) => ({ ...prev, auto_resolve_pending_enabled: e.target.checked }))}
                        disabled={isLoading}
                        className="h-4 w-4 accent-blue-600"
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Queue Trigger</label>
                        <input
                            type="number"
                            min={1}
                            value={settings.pending_auto_resolve_queue_trigger}
                            onChange={(e) => setSettings((prev) => ({
                                ...prev,
                                pending_auto_resolve_queue_trigger: Number(e.target.value || 1),
                            }))}
                            disabled={isLoading}
                            className="mt-2 w-full rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
                        />
                    </div>
                    <div>
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Threshold Delta</label>
                        <input
                            type="number"
                            min={0}
                            max={0.5}
                            step={0.01}
                            value={settings.pending_auto_resolve_delta}
                            onChange={(e) => setSettings((prev) => ({
                                ...prev,
                                pending_auto_resolve_delta: Number(e.target.value || 0),
                            }))}
                            disabled={isLoading}
                            className="mt-2 w-full rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
                        />
                    </div>
                </div>

                {message && (
                    <div className={`p-3 rounded text-sm ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {message.text}
                    </div>
                )}

                <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex justify-end">
                    <button
                        onClick={handleSave}
                        disabled={isLoading || isSaving}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-bold flex items-center gap-2 disabled:opacity-50"
                    >
                        <Save className="w-4 h-4" />
                        {isSaving ? 'Saving...' : 'Save Settings'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SettingsPage;
