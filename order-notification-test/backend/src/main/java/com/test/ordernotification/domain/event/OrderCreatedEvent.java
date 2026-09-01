package com.test.ordernotification.domain.event;

import com.test.ordernotification.domain.model.Order;

/**
 * Domain event emitted when a new Order is placed in the system.
 */
public record OrderCreatedEvent(Order order) {}
