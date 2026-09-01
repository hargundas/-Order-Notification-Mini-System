package com.test.ordernotification.infrastructure.firebase;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.Resource;
import org.springframework.core.io.ResourceLoader;

import java.io.InputStream;

@Configuration
public class FirebaseConfig {

    private static final Logger log = LoggerFactory.getLogger(FirebaseConfig.class);

    private final ResourceLoader resourceLoader;
    private final String credentialsPath;
    private final String projectId;
    private final boolean enabled;

    public FirebaseConfig(
            ResourceLoader resourceLoader,
            @Value("${firebase.credentials-path:classpath:firebase-service-account.json}") String credentialsPath,
            @Value("${firebase.project-id:com-test-ordernotification}") String projectId,
            @Value("${firebase.enabled:false}") boolean enabled
    ) {
        this.resourceLoader = resourceLoader;
        this.credentialsPath = credentialsPath;
        this.projectId = projectId;
        this.enabled = enabled;
    }

    @PostConstruct
    public void initFirebase() {
        if (!enabled) {
            log.info("[FirebaseConfig] Firebase Admin SDK is disabled or running in mock simulation mode.");
            return;
        }

        try {
            if (FirebaseApp.getApps().isEmpty()) {
                Resource resource = resourceLoader.getResource(credentialsPath);
                if (resource.exists()) {
                    try (InputStream serviceAccount = resource.getInputStream()) {
                        FirebaseOptions options = FirebaseOptions.builder()
                                .setCredentials(GoogleCredentials.fromStream(serviceAccount))
                                .setProjectId(projectId)
                                .build();
                        FirebaseApp.initializeApp(options);
                        log.info("[FirebaseConfig] Firebase Admin SDK successfully initialized for project: {}", projectId);
                    }
                } else {
                    log.warn("[FirebaseConfig] Firebase credentials not found at '{}'. FCM will operate in simulated mode.", credentialsPath);
                }
            }
        } catch (Exception e) {
            log.warn("[FirebaseConfig] Could not initialize Firebase Admin SDK ({}). Running in simulation fallback mode.", e.getMessage());
        }
    }
}
