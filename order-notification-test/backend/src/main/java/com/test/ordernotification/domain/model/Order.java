package com.test.ordernotification.domain.model;

import java.time.Instant;
import java.util.List;

/**
 * Pure immutable data model representing a customer order.
 * Follows strict Onion Architecture rule: Domain entities MUST be Java records with pure data and NO methods.
 */
public record Order(
    String id,
    String vendorId,
    String customerName,
    List<OrderItem> items,
    OrderStatus status,
    Integer delayMinutes,
    Instant createdAt
) {}
