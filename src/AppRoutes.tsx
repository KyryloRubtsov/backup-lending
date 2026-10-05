// AppRoutes.jsx
import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import axios from 'axios';

import App from './App';
import LoginPage from './pages/login';
import RegisterPage from './pages/registration';
import TasksPage from './pages/main';
import CreateTaskPage from './pages/task';
import EditTaskPage from './pages/edit';

export default function AppRoutes() {

    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const res = await axios.get("http://localhost:3000/api/auth/me", {
                    withCredentials: true
                });
                const userId = res.data.id || res.data.user?.id;
                setIsAuthenticated(!!userId);
            } catch (error) {
                setIsAuthenticated(false);
            } finally {
                setLoading(false);
            }
        };

        checkAuth();
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-950 text-slate-400 flex items-center justify-center font-sans">
                Загрузка...
            </div>
        );
    }

    return (
        <Routes>

            <Route path="/"
                element={isAuthenticated ? <Navigate to="/main" replace /> : <App />} />

            <Route
                path="/login"
                element={isAuthenticated ? <Navigate to="/main" replace /> : <LoginPage setIsAuthenticated={setIsAuthenticated} />}
            />
            <Route
                path="/registration"
                element={isAuthenticated ? <Navigate to="/main" replace /> : <RegisterPage setIsAuthenticated={setIsAuthenticated} />}
            />
            <Route
                path="/main"
                element={isAuthenticated ? <TasksPage setIsAuthenticated={setIsAuthenticated} /> : <Navigate to="/login" replace />}
            />
            <Route
                path="/task/new"
                element={isAuthenticated ? <CreateTaskPage /> : <Navigate to="/login" replace />}
            />
            <Route
                path="/task/edit/:id"
                element={isAuthenticated ? <EditTaskPage /> : <Navigate to="/login" replace />}
            />

            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
}