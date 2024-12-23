// src/components/Dashboard.js

import React, { useEffect, useRef, useState } from "react";
import logoImg from '../assets/logo.svg';
import homeImg from '../assets/home.png';
import attendImg from '../assets/attend.svg';
import mailImg from '../assets/mail.svg';
import sendImg from '../assets/send.svg';
import messageImg from '../assets/message.svg';
import callImg from '../assets/call.svg';
import avatarImg from "../assets/avatar.png";
import settingsImg from "../assets/settings.svg";
import "./Dashboard.css";
import { addChatMessage, getChatMessages, getContacts, sendMessageToTelegram, updateContact, getUsers, updateUser, deleteUser } from '../api/authApi';
import { Stomp } from "@stomp/stompjs";
import SockJS from "sockjs-client";

const Dashboard = () => {
    const userAvatar = "https://i.pinimg.com/736x/1c/d4/e5/1cd4e52db2c3f6445ce7bf697200deb9.jpg";

    const [isSettingsView, setIsSettingsView] = useState(false);
    const [activeTab, setActiveTab] = useState("profile"); // Track the active tab
    const [contacts, setContacts] = useState([]);
    const [selectedContact, setSelectedContact] = useState(null);
    const [animationClass, setAnimationClass] = useState("");
    const [tempContact, setTempContact] = useState(null);
    const [loading, setLoading] = useState(true); // Loading state
    const [chatMessages, setChatMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [stompClient, setStompClient] = useState(null);
    const chatContainerRef = useRef(null);

    // States for users management
    const [users, setUsers] = useState([]);
    const [usersLoading, setUsersLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        const socket = new SockJS("http://localhost:8080/ws");
        const stompClientInstance = Stomp.over(socket);

        stompClientInstance.connect({}, () => {
            console.log("Connected to WebSocket");

            // Подписка на обновления сообщений для выбранного контакта
            if (selectedContact) {
                stompClientInstance.subscribe(
                    `/topic/chats/${selectedContact.id}`,
                    () => {
                        fetchChatMessages(selectedContact.id); // Загружаем обновлённые сообщения
                    }
                );
            }
        });

        setStompClient(stompClientInstance);

        return () => {
            if (stompClientInstance) {
                stompClientInstance.disconnect();
                console.log("Disconnected from WebSocket");
            }
        };
    }, [selectedContact]);

    const handleSettingsClick = () => {
        setIsSettingsView(true);
    };

    const handleHomeClick = () => {
        setIsSettingsView(false);
    };

    const handleTabChange = (tab) => {
        setActiveTab(tab);
    };

    const fetchChatMessages = async (contactId) => {
        try {
            const messages = await getChatMessages(contactId);
            setChatMessages(messages);
        } catch (error) {
            console.error('Failed to fetch chat messages:', error);
        }
    };

    const handleContactChange = (contact) => {
        if (contact.id !== selectedContact?.id) {
            setAnimationClass("fade-out");
            setTimeout(() => {
                setTempContact(contact);
                setAnimationClass("fade-in");
                setTimeout(() => {
                    setSelectedContact(contact);
                    fetchChatMessages(contact.id);
                    setAnimationClass("");
                }, 50);
            }, 200);
        }
    };

    const handleFieldChange = async (field, value) => {
        const updatedContact = { ...tempContact, [field]: value };
        setTempContact(updatedContact);
        setSelectedContact(updatedContact);

        try {
            await updateContact(tempContact.id, updatedContact);
            console.log("Contact updated successfully!");

            const updatedContacts = await getContacts();
            setContacts(updatedContacts);
        } catch (error) {
            console.error("Failed to update contact:", error);
            alert("Ошибка при обновлении данных!");
        }
    };

    const handleSendMessage = async () => {
        if (!newMessage.trim()) return;

        const message = {
            message: newMessage,
            side: "user", // Отправка сообщения от пользователя
            timestamp: new Date().toISOString(),
            contactId: selectedContact.id,
        };

        try {
            // Сохраняем сообщение в локальной базе
            const sentMessage = await addChatMessage(message);

            // Отправляем сообщение через Telegram API
            await sendMessageToTelegram(selectedContact.id, newMessage);

            // Обновляем локальный список сообщений
            setChatMessages([...chatMessages, sentMessage]);
            setNewMessage('');
        } catch (error) {
            console.error('Failed to send message:', error);
            alert('Failed to send message. Please try again.');
        }
    };

    useEffect(() => {
        const fetchContacts = async () => {
            try {
                const data = await getContacts();
                setContacts(data);
                if (data.length > 0) {
                    setSelectedContact(data[0]);
                    setTempContact(data[0]);
                    fetchChatMessages(data[0].id);
                }
                setLoading(false);
            } catch (error) {
                console.error('Failed to fetch contacts:', error);
                setLoading(false);
            }
        };

        fetchContacts();
    }, []);

    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [chatMessages]);

    // Fetch users when the "Пользователи" tab is active
    useEffect(() => {
        if (isSettingsView && activeTab === "users") {
            fetchUsers();
        }
    }, [isSettingsView, activeTab]);

    const fetchUsers = async () => {
        setUsersLoading(true);
        setError(null);
        try {
            const data = await getUsers();
            setUsers(data);
        } catch (err) {
            console.error("Failed to fetch users:", err);
            setError("Не удалось загрузить список пользователей.");
        } finally {
            setUsersLoading(false);
        }
    };

    const handleUserUpdate = async (userId, field, value) => {
        try {
            const updatedData = { [field]: value }; // Передаём только изменённое поле
            const response = await updateUser(userId, updatedData); // Вызываем API для обновления

            if (response.ok) {
                // Если запрос успешен
                setUsers(
                    users.map((user) =>
                        user.id === userId ? { ...user, [field]: value } : user
                    )
                );
                alert("Пользователь успешно обновлён!");
            } else {
                // Если запрос не успешен, например, 404
                await fetchUsers();
            }
        } catch (err) {
            await fetchUsers();
        }
    };


    const handleUserDelete = async (userId) => {
        if (!window.confirm("Вы уверены, что хотите удалить этого пользователя?")) return;
        try {
            await deleteUser(userId);
            // Обновить локальное состояние
            setUsers(users.filter(user => user.id !== userId));
            alert("Пользователь успешно удален!");
        } catch (err) {
            console.error("Failed to delete user:", err);
            alert("Не удалось удалить пользователя.");
        }
    };

    // If data is still loading, show "Loading..."
    if (loading) {
        return <div>Loading...</div>;
    }

    return (
        <div className="dashboard">
            {/* Sidebar */}
            <aside className={`sidebar ${isSettingsView ? 'sidebar-settings-view' : ''}`}>
                <div className={`left ${isSettingsView ? 'left-settings-view' : ''}`}>
                    <div className="logo">
                        <img src={logoImg} className="icon" alt="logotype" />
                    </div>
                    <nav className="menu">
                        <button
                            className={`menu-item ${isSettingsView ? 'active' : ''}`}
                            onClick={handleSettingsClick}
                        >
                            <img src={settingsImg} className="settings" alt="settings" />
                        </button>
                        <button
                            className={`menu-item ${!isSettingsView ? 'active' : ''}`}
                            onClick={handleHomeClick}
                        >
                            <img src={homeImg} className="home" alt="home" />
                        </button>
                    </nav>
                    <div className="avatar">
                        <img src={userAvatar} alt="User Avatar" />
                    </div>
                </div>
                <div className="right">
                    {/* Display the contacts block only if contacts exist */}
                    {contacts.length > 0 ? (
                        <section className="worklist">
                            <div className="worklist-header">
                                <div className="square"></div>
                                <h2 className="worklist-title">Worklist</h2>
                            </div>

                            <div className="contact-list">
                                {contacts.map((contact) => (
                                    <div
                                        key={contact.id}
                                        className={`contact ${contact.id === selectedContact?.id ? "active" : ""}`}
                                        onClick={() => handleContactChange(contact)}
                                    >
                                        <div className="contact-list-top">
                                            <img
                                                src={contact.image || avatarImg}
                                                alt={contact.name}
                                                className="contact-img"
                                            />
                                            <div className="contact-info">
                                                <h3>{contact.name}</h3>
                                                <p>{contact.profession}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    ) : (
                        <div className="no-contacts">
                            <p>No contacts available.</p>
                        </div>
                    )}
                </div>
            </aside>

            {!isSettingsView ? (
                selectedContact ? ( // Check if selectedContact exists
                    <section className={`chat-section ${animationClass}`}>
                        <div className="chat-info">
                            <img
                                src={tempContact.image || avatarImg}
                                alt={tempContact.name}
                                className="chat-info-img"
                            />
                            <div className="chat-info-text">
                                <h2 className="name">{tempContact.name}</h2>
                                <p className="profession" onClick={() => {
                                    const newProfession = prompt("Enter new profession:", tempContact.profession);
                                    if (newProfession) handleFieldChange("profession", newProfession);
                                }}>{tempContact.profession}</p>
                                <p className="address" onClick={() => {
                                    const newAddress = prompt("Enter new address:", tempContact.address);
                                    if (newAddress) handleFieldChange("address", newAddress);
                                }}>{tempContact.address}</p>
                                <p className="email" onClick={() => {
                                    const newEmail = prompt("Enter new email:", tempContact.email);
                                    if (newEmail) handleFieldChange("email", newEmail);
                                }}>{tempContact.email}</p>
                                <p className="phone">{tempContact.phone}</p>
                            </div>
                        </div>
                        <div className="chat-header">
                            <nav className="call-button">
                                <img src={callImg} className="icon" alt="Call"/>
                            </nav>
                            <nav className="message-button">
                                <img src={messageImg} className="icon" alt="Message"/>
                            </nav>
                            <nav className="mail-button">
                                <img src={mailImg} className="icon" alt="Mail"/>
                            </nav>
                        </div>
                        <div className="chat-body" ref={chatContainerRef}>
                            {chatMessages.length > 0 ? (
                                chatMessages.map((msg) => (
                                    <div
                                        key={msg.id}
                                        className={`message ${
                                            msg.side === "user" ? "user-message" : "reply-message"
                                        }`}
                                    >
                                        {msg.message.startsWith("https://") ? (
                                            <img src={msg.message} alt="User sent" className="chat-image" />
                                        ) : (
                                            <p>{msg.message}</p>
                                        )}
                                    </div>
                                ))
                            ) : (
                                <p>No messages yet. Start the conversation!</p>
                            )}
                        </div>

                        <div className="chat-footer">
                            <input
                                type="text"
                                placeholder="Enter a message..."
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                            />
                            <button className="send-button-chat" onClick={handleSendMessage}>
                                <img src={sendImg} alt="Send Message"/>
                            </button>
                        </div>
                    </section>
                ) : (
                    <div className="no-selected-contact">
                        <p>Please select a contact to start chatting.</p>
                    </div>
                )
            ) : (
                <section
                    className={`settings-section ${isSettingsView ? 'settings-visible' : ''}`}
                >
                    <div className="settings-container">
                        <div className="settings-header">
                            <h2>Настройки</h2>
                            <nav className="settings-header-tabs">
                                <button
                                    className={`settings-tab ${activeTab === "profile" ? "active" : ""}`}
                                    onClick={() => handleTabChange("profile")}
                                >
                                    <p>Мой профиль</p>
                                </button>
                                <button
                                    className={`settings-tab ${activeTab === "users" ? "active" : ""}`}
                                    onClick={() => handleTabChange("users")}
                                >
                                    <p>Пользователи</p>
                                </button>
                                <button
                                    className="settings-tab"
                                    onClick={() => {
                                        localStorage.removeItem('token');
                                        window.location.href = '/login';
                                    }}
                                >
                                    <p>Выйти</p>
                                </button>
                            </nav>
                        </div>
                        {activeTab === "profile" ? (
                            <div className="settings-content settings-profile">
                                <img src={userAvatar} alt="User Profile" className="settings-profile-avatar" />
                                <div className="settings-profile-info">
                                    <h2>Кузнецов Александр Викторович</h2>
                                    <p>Роль: Администратор</p>
                                    <button className="settings-profile-button">
                                        <p>Изменить фото</p>
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="settings-content settings-users">
                                <h3>Пользователи</h3>
                                <p>Список пользователей и управление доступом.</p>
                                {usersLoading ? (
                                    <p>Загрузка пользователей...</p>
                                ) : error ? (
                                    <p className="error">{error}</p>
                                ) : (
                                    <table className="users-table">
                                        <thead>
                                        <tr>
                                            <th>Имя</th>
                                            <th>Роль</th>
                                            <th>Действия</th>
                                        </tr>
                                        </thead>
                                        <tbody>
                                        {users.map(user => (
                                            <tr key={user.id}>
                                                <td>
                                                    <div className="user-info">
                                                        <img src={user.imageUrl || avatarImg} alt={user.name} className="user-avatar" />
                                                        <span>{user.username}</span>
                                                    </div>
                                                </td>
                                                <td>
                                                    <select
                                                        value={user.role}
                                                        onChange={(e) => handleUserUpdate(user.id, 'role', e.target.value)}
                                                    >
                                                        <option value="admin">Администратор</option>
                                                        <option value="user">Пользователь</option>
                                                    </select>
                                                </td>
                                                <td>
                                                    <button
                                                        className="delete-button"
                                                        onClick={() => handleUserDelete(user.id)}
                                                    >
                                                        Удалить
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        )}
                    </div>
                </section>
            )}
        </div>
    );

};

export default Dashboard;
