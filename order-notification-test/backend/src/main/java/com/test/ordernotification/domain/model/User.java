package com.test.ordernotification.domain.model;

/**
 * Pure immutable data model representing a system user / vendor.
 * Follows strict Onion Architecture rule: Domain entities MUST be Java records with pure data and NO methods.
 */
public record User(
    String id,
    String email,
    String password,
    String vendorId
) {}
