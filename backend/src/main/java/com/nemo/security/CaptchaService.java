package com.nemo.security;

import jakarta.servlet.http.HttpSession;
import org.springframework.stereotype.Service;

import java.util.Random;

@Service
public class CaptchaService {

    private static final Random RANDOM = new Random();
    private static final String SESSION_KEY = "CAPTCHA_ANSWER";

    public record CaptchaChallenge(String question, int answer) {}

    public CaptchaChallenge generate(HttpSession session) {
        int a = 1 + RANDOM.nextInt(20);
        int b = 1 + RANDOM.nextInt(20);
        int op = RANDOM.nextInt(3);
        String operator;
        int answer;
        switch (op) {
            case 0 -> { operator = "+"; answer = a + b; }
            case 1 -> { operator = "−"; answer = a - b; }
            default -> { operator = "×"; answer = a * b; }
        }
        String question = a + " " + operator + " " + b;
        session.setAttribute(SESSION_KEY, answer);
        return new CaptchaChallenge(question, answer);
    }

    public boolean verify(HttpSession session, String userInput) {
        Object stored = session.getAttribute(SESSION_KEY);
        session.removeAttribute(SESSION_KEY);
        if (stored == null) return false;
        try {
            return Integer.parseInt(userInput.trim()) == (int) stored;
        } catch (NumberFormatException e) {
            return false;
        }
    }
}