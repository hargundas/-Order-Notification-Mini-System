package com.test.ordernotification.api.dto;

public record AuthResponse(
    String token,
    String vendorId
) {}
