import React, { useState } from 'react';
import avatarImg from '../assets/avatar-decoration.png';
import noiseImg from '../assets/login-noise.png';
import './LoginForm.css';
import { login } from '../api/authApi';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const LoginForm = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const data = await login(username, password);
            console.log('Login successful:', data);

            // Сохранение токена
            localStorage.setItem('token', data.token);

            // Очистка полей и сообщение об успехе
            toast.success('Вы успешно вошли!', {
                position: 'top-right',
                autoClose: 3000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
            });

            // Перенаправление на /dashboard
            window.location.href = '/dashboard';
        } catch (error) {
            console.error('Login error:', error.message);

            // Всплывающее уведомление об ошибке
            toast.error('Неверный логин или пароль!', {
                position: 'top-right',
                autoClose: 3000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
            });
        }
    };

    return (
        <div className="login-container">
            <div className="login-noise" style={{ backgroundImage: `url(${noiseImg})` }}></div>
            <div className="login-box">
                <div className="avatar-login">
                    <img src={avatarImg} alt="User Avatar" />
                </div>
                <form onSubmit={handleSubmit}>
                    <input
                        type="text"
                        placeholder="Login"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                    />
                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                    <button type="submit">Войти</button>
                </form>
            </div>
            {/* Контейнер для уведомлений */}
            <ToastContainer />
        </div>
    );
};

export default LoginForm;
