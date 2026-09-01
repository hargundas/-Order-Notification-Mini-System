package com.test.ordernotification.infrastructure.persistence;

import com.test.ordernotification.domain.model.Order;
import com.test.ordernotification.domain.repository.OrderRepository;
import org.springframework.stereotype.Repository;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

/**
 * Thread-safe in-memory implementation of OrderRepository using ConcurrentHashMap.
 */
@Repository
public class InMemoryOrderRepository implements OrderRepository {

    private final ConcurrentHashMap<String, Order> orderStorage = new ConcurrentHashMap<>();

    @Override
    public Order save(Order order) {
        orderStorage.put(order.id(), order);
        return order;
    }

    @Override
    public Optional<Order> findById(String id) {
        return Optional.ofNullable(orderStorage.get(id));
    }

    @Override
    public List<Order> findByVendorId(String vendorId) {
        return orderStorage.values().stream()
                .filter(order -> order.vendorId().equals(vendorId))
                .sorted((a, b) -> b.createdAt().compareTo(a.createdAt())) // latest first
                .collect(Collectors.toList());
    }

    @Override
    public List<Order> findAll() {
        return new ArrayList<>(orderStorage.values());
    }
}
