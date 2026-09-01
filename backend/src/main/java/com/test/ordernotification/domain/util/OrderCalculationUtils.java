package com.test.ordernotification.domain.util;

import com.test.ordernotification.domain.model.OrderItem;

import java.util.List;

/**
 * Pure static calculation utilities for order metrics.
 * 
 * ARCHITECTURE RULE:
 * This class contains only pure static functions and is explicitly NOT a Spring @Component.
 */
public final class OrderCalculationUtils {

    private OrderCalculationUtils() {
        // Enforce non-instantiability
    }

    /**
     * Calculates total monetary value of the ordered items.
     */
    public static double calculateTotalAmount(List<OrderItem> items) {
        if (items == null || items.isEmpty()) {
            return 0.0;
        }
        return items.stream()
                .mapToDouble(item -> item.price() * item.quantity())
                .sum();
    }

    /**
     * Calculates the total item count across all item lines in an order.
     */
    public static int calculateTotalQuantity(List<OrderItem> items) {
        if (items == null || items.isEmpty()) {
            return 0;
        }
        return items.stream()
                .mapToInt(OrderItem::quantity)
                .sum();
    }
}
