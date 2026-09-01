package com.test.ordernotification.api.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record OrderItemDto(
    @NotBlank(message = "Item name is required")
    String name,

    @NotNull(message = "Price is required")
    @Min(value = 0, message = "Price cannot be negative")
    Double price,

    @NotNull(message = "Quantity is required")
    @Min(value = 1, message = "Quantity must be at least 1")
    Integer quantity
) {}
