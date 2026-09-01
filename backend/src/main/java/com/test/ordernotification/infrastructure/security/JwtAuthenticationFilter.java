package com.test.ordernotification.infrastructure.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Collections;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private static final Logger log = LoggerFactory.getLogger(JwtAuthenticationFilter.class);

    private final JwtService jwtService;

    public JwtAuthenticationFilter(JwtService jwtService) {
        this.jwtService = jwtService;
    }

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain
    ) throws ServletException, IOException {

        final String authHeader = request.getHeader("Authorization");

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        final String jwt = authHeader.substring(7);

        if (jwtService.validateToken(jwt)) {
            String email = jwtService.extractEmail(jwt);
            String vendorId = jwtService.extractVendorId(jwt);

            if (email != null && SecurityContextHolder.getContext().getAuthentication() == null) {
                // Principal will be the vendorId or UserDetails so controllers can access it
                UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                        vendorId,
                        null,
                        Collections.singletonList(new SimpleGrantedAuthority("ROLE_VENDOR"))
                );
                authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                SecurityContextHolder.getContext().setAuthentication(authToken);
                log.debug("[JwtAuthenticationFilter] Authenticated vendorId={}", vendorId);
            }
        } else {
            log.debug("[JwtAuthenticationFilter] Rejected token for uri={}", request.getRequestURI());
        }

        filterChain.doFilter(request, response);
    }
}
