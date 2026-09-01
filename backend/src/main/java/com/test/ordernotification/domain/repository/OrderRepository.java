package com.test.ordernotification.domain.repository;

import com.test.ordernotification.domain.model.Order;

import java.util.List;
import java.util.Optional;

/**
 * Domain repository interface for Order persistence.
 */
public interface OrderRepository {
    Order save(Order order);
    Optional<Order> findById(String id);
    List<Order> findByVendorId(String vendorId);
    List<Order> findAll();
}
