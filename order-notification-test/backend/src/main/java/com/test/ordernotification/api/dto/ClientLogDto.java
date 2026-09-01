package com.test.ordernotification.api.dto;

import java.util.Map;

public record ClientLogDto(
    String event,
    String level,
    String message,
    Map<String, Object> details,
    String timestamp
) {}
