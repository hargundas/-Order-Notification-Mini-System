package com.test.ordernotification;

import com.test.ordernotification.infrastructure.security.JwtService;
import com.test.ordernotification.infrastructure.websocket.WebSocketJwtChannelInterceptor;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.MessageBuilder;
import org.springframework.security.access.AccessDeniedException;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.mock;

class WebSocketJwtChannelInterceptorTest {

    private static final String SECRET =
            "404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970";

    private WebSocketJwtChannelInterceptor interceptor;
    private JwtService jwtService;
    private MessageChannel channel;

    @BeforeEach
    void setUp() {
        jwtService = new JwtService(SECRET, 2);
        interceptor = new WebSocketJwtChannelInterceptor(jwtService);
        channel = mock(MessageChannel.class);
    }

    @Test
    @DisplayName("STOMP CONNECT requires a Bearer token")
    void connectWithoutTokenIsRejected() {
        Message<byte[]> message = stompMessage(StompCommand.CONNECT, null, null, null);

        assertThrows(AccessDeniedException.class, () -> interceptor.preSend(message, channel));
    }

    @Test
    @DisplayName("Valid JWT authenticates the STOMP session as its vendor")
    void connectWithValidTokenSetsVendorPrincipal() {
        String token = jwtService.generateToken("vendor@test.com", "vendor-123");
        Message<byte[]> message = stompMessage(
                StompCommand.CONNECT,
                "Bearer " + token,
                null,
                null
        );

        interceptor.preSend(message, channel);

        StompHeaderAccessor accessor = StompHeaderAccessor.wrap(message);
        assertNotNull(accessor.getUser());
        assertEquals("vendor-123", accessor.getUser().getName());
    }

    @Test
    @DisplayName("Vendor may subscribe only to its own order topic")
    void vendorSubscriptionIsScopedToAuthenticatedVendor() {
        var principal = new org.springframework.security.authentication.UsernamePasswordAuthenticationToken(
                "vendor-123",
                null
        );
        Message<byte[]> ownTopic = stompMessage(
                StompCommand.SUBSCRIBE,
                null,
                "/topic/vendor/vendor-123/orders",
                principal
        );
        Message<byte[]> otherTopic = stompMessage(
                StompCommand.SUBSCRIBE,
                null,
                "/topic/vendor/vendor-456/orders",
                principal
        );

        interceptor.preSend(ownTopic, channel);
        assertThrows(AccessDeniedException.class, () -> interceptor.preSend(otherTopic, channel));
    }

    private Message<byte[]> stompMessage(
            StompCommand command,
            String authorization,
            String destination,
            java.security.Principal user
    ) {
        StompHeaderAccessor accessor = StompHeaderAccessor.create(command);
        accessor.setLeaveMutable(true);
        if (authorization != null) {
            accessor.setNativeHeader("Authorization", authorization);
        }
        if (destination != null) {
            accessor.setDestination(destination);
        }
        if (user != null) {
            accessor.setUser(user);
        }
        return MessageBuilder.createMessage(new byte[0], accessor.getMessageHeaders());
    }
}

