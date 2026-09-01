package com.test.ordernotification.domain.service;

import com.test.ordernotification.domain.model.Order;

/**
 * Domain service interface for dispatching notifications to vendors and clients.
 * Infrastructure implementations handle transport protocols (WebSocket STOMP, Firebase Cloud Messaging).
 */
public interface NotificationService {

    /**
     * Sends an alert when a new order is received.
     *
     * @param order the newly created domain order
     */
    void notifyOrderCreated(Order order);

    /**
     * Sends an alert when an order's status has been modified.
     *
     * @param order the updated domain order
     */
    void notifyOrderStatusUpdated(Order order);
}
