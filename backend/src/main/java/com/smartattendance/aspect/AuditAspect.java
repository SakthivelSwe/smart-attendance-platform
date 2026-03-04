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
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
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

    private static final Logger logger = LoggerFactory.getLogger(AuditAspect.class);

    private final AuditLogRepository auditLogRepository;

    @AfterReturning(pointcut = "@annotation(auditAnnotation)", returning = "result")
    public void logAuditActivity(JoinPoint joinPoint, Object result, Audit auditAnnotation) {
        // Wrap in try-catch: audit logging must NEVER crash the actual business
        // operation
        try {
            MethodSignature signature = (MethodSignature) joinPoint.getSignature();
            Method method = signature.getMethod();

            String action = auditAnnotation.action();
            String username = getCurrentUsername();
            String ipAddress = getClientIp();

            String details = "Method execution: " + method.getName();
            if (joinPoint.getArgs().length > 0) {
                String argsStr = Arrays.toString(joinPoint.getArgs());
                if (argsStr.length() > 200) {
                    argsStr = argsStr.substring(0, 197) + "...";
                }
                details += " | Args: " + argsStr;
            }

            // Use setter-based construction to avoid Lombok builder dependency
            AuditLog auditLog = new AuditLog();
            auditLog.setActionType(action);
            auditLog.setUsername(username);
            auditLog.setIpAddress(ipAddress);
            auditLog.setDetails(details);

            auditLogRepository.save(auditLog);
        } catch (Exception e) {
            logger.warn("Failed to save audit log (non-fatal): {}", e.getMessage());
        }
    }

    private String getCurrentUsername() {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth != null && auth.isAuthenticated() && !auth.getPrincipal().equals("anonymousUser")) {
                return auth.getName();
            }
        } catch (Exception e) {
            // ignore
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
