package com.test.ordernotification.infrastructure.event;

import com.test.ordernotification.domain.event.OrderCreatedEvent;
import com.test.ordernotification.domain.event.OrderStatusUpdatedEvent;
import com.test.ordernotification.domain.model.Order;
import com.test.ordernotification.domain.service.NotificationService;
import com.test.ordernotification.infrastructure.firebase.FirebaseMessagingService;
import com.test.ordernotification.infrastructure.websocket.WebSocketNotificationDispatcher;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

/**
 * Event-Driven Notification Listener.
 *
 * <h2>CHALLENGE 1 RESOLUTION DETAILS</h2>
 * This listener decouples OrderService from NotificationService and transport mechanisms
 * (WebSocket / FCM). OrderService simply publishes domain events, and this listener receives
 * them independently, completely avoiding any circular dependencies without needing @Lazy proxies.
 */
@Component
public class OrderEventListener implements NotificationService {

    private static final Logger log = LoggerFactory.getLogger(OrderEventListener.class);

    private final WebSocketNotificationDispatcher wsDispatcher;
    private final FirebaseMessagingService fcmService;

    public OrderEventListener(
            WebSocketNotificationDispatcher wsDispatcher,
            FirebaseMessagingService fcmService
    ) {
        this.wsDispatcher = wsDispatcher;
        this.fcmService = fcmService;
    }

    /**
     * Handles new order creation event published by OrderService.
     */
    @EventListener
    public void onOrderCreated(OrderCreatedEvent event) {
        Order order = event.order();
        log.info("[OrderEventListener] Handling OrderCreatedEvent for orderId={}, vendorId={}", order.id(), order.vendorId());
        notifyOrderCreated(order);
    }

    /**
     * Handles order status updates (Accepted/Rejected/Delayed) published by OrderService.
     */
    @EventListener
    public void onOrderStatusUpdated(OrderStatusUpdatedEvent event) {
        Order order = event.order();
        log.info("[OrderEventListener] Handling OrderStatusUpdatedEvent for orderId={}, status={}", order.id(), order.status());
        notifyOrderStatusUpdated(order);
    }

    @Override
    public void notifyOrderCreated(Order order) {
        // 1. Broadcast via WebSocket STOMP topic to active frontends
        wsDispatcher.dispatchOrderToVendor(order);

        // 2. Dispatch FCM push notification (for backgrounded mobile apps)
        fcmService.sendOrderPushNotification(order);
    }

    @Override
    public void notifyOrderStatusUpdated(Order order) {
        // Broadcast status update via WebSocket STOMP topic
        wsDispatcher.dispatchOrderToVendor(order);
    }
}
