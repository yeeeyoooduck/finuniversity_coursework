import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import LoginForm from './components/LoginForm';
import Dashboard from './components/Dashboard';

import './styles/globals.css'

const App = () => {
    // Проверка аутентификации
    const isAuthenticated = () => {
        const token = localStorage.getItem('token');
        return token != null;
    };

    return (
        <Router>
            <Routes>
                {/* Умный маршрут "/" */}
                <Route
                    path="/"
                    element={isAuthenticated() ? <Navigate to="/dashboard" /> : <Navigate to="/login" />}
                />
                {/* Страница логина */}
                <Route
                    path="/login"
                    element={isAuthenticated() ? <Navigate to="/dashboard" /> : <LoginForm />}
                />
                {/* Дашборд (доступ только для залогиненных пользователей) */}
                <Route
                    path="/dashboard"
                    element={isAuthenticated() ? <Dashboard /> : <Navigate to="/login" />}
                />
            </Routes>
        </Router>
    );
};

export default App;
