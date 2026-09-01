package com.test.ordernotification.infrastructure.controller;

import com.test.ordernotification.api.dto.CreateOrderRequest;
import com.test.ordernotification.api.dto.OrderResponse;
import com.test.ordernotification.api.facade.OrderFacade;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
public class OrderController {

    private static final Logger log = LoggerFactory.getLogger(OrderController.class);

    private final OrderFacade orderFacade;

    public OrderController(OrderFacade orderFacade) {
        this.orderFacade = orderFacade;
    }

    /**
     * Public endpoint to simulate or accept customer order placement.
     * POST /orders
     */
    @PostMapping("/orders")
    public ResponseEntity<OrderResponse> createOrder(@Valid @RequestBody CreateOrderRequest request) {
        log.info("[OrderController] Received new order request for vendorId={}, customer={}", request.vendorId(), request.customerName());
        OrderResponse createdOrder = orderFacade.createOrder(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(createdOrder);
    }

    /**
     * Authenticated endpoint to fetch all orders belonging to the logged-in vendor.
     * GET /vendor/orders
     */
    @GetMapping("/vendor/orders")
    public ResponseEntity<List<OrderResponse>> getVendorOrders(Authentication authentication) {
        String vendorId = (String) authentication.getPrincipal();
        log.info("[OrderController] Fetching orders for authenticated vendorId={}", vendorId);
        List<OrderResponse> orders = orderFacade.getOrdersByVendorId(vendorId);
        return ResponseEntity.ok(orders);
    }

    /**
     * Authenticated endpoint to accept an order, optionally with a preparation delay in minutes.
     * PUT /vendor/orders/{id}/accept
     * PUT /vendor/orders/{id}/accept?delayMinutes=15
     */
    @PutMapping("/vendor/orders/{id}/accept")
    public ResponseEntity<OrderResponse> acceptOrder(
            @PathVariable("id") String orderId,
            @RequestParam(value = "delayMinutes", required = false) Integer delayMinutes,
            Authentication authentication
    ) {
        String vendorId = (String) authentication.getPrincipal();
        log.info("[OrderController] Vendor {} accepting order {} with delayMinutes={}", vendorId, orderId, delayMinutes);
        OrderResponse updated = orderFacade.acceptOrder(orderId, vendorId, delayMinutes);
        return ResponseEntity.ok(updated);
    }

    /**
     * Authenticated endpoint to reject an order.
     * PUT /vendor/orders/{id}/reject
     */
    @PutMapping("/vendor/orders/{id}/reject")
    public ResponseEntity<OrderResponse> rejectOrder(
            @PathVariable("id") String orderId,
            Authentication authentication
    ) {
        String vendorId = (String) authentication.getPrincipal();
        log.info("[OrderController] Vendor {} rejecting order {}", vendorId, orderId);
        OrderResponse updated = orderFacade.rejectOrder(orderId, vendorId);
        return ResponseEntity.ok(updated);
    }
}
