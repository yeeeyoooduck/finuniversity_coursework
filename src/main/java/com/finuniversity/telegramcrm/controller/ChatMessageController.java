package com.finuniversity.telegramcrm.controller;

import com.finuniversity.telegramcrm.model.ChatMessage;
import com.finuniversity.telegramcrm.repository.ChatMessageRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/chats")
public class ChatMessageController {

    @Autowired
    private ChatMessageRepository chatMessageRepository;

    @Autowired
    private ChatWebSocketController chatWebSocketController;

    @Value("${telegram.bot.token}") // Укажите токен в application.properties
    private String botToken;

    private static final String TELEGRAM_SEND_URL = "https://api.telegram.org/bot{token}/sendMessage";

    @GetMapping("/{contactId}")
    public List<ChatMessage> getMessagesByContact(@PathVariable Long contactId) {
        return chatMessageRepository.findByContactIdOrderByIdAsc(contactId);
    }

    @PostMapping
    public ChatMessage addMessage(@RequestBody ChatMessage chatMessage) {
        ChatMessage savedMessage = chatMessageRepository.save(chatMessage);

        // Отправка уведомления через WebSocket
        chatWebSocketController.sendChatUpdate(chatMessage.getContactId());

        return savedMessage;
    }


    @PostMapping("/send")
    public ResponseEntity<?> sendMessageToTelegram(@RequestBody Map<String, String> payload) {
        String chatId = payload.get("chatId");
        String message = payload.get("message");

        if (chatId == null || message == null) {
            return ResponseEntity.badRequest().body("chatId and message are required.");
        }

        try {
            RestTemplate restTemplate = new RestTemplate();
            String url = TELEGRAM_SEND_URL.replace("{token}", botToken);

            Map<String, String> body = Map.of(
                    "chat_id", chatId,
                    "text", message
            );

            restTemplate.postForEntity(url, body, String.class);
            return ResponseEntity.ok("Message sent successfully");
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Failed to send message: " + e.getMessage());
        }
    }

}
