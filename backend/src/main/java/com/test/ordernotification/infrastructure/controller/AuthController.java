package com.test.ordernotification.infrastructure.controller;

import com.test.ordernotification.api.dto.AuthResponse;
import com.test.ordernotification.api.dto.LoginRequest;
import com.test.ordernotification.api.facade.AuthFacade;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth")
public class AuthController {

    private static final Logger log = LoggerFactory.getLogger(AuthController.class);

    private final AuthFacade authFacade;

    public AuthController(AuthFacade authFacade) {
        this.authFacade = authFacade;
    }

    /**
     * Authenticates vendor credentials and issues a JWT token.
     * POST /auth/login
     */
    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        log.info("[AuthController] Login attempt for email: {}", request.email());
        AuthResponse response = authFacade.login(request);
        return ResponseEntity.ok(response);
    }

    /**
     * Refreshes an expired or current JWT token.
     * POST /auth/refresh
     */
    @PostMapping("/refresh")
    public ResponseEntity<AuthResponse> refresh(@RequestHeader(value = "Authorization", required = false) String authHeader) {
        log.info("[AuthController] Token refresh requested");
        AuthResponse response = authFacade.refreshToken(authHeader);
        return ResponseEntity.ok(response);
    }
}
