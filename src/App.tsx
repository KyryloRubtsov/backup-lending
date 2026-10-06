import React from 'react';
import { ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function App() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-indigo-500 selection:text-white relative overflow-hidden">
            <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
                <div className="absolute -top-40 -left-40 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl"></div>
                <div className="absolute top-1/3 -right-40 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl"></div>
            </div>

            <header className="border-b border-slate-800/80 backdrop-blur-md sticky top-0 z-50 bg-slate-950/70">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-xl shadow-lg shadow-indigo-500/20">
                            <ShieldCheck className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
                            QxW.inc
                        </span>
                    </div>
                    <div className="flex items-center gap-4">
                        <button
                            className="text-sm font-medium text-slate-300 hover:text-white transition-colors px-4 py-2 cursor-pointer"
                            onClick={() => navigate('/login')}
                        >
                            Sign in
                        </button>

                        <button
                            className="text-sm font-medium bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl shadow-lg shadow-indigo-600/30 transition-all hover:scale-105 active:scale-95 cursor-pointer"
                            onClick={() => navigate('/registration')}
                        >
                            Sign up
                        </button>
                    </div>
                </div>
            </header>

            <section className="pt-24 pb-20 px-6 max-w-7xl mx-auto text-center relative z-10">
                <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-white mb-6 max-w-4xl mx-auto leading-tight">
                    "Smart Backup" for databases
                </h1>
                <p className="text-slate-400 text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
                    A web-based backup service. The user visits the site, enters their database credentials (for PostgreSQL, MySQL, or MongoDB), and sets a schedule (e.g., "every night at 3:00 AM"). The service automatically connects in the background, retrieves the data, encrypts it, and stores it in an independent, secure S3 cloud. If something goes wrong, the user simply clicks a single "Restore" button on your site.
                </p>
            </section>
        </div>
    );
}