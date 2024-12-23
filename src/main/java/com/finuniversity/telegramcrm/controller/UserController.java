package com.finuniversity.telegramcrm.controller;

import com.finuniversity.telegramcrm.model.User;
import com.finuniversity.telegramcrm.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/users")
public class UserController {

    @Autowired
    private UserRepository userRepository;

    // Получить всех пользователей
    @GetMapping
    public ResponseEntity<List<User>> getAllUsers() {
        List<User> users = userRepository.findAll();
        return ResponseEntity.ok(users);
    }

    // Получить пользователя по ID
    @GetMapping("/{id}")
    public ResponseEntity<?> getUserById(@PathVariable Long id) {
        Optional<User> user = userRepository.findById(id);
        if (user.isPresent()) {
            return ResponseEntity.ok(user.get());
        } else {
            return ResponseEntity.status(404).body("Пользователь не найден");
        }
    }

    // Обновить пользователя
    @PutMapping("/{id}")
    public ResponseEntity<?> updateUser(@PathVariable Long id, @RequestBody User updatedData) {
        Optional<User> userOptional = userRepository.findById(id);
        if (userOptional.isPresent()) {
            User user = userOptional.get();

            // Меняем только роль, остальные поля остаются без изменений
            if (updatedData.getRole() != null) {
                user.setRole(updatedData.getRole());
            }

            // Сохраняем пользователя
            userRepository.save(user);

            // Возвращаем успешное сообщение
            return ResponseEntity.ok("Роль пользователя успешно обновлена");
        } else {
            // Возвращаем ошибку, если пользователь не найден
            return ResponseEntity.status(404).body("Пользователь не найден");
        }
    }



    // Удалить пользователя
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteUser(@PathVariable Long id) {
        Optional<User> userOptional = userRepository.findById(id);
        if (userOptional.isPresent()) {
            userRepository.deleteById(id);
            return ResponseEntity.ok("Пользователь удалён");
        } else {
            return ResponseEntity.status(404).body("Пользователь не найден");
        }
    }
}
