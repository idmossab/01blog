package com.example._blog.Dto;

public record AuthResponse(
        String token,
        UserResponse user
) {
}
