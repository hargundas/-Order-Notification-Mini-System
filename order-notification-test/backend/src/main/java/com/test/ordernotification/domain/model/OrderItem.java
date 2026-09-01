package com.test.ordernotification.domain.model;

/**
 * Pure immutable data model representing an item in an order.
 * Follows strict Onion Architecture rule: Domain entities MUST be Java records with pure data and NO methods.
 */
public record OrderItem(
    String name,
    double price,
    int quantity
) {}
