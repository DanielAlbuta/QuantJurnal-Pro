import React, { useState } from 'react';
import { BookOpen, User, Lock, Mail, ArrowRight, ArrowLeft, AlertCircle } from 'lucide-react';
import { UserProfile } from '../types';
import { api, setToken } from '../api';

interface AuthPageProps {
    initialMode: 'login' | 'register';
    onAuthSuccess: (userProfile?: Partial<UserProfile>) => void;
    onBack: () => void;
}

const AuthPage: React.FC<AuthPageProps> = ({ initialMode, onAuthSuccess, onBack }) => {
    const [mode, setMode] = useState<'login' | 'register'>(initialMode);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: ''
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            let response;

            if (mode === 'register') {
                response = await api.register(formData.name, formData.email, formData.password);
            } else {
                response = await api.login(formData.email, formData.password);
            }

            // Store JWT token
            setToken(response.token);

            // Pass user data to parent
            onAuthSuccess(response.user);

        } catch (err: any) {
            console.error('Auth error:', err);
            setError(err.message || 'Authentication failed. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#0f172a] flex relative overflow-hidden">

            {/* Background Decor */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
                <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-indigo-600/20 rounded-full blur-[120px]"></div>
                <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-emerald-600/10 rounded-full blur-[120px]"></div>
            </div>

            <div className="relative z-10 w-full max-w-md m-auto px-6">

                <button
                    onClick={onBack}
                    className="mb-8 flex items-center gap-2 text-slate-400 hover:text-white transition-colors group"
                >
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Back to Home
                </button>

                <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 p-8 rounded-2xl shadow-2xl animate-in fade-in zoom-in-95 duration-300">
                    <div className="flex justify-center mb-6">
                        <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-600/30">
                            <BookOpen className="w-6 h-6 text-white" />
                        </div>
                    </div>

                    <h2 className="text-2xl font-bold text-center text-white mb-2">
                        {mode === 'login' ? 'Welcome Back' : 'Create Account'}
                    </h2>
                    <p className="text-slate-400 text-center mb-8 text-sm">
                        {mode === 'login' ? 'Enter your credentials to access your journal.' : 'Start your professional trading journey today.'}
                    </p>

                    {/* Error Message */}
                    {error && (
                        <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg flex items-center gap-2 text-rose-400 text-sm">
                            <AlertCircle className="w-4 h-4 flex-shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {mode === 'register' && (
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-slate-500 uppercase ml-1">Full Name</label>
                                <div className="relative">
                                    <User className="absolute left-3 top-2.5 w-5 h-5 text-slate-500" />
                                    <input
                                        type="text" required
                                        className="w-full bg-slate-950 border border-slate-800 text-slate-200 pl-10 pr-4 py-2.5 rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                                        placeholder="Trader One"
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    />
                                </div>
                            </div>
                        )}

                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-slate-500 uppercase ml-1">Email Address</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-2.5 w-5 h-5 text-slate-500" />
                                <input
                                    type="email" required
                                    className="w-full bg-slate-950 border border-slate-800 text-slate-200 pl-10 pr-4 py-2.5 rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                                    placeholder="name@example.com"
                                    value={formData.email}
                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-slate-500 uppercase ml-1">Password</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-2.5 w-5 h-5 text-slate-500" />
                                <input
                                    type="password" required
                                    minLength={6}
                                    className="w-full bg-slate-950 border border-slate-800 text-slate-200 pl-10 pr-4 py-2.5 rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                                    placeholder="••••••••"
                                    value={formData.password}
                                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-xl shadow-lg shadow-indigo-900/20 transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 mt-4 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                        >
                            {isLoading ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    {mode === 'login' ? 'Sign In' : 'Create Account'} <ArrowRight className="w-4 h-4" />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-6 pt-6 border-t border-slate-800 text-center">
                        <p className="text-sm text-slate-400">
                            {mode === 'login' ? "Don't have an account?" : "Already have an account?"}
                            <button
                                onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(null); }}
                                className="ml-2 text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
                            >
                                {mode === 'login' ? 'Sign Up' : 'Log In'}
                            </button>
                        </p>
                    </div>
                </div>

                {/* Simple Footer */}
                <div className="mt-8 text-center text-xs text-slate-600">
                    &copy; 2024 QuantJournal Pro. All rights reserved.
                </div>
            </div>
        </div>
    );
};

export default AuthPage;