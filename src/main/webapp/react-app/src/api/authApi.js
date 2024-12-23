import axios from 'axios';

const API_BASE_URL = 'http://localhost:8080/api'; // Базовый URL сервера

// Функция для логина
export const login = async (username, password) => {
    try {
        const response = await axios.post(`${API_BASE_URL}/login`, {
            username,
            password,
        });
        return response.data; // Возвращаем данные (например, токен)
    } catch (error) {
        if (error.response) {
            // Сервер вернул ошибку (например, 401 Unauthorized)
            throw new Error(error.response.data || 'Login failed');
        } else {
            // Проблема на стороне клиента или сети
            throw new Error('Network error');
        }
    }
};

export const getContacts = async () => {
    try {
        const response = await axios.get(`${API_BASE_URL}/contacts`, {
            headers: {
                Authorization: `Bearer ${localStorage.getItem('token')}`, // Передача токена для авторизации
            },
        });
        return response.data;
    } catch (error) {
        console.error('Error fetching contacts:', error);
        throw error;
    }
};

export const updateContact = async (id, updatedContact) => {
    try {
        const response = await axios.put(
            `${API_BASE_URL}/contacts/${id}`,
            updatedContact,
            {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`, // Передача токена для авторизации
                },
            }
        );
        return response.data;
    } catch (error) {
        console.error('Error updating contact:', error);
        throw error;
    }
};

// Получение сообщений для конкретного контакта
export const getChatMessages = async (contactId) => {
    try {
        const response = await axios.get(`${API_BASE_URL}/chats/${contactId}`, {
            headers: {
                Authorization: `Bearer ${localStorage.getItem('token')}`,
            },
        });
        return response.data;
    } catch (error) {
        console.error('Error fetching chat messages:', error);
        throw error;
    }
};

// Отправка нового сообщения
export const addChatMessage = async (message) => {
    try {
        const response = await axios.post(`${API_BASE_URL}/chats`, message, {
            headers: {
                Authorization: `Bearer ${localStorage.getItem('token')}`,
            },
        });
        return response.data;
    } catch (error) {
        console.error('Error sending chat message:', error);
        throw error;
    }
};

export const sendMessageToTelegram = async (chatId, message) => {
    try {
        const response = await axios.post(`${API_BASE_URL}/chats/send`, { chatId, message });
        return response.data;
    } catch (error) {
        console.error('Failed to send message:', error);
        throw error;
    }
};

// src/api/authApi.js

export const getUsers = async () => {
    const response = await fetch(`${API_BASE_URL}/users`, {
        headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
        }
    });
    if (!response.ok) {
        throw new Error('Failed to fetch users');
    }
    return response.json();
};

export const updateUser = async (userId, updatedData) => {
    const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(updatedData)
    });
    if (!response.ok) {
        throw new Error('Failed to update user');
    }
    return response.json();
};

export const deleteUser = async (userId) => {
    const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
        method: 'DELETE',
        headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
        }
    });
    if (!response.ok) {
        throw new Error('Failed to delete user');
    }
    return response.json();
};

