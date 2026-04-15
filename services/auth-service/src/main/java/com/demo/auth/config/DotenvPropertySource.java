package com.demo.auth.config;

import org.springframework.boot.context.event.ApplicationEnvironmentPreparedEvent;
import org.springframework.context.ApplicationListener;
import org.springframework.core.env.ConfigurableEnvironment;
import org.springframework.core.env.MapPropertySource;

import java.io.*;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.HashMap;
import java.util.Map;

/**
 * Loads .env from the service root directory into Spring's Environment.
 * Runs BEFORE Spring Boot autoconfiguration so all placeholders
 * (e.g. ${AWS_COGNITO_USER_POOL_ID}) resolve correctly.
 *
 * Supports both the service-level .env and a parent .env if present.
 */
public class DotenvPropertySource implements ApplicationListener<ApplicationEnvironmentPreparedEvent> {

    private static final String SOURCE_NAME = "dotenv";

    @Override
    public void onApplicationEvent(ApplicationEnvironmentPreparedEvent event) {
        ConfigurableEnvironment env = event.getEnvironment();
        Map<String, Object> props = new HashMap<>();

        // Try service-level .env first, then fall back to parent-level
        Path serviceRoot = Path.of(".").toAbsolutePath().normalize();
        Path root = serviceRoot.getParent();

        boolean loaded = false;

        for (Path base : new Path[]{serviceRoot, root}) {
            Path dotenvPath = base.resolve(".env");
            if (Files.exists(dotenvPath)) {
                try {
                    loadFile(dotenvPath, props);
                    System.out.println("✔ Loaded .env from: " + dotenvPath);
                    loaded = true;
                    break;
                } catch (IOException e) {
                    System.out.println("⚠ Failed to read .env at " + dotenvPath + ": " + e.getMessage());
                }
            }
        }

        if (!loaded) {
            System.out.println("⚠ No .env found — relying on system env / defaults");
        }

        if (!props.isEmpty()) {
            env.getPropertySources().addFirst(new MapPropertySource(SOURCE_NAME, props));
        }
    }

    private void loadFile(Path path, Map<String, Object> out) throws IOException {
        try (BufferedReader reader = Files.newBufferedReader(path)) {
            String line;
            while ((line = reader.readLine()) != null) {
                line = line.trim();
                if (line.isEmpty() || line.startsWith("#")) continue;
                int eq = line.indexOf('=');
                if (eq <= 0) continue;
                String key = line.substring(0, eq).trim();
                String val = line.substring(eq + 1).trim();
                // Strip surrounding quotes
                if ((val.startsWith("\"") && val.endsWith("\"")) ||
                    (val.startsWith("'") && val.endsWith("'"))) {
                    val = val.substring(1, val.length() - 1);
                }
                if (!key.isEmpty()) {
                    out.put(key, val);
                }
            }
        }
    }
}
