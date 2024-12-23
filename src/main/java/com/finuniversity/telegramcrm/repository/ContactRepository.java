package com.finuniversity.telegramcrm.repository;

import com.finuniversity.telegramcrm.model.Contact;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ContactRepository extends JpaRepository<Contact, Long> {
    Optional<Contact> findByName(String name); // Поиск по имени
    Optional<Contact> findById(Long id); // Поиск по chatId (если используется)
}
