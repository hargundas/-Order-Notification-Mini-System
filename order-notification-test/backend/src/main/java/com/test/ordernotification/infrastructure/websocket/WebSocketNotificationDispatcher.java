package com.test.ordernotification.infrastructure.websocket;

import com.test.ordernotification.api.dto.OrderResponse;
import com.test.ordernotification.api.facade.OrderFacade;
import com.test.ordernotification.domain.model.Order;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionConnectedEvent;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

@Component
public class WebSocketNotificationDispatcher {

    private static final Logger log = LoggerFactory.getLogger(WebSocketNotificationDispatcher.class);

    private final SimpMessagingTemplate messagingTemplate;
    private final OrderFacade orderFacade;

    public WebSocketNotificationDispatcher(SimpMessagingTemplate messagingTemplate, OrderFacade orderFacade) {
        this.messagingTemplate = messagingTemplate;
        this.orderFacade = orderFacade;
    }

    /**
     * Broadcasts order payload to the vendor's dedicated STOMP topic:
     * destination: /topic/vendor/{vendorId}/orders
     */
    public void dispatchOrderToVendor(Order order) {
        String destination = "/topic/vendor/" + order.vendorId() + "/orders";
        OrderResponse payload = orderFacade.toResponseDto(order);

        log.info("[WebSocketDispatcher] Dispatching order {} [status={}] to {}", order.id(), order.status(), destination);
        messagingTemplate.convertAndSend(destination, payload);
    }

    @EventListener
    public void handleWebSocketConnectListener(SessionConnectedEvent event) {
        log.info("[WebSocket] New client connected: session={}", event.getMessage().getHeaders().get("simpSessionId"));
    }

    @EventListener
    public void handleWebSocketDisconnectListener(SessionDisconnectEvent event) {
        log.info("[WebSocket] Client disconnected: session={}", event.getSessionId());
    }
}
