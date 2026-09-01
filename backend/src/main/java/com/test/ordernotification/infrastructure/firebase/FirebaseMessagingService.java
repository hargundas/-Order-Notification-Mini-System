package com.test.ordernotification.infrastructure.firebase;

import com.google.firebase.FirebaseApp;
import com.google.firebase.messaging.FirebaseMessaging;
import com.google.firebase.messaging.Message;
import com.google.firebase.messaging.Notification;
import com.test.ordernotification.domain.model.Order;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

@Service
public class FirebaseMessagingService {

    private static final Logger log = LoggerFactory.getLogger(FirebaseMessagingService.class);

    /**
     * Sends a push notification for a newly created order to devices subscribed to the vendor topic.
     */
    public void sendOrderPushNotification(Order order) {
        String topic = "vendor-" + order.vendorId();
        String title = "New Order Received! 🛍️";
        String body = String.format("Order #%s from %s with %d items.", order.id(), order.customerName(), order.items().size());

        log.info("[FCM] Preparing push notification for topic='{}': title='{}', body='{}'", topic, title, body);

        if (FirebaseApp.getApps().isEmpty()) {
            log.info("[FCM (Simulation)] FirebaseApp not active. Simulated FCM push sent successfully to topic '{}'.", topic);
            return;
        }

        try {
            Message message = Message.builder()
                    .setTopic(topic)
                    .setNotification(Notification.builder()
                            .setTitle(title)
                            .setBody(body)
                            .build())
                    .putData("orderId", order.id())
                    .putData("vendorId", order.vendorId())
                    .putData("status", order.status().name())
                    .putData("customerName", order.customerName())
                    .build();

            String response = FirebaseMessaging.getInstance().send(message);
            log.info("[FCM] Successfully sent FCM message ID: {}", response);
        } catch (Exception e) {
            log.warn("[FCM] Failed to dispatch real FCM push notification: {}", e.getMessage());
        }
    }
}
