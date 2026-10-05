import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Database, Clock, Save, ArrowLeft } from 'lucide-react';
import axios from 'axios';

export default function EditTaskPage() {
    const navigate = useNavigate();
    const { id } = useParams();

    const [isActive, setIsActive] = useState(false);
    const [scheduleType, setScheduleType] = useState('daily');
    const [dbType, setDbType] = useState('postgresql');
    const [schedule, setSchedule] = useState('daily_03');

    const [dayOfWeek, setDayOfWeek] = useState('1');
    const [dayOfMonth, setDayOfMonth] = useState('1');
    const [time, setTime] = useState('03:00');

    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);


    function parseCron(cronString: string) {

        const defaultConfig = {
            scheduleType: 'daily',
            time: '03:00',
            dayOfWeek: '1',
            dayOfMonth: '1',
        };

        if (!cronString || typeof cronString !== 'string') {
            return defaultConfig;
        }

        const parts = cronString.trim().split(/\s+/);

        if (parts.length !== 5) {
            return defaultConfig;
        }

        const [minute, hour, dayOfMonth, month, dayOfWeek] = parts;

        const formattedHour = hour !== '*' ? hour.padStart(2, '0') : '00';
        const formattedMinute = minute !== '*' ? minute.padStart(2, '0') : '00';
        const time = `${formattedHour}:${formattedMinute}`;

        if (hour === '*') {
            return {
                scheduleType: 'hourly',
                time: '00:00',
                dayOfWeek: '1',
                dayOfMonth: '1',
            };
        }

        if (dayOfWeek !== '*') {
            return {
                scheduleType: 'weekly',
                time,
                dayOfWeek: dayOfWeek,
                dayOfMonth: '1',
            };
        }

        if (dayOfMonth !== '*') {
            return {
                scheduleType: 'monthly',
                time,
                dayOfWeek: '1',
                dayOfMonth: dayOfMonth === 'L' ? 'last' : dayOfMonth,
            };
        }

        return {
            scheduleType: 'daily',
            time,
            dayOfWeek: '1',
            dayOfMonth: '1',
        };
    }

    const generateCron = () => {
        const [hours = '00', minutes = '00'] = time.split(':');
        switch (scheduleType) {
            case 'hourly':
                return '0 * * * *';
            case 'weekly':
                return `${minutes} ${hours} * * ${dayOfWeek}`;
            case 'monthly':
                return `${minutes} ${hours} ${dayOfMonth === 'last' ? 'L' : dayOfMonth} * *`;
            case 'daily':
            default:
                return `${minutes} ${hours} * * *`;
        }
    };


    interface Tasks {
        id?: string;
        db_type?: string;
        cron_schedule?: string;
        status?: string;
    }
    useEffect(() => {
        const fetchLatestTask = async () => {
            try {
                const res = await axios.get("http://localhost:3000/api/tasks", {
                    withCredentials: true
                });

                const resData = res.data as Tasks[];

                const filteredTasks = resData.filter((el) => String(el.id) === String(id));

                const task = filteredTasks[0];

                if (task) {
                    setIsActive(task.status === 'active');
                    setDbType(task.db_type || '');

                    const parsedSchedule = parseCron(task.cron_schedule || '');

                    setScheduleType(parsedSchedule.scheduleType);
                    setTime(parsedSchedule.time);
                    setDayOfWeek(parsedSchedule.dayOfWeek);
                    setDayOfMonth(parsedSchedule.dayOfMonth);
                }
            } catch (err) {
                console.error("Ошибка загрузки:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchLatestTask();
    }, [id]);

    const handleSubmit: React.FormEventHandler<HTMLFormElement> = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        const updatedTask = {
            status: isActive ? 'active' : 'inactive',
            cron_schedule: generateCron(),
        };

        try {
            const res = await axios.put(`http://localhost:3000/api/tasks/${id}`, updatedTask, {
                withCredentials: true
            });

            if (res.status >= 200 && res.status < 300) {
                navigate('/main');
            } else {
                alert('Не удалось сохранить изменения');
            }
        } catch (err) {
            console.error('Ошибка сохранения:', err);
            alert('Не удалось сохранить изменения');
        } finally {
            setIsSubmitting(false);
        }

    };


    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-12 flex items-center justify-center relative overflow-hidden">
            <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
                <div className="absolute -top-40 -left-40 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl"></div>
                <div className="absolute top-1/3 -right-40 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl"></div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden relative z-10">

                <div className="flex items-center justify-between px-6 py-5 border-b border-slate-800 bg-slate-900/50">
                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={() => navigate('/main')}
                            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                            title="Назад к списку"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>

                        <div>
                            <h1 className="text-lg font-semibold text-white">Редактировать задачу</h1>
                            <p className="text-xs text-slate-400 font-mono">ID: {id}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2.5 px-3 py-1.5 bg-slate-950/60 border border-slate-800 rounded-xl shadow-inner">
                        <div className="p-1.5 bg-indigo-500/10 rounded-lg border border-indigo-500/20 text-indigo-400">
                            <Database className="w-4 h-4" />
                        </div>
                        <div className="flex flex-col text-right">
                            <span className="text-[9px] font-medium text-slate-500 uppercase tracking-wider leading-none mb-0.5">
                                База данных
                            </span>
                            <span className="text-xs font-semibold text-indigo-300 font-mono uppercase tracking-wide leading-none">
                                {dbType}
                            </span>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-5">

                    <div className="flex items-center justify-between p-4 bg-slate-950 border border-slate-800 rounded-xl">
                        <div className="flex items-center gap-3">
                            <span className="flex h-3 w-3 relative">
                                {isActive && (
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                )}
                                <span className={`relative inline-flex rounded-full h-3 w-3 ${isActive ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
                            </span>
                            <div>
                                <label htmlFor="task-status-toggle" className="block text-sm font-medium text-slate-200 cursor-pointer">
                                    Статус задачи
                                </label>
                                <p className="text-xs text-slate-400">
                                    {isActive ? 'Задача активна и выполняется по расписанию' : 'Задача приостановлена'}
                                </p>
                            </div>
                        </div>

                        <button
                            id="task-status-toggle"
                            type="button"
                            role="switch"
                            aria-checked={isActive}
                            onClick={() => setIsActive(!isActive)}
                            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-900 ${isActive ? 'bg-indigo-600' : 'bg-slate-700'
                                }`}
                        >
                            <span
                                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${isActive ? 'translate-x-5' : 'translate-x-0'
                                    }`}
                            />
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-3">
                            <label className="block text-sm font-medium text-slate-300">
                                Расписание
                            </label>
                            <div className="relative">
                                <Clock className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-500 z-10" />
                                <select
                                    value={scheduleType}
                                    onChange={(e) => setScheduleType(e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
                                >
                                    <option value="daily">Каждый день</option>
                                    <option value="weekly">Раз в неделю</option>
                                    <option value="monthly">Раз в месяц</option>
                                    <option value="hourly">Каждый час</option>
                                </select>
                            </div>

                            {scheduleType === 'weekly' && (
                                <div className="space-y-1.5">
                                    <label className="block text-xs font-medium text-slate-400">День недели</label>
                                    <select
                                        value={dayOfWeek}
                                        onChange={(e) => setDayOfWeek(e.target.value)}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-4 text-sm text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
                                    >
                                        <option value="1">Понедельник</option>
                                        <option value="2">Вторник</option>
                                        <option value="3">Среда</option>
                                        <option value="4">Четверг</option>
                                        <option value="5">Пятница</option>
                                        <option value="6">Суббота</option>
                                        <option value="0">Воскресенье</option>
                                    </select>
                                </div>
                            )}

                            {scheduleType === 'monthly' && (
                                <div className="space-y-1.5">
                                    <label className="block text-xs font-medium text-slate-400">Число месяца</label>
                                    <select
                                        value={dayOfMonth}
                                        onChange={(e) => setDayOfMonth(e.target.value)}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-4 text-sm text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
                                    >
                                        <option value="last">Последний день месяца</option>
                                        {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                                            <option key={day} value={day}>
                                                {day}-е число
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {scheduleType !== 'hourly' && (
                                <div className="space-y-1.5">
                                    <label className="block text-xs font-medium text-slate-400">Время запуска</label>
                                    <input
                                        type="time"
                                        value={time}
                                        onChange={(e) => setTime(e.target.value)}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-4 text-sm text-white focus:outline-none focus:border-indigo-500"
                                    />
                                </div>
                            )}

                        </div>

                    </div>

                    <p className="text-xs text-slate-500 italic pt-2">
                        Сгенерированный Cron: <code className="text-indigo-400 font-mono">{generateCron()}</code>
                    </p>

                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800/80">
                        <button
                            type="button"
                            onClick={() => navigate('/main')}
                            className="px-4 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 text-sm font-medium transition-colors"
                        >
                            Отмена
                        </button>

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 cursor-pointer"
                        >
                            <Save className="w-4 h-4" />
                            {isSubmitting ? 'Сохранение...' : 'Сохранить изменения'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};