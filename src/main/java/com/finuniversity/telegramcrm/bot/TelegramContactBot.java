package com.finuniversity.telegramcrm.bot;

import com.finuniversity.telegramcrm.controller.ChatWebSocketController;
import com.finuniversity.telegramcrm.model.ChatMessage;
import com.finuniversity.telegramcrm.model.Contact;
import com.finuniversity.telegramcrm.repository.ContactRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.telegram.telegrambots.bots.TelegramLongPollingBot;
import org.telegram.telegrambots.meta.api.methods.GetFile;
import org.telegram.telegrambots.meta.api.methods.GetUserProfilePhotos;
import org.telegram.telegrambots.meta.api.methods.send.SendPhoto;
import org.telegram.telegrambots.meta.api.objects.File;
import org.telegram.telegrambots.meta.api.objects.InputFile;
import org.telegram.telegrambots.meta.api.objects.Update;
import org.telegram.telegrambots.meta.api.objects.UserProfilePhotos;
import org.telegram.telegrambots.meta.exceptions.TelegramApiException;
import org.telegram.telegrambots.meta.api.methods.send.SendMessage;
import org.springframework.stereotype.Component;
import com.finuniversity.telegramcrm.repository.ChatMessageRepository;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Component
public class TelegramContactBot extends TelegramLongPollingBot {

    @Autowired
    private ContactRepository contactRepository; // Внедрение ContactRepository

    @Autowired
    private ChatMessageRepository chatMessageRepository; // Для работы с сообщениями

    @Autowired
    private ChatWebSocketController chatWebSocketController;

    @Override
    public void onUpdateReceived(Update update) {
        if (update.hasMessage()) {
            if (update.getMessage().hasText()) {
                saveContactAndMessage(update);
            }

            if (update.getMessage().hasContact()) {
                saveUserContact(update);
            }

            if (update.getMessage().hasPhoto()) {
                savePhotoMessage(update);
            }

            Long chatId = update.getMessage().getChatId();
            chatWebSocketController.sendChatUpdate(chatId);
        }
    }

    @Transactional
    protected void savePhotoMessage(Update update) {
        if (update.hasMessage() && update.getMessage().hasPhoto()) {
            Long chatId = update.getMessage().getChatId();

            // Получение самого большого фото (максимального размера)
            var photos = update.getMessage().getPhoto();
            var largestPhoto = photos.stream().max((p1, p2) -> Long.compare(p1.getFileSize(), p2.getFileSize())).orElse(null);

            if (largestPhoto != null) {
                try {
                    // Получение пути к файлу фотографии
                    String fileId = largestPhoto.getFileId();
                    GetFile getFile = new GetFile();
                    getFile.setFileId(fileId);
                    org.telegram.telegrambots.meta.api.objects.File file = execute(getFile);

                    // Генерация URL для загрузки фотографии
                    String fileUrl = "https://api.telegram.org/file/bot" + getBotToken() + "/" + file.getFilePath();

                    // Сохранение фотографии в базе данных
                    ChatMessage chatMessage = new ChatMessage();
                    chatMessage.setMessage(fileUrl); // Сохраняем URL фото как сообщение
                    chatMessage.setSide("reply"); // Указываем, что это сообщение от пользователя
                    chatMessage.setTimestamp(LocalDateTime.now());
                    chatMessage.setContactId(chatId);

                    chatMessageRepository.save(chatMessage);

                    System.out.println("Фотография сохранена: " + fileUrl);
                } catch (TelegramApiException e) {
                    System.err.println("Ошибка при обработке фотографии: " + e.getMessage());
                }
            }
        }
    }


