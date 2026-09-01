package com.test.ordernotification.api.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import java.util.List;

public record CreateOrderRequest(
    @NotBlank(message = "Vendor ID is required")
    String vendorId,

    @NotBlank(message = "Customer name is required")
    String customerName,

    @NotEmpty(message = "Items list cannot be empty")
    @Valid
    List<OrderItemDto> items
) {}
