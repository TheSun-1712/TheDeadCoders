import { Link } from "react-router-dom";
import {
    Shield,
    Lock,
    Activity,
    Radar,
    Zap,
    LayoutDashboard,
    FileText,
    Settings,
    Bell,
    Eye,
} from "lucide-react";

const LandingPage = () => {
    return (
        <div className="relative min-h-screen bg-background-dark text-white font-display overflow-hidden selection:bg-primary selection:text-white">

            {/* ===== Animated Background Gradient ===== */}
            <div className="absolute inset-0 -z-20 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 animate-gradient"></div>

            {/* ===== Cyber Grid Overlay ===== */}
            <div className="absolute inset-0 -z-10 opacity-10 bg-[linear-gradient(to_right,#14b8a6_1px,transparent_1px),linear-gradient(to_bottom,#14b8a6_1px,transparent_1px)] bg-[size:60px_60px]"></div>

            {/* Floating Glows */}
            <div className="absolute top-20 left-20 w-72 h-72 bg-primary/20 rounded-full blur-3xl animate-pulseSlow"></div>
            <div className="absolute bottom-20 right-20 w-72 h-72 bg-orange-400/20 rounded-full blur-3xl animate-pulseSlow"></div>

            {/* ================= HERO ================= */}
            <section className="px-6 py-24 max-w-7xl mx-auto text-center relative z-10 animate-fadeInUp">

                <p className="text-primary font-semibold tracking-wider uppercase mb-4">
                    Intelligent Threat Detection & Automated Response
                </p>

                <h1 className="text-4xl md:text-6xl font-bold leading-tight mb-6">
                    Security That Detects,
                    <span className="text-primary"> Decides</span>, and
                    <span className="text-orange-300"> Responds</span> Instantly
                </h1>

                <p className="text-slate-400 max-w-3xl mx-auto text-lg mb-8">
                    Monitor activity, identify attacks, and enforce protection instantly —
                    without manual intervention.
                </p>

                <a href="#portal-access"
                    className="px-8 py-3 rounded-xl bg-primary hover:bg-primary-dark transition font-semibold shadow-lg shadow-primary/20 hover:shadow-primary/40 hover:-translate-y-1 duration-300 inline-block">
                    Get Started
                </a>
            </section>

            {/* ================= FEATURES ================= */}
            <section className="px-6 py-20 relative z-10">
                <div className="max-w-7xl mx-auto grid md:grid-cols-2 lg:grid-cols-4 gap-8">

                    {[
                        { icon: Activity, title: "Real-Time Monitoring", desc: "Continuously observes system activity." },
                        { icon: Radar, title: "Attack Identification", desc: "Recognizes brute force and bot traffic." },
                        { icon: Zap, title: "Automated Mitigation", desc: "Blocks malicious sources instantly." },
                        { icon: LayoutDashboard, title: "Centralized Visibility", desc: "Unified dashboard overview." },
                    ].map((item, index) => (
                        <div
                            key={index}
                            className="group bg-surface-dark/70 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 
                            hover:border-primary hover:-translate-y-2 hover:shadow-[0_0_30px_rgba(16,185,129,0.4)]
                            transition-all duration-500 animate-fadeInUp"
                        >
                            <item.icon className="w-10 h-10 text-primary mb-4 group-hover:scale-110 group-hover:rotate-6 transition-transform duration-500" />
                            <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                            <p className="text-slate-400 text-sm">{item.desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* ================= WHY ================= */}
            <section className="px-6 py-24 text-center max-w-4xl mx-auto relative z-10 animate-fadeInUp">
                <h2 className="text-3xl font-bold mb-6">Why This Platform</h2>

                <div className="grid md:grid-cols-3 gap-6">
                    {[
                        "Responds to threats instantly",
                        "Reduces manual workload",
                        "Ensures consistent response handling",
                    ].map((text, i) => (
                        <div
                            key={i}
                            className="bg-surface-dark/70 backdrop-blur-xl border border-slate-800 rounded-xl p-5
                            hover:border-primary hover:-translate-y-1 transition-all duration-300"
                        >
                            <p className="text-slate-300">{text}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* ================= PORTAL ACCESS ================= */}
            <section className="px-6 pb-24 relative z-10">
                <div id="portal-access" className="max-w-4xl mx-auto grid md:grid-cols-2 gap-8">

                    {[{
                        title: "Client Portal",
                        desc: "Track protection status and automated responses.",
                        icon: Shield,
                        link: "/client/dashboard"
                    },
                    {
                        title: "Administrator Portal",
                        desc: "Manage policies and investigate incidents.",
                        icon: Lock,
                        link: "/admin/dashboard"
                    }].map((item, i) => (
                        <Link
                            key={i}
                            to={item.link}
                            className="group relative bg-surface-dark/80 backdrop-blur-xl rounded-2xl p-8 
                            border border-slate-800 hover:border-primary hover:-translate-y-2
                            hover:shadow-[0_0_40px_rgba(16,185,129,0.5)]
                            transition-all duration-500 overflow-hidden"
                        >
                            <item.icon className="absolute right-6 top-6 w-28 h-28 opacity-10 text-primary group-hover:rotate-12 transition-transform duration-700" />

                            <h3 className="text-2xl font-bold mb-2">{item.title}</h3>
                            <p className="text-slate-400 mb-6">{item.desc}</p>

                            <span className="text-primary font-semibold group-hover:translate-x-2 transition-transform inline-block">
                                Enter →
                            </span>
                        </Link>
                    ))}

                </div>
            </section>

            {/* ================= FOOTER ================= */}
            <footer className="border-t border-slate-800 py-6 text-center text-slate-500 bg-background-dark">
                Reliable monitoring. Clear decisions. Continuous protection.
            </footer>

            {/* ===== Custom Animations ===== */}
            <style>
                {`
                .animate-fadeInUp {
                    animation: fadeInUp 1s ease forwards;
                }

                @keyframes fadeInUp {
                    from { opacity: 0; transform: translateY(40px); }
                    to { opacity: 1; transform: translateY(0); }
                }

                .animate-gradient {
                    background-size: 200% 200%;
                    animation: gradientShift 15s ease infinite;
                }

                @keyframes gradientShift {
                    0% { background-position: 0% 50%; }
                    50% { background-position: 100% 50%; }
                    100% { background-position: 0% 50%; }
                }

                .animate-pulseSlow {
                    animation: pulseSlow 6s infinite ease-in-out;
                }

                @keyframes pulseSlow {
                    0%,100% { opacity: 0.4; transform: scale(1); }
                    50% { opacity: 0.7; transform: scale(1.1); }
                }
                `}
            </style>
        </div>
    );
};

export default LandingPage;
