import { useRef } from 'react';
import { useLiveTraffic } from '../../../hooks/useLiveTraffic';
import clsx from 'clsx';
import { Search } from 'lucide-react';

const EventStream = () => {
    const { traffic } = useLiveTraffic();
    const scrollRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to top when new traffic comes in (since we display newest on top)
    // Actually typically terminals scroll to bottom, but the design had newest on top?
    // Let's stick to the design: "Row 1 (Recent)". So standard list rendering.

    return (
        <div className="flex-1 flex flex-col min-w-0 bg-background-light dark:bg-background-dark relative font-mono h-full">
            {/* Toolbar */}
            <div className="h-14 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-surface-dark flex items-center justify-between px-6 flex-shrink-0 z-10">
                <div className="flex items-center gap-4">
                    <div className="relative">
                        <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                        <input className="pl-8 pr-4 py-1.5 text-sm bg-slate-100 dark:bg-background-dark border-none rounded text-slate-700 dark:text-slate-300 placeholder-slate-400 focus:ring-1 focus:ring-primary w-64 font-mono" placeholder="Search logs..." type="text" />
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-400 dark:text-slate-500 font-mono animate-pulse">RECEIVING DATA...</span>
                </div>
            </div>

            {/* Terminal Window */}
            <div className="flex-1 p-4 sm:p-6 overflow-hidden flex flex-col">
                <div className="flex-1 bg-[#0c1017] rounded-lg border border-slate-800 shadow-2xl overflow-hidden flex flex-col relative text-sm">
                    {/* Header */}
                    <div className="h-8 bg-[#1a202c] border-b border-slate-800 flex items-center px-4 justify-between select-none shrink-0">
                        <div className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 rounded-full bg-red-500/50"></div>
                            <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/50"></div>
                            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/50"></div>
                        </div>
                        <div className="text-xs text-slate-500 font-medium">soar-stream-v1.4.2 @ root</div>
                        <div className="w-10"></div>
                    </div>

                    {/* Columns */}
                    <div className="grid grid-cols-12 gap-4 px-4 py-2 bg-[#131720] border-b border-slate-800 text-xs font-bold text-slate-500 uppercase tracking-wider sticky top-0 z-10 shrink-0">
                        <div className="col-span-2">Timestamp (UTC)</div>
                        <div className="col-span-1">ID</div>
                        <div className="col-span-3">Classification</div>
                        <div className="col-span-3">Confidence</div>
                        <div className="col-span-3 text-right">System Action</div>
                    </div>

                    {/* Stream Content */}
                    <div className="flex-1 overflow-y-auto p-2 space-y-0.5 relative custom-scrollbar" ref={scrollRef}>
                        <div className="absolute inset-0 scanlines opacity-10 pointer-events-none z-0"></div>

                        {traffic.map((packet, idx) => (
                            <div key={packet.id} className={clsx(
                                "grid grid-cols-12 gap-4 px-3 py-2.5 rounded border-l-2 transition-colors cursor-default group items-center relative z-10",
                                idx === 0 ? "hover:bg-primary/5 border-primary" : "hover:bg-primary/5 border-transparent hover:border-slate-700",
                                idx > 10 ? "opacity-60" : "opacity-100"
                            )}>
                                <div className="col-span-2 text-slate-500">{new Date(packet.timestamp).toTimeString().split(' ')[0]}</div>
                                <div className="col-span-1 text-slate-600">#{packet.id}</div>
                                <div className="col-span-3 flex items-center gap-2">
                                    <span className={clsx("w-2 h-2 rounded-full", packet.type === 'Normal Traffic' ? "bg-emerald-500" : "bg-red-500 animate-pulse")}></span>
                                    <span className={clsx("font-bold", packet.type === 'Normal Traffic' ? "text-emerald-400" : "text-red-400")}>{packet.type}</span>
                                </div>
                                <div className="col-span-3 flex items-center gap-3">
                                    <div className="w-24 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                        <div className={clsx("h-full w-[98%]", packet.confidence > 0.9 ? "bg-primary" : "bg-yellow-500")}></div>
                                    </div>
                                    <span className="text-primary font-bold">{Math.round(packet.confidence * 100)}%</span>
                                </div>
                                <div className="col-span-3 text-right">
                                    <span className={clsx("px-2 py-1 rounded text-xs font-bold uppercase tracking-wide border",
                                        packet.action === 'AUTO_BLOCKED' ? "bg-red-500/10 text-red-400 border-red-500/20" :
                                            packet.action === 'MONITOR' ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                                                "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
                                    )}>
                                        {packet.action}
                                    </span>
                                </div>
                            </div>
                        ))}

                        {traffic.length === 0 && <div className="text-slate-500 text-center py-10">Waiting for stream...</div>}
                    </div>

                    {/* Footer */}
                    <div className="h-6 bg-[#131720] border-t border-slate-800 flex items-center justify-between px-3 text-[10px] text-slate-600 font-mono shrink-0">
                        <div className="flex gap-4">
                            <span>PROCESS_ID: 8821</span>
                            <span>MEM_USAGE: 24%</span>
                            <span className="text-emerald-500">SOCKET_OPEN</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EventStream;