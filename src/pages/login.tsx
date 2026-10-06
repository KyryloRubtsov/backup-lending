import React, { useState, useRef, Dispatch, SetStateAction } from 'react';
import { X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

interface AppProps {
    setIsAuthenticated: Dispatch<SetStateAction<boolean>>;
}

export default function App({ setIsAuthenticated }: AppProps) {
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        email: '',
        password: '',
    });

    const inputEmail = useRef(null);
    const inputPassword = useRef(null);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData((prev) => ({
            ...prev,
            [e.target.name]: e.target.value,
        }));
    };
    interface BackendError {
        message: string;
        statusCode: number;
        error?: string;
        errors?: string[];
    }
    const handleLoginSubmit: React.FormEventHandler<HTMLFormElement> = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.post('http://localhost:3000/api/auth/login', {
                email: formData.email,
                password: formData.password,
            }, {
                withCredentials: true
            });

            if (setIsAuthenticated) setIsAuthenticated(true);
            navigate('/main', { replace: true });

        } catch (error) {
            if (axios.isAxiosError(error)) {
                const data = error.response?.data as BackendError | undefined;
                console.error('Network or server error:', data);
            } else {
                console.error('Network or server error:', error);
            }
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 text-slate-100 relative">
            <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl shadow-indigo-950/50 relative">
                <button
                    onClick={() => navigate('*')}
                    className="absolute top-6 right-6 p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>

                <h2 className="text-2xl font-bold text-white text-center mb-6">Login</h2>

                <form onSubmit={handleLoginSubmit} className="space-y-4">
                    <div className="space-y-1.5">
                        <label className="block text-xs font-medium text-slate-400 ml-1">Email</label>
                        <input
                            name="email"
                            ref={inputEmail}
                            type="email"
                            placeholder="Enter your email..."
                            value={formData.email}
                            onChange={handleChange}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 transition-colors"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="block text-xs font-medium text-slate-400 ml-1">Password</label>
                        <input
                            name="password"
                            ref={inputPassword}
                            type="password"
                            placeholder="••••••••"
                            value={formData.password}
                            onChange={handleChange}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 transition-colors"
                        />
                    </div>

                    <div className="flex flex-col gap-3 pt-2">
                        <button
                            type="submit"
                            className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold rounded-xl shadow-lg shadow-indigo-600/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
                        >
                            Login
                        </button>
                        <button
                            type="button"
                            className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium rounded-xl border border-slate-700 transition-all"
                            onClick={() => navigate("/registration", { replace: true })}
                        >
                            Registration
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}