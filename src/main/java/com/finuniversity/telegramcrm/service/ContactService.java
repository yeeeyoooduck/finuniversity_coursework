package com.finuniversity.telegramcrm.service;

import com.finuniversity.telegramcrm.model.Contact;
import com.finuniversity.telegramcrm.repository.ContactRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

@Component
public class ContactService {

    @Autowired
    private ContactRepository contactRepository;

    public void saveContact(Contact contact) {
        contactRepository.save(contact);
    }
}
