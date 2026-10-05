import React, { useState } from 'react';
import { Database, Clock, Key, Server, User, Link } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function App() {

    const navigate = useNavigate();

    const [dbType, setDbType] = useState('postgres');
    const [host, setHost] = useState('');
    const [port, setPort] = useState('5432');
    const [dbName, setDbName] = useState('');
    const [user, setUser] = useState('');
    const [password, setPassword] = useState('');

    const [scheduleType, setScheduleType] = useState('daily');
    const [time, setTime] = useState('03:00');
    const [dayOfWeek, setDayOfWeek] = useState('1');
    const [dayOfMonth, setDayOfMonth] = useState('1');

    const handleDbTypeChange = (type: string) => {
        setDbType(type);
        if (type === 'postgres') setPort('5432');
        if (type === 'mysql') setPort('3306');
        if (type === 'mongodb') setPort('27017');
    };

    const generateCron = () => {
        const [hours, minutes] = time.split(':');

        switch (scheduleType) {
            case 'hourly':
                return `0 * * * *`;
            case 'daily':
                return `${minutes} ${hours} * * *`;
            case 'weekly':
                return `${minutes} ${hours} * * ${dayOfWeek}`;
            case 'monthly':
                return `${minutes} ${hours} ${dayOfMonth} * *`;
            default:
                return `0 3 * * *`;
        }
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        const connectionString = `${dbType}://${user}:${password}@${host}:${port}/${dbName}`;

        try {
            await axios.post('http://localhost:3000/api/task', {
                db_type: dbType,
                connection_string: connectionString,
                cron_schedule: generateCron(),
            }, {
                withCredentials: true
            });

            navigate("/main");

        } catch (error) {
            let errorMsg = 'Ошибка при сохранении';

            if (axios.isAxiosError(error)) {
                errorMsg = error.response?.data?.message || errorMsg;
            } else if (error instanceof Error) {
                errorMsg = error.message;
            }

            alert(errorMsg);
            console.error('Ошибка сохранения:', error);
        }
    };
    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl shadow-indigo-950/50 text-slate-100">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2.5 bg-indigo-600/20 rounded-xl text-indigo-400">
                        <Database className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-white">Новая задача бэкапа</h3>
                        <p className="text-xs text-slate-400">Укажите параметры подключения к вашей БД</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                            Тип базы данных
                        </label>
                        <div className="grid grid-cols-3 gap-3">
                            {[
                                { id: 'postgres', label: 'PostgreSQL' },
                                { id: 'mysql', label: 'MySQL' },
                                { id: 'mongodb', label: 'MongoDB' },
                            ].map((db) => (
                                <button
                                    key={db.id}
                                    type="button"
                                    onClick={() => handleDbTypeChange(db.id)}
                                    className={`py-3 px-4 rounded-xl font-medium text-sm border transition-all ${dbType === db.id
                                        ? 'bg-indigo-600/10 border-indigo-500 text-indigo-400 shadow-lg shadow-indigo-500/10'
                                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                                        }`}
                                >
                                    {db.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="md:col-span-2 space-y-1.5">
                            <label className="block text-xs font-medium text-slate-400 flex items-center gap-1.5">
                                <Server className="w-3.5 h-3.5" /> Хост (Host)
                            </label>
                            <input
                                type="text"
                                placeholder="localhost или db.example.com"
                                value={host}
                                onChange={(e) => setHost(e.target.value)}
                                required
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-4 text-sm text-white focus:outline-none focus:border-indigo-500"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="block text-xs font-medium text-slate-400 flex items-center gap-1.5">
                                <Link className="w-3.5 h-3.5" /> Порт
                            </label>
                            <input
                                type="text"
                                placeholder="5432"
                                value={port}
                                onChange={(e) => setPort(e.target.value)}
                                required
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-4 text-sm text-white focus:outline-none focus:border-indigo-500"
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="block text-xs font-medium text-slate-400 flex items-center gap-1.5">
                            <Database className="w-3.5 h-3.5" /> Имя базы данных
                        </label>
                        <input
                            type="text"
                            placeholder="my_database"
                            value={dbName}
                            onChange={(e) => setDbName(e.target.value)}
                            required
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-4 text-sm text-white focus:outline-none focus:border-indigo-500"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="block text-xs font-medium text-slate-400 flex items-center gap-1.5">
                                <User className="w-3.5 h-3.5" /> Пользователь
                            </label>
                            <input
                                type="text"
                                placeholder="postgres / root"
                                value={user}
                                onChange={(e) => setUser(e.target.value)}
                                required
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-4 text-sm text-white focus:outline-none focus:border-indigo-500"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="block text-xs font-medium text-slate-400 flex items-center gap-1.5">
                                <Key className="w-3.5 h-3.5" /> Пароль
                            </label>
                            <input
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-4 text-sm text-white focus:outline-none focus:border-indigo-500"
                            />
                        </div>
                    </div>

                    <div className="pt-2 border-t border-slate-800/80 space-y-4">
                        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                            <Clock className="w-4 h-4 text-indigo-400" /> Расписание бэкапов
                        </label>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="block text-xs font-medium text-slate-400">Периодичность</label>
                                <select
                                    value={scheduleType}
                                    onChange={(e) => setScheduleType(e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-4 text-sm text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
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

                        <p className="text-xs text-slate-500 italic">
                            Сгенерированный Cron: <code className="text-indigo-400 font-mono">{generateCron()}</code>
                        </p>
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={() => navigate("/")}
                            className="px-5 py-3 bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-white font-medium text-sm border border-slate-800 rounded-xl transition-all"
                        >
                            Назад
                        </button>
                        <button
                            type="submit"
                            className="flex-1 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold rounded-xl shadow-lg shadow-indigo-600/30 transition-all hover:scale-[1.01] active:scale-[0.99]"
                        >
                            Сохранить расписание
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}