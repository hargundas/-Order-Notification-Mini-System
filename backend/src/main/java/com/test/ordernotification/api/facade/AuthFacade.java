package com.test.ordernotification.api.facade;

import com.test.ordernotification.api.dto.AuthResponse;
import com.test.ordernotification.api.dto.LoginRequest;
import com.test.ordernotification.domain.model.User;
import com.test.ordernotification.domain.service.AuthService;
import com.test.ordernotification.infrastructure.security.JwtService;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.stereotype.Component;

@Component
public class AuthFacade {

    private final AuthService authService;
    private final JwtService jwtService;

    public AuthFacade(AuthService authService, JwtService jwtService) {
        this.authService = authService;
        this.jwtService = jwtService;
    }

    /**
     * Authenticates vendor credentials and produces a JWT token.
     */
    public AuthResponse login(LoginRequest request) {
        User user = authService.authenticate(request.email(), request.password())
                .orElseThrow(() -> new BadCredentialsException("Invalid email or password"));

        String token = jwtService.generateToken(user.email(), user.vendorId());
        return new AuthResponse(token, user.vendorId());
    }

    /**
     * Refreshes an existing valid or recently expired JWT token.
     */
    public AuthResponse refreshToken(String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            throw new BadCredentialsException("Missing or malformed Authorization header");
        }

        String oldToken = authHeader.substring(7);
        String email = jwtService.extractEmailFromTokenAllowingExpired(oldToken);
        String vendorId = jwtService.extractVendorIdFromTokenAllowingExpired(oldToken);

        if (email == null || vendorId == null) {
            throw new BadCredentialsException("Invalid token claims for refresh");
        }

        // Verify user still exists in domain
        authService.findByEmail(email)
                .orElseThrow(() -> new BadCredentialsException("User not found"));

        String newToken = jwtService.generateToken(email, vendorId);
        return new AuthResponse(newToken, vendorId);
    }
}
