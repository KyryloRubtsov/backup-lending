import React, { useState, Dispatch, SetStateAction } from 'react';
import { X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import CodeVerification from './codeVerification';

interface AppProps {
    setIsAuthenticated: Dispatch<SetStateAction<boolean>>;
}

export default function App({ setIsAuthenticated }: AppProps) {
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        email: '',
        password: '',
    });

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMessage, setErrorMessage] = useState('')

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

    const handleRegisterSubmit: React.FormEventHandler<HTMLFormElement> = async (e) => {

        e.preventDefault();
        setIsSubmitting(true);

        try {
            await requestVerificationCode();
            setIsModalOpen(true);

        } catch (error) {
            if (axios.isAxiosError(error)) {
                const data = error.response?.data as BackendError | undefined;
                console.log(data?.message);
            } else {
                console.error('Unknown error:', error);
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const requestVerificationCode = async () => {
        await axios.post(
            'http://localhost:3000/api/verification/code',
            {
                email: formData.email,
                password: formData.password,
            },
            { withCredentials: true }
        );
    };

    const performLogin = async () => {
        try {
            const response = await axios.post('http://localhost:3000/api/auth/login', {
                email: formData.email,
                password: formData.password,
            }, {
                withCredentials: true
            });

            if (setIsAuthenticated) setIsAuthenticated(true);

        } catch (error) {
            if (axios.isAxiosError(error)) {
                const data = error.response?.data as BackendError | undefined;
                alert(data?.error || data?.message || 'Ошибка входа');
            } else {
                console.error('Unknown error:', error);
            }

        }
    };

    const handleVerifyCode = async (code: string) => {
        try {

            await axios.post(
                'http://localhost:3000/api/verification/verify',
                { code: code, email: formData.email },
                { withCredentials: true }
            );

            await axios.post(
                'http://localhost:3000/api/auth/register',
                { email: formData.email, password: formData.password },
                { withCredentials: true }
            );

            setIsModalOpen(false);
            await performLogin();
            navigate('/main', { replace: true });

        } catch (error) {
            if (axios.isAxiosError(error)) {
                const message = error.response?.data?.message as BackendError | undefined;
                if (message && typeof message === 'string') {
                    setErrorMessage(message);
                } else {
                    setErrorMessage('Unexpected backend error');
                }

                console.error(message);
            } else {
                console.error('Unknown error:', error);
            }

        }
    };

    return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 text-slate-100 relative">
            <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl shadow-indigo-950/50 relative">

                <button
                    type="button"
                    onClick={() => navigate('/')}
                    className="absolute top-6 right-6 p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>

                <h2 className="text-2xl font-bold text-white text-center mb-6">Create Account</h2>

                <form onSubmit={handleRegisterSubmit} className="space-y-4">
                    <div className="space-y-1.5">
                        <label className="block text-xs font-medium text-slate-400 ml-1">Email</label>
                        <input
                            name="email"
                            type="email"
                            required
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
                            type="password"
                            required
                            placeholder="••••••••"
                            value={formData.password}
                            onChange={handleChange}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 transition-colors"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full py-3.5 mt-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold rounded-xl shadow-lg shadow-indigo-600/30 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                    >
                        {isSubmitting ? 'Creating account...' : 'Create account'}
                    </button>
                </form>

                <p className="mt-6 text-center text-xs text-slate-400">
                    Already have account?{' '}
                    <span
                        className="text-indigo-400 font-semibold cursor-pointer hover:underline ml-1"
                        onClick={() => navigate('/login', { replace: true })}
                    >
                        Login
                    </span>
                </p>
            </div>

            <CodeVerification
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onVerify={handleVerifyCode}
                errorMessage={errorMessage}
                formData={formData}
            />
        </div>
    );
}