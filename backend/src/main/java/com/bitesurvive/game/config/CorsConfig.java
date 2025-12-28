package com.bitesurvive.game.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.CorsFilter;

import java.util.Arrays;

@Configuration
public class CorsConfig {
    
    @Bean
    public CorsFilter corsFilter() {
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        CorsConfiguration config = new CorsConfiguration();
        
        config.setAllowCredentials(true);
        
        // Allow specific origins (development and production)
        config.setAllowedOrigins(Arrays.asList(
            "http://localhost:8000",                    // Local development
            "http://127.0.0.1:8000",                    // Local development
            "https://bitesurvive.ragingscout97.in",     // Production frontend
            "http://api.ragingscout97.in",              // Production API HTTP (temporary)
            "https://api.ragingscout97.in"              // Production API HTTPS (for testing)
        ));
        
        config.addAllowedHeader("*");
        config.addAllowedMethod("*");
        
        source.registerCorsConfiguration("/**", config);
        return new CorsFilter(source);
    }
}

