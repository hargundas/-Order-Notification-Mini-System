package com.test.ordernotification.domain.repository;

import com.test.ordernotification.domain.model.User;

import java.util.Optional;

/**
 * Domain repository interface for User persistence.
 */
public interface UserRepository {
    Optional<User> findByEmail(String email);
    Optional<User> findByVendorId(String vendorId);
    User save(User user);
}
