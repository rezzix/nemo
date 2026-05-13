package com.nemo.common.activity;

import com.nemo.security.CustomUserDetails;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

@Component
public class ActivityInterceptor implements HandlerInterceptor {

    private static final Logger log = LoggerFactory.getLogger(ActivityInterceptor.class);
    private static final String START_TIME_ATTR = "activityStartTime";

    private final ActivityLogRepository repository;

    public ActivityInterceptor(ActivityLogRepository repository) {
        this.repository = repository;
    }

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        request.setAttribute(START_TIME_ATTR, System.currentTimeMillis());
        return true;
    }

    @Override
    public void afterCompletion(HttpServletRequest request, HttpServletResponse response, Object handler, Exception ex) {
        try {
            Long startTime = (Long) request.getAttribute(START_TIME_ATTR);
            long duration = startTime != null ? System.currentTimeMillis() - startTime : 0;

            String username = resolveUsername();
            String method = request.getMethod();
            String path = request.getRequestURI();
            String ip = resolveIp(request);

            ActivityLog activityLog = new ActivityLog();
            activityLog.setUsername(username);
            activityLog.setMethod(method);
            activityLog.setPath(path);
            activityLog.setStatus(response.getStatus());
            activityLog.setIp(ip);
            activityLog.setDuration(duration);

            repository.save(activityLog);
        } catch (Exception e) {
            log.warn("Failed to save activity log: {}", e.getMessage());
        }
    }

    private String resolveUsername() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated() && auth.getPrincipal() instanceof CustomUserDetails details) {
            return details.getUsername();
        }
        if (auth != null && auth.isAuthenticated() && auth.getPrincipal() instanceof org.springframework.security.core.userdetails.User user) {
            return user.getUsername();
        }
        return "unauthenticated";
    }

    private String resolveIp(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            return forwarded.split(",")[0].trim();
        }
        String realIp = request.getHeader("X-Real-IP");
        if (realIp != null && !realIp.isBlank()) {
            return realIp.trim();
        }
        return request.getRemoteAddr();
    }
}