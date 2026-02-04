package com.example._blog.Dto;

import java.time.Instant;

import com.example._blog.Entity.enums.UserRole;
import com.example._blog.Entity.enums.UserStatus;

public record UserResponse(
        Long userId,
        String firstName,
        String lastName,
        String userName,
        String email,
        UserStatus status,
        UserRole role,
        Instant createdAt
) {
}
