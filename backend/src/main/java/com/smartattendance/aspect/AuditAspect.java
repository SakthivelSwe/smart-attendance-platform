package com.smartattendance.aspect;

import com.smartattendance.annotation.Audit;
import com.smartattendance.entity.AuditLog;
import com.smartattendance.repository.AuditLogRepository;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.aspectj.lang.JoinPoint;
import org.aspectj.lang.annotation.AfterReturning;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.reflect.MethodSignature;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.lang.reflect.Method;
import java.util.Arrays;

@Aspect
@Component
@RequiredArgsConstructor
public class AuditAspect {

    private final AuditLogRepository auditLogRepository;

    @AfterReturning(pointcut = "@annotation(com.smartattendance.annotation.Audit)", returning = "result")
    public void logAuditActivity(JoinPoint joinPoint, Object result) {
        MethodSignature signature = (MethodSignature) joinPoint.getSignature();
        Method method = signature.getMethod();
        Audit auditAnnotation = method.getAnnotation(Audit.class);

        String action = auditAnnotation.action();
        String username = getCurrentUsername();
        String ipAddress = getClientIp();

        // Extract arguments for details (be cautious with PII or large objects)
        String details = "Method execution: " + method.getName();
        if (joinPoint.getArgs().length > 0) {
            String argsStr = Arrays.toString(joinPoint.getArgs());
            // truncate if too long
            if (argsStr.length() > 200) {
                argsStr = argsStr.substring(0, 197) + "...";
            }
            details += " | Args: " + argsStr;
        }

        AuditLog auditLog = AuditLog.builder()
                .actionType(action)
                .username(username)
                .ipAddress(ipAddress)
                .details(details)
                .build();

        auditLogRepository.save(auditLog);
    }

    private String getCurrentUsername() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated() && !auth.getPrincipal().equals("anonymousUser")) {
            return auth.getName();
        }
        return "SYSTEM";
    }

    private String getClientIp() {
        try {
            ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder
                    .getRequestAttributes();
            if (attributes != null) {
                HttpServletRequest request = attributes.getRequest();
                String ip = request.getHeader("X-Forwarded-For");
                if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
                    ip = request.getHeader("Proxy-Client-IP");
                }
                if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
                    ip = request.getRemoteAddr();
                }
                return ip;
            }
        } catch (Exception e) {
            // Ignore if not in a request context
        }
        return "UNKNOWN";
    }
}
