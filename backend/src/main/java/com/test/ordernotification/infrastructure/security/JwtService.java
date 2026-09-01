package com.test.ordernotification.infrastructure.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;

@Service
public class JwtService {

    private static final Logger log = LoggerFactory.getLogger(JwtService.class);

    private final SecretKey secretKey;
    private final long expiryMinutes;

    public JwtService(
            @Value("${jwt.secret:404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970}") String secret,
            @Value("${jwt.expiry-minutes:2}") long expiryMinutes
    ) {
        this.secretKey = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.expiryMinutes = expiryMinutes;
        log.info("[JwtService] Initialized with token expiry: {} minutes", this.expiryMinutes);
    }

    /**
     * Generates a signed JWT token containing email and vendorId claims.
     */
    public String generateToken(String email, String vendorId) {
        Map<String, Object> extraClaims = new HashMap<>();
        extraClaims.put("vendorId", vendorId);
        extraClaims.put("role", "ROLE_VENDOR");

        Instant now = Instant.now();
        Instant validity = now.plus(expiryMinutes, ChronoUnit.MINUTES);

        String token = Jwts.builder()
                .claims(extraClaims)
                .subject(email)
                .issuedAt(Date.from(now))
                .expiration(Date.from(validity))
                .signWith(secretKey)
                .compact();

        log.info("[JwtService] Token issued for email={} vendorId={} expiresAt={}", email, vendorId, validity);
        return token;
    }

    /**
     * Validates a JWT token and returns true if valid and unexpired.
     */
    public boolean validateToken(String token) {
        try {
            Jwts.parser()
                    .verifyWith(secretKey)
                    .build()
                    .parseSignedClaims(token);
            return true;
        } catch (ExpiredJwtException e) {
            log.warn("[JwtService] Token expired: {}", e.getMessage());
            return false;
        } catch (JwtException | IllegalArgumentException e) {
            log.warn("[JwtService] Invalid token: {}", e.getMessage());
            return false;
        }
    }

    /**
     * Extracts email (subject) from a valid token.
     */
    public String extractEmail(String token) {
        return extractAllClaims(token).getSubject();
    }

    /**
     * Extracts vendorId claim from a valid token.
     */
    public String extractVendorId(String token) {
        Claims claims = extractAllClaims(token);
        return claims.get("vendorId", String.class);
    }

    /**
     * Extracts email from a token even if it is currently expired (used for /auth/refresh).
     */
    public String extractEmailFromTokenAllowingExpired(String token) {
        try {
            return extractEmail(token);
        } catch (ExpiredJwtException e) {
            log.info("[JwtService] Extracting claims from expired token for refresh");
            return e.getClaims().getSubject();
        } catch (Exception e) {
            log.error("[JwtService] Failed to extract email from token: {}", e.getMessage());
            return null;
        }
    }

    /**
     * Extracts vendorId from a token even if it is currently expired (used for /auth/refresh).
     */
    public String extractVendorIdFromTokenAllowingExpired(String token) {
        try {
            return extractVendorId(token);
        } catch (ExpiredJwtException e) {
            log.info("[JwtService] Extracting vendorId from expired token for refresh");
            return e.getClaims().get("vendorId", String.class);
        } catch (Exception e) {
            log.error("[JwtService] Failed to extract vendorId from token: {}", e.getMessage());
            return null;
        }
    }

    private Claims extractAllClaims(String token) {
        return Jwts.parser()
                .verifyWith(secretKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }
}
