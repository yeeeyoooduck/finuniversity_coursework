package com.finuniversity.telegramcrm.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.telegram.telegrambots.meta.TelegramBotsApi;
import org.telegram.telegrambots.meta.exceptions.TelegramApiException;
import org.telegram.telegrambots.updatesreceivers.DefaultBotSession;
import com.finuniversity.telegramcrm.bot.TelegramContactBot;


@Configuration
public class TelegramBotConfig {

    @Bean
    public TelegramContactBot telegramContactBot() throws TelegramApiException {
        TelegramBotsApi botsApi = new TelegramBotsApi(DefaultBotSession.class);
        TelegramContactBot bot = new TelegramContactBot();
        botsApi.registerBot(bot);
        return bot;
    }
}
