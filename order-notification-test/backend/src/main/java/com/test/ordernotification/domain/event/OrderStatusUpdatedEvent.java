package com.test.ordernotification.domain.event;

import com.test.ordernotification.domain.model.Order;

/**
 * Domain event emitted when an existing Order's status is modified (e.g. ACCEPTED or REJECTED).
 */
public record OrderStatusUpdatedEvent(Order order) {}