    @Transactional
    protected void saveUserContact(Update update) {
        if (update.hasMessage() && update.getMessage().hasContact()) {
            Long chatId = update.getMessage().getChatId();
            String phoneNumber = update.getMessage().getContact().getPhoneNumber();
            String firstName = update.getMessage().getContact().getFirstName();
            String lastName = update.getMessage().getContact().getLastName();

            // Проверяем, существует ли контакт
            Contact contact = contactRepository.findById(chatId).orElseGet(() -> {
                Contact newContact = new Contact();
                newContact.setId(chatId);
                newContact.setName(firstName + " " + lastName);
                newContact.setPhone(phoneNumber); // Сохраняем телефон
                contactRepository.save(newContact);
                return newContact;
            });

            // Если контакт уже существует, обновляем его номер телефона
            if (contact.getPhone() == null || !contact.getPhone().equals(phoneNumber)) {
                contact.setPhone(phoneNumber);
                contactRepository.save(contact); // Обновляем в базе
                System.out.println("Телефон пользователя сохранён: " + phoneNumber);
            }
        }
    }


    private String getUserProfilePhoto(Long chatId) {
        try {
            // Получение фотографий профиля пользователя
            GetUserProfilePhotos getUserProfilePhotos = new GetUserProfilePhotos();
            getUserProfilePhotos.setUserId((long) chatId.intValue());
            getUserProfilePhotos.setLimit(1); // Получаем только первую (основную) фотографию

            UserProfilePhotos photos = execute(getUserProfilePhotos);

            if (photos != null && !photos.getPhotos().isEmpty()) {
                // Получение файла первой фотографии
                String fileId = photos.getPhotos().get(0).get(0).getFileId();
                GetFile getFile = new GetFile();
                getFile.setFileId(fileId);

                File file = execute(getFile);

                // URL для загрузки фотографии
                return "https://api.telegram.org/file/bot" + getBotToken() + "/" + file.getFilePath();
            }
        } catch (TelegramApiException e) {
            System.err.println("Не удалось получить фотографию профиля: " + e.getMessage());
        }
        return null; // Возвращаем null, если фото недоступно
    }


    protected void saveContactAndMessage(Update update) {
        if (update.hasMessage() && update.getMessage().getChat() != null) {
            Long chatId = update.getMessage().getChatId();
            String username = update.getMessage().getChat().getUserName();
            String firstName = update.getMessage().getChat().getFirstName();
            String lastName = update.getMessage().getChat().getLastName();
            String messageText = update.getMessage().getText();

            Contact contact = contactRepository.findById(chatId).orElseGet(() -> {
                Contact newContact = new Contact();
                newContact.setId(chatId);
                newContact.setName(username != null ? username : firstName + " " + lastName);

                // Получаем фотографию пользователя
                String photoUrl = getUserProfilePhoto(chatId);
                if (photoUrl != null) {
                    newContact.setImage(photoUrl);
                    System.out.println("Фотография профиля пользователя сохранена: " + photoUrl);
                } else {
                    System.out.println("У пользователя нет фотографии профиля.");
                }

                contactRepository.save(newContact);
                return newContact;
            });

            ChatMessage chatMessage = new ChatMessage();
            chatMessage.setMessage(messageText);
            chatMessage.setSide("reply");
            chatMessage.setTimestamp(java.time.LocalDateTime.now());
            chatMessage.setContactId(contact.getId());
            chatMessageRepository.save(chatMessage);
        }
    }

    public void sendPhotoToUser(Long chatId, String photoUrl, String caption) {
        try {
            SendPhoto sendPhoto = new SendPhoto();
            sendPhoto.setChatId(chatId.toString());
            sendPhoto.setPhoto(new InputFile(photoUrl)); // URL или файл
            sendPhoto.setCaption(caption); // Подпись к фотографии, если есть

            execute(sendPhoto); // Отправляем фотографию
            System.out.println("Фотография успешно отправлена пользователю: " + chatId);
        } catch (TelegramApiException e) {
            System.err.println("Ошибка при отправке фотографии: " + e.getMessage());
        }
    }



    @Override
    public String getBotUsername() {
        return "coursework_alexander_bot"; // Имя бота
    }

    @Override
    public String getBotToken() {
        return "7925918213:AAEypRCOElJfkMO8TVuNjxntik96bUZuZzA"; // Токен, полученный у BotFather
    }
}
