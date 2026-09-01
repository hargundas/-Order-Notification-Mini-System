package com.test.ordernotification.api.dto;

import java.util.List;

public record OrderResponse(
    String id,
    String vendorId,
    String customerName,
    List<OrderItemDto> items,
    String status,
    Integer delayMinutes,
    String createdAt,
    Double totalAmount
) {}
