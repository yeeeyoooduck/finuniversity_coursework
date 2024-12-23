package com.finuniversity.telegramcrm.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

@Controller
public class ChatWebSocketController {

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    // Метод для отправки уведомлений через WebSocket
    public void sendChatUpdate(Long contactId) {
        messagingTemplate.convertAndSend("/topic/chats/" + contactId, "update");
    }
}
