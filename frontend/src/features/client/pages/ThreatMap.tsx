import { AlertTriangle } from 'lucide-react';
import { useSystemHealth } from '../../../hooks/useSystemHealth';
import { useLiveTraffic } from '../../../hooks/useLiveTraffic';

const ThreatMap = () => {
    const { health } = useSystemHealth();
    const { traffic } = useLiveTraffic();

    // Filter threats
    const threats = traffic.filter(p => p.type !== 'Normal Traffic');

    return (
        <div className="relative h-full w-full bg-background-dark overflow-hidden flex flex-col">
            {/* Map Background & SVG Visualization */}
            <div className="absolute inset-0 map-background">
                <svg className="w-full h-full text-slate-700" preserveAspectRatio="xMidYMid slice" viewBox="0 0 1000 500">
                    <defs>
                        <linearGradient id="lineGradient" gradientUnits="userSpaceOnUse">
                            <stop offset="0%" stopColor="#ef4444" stopOpacity="0" />
                            <stop offset="50%" stopColor="#ef4444" stopOpacity="1" />
                            <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
                        </linearGradient>
                        <linearGradient id="lineGradientBlue" gradientUnits="userSpaceOnUse">
                            <stop offset="0%" stopColor="#135bec" stopOpacity="0" />
                            <stop offset="50%" stopColor="#135bec" stopOpacity="1" />
                            <stop offset="100%" stopColor="#135bec" stopOpacity="0" />
                        </linearGradient>
                    </defs>
                    {/* Simplified World Map */}
                    <path d="M150,80 L250,80 L280,150 L220,220 L120,180 Z" className="fill-surface-dark stroke-surface-border stroke-[0.5] hover:fill-surface-border transition-colors" />
                    <path d="M240,240 L300,240 L320,350 L260,420 L220,300 Z" className="fill-surface-dark stroke-surface-border stroke-[0.5] hover:fill-surface-border transition-colors" />
                    <path d="M420,80 L850,80 L900,180 L800,250 L700,220 L600,250 L500,180 L450,150 Z" className="fill-surface-dark stroke-surface-border stroke-[0.5] hover:fill-surface-border transition-colors" />
                    <path d="M480,200 L600,200 L620,350 L550,400 L460,300 Z" className="fill-surface-dark stroke-surface-border stroke-[0.5] hover:fill-surface-border transition-colors" />
                    <path d="M780,300 L880,300 L890,380 L800,380 Z" className="fill-surface-dark stroke-surface-border stroke-[0.5] hover:fill-surface-border transition-colors" />

                    {/* Attack Lines (Simulated based on traffic) */}
                    {threats.map((threat, i) => {
                        // Simple logic to place dots based on lat/lon relative to SVG viewBox 1000x500
                        // Lon -180 to 180 maps to x 0 to 1000
                        // Lat 90 to -90 maps to y 0 to 500
                        const x = ((threat.lon + 180) / 360) * 1000;
                        const y = ((90 - threat.lat) / 180) * 500;

                        // Destination (USA roughly)
                        const destX = 200;
                        const destY = 150;

                        return (
                            <g key={threat.id}>
                                <path
                                    d={`M${x},${y} Q${(x + destX) / 2},${(y + destY) / 2 - 50} ${destX},${destY}`}
                                    fill="none"
                                    stroke={`url(#${i % 2 === 0 ? 'lineGradient' : 'lineGradientBlue'})`}
                                    strokeWidth="2"
                                    className="animate-dash"
                                    style={{ strokeDasharray: 10, animationDuration: `${Math.random() * 2 + 1}s` }}
                                />
                                <circle cx={x} cy={y} r="3" fill="#ef4444" className="animate-pulse" />
                            </g>
                        );
                    })}

                    {/* Destination Hotspot (USA) */}
                    <circle cx="200" cy="150" r="10" fill="rgba(19, 91, 236, 0.4)" className="animate-ping" />
                    <circle cx="200" cy="150" r="4" fill="#135bec" />
                </svg>
            </div>

            {/* Overlay Header */}
            <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-start z-10 pointer-events-none">
                <div className="pointer-events-auto">
                    <h1 className="text-xs uppercase tracking-[0.3em] text-slate-400 mb-1">Global Threat Vector</h1>
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        <h2 className="text-xl font-bold text-white tracking-tight">Portal A Operations</h2>
                    </div>
                </div>
                {/* Stats Ticker */}
                <div className="hidden lg:flex gap-4 pointer-events-auto">
                    <div className="bg-surface-dark/60 backdrop-blur-md border border-slate-700/50 px-4 py-2 rounded-lg flex flex-col items-center min-w-[120px]">
                        <span className="text-[10px] uppercase tracking-wider text-slate-400">Events / Sec</span>
                        <span className="text-lg font-bold text-white font-mono">2,450</span>
                    </div>
                    <div className="bg-surface-dark/60 backdrop-blur-md border border-slate-700/50 px-4 py-2 rounded-lg flex flex-col items-center min-w-[120px] border-l-2 border-l-primary">
                        <span className="text-[10px] uppercase tracking-wider text-slate-400">Auto-Blocked</span>
                        <span className="text-lg font-bold text-primary font-mono">{health?.automation_rate || '99.9%'}</span>
                    </div>
                </div>
            </div>

            {/* Floating Lists */}
            <div className="absolute bottom-8 left-8 w-64 bg-surface-dark/60 backdrop-blur-md border border-slate-700/50 rounded-xl p-4 hidden md:block z-10 border-l-4 border-l-alert-orange">
                <div className="flex justify-between items-center mb-3">
                    <h3 className="text-sm font-semibold text-white">Active Vectors</h3>
                    <span className="text-[10px] bg-alert-orange/20 text-alert-orange px-1.5 py-0.5 rounded border border-alert-orange/20">LIVE</span>
                </div>
                <ul className="space-y-2">
                    {threats.slice(0, 3).map((t, i) => (
                        <li key={i} className="flex items-center justify-between text-xs group cursor-pointer hover:bg-white/5 p-1 rounded transition-colors">
                            <div className="flex items-center gap-2">
                                <AlertTriangle className="w-3 h-3 text-red-500" />
                                <span className="text-slate-300 group-hover:text-white">{t.type}</span>
                            </div>
                            <span className="text-slate-500 font-mono">{t.country} -&gt; US</span>
                        </li>
                    ))}
                    {threats.length === 0 && <li className="text-xs text-slate-500">No active threats visualized.</li>}
                </ul>
            </div>

        </div>
    );
};

export default ThreatMap;
