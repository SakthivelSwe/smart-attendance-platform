package com.smartattendance.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.access.hierarchicalroles.RoleHierarchy;
import org.springframework.security.access.hierarchicalroles.RoleHierarchyImpl;

@Configuration
public class RoleHierarchyConfig {

    /**
     * Defines role hierarchy: ADMIN > MANAGER > TEAM_LEAD > USER
     * A user with ADMIN role inherits all permissions of MANAGER, TEAM_LEAD, and
     * USER.
     */
    @Bean
    public RoleHierarchy roleHierarchy() {
        RoleHierarchyImpl roleHierarchy = new RoleHierarchyImpl();
        roleHierarchy.setHierarchy(
                "ROLE_ADMIN > ROLE_MANAGER\n" +
                        "ROLE_MANAGER > ROLE_TEAM_LEAD\n" +
                        "ROLE_TEAM_LEAD > ROLE_USER");
        return roleHierarchy;
    }
}
