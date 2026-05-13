package com.nemo.common.audit;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.reflect.MethodSignature;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

@Aspect
@Component
public class AuditAspect {

    private final AuditLogRepository auditLogRepository;
    private final ObjectMapper objectMapper;

    public AuditAspect(AuditLogRepository auditLogRepository, ObjectMapper objectMapper) {
        this.auditLogRepository = auditLogRepository;
        this.objectMapper = objectMapper;
    }

    @Around("@annotation(audited)")
    public Object audit(ProceedingJoinPoint joinPoint, Audited audited) throws Throwable {
        Object result = joinPoint.proceed();

        try {
            Long userId = getCurrentUserId();
            Long entityId = extractEntityId(result);
            String newValue = serialize(result);

            AuditLog log = new AuditLog(
                audited.entityType(),
                entityId,
                audited.action(),
                null,
                newValue,
                userId
            );
            auditLogRepository.save(log);
        } catch (Exception e) {
            // Audit failure should not break the business operation
        }

        return result;
    }

    private Long getCurrentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof org.springframework.security.core.userdetails.User userDetails) {
            return Long.parseLong(userDetails.getUsername());
        }
        return null;
    }

    private Long extractEntityId(Object result) {
        if (result == null) return null;
        try {
            var method = result.getClass().getMethod("getId");
            var value = method.invoke(result);
            if (value instanceof Long l) return l;
            if (value instanceof Number n) return n.longValue();
        } catch (Exception ignored) {}
        return null;
    }

    private String serialize(Object obj) {
        try {
            return objectMapper.writeValueAsString(obj);
        } catch (Exception e) {
            return null;
        }
    }
}