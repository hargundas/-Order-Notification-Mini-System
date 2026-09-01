package com.test.ordernotification;

import com.test.ordernotification.domain.model.Order;
import com.test.ordernotification.domain.model.OrderItem;
import com.test.ordernotification.domain.model.User;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.lang.reflect.Method;
import java.lang.reflect.Modifier;
import java.util.Arrays;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Validates strict Onion Architecture rules for domain entities:
 * 1. Domain entities MUST be Java records.
 * 2. Pure data records with NO custom behavioral methods.
 */
class DomainIntegrityTest {

    @Test
    @DisplayName("Domain entities must be Java records (pure data, no custom methods)")
    void assertDomainEntitiesArePureRecords() {
        List<Class<?>> domainRecordClasses = List.of(Order.class, OrderItem.class, User.class);

        for (Class<?> clazz : domainRecordClasses) {
            assertTrue(clazz.isRecord(), clazz.getSimpleName() + " must be a Java record");

            // Filter out default record methods (equals, hashCode, toString, and component getters)
            Method[] declaredMethods = clazz.getDeclaredMethods();
            for (Method method : declaredMethods) {
                // Component accessors match record component names exactly
                boolean isComponentAccessor = Arrays.stream(clazz.getRecordComponents())
                        .anyMatch(c -> c.getName().equals(method.getName()) && method.getParameterCount() == 0);
                boolean isStandardRecordMethod = method.getName().equals("equals")
                        || method.getName().equals("hashCode")
                        || method.getName().equals("toString");

                assertTrue(
                        isComponentAccessor || isStandardRecordMethod,
                        "Domain record " + clazz.getSimpleName() + " should not contain custom behavioral method: " + method.getName()
                );
            }
        }
    }
}
