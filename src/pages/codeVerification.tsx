import React, { useState, useEffect, useRef } from 'react';
import { Mail, X, CheckCircle2, RefreshCw } from 'lucide-react';

import axios from 'axios';

interface formData {
    email: string;
    password: string
}

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onVerify: (code: string) => void | Promise<void>;
    errorMessage: string | null;
    formData: formData;
}

export default function codeVerification({ isOpen, onClose, onVerify, errorMessage, formData }: Props) {

    const [code, setCode] = useState(Array(6).fill(''));
    const [timer, setTimer] = useState(60);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    useEffect(() => {
        if (!isOpen) return;

        let interval: ReturnType<typeof setInterval> | undefined = undefined;

        if (timer > 0) {
            interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
        }
        return () => clearInterval(interval);
    }, [isOpen, timer]);

    useEffect(() => {
        if (isOpen && inputRefs.current[0]) {
            inputRefs.current[0]?.focus();
        }
    }, [isOpen]);

    if (!isOpen) return null;



    const handleChange = (index: number, value: string) => {
        if (!/^\d*$/.test(value)) return;

        const newCode = [...code];
        if (value.length > 1) {
            const pastedDigits = value.slice(0, 6).split('');
            pastedDigits.forEach((digit, i) => {
                newCode[i] = digit;
            });
            setCode(newCode);
            const nextFocusIndex = Math.min(pastedDigits.length, 6 - 1);
            inputRefs.current[nextFocusIndex]?.focus();
            return;
        }

        newCode[index] = value.slice(-1);
        setCode(newCode);
        errorMessage = null
        setIsSubmitting(false);

        if (value && index < 6 - 1) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Backspace' && !code[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handleResend = async () => {
        if (timer > 0) return;
        setTimer(60);
        setCode(Array(6).fill(''));

        inputRefs.current[0]?.focus();
        await axios.post(
            'http://localhost:3000/api/verification/code',
            {
                email: formData.email,
                password: formData.password,
            },
            { withCredentials: true }
        );
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const fullCode = code.join('');
        if (fullCode.length < 6) {
            return;
        }
        setCode(Array(6).fill(''));
        setIsSubmitting(true);


        try {
            await onVerify(fullCode);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Invalid or expired code';
            console.log(errorMessage);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden relative text-slate-100 p-6">

                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>

                <div className="text-center mb-6">
                    <div className="w-12 h-12 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4 text-indigo-400">
                        <Mail className="w-6 h-6" />
                    </div>
                    <h2 className="text-xl font-bold text-white mb-1">
                        Check your email.
                    </h2>
                    <p className="text-sm text-slate-400">
                        We have sent a confirmation code to
                    </p>
                    <p className="text-sm font-medium text-indigo-300 font-mono mt-0.5">
                        {formData.email}
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="flex justify-center gap-3">
                        {code.map((digit, idx) => (
                            <input
                                key={idx}
                                ref={(el) => { inputRefs.current[idx] = el; }}
                                type="text"
                                inputMode="numeric"
                                maxLength={1}
                                value={digit}
                                onChange={(e) => handleChange(idx, e.target.value)}
                                onKeyDown={(e) => handleKeyDown(idx, e)}
                                className={`w-12 h-14 text-center text-xl font-bold rounded-xl bg-slate-950 border transition-all focus:outline-none ${digit
                                    ? 'border-indigo-500 text-white shadow-lg shadow-indigo-500/10'
                                    : 'border-slate-800 text-slate-200 focus:border-indigo-500'
                                    }`}
                            />
                        ))}
                    </div>

                    {errorMessage && isSubmitting && (
                        <div className="text-center bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs py-2 px-3 rounded-lg flex items-center justify-center gap-2 animate-fadeIn max-w-[280px] mx-auto mt-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse flex-shrink-0" />
                            <span className="font-medium">{errorMessage}</span>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={code.join('').length < 6}
                        className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-medium rounded-xl shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2"
                    >

                        <>
                            <CheckCircle2 className="w-4 h-4" />
                            Confirm
                        </>

                    </button>
                </form>

                <div className="mt-6 text-center text-xs text-slate-400">
                    Didn't receive the code?{' '}
                    {timer > 0 ? (
                        <span className="text-slate-500 font-mono">
                            Resend in {timer}s
                        </span>
                    ) : (
                        <button
                            type="button"
                            onClick={handleResend}
                            className="text-indigo-400 hover:text-indigo-300 font-medium inline-flex items-center gap-1 ml-1"
                        >
                            <RefreshCw className="w-3 h-3" /> Send again
                        </button>
                    )}
                </div>

            </div>
        </div>
    );
}