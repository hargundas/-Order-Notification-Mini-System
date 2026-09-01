package com.test.ordernotification.domain.service;

import com.test.ordernotification.domain.model.User;
import com.test.ordernotification.domain.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.util.Optional;

/**
 * Domain Service for authentication and user verification.
 */
@Service
public class AuthService {

    private final UserRepository userRepository;

    public AuthService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    /**
     * Authenticates a user given their email and raw password.
     * Returns the authenticated domain User if credentials match.
     */
    public Optional<User> authenticate(String email, String rawPassword) {
        if (email == null || rawPassword == null) {
            return Optional.empty();
        }
        return userRepository.findByEmail(email.trim().toLowerCase())
                .filter(user -> user.password().equals(rawPassword));
    }

    /**
     * Finds a user by their vendor ID.
     */
    public Optional<User> findByVendorId(String vendorId) {
        return userRepository.findByVendorId(vendorId);
    }

    /**
     * Finds a user by their email address.
     */
    public Optional<User> findByEmail(String email) {
        if (email == null) {
            return Optional.empty();
        }
        return userRepository.findByEmail(email.trim().toLowerCase());
    }
}
