package com.test.ordernotification.infrastructure.websocket;

import com.test.ordernotification.infrastructure.security.JwtService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class WebSocketJwtChannelInterceptor implements ChannelInterceptor {

    private static final Logger log = LoggerFactory.getLogger(WebSocketJwtChannelInterceptor.class);

    private final JwtService jwtService;

    public WebSocketJwtChannelInterceptor(JwtService jwtService) {
        this.jwtService = jwtService;
    }

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
        if (accessor == null) {
            return message;
        }

        if (StompCommand.CONNECT.equals(accessor.getCommand())) {
            authenticateConnect(accessor);
        } else if (StompCommand.SUBSCRIBE.equals(accessor.getCommand())) {
            authorizeVendorSubscription(accessor);
        }

        return message;
    }

    private void authenticateConnect(StompHeaderAccessor accessor) {
        String authHeader = accessor.getFirstNativeHeader("Authorization");
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            log.warn("[WebSocket] Rejected STOMP CONNECT: missing Bearer token");
            throw new AccessDeniedException("Missing WebSocket Bearer token");
        }

        String token = authHeader.substring(7);
        if (!jwtService.validateToken(token)) {
            log.warn("[WebSocket] Rejected STOMP CONNECT: invalid or expired token");
            throw new AccessDeniedException("Invalid or expired WebSocket token");
        }

        String vendorId = jwtService.extractVendorId(token);
        if (vendorId == null || vendorId.isBlank()) {
            throw new AccessDeniedException("WebSocket token has no vendorId");
        }

        UsernamePasswordAuthenticationToken authentication =
                new UsernamePasswordAuthenticationToken(
                        vendorId,
                        null,
                        List.of(new SimpleGrantedAuthority("ROLE_VENDOR"))
                );
        accessor.setUser(authentication);
        log.info("[WebSocket] Authenticated STOMP client for vendorId={}", vendorId);
    }

    private void authorizeVendorSubscription(StompHeaderAccessor accessor) {
        if (!(accessor.getUser() instanceof UsernamePasswordAuthenticationToken authentication)) {
            throw new AccessDeniedException("Unauthenticated WebSocket subscription");
        }

        String destination = accessor.getDestination();
        String expectedDestination = "/topic/vendor/" + authentication.getName() + "/orders";
        if (destination == null || !destination.equals(expectedDestination)) {
            log.warn(
                    "[WebSocket] Vendor {} attempted unauthorized subscription to {}",
                    authentication.getName(),
                    destination
            );
            throw new AccessDeniedException("WebSocket subscription is not authorized for this vendor");
        }
    }
}
