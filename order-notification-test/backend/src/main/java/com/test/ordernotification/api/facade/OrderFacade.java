package com.test.ordernotification.api.facade;

import com.test.ordernotification.api.dto.CreateOrderRequest;
import com.test.ordernotification.api.dto.OrderItemDto;
import com.test.ordernotification.api.dto.OrderResponse;
import com.test.ordernotification.domain.model.Order;
import com.test.ordernotification.domain.model.OrderItem;
import com.test.ordernotification.domain.service.OrderService;
import com.test.ordernotification.domain.util.OrderCalculationUtils;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Facade bridging the API transport layer (DTOs) with the pure Domain model.
 * Enforces Onion Architecture isolation: DTOs never enter the Domain layer.
 */
@Component
public class OrderFacade {

    private final OrderService orderService;

    public OrderFacade(OrderService orderService) {
        this.orderService = orderService;
    }

    /**
     * Creates a new order by converting API request DTOs to pure domain models.
     */
    public OrderResponse createOrder(CreateOrderRequest request) {
        List<OrderItem> domainItems = request.items().stream()
                .map(itemDto -> new OrderItem(itemDto.name(), itemDto.price(), itemDto.quantity()))
                .collect(Collectors.toList());

        Order created = orderService.createOrder(request.vendorId(), request.customerName(), domainItems);
        return toResponseDto(created);
    }

    /**
     * Retrieves all orders for a vendor and converts them to DTOs.
     */
    public List<OrderResponse> getOrdersByVendorId(String vendorId) {
        return orderService.getOrdersByVendorId(vendorId).stream()
                .map(this::toResponseDto)
                .collect(Collectors.toList());
    }

    /**
     * Accepts an order and returns the updated DTO.
     */
    public OrderResponse acceptOrder(String orderId, String vendorId, Integer delayMinutes) {
        Order accepted = orderService.acceptOrder(orderId, vendorId, delayMinutes);
        return toResponseDto(accepted);
    }

    /**
     * Rejects an order and returns the updated DTO.
     */
    public OrderResponse rejectOrder(String orderId, String vendorId) {
        Order rejected = orderService.rejectOrder(orderId, vendorId);
        return toResponseDto(rejected);
    }

    /**
     * Converts a domain Order record into an OrderResponse DTO.
     */
    public OrderResponse toResponseDto(Order order) {
        List<OrderItemDto> itemDtos = order.items().stream()
                .map(item -> new OrderItemDto(item.name(), item.price(), item.quantity()))
                .collect(Collectors.toList());

        double totalAmount = OrderCalculationUtils.calculateTotalAmount(order.items());

        return new OrderResponse(
                order.id(),
                order.vendorId(),
                order.customerName(),
                itemDtos,
                order.status().name(),
                order.delayMinutes(),
                order.createdAt().toString(),
                totalAmount
        );
    }
}
