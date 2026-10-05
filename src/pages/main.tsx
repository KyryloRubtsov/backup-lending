import React, { useState, useEffect, Dispatch, SetStateAction } from 'react';
import { Database, Clock, PlusCircle, Play, Trash2, CheckCircle2, XCircle, Pencil, Hash, RotateCcw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

interface Tasks {
    id: string;
    db_type?: string;
    db_name?: string;
    cron_schedule?: string;
    status?: string;
}

interface AppProps {
    setIsAuthenticated: Dispatch<SetStateAction<boolean>>;
}
export default function App({ setIsAuthenticated }: AppProps) {
    const navigate = useNavigate();

    const [tasks, setTasks] = useState<Tasks[]>([]);

    useEffect(() => {
        const fetchTasks = async () => {
            try {
                const res = await axios.get("http://localhost:3000/api/tasks", {
                    withCredentials: true
                });
                setTasks(res.data as Tasks[]);
            } catch (error) {
                setIsAuthenticated(false);
            }
        };

        fetchTasks();
    }, []);

    interface BackendError {
        message: string;
        statusCode: number;
        error?: string;
        errors?: string[];
    }

    const deleteTask = async (taskId: string) => {
        try {
            await axios.delete(`http://localhost:3000/api/tasks/${taskId}`, {
                withCredentials: true
            });

            setTasks((prevTasks) => prevTasks.filter((task) => String(task.id) !== taskId));
        } catch (error) {
            if (axios.isAxiosError(error)) {
                const errorData = error.response?.data as BackendError | undefined;
                console.error('Ошибка сервера при удалении:', errorData);
            } else {
                console.error('Ошибка сервера при удалении:', error);
            }
        }
    };

    const postTask = async (taskId: string) => {
        try {
            const response = await axios.post(`http://localhost:3000/api/task/${taskId}/backup`, {}, {
                withCredentials: true
            });

            const data = response.data;
            alert(data.message || 'Бэкап успешно запущен!');
        } catch (error) {
            if (axios.isAxiosError(error)) {
                const errorData = error.response?.data as BackendError | undefined;
                console.error('Ошибка сервера при удалении:', errorData);
            } else {
                console.error('Ошибка сервера при удалении:', error);
            }
        }
    };


    const [loading, setLoading] = useState(false);

    const handleRestore = async (taskId: string) => {

        const confirmed = window.confirm(`Восстановить базу из бэкапа #${taskId}? Текущие данные будут перезаписаны!`);

        if (!confirmed) return;

        setLoading(true);

        try {
            await axios.post(
                `http://localhost:3000/api/backups/${taskId}/restore`,
                {},
                { withCredentials: true }
            );
            alert('Успешно восстановлено!');
        } catch (error) {
            if (axios.isAxiosError(error)) {
                alert('Ошибка восстановления: ' + (error.response?.data?.error || error.message));
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl shadow-indigo-950/50 text-slate-100 mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-6 border-b border-slate-800">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-indigo-600/20 rounded-xl text-indigo-400">
                        <Database className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-white">Задачи бэкапа</h3>
                        <p className="text-xs text-slate-400">Список всех настроенных автоматических бэкапов</p>
                    </div>
                </div>

                <button
                    onClick={() => navigate("/task/new")}
                    className="py-2.5 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-medium text-sm rounded-xl shadow-lg shadow-indigo-600/30 transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 self-start sm:self-auto"
                >
                    <PlusCircle className="w-4 h-4" />
                    Добавить задание
                </button>
            </div>

            <div className="space-y-4">
                {tasks.map((task) => (
                    <div
                        key={task.id}
                        className="bg-slate-950 border border-slate-800/80 rounded-2xl p-5 hover:border-slate-700 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                    >
                        <div className="space-y-2">
                            <div className="flex items-center gap-2.5">
                                <span className="uppercase text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                                    {task.db_type}
                                </span>
                                <h4 className="font-semibold text-white text-base">{task.db_name}</h4>
                            </div>

                            <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-slate-400">
                                <span className="flex items-center gap-1">
                                    <Hash className="w-3.5 h-3.5 text-slate-500" />
                                    <span className="text-slate-400 font-mono">ID: {task.id}</span>
                                </span>

                                <span className="flex items-center gap-1">
                                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                                    <code className="text-indigo-400 font-mono">{task.cron_schedule}</code>
                                </span>
                            </div>
                        </div>

                        <button
                            onClick={() => handleRestore(task.id)}
                            disabled={loading}
                            className="px-2.5 py-1 bg-slate-900 hover:bg-indigo-600/20 text-slate-300 hover:text-indigo-400 border border-slate-800 rounded-lg text-xs flex items-center gap-1 transition-all"
                        >
                            <RotateCcw className="w-3 h-3" />
                            {loading ? 'Восстановление...' : 'Восстановить'}
                        </button>

                        <div className="flex items-center justify-between md:justify-end gap-3 pt-3 md:pt-0 border-t md:border-t-0 border-slate-800/50">
                            {task.status === "active" ? (
                                <>
                                    <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-lg">
                                        <CheckCircle2 className="w-3.5 h-3.5" />
                                        Активно
                                    </span>
                                </>
                            ) : (
                                <>
                                    <span className="flex items-center gap-1.5 text-xs font-medium text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2.5 py-1 rounded-lg">
                                        <XCircle className="w-3.5 h-3.5" />
                                        Неактивно
                                    </span>
                                </>
                            )}

                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => postTask(task.id)}
                                    title="Запустить сейчас"
                                    className="p-2 bg-slate-900 hover:bg-indigo-600/20 text-slate-300 hover:text-indigo-400 border border-slate-800 rounded-xl transition-all"
                                >
                                    <Play className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => deleteTask(task.id)}
                                    title="Удалить"
                                    className="p-2 bg-slate-900 hover:bg-rose-600/20 text-slate-300 hover:text-rose-400 border border-slate-800 rounded-xl transition-all"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => navigate(`/task/edit/${task.id}`)}
                                    className="p-2 bg-slate-900 hover:bg-slate-700 text-indigo-300 hover:text-indigo-400 border-slate-800 rounded-xl transition-colors border "
                                    title="Редактировать"
                                >
                                    <Pencil className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

        </div>
    );
}