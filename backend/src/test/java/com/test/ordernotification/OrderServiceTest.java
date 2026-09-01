package com.test.ordernotification;

import com.test.ordernotification.domain.event.OrderCreatedEvent;
import com.test.ordernotification.domain.event.OrderStatusUpdatedEvent;
import com.test.ordernotification.domain.model.Order;
import com.test.ordernotification.domain.model.OrderItem;
import com.test.ordernotification.domain.model.OrderStatus;
import com.test.ordernotification.domain.service.OrderService;
import com.test.ordernotification.infrastructure.persistence.InMemoryOrderRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.context.ApplicationEventPublisher;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class OrderServiceTest {

    private InMemoryOrderRepository orderRepository;
    private ApplicationEventPublisher eventPublisher;
    private OrderService orderService;

    @BeforeEach
    void setUp() {
        orderRepository = new InMemoryOrderRepository();
        eventPublisher = mock(ApplicationEventPublisher.class);
        orderService = new OrderService(orderRepository, eventPublisher);
    }

    @Test
    @DisplayName("Creating order persists entity and publishes OrderCreatedEvent")
    void testCreateOrderPublishesEvent() {
        List<OrderItem> items = List.of(
                new OrderItem("Burger", 12.99, 2),
                new OrderItem("Fries", 4.50, 1)
        );

        Order created = orderService.createOrder("vendor-123", "John Doe", items);

        assertNotNull(created);
        assertEquals("vendor-123", created.vendorId());
        assertEquals("John Doe", created.customerName());
        assertEquals(OrderStatus.PENDING, created.status());
        assertEquals(2, created.items().size());

        // Verify repository contains order
        assertTrue(orderRepository.findById(created.id()).isPresent());

        // Verify domain event was published
        ArgumentCaptor<OrderCreatedEvent> eventCaptor = ArgumentCaptor.forClass(OrderCreatedEvent.class);
        verify(eventPublisher, times(1)).publishEvent(eventCaptor.capture());

        OrderCreatedEvent publishedEvent = eventCaptor.getValue();
        assertEquals(created.id(), publishedEvent.order().id());
    }

    @Test
    @DisplayName("Accepting order with delay updates status and publishes OrderStatusUpdatedEvent")
    void testAcceptOrderWithDelay() {
        Order initial = orderService.createOrder("vendor-123", "Alice", List.of(new OrderItem("Pizza", 18.00, 1)));
        reset(eventPublisher);

        Order accepted = orderService.acceptOrder(initial.id(), "vendor-123", 15);

        assertEquals(OrderStatus.ACCEPTED, accepted.status());
        assertEquals(15, accepted.delayMinutes());

        ArgumentCaptor<OrderStatusUpdatedEvent> eventCaptor = ArgumentCaptor.forClass(OrderStatusUpdatedEvent.class);
        verify(eventPublisher, times(1)).publishEvent(eventCaptor.capture());
        assertEquals(accepted.id(), eventCaptor.getValue().order().id());
    }

    @Test
    @DisplayName("Rejecting order updates status to REJECTED")
    void testRejectOrder() {
        Order initial = orderService.createOrder("vendor-123", "Bob", List.of(new OrderItem("Soda", 2.50, 2)));
        reset(eventPublisher);

        Order rejected = orderService.rejectOrder(initial.id(), "vendor-123");

        assertEquals(OrderStatus.REJECTED, rejected.status());

        ArgumentCaptor<OrderStatusUpdatedEvent> eventCaptor = ArgumentCaptor.forClass(OrderStatusUpdatedEvent.class);
        verify(eventPublisher, times(1)).publishEvent(eventCaptor.capture());
        assertEquals(OrderStatus.REJECTED, eventCaptor.getValue().order().status());
    }

    @Test
    @DisplayName("Rejecting by unauthenticated vendor throws SecurityException")
    void testUnauthorizedVendorRejectionThrowsException() {
        Order initial = orderService.createOrder("vendor-123", "Charlie", List.of(new OrderItem("Coffee", 3.00, 1)));

        assertThrows(SecurityException.class, () -> orderService.rejectOrder(initial.id(), "wrong-vendor"));
    }
}
