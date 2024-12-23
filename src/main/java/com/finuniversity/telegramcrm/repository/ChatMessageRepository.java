package com.finuniversity.telegramcrm.repository;

import com.finuniversity.telegramcrm.model.ChatMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {
    List<ChatMessage> findByContactIdOrderByTimestampAsc(Long contactId);
    List<ChatMessage> findByContactIdOrderByIdAsc(Long contactId);
}
