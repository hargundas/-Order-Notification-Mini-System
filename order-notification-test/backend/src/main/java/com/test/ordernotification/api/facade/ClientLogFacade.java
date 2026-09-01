package com.test.ordernotification.api.facade;

import com.test.ordernotification.api.dto.ClientLogDto;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

@Component
public class ClientLogFacade {

    private static final Logger log = LoggerFactory.getLogger("CLIENT_LOGGER");

    public void processClientLog(ClientLogDto clientLog) {
        String level = clientLog.level() != null ? clientLog.level().toUpperCase() : "INFO";
        String event = clientLog.event() != null ? clientLog.event() : "GENERIC_EVENT";
        String message = clientLog.message() != null ? clientLog.message() : "";
        String details = clientLog.details() != null ? clientLog.details().toString() : "";

        switch (level) {
            case "WARN" -> log.warn("[CLIENT] [{}] {} - details: {}", event, message, details);
            case "ERROR" -> log.error("[CLIENT] [{}] {} - details: {}", event, message, details);
            case "DEBUG" -> log.debug("[CLIENT] [{}] {} - details: {}", event, message, details);
            default -> log.info("[CLIENT] [{}] {} - details: {}", event, message, details);
        }
    }
}
