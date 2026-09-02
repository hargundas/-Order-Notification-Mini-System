package com.test.ordernotification;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.test.ordernotification.api.dto.CreateOrderRequest;
import com.test.ordernotification.api.dto.LoginRequest;
import com.test.ordernotification.api.dto.OrderItemDto;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.util.List;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class OrderControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    private String authToken;

    @BeforeEach
    void setUpAuth() throws Exception {
        LoginRequest loginReq = new LoginRequest("vendor@test.com", "test123");
        MvcResult result = mockMvc.perform(post("/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginReq)))
                .andExpect(status().isOk())
                .andReturn();

        authToken = objectMapper.readTree(result.getResponse().getContentAsString()).get("token").asText();
    }

    @Test
    @DisplayName("POST /orders creates an order and returns 201 Created")
    void testCreateOrder() throws Exception {
        CreateOrderRequest request = new CreateOrderRequest(
                "vendor-123",
                "Jane Customer",
                List.of(
                        new OrderItemDto("Cheeseburger", 11.50, 2),
                        new OrderItemDto("Diet Coke", 2.50, 1)
                )
        );

        mockMvc.perform(post("/orders")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id", notNullValue()))
                .andExpect(jsonPath("$.vendorId", is("vendor-123")))
                .andExpect(jsonPath("$.customerName", is("Jane Customer")))
                .andExpect(jsonPath("$.status", is("PENDING")))
                .andExpect(jsonPath("$.totalAmount", is(25.50)));
    }

    @Test
    @DisplayName("GET /vendor/orders returns authenticated vendor's orders")
    void testGetVendorOrders() throws Exception {
        // Create an order first
        CreateOrderRequest request = new CreateOrderRequest(
                "vendor-123",
                "Alice Wonder",
                List.of(new OrderItemDto("Tacos", 9.00, 3))
        );
        mockMvc.perform(post("/orders")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)));

        // Retrieve vendor orders
        mockMvc.perform(get("/vendor/orders")
                        .header("Authorization", "Bearer " + authToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", isA(List.class)))
                .andExpect(jsonPath("$[0].vendorId", is("vendor-123")));
    }

    @Test
    @DisplayName("PUT /vendor/orders/{id}/accept with delayMinutes updates status to ACCEPTED")
    void testAcceptOrderWithDelay() throws Exception {
        CreateOrderRequest request = new CreateOrderRequest(
                "vendor-123",
                "Bob Builder",
                List.of(new OrderItemDto("Salad", 8.50, 1))
        );
        MvcResult createResult = mockMvc.perform(post("/orders")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andReturn();

        String orderId = objectMapper.readTree(createResult.getResponse().getContentAsString()).get("id").asText();

        mockMvc.perform(put("/vendor/orders/" + orderId + "/accept?delayMinutes=20")
                        .header("Authorization", "Bearer " + authToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id", is(orderId)))
                .andExpect(jsonPath("$.status", is("ACCEPTED")))
                .andExpect(jsonPath("$.delayMinutes", is(20)));
    }

    @Test
    @DisplayName("PUT /vendor/orders/{id}/reject updates status to REJECTED")
    void testRejectOrder() throws Exception {
        CreateOrderRequest request = new CreateOrderRequest(
                "vendor-123",
                "Dave Client",
                List.of(new OrderItemDto("Wrap", 7.00, 1))
        );
        MvcResult createResult = mockMvc.perform(post("/orders")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andReturn();

        String orderId = objectMapper.readTree(createResult.getResponse().getContentAsString()).get("id").asText();

        mockMvc.perform(put("/vendor/orders/" + orderId + "/reject")
                        .header("Authorization", "Bearer " + authToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id", is(orderId)))
                .andExpect(jsonPath("$.status", is("REJECTED")));
    }

    @Test
    @DisplayName("GET /vendor/orders without Bearer token returns 401 Unauthorized")
    void testUnauthenticatedGetVendorOrdersReturns401() throws Exception {
        mockMvc.perform(get("/vendor/orders"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("CORS preflight permits the tunnel bypass request header")
    void testCorsAllowsTunnelBypassHeader() throws Exception {
        mockMvc.perform(options("/vendor/orders")
                        .header("Origin", "http://localhost:5173")
                        .header("Access-Control-Request-Method", "GET")
                        .header(
                                "Access-Control-Request-Headers",
                                "Authorization,Bypass-Tunnel-Reminder"
                        ))
                .andExpect(status().isOk())
                .andExpect(header().string(
                        "Access-Control-Allow-Headers",
                        containsString("Bypass-Tunnel-Reminder")
                ));
    }
}
