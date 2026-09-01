package com.test.ordernotification.infrastructure.persistence;

import com.test.ordernotification.domain.model.User;
import com.test.ordernotification.domain.repository.UserRepository;
import jakarta.annotation.PostConstruct;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Thread-safe in-memory implementation of UserRepository using ConcurrentHashMap.
 */
@Repository
public class InMemoryUserRepository implements UserRepository {

    private final ConcurrentHashMap<String, User> userByEmail = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<String, User> userByVendorId = new ConcurrentHashMap<>();

    @PostConstruct
    public void seedInitialUsers() {
        User defaultVendor = new User(
                "usr-001",
                "vendor@test.com",
                "test123",
                "vendor-123"
        );
        save(defaultVendor);

        User secondaryVendor = new User(
                "usr-002",
                "vendor2@test.com",
                "test123",
                "vendor-456"
        );
        save(secondaryVendor);
    }

    @Override
    public Optional<User> findByEmail(String email) {
        if (email == null) return Optional.empty();
        return Optional.ofNullable(userByEmail.get(email.toLowerCase()));
    }

    @Override
    public Optional<User> findByVendorId(String vendorId) {
        if (vendorId == null) return Optional.empty();
        return Optional.ofNullable(userByVendorId.get(vendorId));
    }

    @Override
    public User save(User user) {
        userByEmail.put(user.email().toLowerCase(), user);
        userByVendorId.put(user.vendorId(), user);
        return user;
    }
}
