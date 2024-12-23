package com.finuniversity.telegramcrm.controller;

import com.finuniversity.telegramcrm.model.Contact;
import com.finuniversity.telegramcrm.repository.ContactRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/contacts")
public class ContactController {

    @Autowired
    private ContactRepository contactRepository;

    @GetMapping
    public List<Contact> getAllContacts() {
        return contactRepository.findAll().stream()
                .sorted((c1, c2) -> c1.getId().compareTo(c2.getId())) // Сортировка по id
                .collect(Collectors.toList());
    }

    @PutMapping("/{id}")
    public Contact updateContact(@PathVariable Long id, @RequestBody Contact updatedContact) {
        Optional<Contact> optionalContact = contactRepository.findById(id);
        if (optionalContact.isPresent()) {
            Contact contact = optionalContact.get();
            contact.setProfession(updatedContact.getProfession());
            contact.setAddress(updatedContact.getAddress());
            contact.setEmail(updatedContact.getEmail());
            return contactRepository.save(contact);
        } else {
            throw new RuntimeException("Contact not found with id " + id);
        }
    }
}
