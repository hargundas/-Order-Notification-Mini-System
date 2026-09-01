package com.test.ordernotification.domain.service;

import com.test.ordernotification.domain.event.OrderCreatedEvent;
import com.test.ordernotification.domain.event.OrderStatusUpdatedEvent;
import com.test.ordernotification.domain.model.Order;
import com.test.ordernotification.domain.model.OrderItem;
import com.test.ordernotification.domain.model.OrderStatus;
import com.test.ordernotification.domain.repository.OrderRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;
import java.util.NoSuchElementException;
import java.util.UUID;

/**
 * Domain Service responsible for managing order lifecycle operations (creation, acceptance, rejection).
 *
 * <h2>CHALLENGE 1 RESOLUTION: CIRCULAR DEPENDENCY &amp; ARCHITECTURAL DESIGN</h2>
 * <p>
 * <b>The Problem:</b><br>
 * In naive system designs, {@code OrderService} requires {@code NotificationService} to send real-time
 * alerts whenever an order is created or updated. Conversely, {@code NotificationService} often requires
 * {@code OrderService} to look up order metadata, verify customer history, or enforce business notification
 * rules before broadcasting. Direct bidirectional constructor injection between these two Spring components
 * causes a fatal {@code BeanCurrentlyInCreationException} during container startup due to cyclical graph resolution.
 * </p>
 * <p>
 * <b>Why {@code @Lazy} is an Anti-Pattern / Suboptimal Solution:</b><br>
 * While adding {@code @Lazy} to one of the constructor parameters forces Spring to inject a CGLIB/JDK dynamic proxy
 * that delays actual bean initialization until the first method call, it merely conceals high coupling:
 * <ul>
 *   <li>It masks poor architectural cohesion and tight bidirectional coupling between services.</li>
 *   <li>It complicates unit testing by requiring circular mock configurations.</li>
 *   <li>It increases the risk of hidden runtime deadlocks or race conditions during lazy initialization.</li>
 *   <li>It violates the Single Responsibility Principle and the Open/Closed Principle.</li>
 * </ul>
 * </p>
 * <p>
 * <b>Why the Event-Driven (Domain Events) Approach is Superior:</b><br>
 * 1. <b>Strict Inversion of Control &amp; Decoupling:</b> {@code OrderService} only focuses on domain validation and state persistence.
 *    It has zero compile-time or runtime knowledge of websocket dispatchers, push notifications, or external messaging brokers.
 *    It merely publishes immutable domain events ({@link OrderCreatedEvent}, {@link OrderStatusUpdatedEvent}) via {@link ApplicationEventPublisher}.<br>
 * 2. <b>Extensibility:</b> Future downstream subscribers (e.g., audit logging, analytics, inventory management, SMS gateways)
 *    can be attached without altering a single line of {@code OrderService} code.<br>
 * 3. <b>Asynchronous and Resilient Execution:</b> Event listeners can execute synchronously within transaction boundaries or asynchronously
 *    via {@code @Async} without blocking the primary HTTP request/response thread.
 * </p>
 */
@Service
public class OrderService {

    private static final Logger log = LoggerFactory.getLogger(OrderService.class);

    private final OrderRepository orderRepository;
    private final ApplicationEventPublisher eventPublisher;

    public OrderService(OrderRepository orderRepository, ApplicationEventPublisher eventPublisher) {
        this.orderRepository = orderRepository;
        this.eventPublisher = eventPublisher;
    }

    /**
     * Creates and stores a new Order, then publishes an {@link OrderCreatedEvent}.
     *
     * @param vendorId     the vendor to whom the order belongs
     * @param customerName the customer placing the order
     * @param items        the line items in the order
     * @return the created domain Order
     */
    public Order createOrder(String vendorId, String customerName, List<OrderItem> items) {
        if (vendorId == null || vendorId.isBlank()) {
            throw new IllegalArgumentException("Vendor ID cannot be empty");
        }
        if (customerName == null || customerName.isBlank()) {
            throw new IllegalArgumentException("Customer name cannot be empty");
        }
        if (items == null || items.isEmpty()) {
            throw new IllegalArgumentException("Order must contain at least one item");
        }

        String orderId = "ORD-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        Order newOrder = new Order(
                orderId,
                vendorId,
                customerName,
                items,
                OrderStatus.PENDING,
                null,
                Instant.now()
        );

        Order savedOrder = orderRepository.save(newOrder);
        log.info("[OrderService] Order created: id={}, vendorId={}, customer={}", savedOrder.id(), savedOrder.vendorId(), savedOrder.customerName());

        // Publish domain event to decouple notification dispatching
        eventPublisher.publishEvent(new OrderCreatedEvent(savedOrder));

        return savedOrder;
    }

    /**
     * Retrieves all orders for a specific vendor.
     */
    public List<Order> getOrdersByVendorId(String vendorId) {
        return orderRepository.findByVendorId(vendorId);
    }

    /**
     * Retrieves a single order by its identifier.
     */
    public Order getOrderById(String orderId) {
        return orderRepository.findById(orderId)
                .orElseThrow(() -> new NoSuchElementException("Order not found with id: " + orderId));
    }

    /**
     * Accepts an order, optionally applying a preparation delay, and publishes an {@link OrderStatusUpdatedEvent}.
     *
     * @param orderId      the order identifier
     * @param vendorId     the authenticated vendor's ID
     * @param delayMinutes optional preparation delay in minutes
     * @return the updated domain Order
     */
    public Order acceptOrder(String orderId, String vendorId, Integer delayMinutes) {
        Order existing = getOrderById(orderId);
        if (!existing.vendorId().equals(vendorId)) {
            throw new SecurityException("Vendor unauthorized to modify order: " + orderId);
        }

        Order updatedOrder = new Order(
                existing.id(),
                existing.vendorId(),
                existing.customerName(),
                existing.items(),
                OrderStatus.ACCEPTED,
                delayMinutes != null && delayMinutes > 0 ? delayMinutes : null,
                existing.createdAt()
        );

        Order saved = orderRepository.save(updatedOrder);
        log.info("[OrderService] Order accepted: id={}, delayMinutes={}", saved.id(), saved.delayMinutes());

        eventPublisher.publishEvent(new OrderStatusUpdatedEvent(saved));
        return saved;
    }

    /**
     * Rejects an order and publishes an {@link OrderStatusUpdatedEvent}.
     *
     * @param orderId  the order identifier
     * @param vendorId the authenticated vendor's ID
     * @return the updated domain Order
     */
    public Order rejectOrder(String orderId, String vendorId) {
        Order existing = getOrderById(orderId);
        if (!existing.vendorId().equals(vendorId)) {
            throw new SecurityException("Vendor unauthorized to modify order: " + orderId);
        }

        Order updatedOrder = new Order(
                existing.id(),
                existing.vendorId(),
                existing.customerName(),
                existing.items(),
                OrderStatus.REJECTED,
                existing.delayMinutes(),
                existing.createdAt()
        );

        Order saved = orderRepository.save(updatedOrder);
        log.info("[OrderService] Order rejected: id={}", saved.id());

        eventPublisher.publishEvent(new OrderStatusUpdatedEvent(saved));
        return saved;
    }
}
